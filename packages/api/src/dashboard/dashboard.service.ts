import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Load } from '../load/entities/load.entity';
import { Week } from '../week/entities/week.entity';
import type {
  DashboardDto,
  WeeklyAggregation,
  StatusBreakdown,
  DashboardAverages,
  TopCorridor,
  FlagSummary,
} from '@lol/shared';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Load)
    private readonly loadsRepo: Repository<Load>,
    @InjectRepository(Week)
    private readonly weeksRepo: Repository<Week>,
  ) {}

  /**
   * Aggregate load financials grouped by week for a date range.
   * Returns totals, per-week breakdown, status distribution,
   * averages, top corridors, and flag counts.
   */
  async aggregate(weekIds: string[]): Promise<DashboardDto> {
    if (!weekIds.length) {
      throw new BadRequestException('At least one weekId is required');
    }

    // Fetch the week metadata for labels/dates
    const weeks = await this.weeksRepo
      .createQueryBuilder('week')
      .where('week.id IN (:...weekIds)', { weekIds })
      .orderBy('week.isoYear', 'ASC')
      .addOrderBy('week.isoWeek', 'ASC')
      .getMany();

    // ── 1. Per-week financial aggregation ──
    const rawRows: {
      weekId: string;
      loadCount: string;
      grossAmount: string;
      driverCostAmount: string;
      profitAmount: string;
      otrAmount: string;
      netProfitAmount: string;
    }[] = await this.loadsRepo
      .createQueryBuilder('load')
      .select('load.weekId', 'weekId')
      .addSelect('COUNT(*)::int', 'loadCount')
      .addSelect('COALESCE(SUM(load.grossAmount), 0)', 'grossAmount')
      .addSelect('COALESCE(SUM(load.driverCostAmount), 0)', 'driverCostAmount')
      .addSelect('COALESCE(SUM(load.profitAmount), 0)', 'profitAmount')
      .addSelect('COALESCE(SUM(load.otrAmount), 0)', 'otrAmount')
      .addSelect('COALESCE(SUM(load.netProfitAmount), 0)', 'netProfitAmount')
      .where('load.archivedAt IS NULL')
      .andWhere('load.weekId IN (:...weekIds)', { weekIds })
      .groupBy('load.weekId')
      .getRawMany();

    const aggMap = new Map<string, typeof rawRows[0]>();
    for (const row of rawRows) {
      aggMap.set(row.weekId, row);
    }

    const weeklyData: WeeklyAggregation[] = weeks.map((w) => {
      const row = aggMap.get(w.id);
      return {
        weekId: w.id,
        weekLabel: w.label,
        startDate: w.startDate,
        endDate: w.endDate,
        loadCount: row ? Number(row.loadCount) : 0,
        grossAmount: round2(row ? Number(row.grossAmount) : 0),
        driverCostAmount: round2(row ? Number(row.driverCostAmount) : 0),
        profitAmount: round2(row ? Number(row.profitAmount) : 0),
        otrAmount: round2(row ? Number(row.otrAmount) : 0),
        netProfitAmount: round2(row ? Number(row.netProfitAmount) : 0),
      };
    });

    // Compute totals
    const totals = {
      loadCount: 0,
      grossAmount: 0,
      driverCostAmount: 0,
      profitAmount: 0,
      otrAmount: 0,
      netProfitAmount: 0,
    };

    for (const w of weeklyData) {
      totals.loadCount += w.loadCount;
      totals.grossAmount += w.grossAmount;
      totals.driverCostAmount += w.driverCostAmount;
      totals.profitAmount += w.profitAmount;
      totals.otrAmount += w.otrAmount;
      totals.netProfitAmount += w.netProfitAmount;
    }

    totals.grossAmount = round2(totals.grossAmount);
    totals.driverCostAmount = round2(totals.driverCostAmount);
    totals.profitAmount = round2(totals.profitAmount);
    totals.otrAmount = round2(totals.otrAmount);
    totals.netProfitAmount = round2(totals.netProfitAmount);

    // ── 2. Status breakdown ──
    const statusRows: { status: string; count: string }[] = await this.loadsRepo
      .createQueryBuilder('load')
      .select('load.loadStatus', 'status')
      .addSelect('COUNT(*)::int', 'count')
      .where('load.archivedAt IS NULL')
      .andWhere('load.weekId IN (:...weekIds)', { weekIds })
      .groupBy('load.loadStatus')
      .getRawMany();

    const statusBreakdown: StatusBreakdown[] = statusRows.map((r) => ({
      status: r.status,
      count: Number(r.count),
    }));

    // ── 3. Averages per load ──
    const avgRow: {
      avgGross: string;
      avgProfit: string;
      avgMiles: string;
      avgProfitMargin: string;
    } = (await this.loadsRepo
      .createQueryBuilder('load')
      .select('COALESCE(AVG(load.grossAmount), 0)', 'avgGross')
      .addSelect('COALESCE(AVG(load.profitAmount), 0)', 'avgProfit')
      .addSelect('COALESCE(AVG(load.miles), 0)', 'avgMiles')
      .addSelect(
        'COALESCE(AVG(CASE WHEN load.grossAmount > 0 THEN (load.profitAmount / load.grossAmount) * 100 ELSE 0 END), 0)',
        'avgProfitMargin',
      )
      .where('load.archivedAt IS NULL')
      .andWhere('load.weekId IN (:...weekIds)', { weekIds })
      .getRawOne()) ?? { avgGross: '0', avgProfit: '0', avgMiles: '0', avgProfitMargin: '0' };

    const averages: DashboardAverages = {
      avgGross: round2(Number(avgRow.avgGross)),
      avgProfit: round2(Number(avgRow.avgProfit)),
      avgMiles: round2(Number(avgRow.avgMiles)),
      avgProfitMargin: round2(Number(avgRow.avgProfitMargin)),
    };

    // ── 4. Top corridors (from_state → to_state) ──
    const corridorRows: {
      fromState: string;
      toState: string;
      loadCount: string;
      grossAmount: string;
      profitAmount: string;
    }[] = await this.loadsRepo
      .createQueryBuilder('load')
      .select('load.fromState', 'fromState')
      .addSelect('load.toState', 'toState')
      .addSelect('COUNT(*)::int', 'loadCount')
      .addSelect('COALESCE(SUM(load.grossAmount), 0)', 'grossAmount')
      .addSelect('COALESCE(SUM(load.profitAmount), 0)', 'profitAmount')
      .where('load.archivedAt IS NULL')
      .andWhere('load.weekId IN (:...weekIds)', { weekIds })
      .groupBy('load.fromState')
      .addGroupBy('load.toState')
      .orderBy('"loadCount"', 'DESC')
      .limit(5)
      .getRawMany();

    const topCorridors: TopCorridor[] = corridorRows.map((r) => ({
      fromState: r.fromState,
      toState: r.toState,
      loadCount: Number(r.loadCount),
      grossAmount: round2(Number(r.grossAmount)),
      profitAmount: round2(Number(r.profitAmount)),
    }));

    // ── 5. Flag counts ──
    const flagRow: {
      quickPay: string;
      directPayment: string;
      factoring: string;
      driverPaid: string;
    } = (await this.loadsRepo
      .createQueryBuilder('load')
      .select('COALESCE(SUM(CASE WHEN load.quickPayFlag = true THEN 1 ELSE 0 END), 0)::int', 'quickPay')
      .addSelect('COALESCE(SUM(CASE WHEN load.directPaymentFlag = true THEN 1 ELSE 0 END), 0)::int', 'directPayment')
      .addSelect('COALESCE(SUM(CASE WHEN load.factoringFlag = true THEN 1 ELSE 0 END), 0)::int', 'factoring')
      .addSelect('COALESCE(SUM(CASE WHEN load.driverPaidFlag = true THEN 1 ELSE 0 END), 0)::int', 'driverPaid')
      .where('load.archivedAt IS NULL')
      .andWhere('load.weekId IN (:...weekIds)', { weekIds })
      .getRawOne()) ?? { quickPay: '0', directPayment: '0', factoring: '0', driverPaid: '0' };

    const flags: FlagSummary = {
      quickPay: Number(flagRow.quickPay),
      directPayment: Number(flagRow.directPayment),
      factoring: Number(flagRow.factoring),
      driverPaid: Number(flagRow.driverPaid),
    };

    return {
      totals,
      weeks: weeklyData,
      statusBreakdown,
      averages,
      topCorridors,
      flags,
    };
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
