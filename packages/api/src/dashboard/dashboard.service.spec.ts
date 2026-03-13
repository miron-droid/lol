import { BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { DashboardService } from './dashboard.service';
import { Load } from '../load/entities/load.entity';
import { Week } from '../week/entities/week.entity';

describe('DashboardService', () => {
  let service: DashboardService;
  let loadsRepo: Partial<Repository<Load>>;
  let weeksRepo: Partial<Repository<Week>>;

  const mockWeeks: Partial<Week>[] = [
    { id: 'w1', label: 'LS2026-10', isoYear: 2026, isoWeek: 10, startDate: '2026-03-02', endDate: '2026-03-08' },
    { id: 'w2', label: 'LS2026-11', isoYear: 2026, isoWeek: 11, startDate: '2026-03-09', endDate: '2026-03-15' },
  ];

  const mockAggRows = [
    {
      weekId: 'w1',
      loadCount: '3',
      grossAmount: '15000',
      driverCostAmount: '10500',
      profitAmount: '4500',
      otrAmount: '187.50',
      netProfitAmount: '4312.50',
    },
    {
      weekId: 'w2',
      loadCount: '2',
      grossAmount: '8000',
      driverCostAmount: '5600',
      profitAmount: '2400',
      otrAmount: '100',
      netProfitAmount: '2300',
    },
  ];

  const weeksQb = {
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue(mockWeeks),
  };

  const loadsQb = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    addGroupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    getRawMany: jest.fn().mockResolvedValue(mockAggRows),
    getRawOne: jest.fn().mockResolvedValue({ avgGross: '4600', avgProfit: '1380', avgMiles: '300', avgProfitMargin: '30' }),
  };

  beforeEach(() => {
    weeksQb.getMany.mockResolvedValue(mockWeeks);
    loadsQb.getRawMany.mockResolvedValue(mockAggRows);

    weeksRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(weeksQb),
    };
    loadsRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(loadsQb),
    };

    service = new DashboardService(
      loadsRepo as Repository<Load>,
      weeksRepo as Repository<Week>,
    );
  });

  it('should throw BadRequestException when weekIds is empty', async () => {
    await expect(service.aggregate([])).rejects.toThrow(BadRequestException);
  });

  it('should return totals and weekly breakdown', async () => {
    const result = await service.aggregate(['w1', 'w2']);

    expect(result.totals).toEqual({
      loadCount: 5,
      grossAmount: 23000,
      driverCostAmount: 16100,
      profitAmount: 6900,
      otrAmount: 287.5,
      netProfitAmount: 6612.5,
    });

    expect(result.weeks).toHaveLength(2);
    expect(result.weeks[0].weekLabel).toBe('LS2026-10');
    expect(result.weeks[0].loadCount).toBe(3);
    expect(result.weeks[0].grossAmount).toBe(15000);
    expect(result.weeks[1].weekLabel).toBe('LS2026-11');
    expect(result.weeks[1].loadCount).toBe(2);
  });

  it('should handle weeks with no loads', async () => {
    loadsQb.getRawMany.mockResolvedValue([]); // no load data

    const result = await service.aggregate(['w1', 'w2']);

    expect(result.totals.loadCount).toBe(0);
    expect(result.totals.grossAmount).toBe(0);
    expect(result.weeks[0].loadCount).toBe(0);
    expect(result.weeks[0].grossAmount).toBe(0);
    expect(result.weeks[1].loadCount).toBe(0);
  });

  it('should order weeks oldest to newest', async () => {
    const result = await service.aggregate(['w1', 'w2']);

    expect(weeksQb.orderBy).toHaveBeenCalledWith('week.isoYear', 'ASC');
    expect(weeksQb.addOrderBy).toHaveBeenCalledWith('week.isoWeek', 'ASC');
    expect(result.weeks[0].weekLabel).toBe('LS2026-10');
    expect(result.weeks[1].weekLabel).toBe('LS2026-11');
  });

  it('should exclude archived loads via WHERE clause', async () => {
    await service.aggregate(['w1']);

    expect(loadsQb.where).toHaveBeenCalledWith('load.archivedAt IS NULL');
  });

  it('should round totals to 2 decimal places', async () => {
    loadsQb.getRawMany.mockResolvedValue([
      {
        weekId: 'w1',
        loadCount: '1',
        grossAmount: '3333.333',
        driverCostAmount: '2222.222',
        profitAmount: '1111.111',
        otrAmount: '41.666',
        netProfitAmount: '1069.445',
      },
    ]);
    weeksQb.getMany.mockResolvedValue([mockWeeks[0]]);

    const result = await service.aggregate(['w1']);

    expect(result.totals.grossAmount).toBe(3333.33);
    expect(result.totals.driverCostAmount).toBe(2222.22);
    expect(result.totals.profitAmount).toBe(1111.11);
    expect(result.totals.otrAmount).toBe(41.67);
    expect(result.totals.netProfitAmount).toBe(1069.45);
  });
});
