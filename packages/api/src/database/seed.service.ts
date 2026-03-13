import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../identity/entities/user.entity';
import { Week } from '../week/entities/week.entity';
import { Load } from '../load/entities/load.entity';
import { SalaryRule } from '../salary-rule/entities/salary-rule.entity';
import { Driver } from '../master-data/entities/driver.entity';
import { Unit } from '../master-data/entities/unit.entity';
import { Brokerage } from '../master-data/entities/brokerage.entity';
import { Role, LoadStatus } from '@lol/shared';

/* ═══════════════════════════════════════════════════════
   Weekly profiles — each week has its own "personality"
   for chart variation
   ═══════════════════════════════════════════════════════ */

interface WeekProfile {
  loadsPerDispatcher: [number, number];
  grossRange: [number, number];
  driverCostPct: [number, number];
  quickPayRate: number;
  directPayRate: number;
  factoringRate: number;
  driverPaidRate: number;
}

const WEEKLY_PROFILES: WeekProfile[] = [
  { loadsPerDispatcher: [1, 2], grossRange: [1800, 3500], driverCostPct: [0.55, 0.65], quickPayRate: 0.1, directPayRate: 0.05, factoringRate: 0.3, driverPaidRate: 0.2 },
  { loadsPerDispatcher: [1, 3], grossRange: [2200, 4200], driverCostPct: [0.52, 0.62], quickPayRate: 0.15, directPayRate: 0.1, factoringRate: 0.25, driverPaidRate: 0.3 },
  { loadsPerDispatcher: [2, 3], grossRange: [3000, 5500], driverCostPct: [0.50, 0.60], quickPayRate: 0.2, directPayRate: 0.1, factoringRate: 0.2, driverPaidRate: 0.4 },
  { loadsPerDispatcher: [2, 4], grossRange: [3500, 6500], driverCostPct: [0.48, 0.58], quickPayRate: 0.25, directPayRate: 0.15, factoringRate: 0.15, driverPaidRate: 0.5 },
  { loadsPerDispatcher: [3, 4], grossRange: [4000, 7500], driverCostPct: [0.50, 0.60], quickPayRate: 0.3, directPayRate: 0.15, factoringRate: 0.1, driverPaidRate: 0.6 },
  { loadsPerDispatcher: [3, 5], grossRange: [4500, 8500], driverCostPct: [0.48, 0.55], quickPayRate: 0.35, directPayRate: 0.2, factoringRate: 0.1, driverPaidRate: 0.7 },
  { loadsPerDispatcher: [2, 4], grossRange: [3200, 6000], driverCostPct: [0.52, 0.62], quickPayRate: 0.2, directPayRate: 0.1, factoringRate: 0.2, driverPaidRate: 0.5 },
  { loadsPerDispatcher: [1, 3], grossRange: [2800, 5800], driverCostPct: [0.50, 0.60], quickPayRate: 0.15, directPayRate: 0.1, factoringRate: 0.25, driverPaidRate: 0.35 },
];

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function coinFlip(probability: number): boolean {
  return Math.random() < probability;
}

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Week) private readonly weekRepo: Repository<Week>,
    @InjectRepository(Load) private readonly loadRepo: Repository<Load>,
    @InjectRepository(SalaryRule) private readonly ruleRepo: Repository<SalaryRule>,
    @InjectRepository(Driver) private readonly driverRepo: Repository<Driver>,
    @InjectRepository(Unit) private readonly unitRepo: Repository<Unit>,
    @InjectRepository(Brokerage) private readonly brokerageRepo: Repository<Brokerage>,
  ) {}

  async onModuleInit() {
    const userCount = await this.userRepo.count();
    if (userCount > 0) {
      this.logger.log('Database already has users — skipping auto-seed.');
      return;
    }

    this.logger.log('Empty database detected — running auto-seed...');
    await this.seed();
    this.logger.log('Auto-seed complete!');
  }

  async seed() {
    const hash = await bcrypt.hash('password123', 10);

    // ── 1. Users ──
    const usersData = [
      { email: 'admin@tlslogistics.us', firstName: 'Admin', lastName: 'LOL', role: Role.Admin },
      { email: 'accounting@tlslogistics.us', firstName: 'Sarah', lastName: 'Miller', role: Role.Accountant },
      { email: 'alex.petrov@tlslogistics.us', firstName: 'Alex', lastName: 'Petrov', role: Role.Dispatcher },
      { email: 'maria.gonzalez@tlslogistics.us', firstName: 'Maria', lastName: 'Gonzalez', role: Role.Dispatcher },
      { email: 'james.chen@tlslogistics.us', firstName: 'James', lastName: 'Chen', role: Role.Dispatcher },
      { email: 'anna.kowalski@tlslogistics.us', firstName: 'Anna', lastName: 'Kowalski', role: Role.Dispatcher },
      { email: 'assistant@tlslogistics.us', firstName: 'Mike', lastName: 'Davis', role: Role.Assistant },
    ];

    const users: User[] = [];
    for (const u of usersData) {
      const saved = await this.userRepo.save(this.userRepo.create({ ...u, passwordHash: hash }));
      this.logger.log(`User created: ${u.firstName} ${u.lastName} (${u.role})`);
      users.push(saved);
    }

    const admin = users[0];
    const dispatchers = users.filter((u) => u.role === Role.Dispatcher);

    // ── 2. Drivers ──
    const driversData = [
      { firstName: 'Ivan', lastName: 'Sokolov', phone: '(214) 555-0101' },
      { firstName: 'Dmitry', lastName: 'Volkov', phone: '(312) 555-0202' },
      { firstName: 'Sergey', lastName: 'Kozlov', phone: '(713) 555-0303' },
      { firstName: 'Andrey', lastName: 'Morozov', phone: '(404) 555-0404' },
      { firstName: 'Viktor', lastName: 'Popov', phone: '(305) 555-0505' },
      { firstName: 'Nikolay', lastName: 'Lebedev', phone: '(206) 555-0606' },
      { firstName: 'Oleg', lastName: 'Smirnov', phone: '(602) 555-0707' },
      { firstName: 'Pavel', lastName: 'Kuznetsov', phone: '(816) 555-0808' },
      { firstName: 'Roman', lastName: 'Fedorov', phone: '(303) 555-0909' },
      { firstName: 'Maxim', lastName: 'Novikov', phone: '(317) 555-1010' },
    ];

    const drivers: Driver[] = [];
    for (const d of driversData) {
      drivers.push(await this.driverRepo.save(this.driverRepo.create(d)));
    }
    this.logger.log(`${drivers.length} drivers created`);

    // ── 3. Units ──
    const unitsData = [
      { unitNumber: 'TLS-101', make: 'Freightliner', vin: '3AKJHHDR5NSLA1001', year: 2024 },
      { unitNumber: 'TLS-102', make: 'Kenworth', vin: '1XKYD49X46J1002', year: 2023 },
      { unitNumber: 'TLS-103', make: 'Peterbilt', vin: '2NP2HJ7X97M1003', year: 2025 },
      { unitNumber: 'TLS-104', make: 'Volvo', vin: '4V4NC9EH5FN1004', year: 2024 },
      { unitNumber: 'TLS-105', make: 'International', vin: '3HSDJSJR1CN1005', year: 2022 },
      { unitNumber: 'TLS-106', make: 'Mack', vin: '1M1AN07Y57N1006', year: 2025 },
    ];

    const units: Unit[] = [];
    for (const u of unitsData) {
      units.push(await this.unitRepo.save(this.unitRepo.create(u)));
    }
    this.logger.log(`${units.length} units created`);

    // ── 4. Brokerages ──
    const brokeragesData = [
      { name: 'FedEx Freight', mcNumber: 'MC-123456' },
      { name: 'Swift Transport', mcNumber: 'MC-234567' },
      { name: 'Werner Logistics', mcNumber: 'MC-345678' },
      { name: 'JB Hunt', mcNumber: 'MC-456789' },
      { name: 'XPO Logistics', mcNumber: 'MC-567890' },
    ];

    const brokerages: Brokerage[] = [];
    for (const b of brokeragesData) {
      brokerages.push(await this.brokerageRepo.save(this.brokerageRepo.create(b)));
    }
    this.logger.log(`${brokerages.length} brokerages created`);

    // ── 5. Weeks (W6–W13 of 2026) ──
    const weekData = [
      { label: 'LS2026-06', isoYear: 2026, isoWeek: 6,  startDate: '2026-02-02', endDate: '2026-02-08' },
      { label: 'LS2026-07', isoYear: 2026, isoWeek: 7,  startDate: '2026-02-09', endDate: '2026-02-15' },
      { label: 'LS2026-08', isoYear: 2026, isoWeek: 8,  startDate: '2026-02-16', endDate: '2026-02-22' },
      { label: 'LS2026-09', isoYear: 2026, isoWeek: 9,  startDate: '2026-02-23', endDate: '2026-03-01' },
      { label: 'LS2026-10', isoYear: 2026, isoWeek: 10, startDate: '2026-03-02', endDate: '2026-03-08' },
      { label: 'LS2026-11', isoYear: 2026, isoWeek: 11, startDate: '2026-03-09', endDate: '2026-03-15' },
      { label: 'LS2026-12', isoYear: 2026, isoWeek: 12, startDate: '2026-03-16', endDate: '2026-03-22' },
      { label: 'LS2026-13', isoYear: 2026, isoWeek: 13, startDate: '2026-03-23', endDate: '2026-03-29' },
    ];

    const weeks: Week[] = [];
    for (const w of weekData) {
      weeks.push(await this.weekRepo.save(this.weekRepo.create(w)));
    }
    this.logger.log(`${weeks.length} weeks created`);

    // ── 6. Loads — with distinct weekly variation ──
    const routes = [
      { from: 'Dallas, TX', fromState: 'TX', to: 'Jackson, MS', toState: 'MS', miles: 420 },
      { from: 'Chicago, IL', fromState: 'IL', to: 'Indianapolis, IN', toState: 'IN', miles: 180 },
      { from: 'Los Angeles, CA', fromState: 'CA', to: 'Phoenix, AZ', toState: 'AZ', miles: 370 },
      { from: 'Atlanta, GA', fromState: 'GA', to: 'Nashville, TN', toState: 'TN', miles: 250 },
      { from: 'Houston, TX', fromState: 'TX', to: 'New Orleans, LA', toState: 'LA', miles: 350 },
      { from: 'Denver, CO', fromState: 'CO', to: 'Kansas City, MO', toState: 'MO', miles: 600 },
      { from: 'Miami, FL', fromState: 'FL', to: 'Orlando, FL', toState: 'FL', miles: 235 },
      { from: 'Seattle, WA', fromState: 'WA', to: 'Portland, OR', toState: 'OR', miles: 175 },
      { from: 'San Antonio, TX', fromState: 'TX', to: 'Lubbock, TX', toState: 'TX', miles: 330 },
      { from: 'Memphis, TN', fromState: 'TN', to: 'Little Rock, AR', toState: 'AR', miles: 135 },
    ];

    let loadNum = 1;

    for (let wi = 0; wi < weeks.length; wi++) {
      const week = weeks[wi];
      const profile = WEEKLY_PROFILES[wi];

      for (const disp of dispatchers) {
        const loadCount = Math.round(rand(profile.loadsPerDispatcher[0], profile.loadsPerDispatcher[1]));

        for (let i = 0; i < loadCount; i++) {
          const route = routes[(loadNum - 1) % routes.length];
          const brokerage = brokerages[(loadNum - 1) % brokerages.length];
          const driver = drivers[(loadNum - 1) % drivers.length];
          const unit = units[(loadNum - 1) % units.length];

          const gross = Math.round(rand(profile.grossRange[0], profile.grossRange[1]));
          const driverCostPct = rand(profile.driverCostPct[0], profile.driverCostPct[1]);
          const driverCost = Math.round(gross * driverCostPct);
          const profit = gross - driverCost;
          const profitPercent = gross > 0 ? Math.round((profit / gross) * 10000) / 100 : 0;
          const otr = Math.round(gross * 0.0125 * 100) / 100;
          const netProfit = Math.round((profit - otr) * 100) / 100;

          const sylNumber = `TLS26-${String(week.isoWeek).padStart(2, '0')}-${String(loadNum).padStart(2, '0')}`;
          const dateOffset = Math.floor(Math.random() * 5);
          const loadDate = new Date(week.startDate);
          loadDate.setDate(loadDate.getDate() + dateOffset);
          const dateStr = loadDate.toISOString().slice(0, 10);

          const toDateObj = new Date(dateStr);
          toDateObj.setDate(toDateObj.getDate() + 1 + Math.floor(Math.random() * 2));

          await this.loadRepo.save(
            this.loadRepo.create({
              sylNumber,
              weekId: week.id,
              date: dateStr,
              dispatcherId: disp.id,
              businessName: brokerage.name,
              brokerageId: brokerage.id,
              driverId: driver.id,
              unitId: unit.id,
              fromAddress: route.from,
              fromState: route.fromState,
              fromDate: dateStr,
              toAddress: route.to,
              toState: route.toState,
              toDate: toDateObj.toISOString().slice(0, 10),
              miles: route.miles,
              grossAmount: gross,
              driverCostAmount: driverCost,
              profitAmount: profit,
              profitPercent,
              otrAmount: otr,
              netProfitAmount: netProfit,
              loadStatus: LoadStatus.Completed,
              auditSource: 'manual',
              quickPayFlag: coinFlip(profile.quickPayRate),
              directPaymentFlag: coinFlip(profile.directPayRate),
              factoringFlag: coinFlip(profile.factoringRate),
              driverPaidFlag: coinFlip(profile.driverPaidRate),
              externalSource: null,
              externalLoadKey: null,
              netsuiteRef: null,
              comment: null,
            }),
          );
          loadNum++;
        }
      }
    }
    this.logger.log(`${loadNum - 1} loads created across ${weeks.length} weeks`);

    // ── 7. Salary Rule Set ──
    await this.ruleRepo.save(
      this.ruleRepo.create({
        name: 'Standard Tiers 2026',
        version: 1,
        isActive: true,
        effectiveFrom: '2026-03-01',
        applicationMode: 'flat_rate',
        salaryBase: 'gross_profit',
        tiers: [
          { tierOrder: 1, minProfit: 0, maxProfit: 5000, percent: 8 },
          { tierOrder: 2, minProfit: 5000, maxProfit: 10000, percent: 10 },
          { tierOrder: 3, minProfit: 10000, maxProfit: 20000, percent: 12 },
          { tierOrder: 4, minProfit: 20000, maxProfit: null, percent: 15 },
        ],
        createdById: admin.id,
        createdByName: `${admin.firstName} ${admin.lastName}`,
      }),
    );
    this.logger.log('Salary rule set created');
  }
}
