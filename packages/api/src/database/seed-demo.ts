/**
 * seed-demo.ts — Populate the database with realistic demo data.
 *
 * Creates: 1 admin, 1 accountant, 4 dispatchers, 10 drivers, 6 units,
 *          5 brokerages, 8 weeks, ~80 loads with weekly variation, 1 active salary rule set.
 *
 * Weekly profiles make charts visually interesting:
 *   W6-W7: ramp-up period (low volume, moderate rates)
 *   W8-W9: growth (increasing volume & rates)
 *   W10-W11: peak season (high volume, high rates)
 *   W12-W13: slight cooldown
 *
 * Usage:
 *   npx ts-node -r tsconfig-paths/register packages/api/src/database/seed-demo.ts
 */
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import { join } from 'path';
import { User } from '../identity/entities/user.entity';
import { Week } from '../week/entities/week.entity';
import { Load } from '../load/entities/load.entity';
import { SalaryRule } from '../salary-rule/entities/salary-rule.entity';
import { Driver } from '../master-data/entities/driver.entity';
import { Unit } from '../master-data/entities/unit.entity';
import { Brokerage } from '../master-data/entities/brokerage.entity';
import { Role, LoadStatus } from '@lol/shared';

dotenv.config({ path: join(__dirname, '../../../../.env') });

/* ═══════════════════════════════════════════════════════
   Weekly profiles — each week has its own "personality"
   ═══════════════════════════════════════════════════════ */

interface WeekProfile {
  loadsPerDispatcher: [number, number]; // [min, max] loads
  grossRange: [number, number];         // [min, max] gross per load
  driverCostPct: [number, number];      // [min, max] driver cost as % of gross
  quickPayRate: number;                 // probability of quickPay flag
  directPayRate: number;
  factoringRate: number;
  driverPaidRate: number;
}

const WEEKLY_PROFILES: WeekProfile[] = [
  // W6 — Slow start of quarter
  { loadsPerDispatcher: [1, 2], grossRange: [1800, 3500], driverCostPct: [0.55, 0.65], quickPayRate: 0.1, directPayRate: 0.05, factoringRate: 0.3, driverPaidRate: 0.2 },
  // W7 — Picking up slightly
  { loadsPerDispatcher: [1, 3], grossRange: [2200, 4200], driverCostPct: [0.52, 0.62], quickPayRate: 0.15, directPayRate: 0.1, factoringRate: 0.25, driverPaidRate: 0.3 },
  // W8 — Solid growth
  { loadsPerDispatcher: [2, 3], grossRange: [3000, 5500], driverCostPct: [0.50, 0.60], quickPayRate: 0.2, directPayRate: 0.1, factoringRate: 0.2, driverPaidRate: 0.4 },
  // W9 — Strong week
  { loadsPerDispatcher: [2, 4], grossRange: [3500, 6500], driverCostPct: [0.48, 0.58], quickPayRate: 0.25, directPayRate: 0.15, factoringRate: 0.15, driverPaidRate: 0.5 },
  // W10 — Peak season begins
  { loadsPerDispatcher: [3, 4], grossRange: [4000, 7500], driverCostPct: [0.50, 0.60], quickPayRate: 0.3, directPayRate: 0.15, factoringRate: 0.1, driverPaidRate: 0.6 },
  // W11 — Best week
  { loadsPerDispatcher: [3, 5], grossRange: [4500, 8500], driverCostPct: [0.48, 0.55], quickPayRate: 0.35, directPayRate: 0.2, factoringRate: 0.1, driverPaidRate: 0.7 },
  // W12 — Slight dip
  { loadsPerDispatcher: [2, 4], grossRange: [3200, 6000], driverCostPct: [0.52, 0.62], quickPayRate: 0.2, directPayRate: 0.1, factoringRate: 0.2, driverPaidRate: 0.5 },
  // W13 — Current week (partial)
  { loadsPerDispatcher: [1, 3], grossRange: [2800, 5800], driverCostPct: [0.50, 0.60], quickPayRate: 0.15, directPayRate: 0.1, factoringRate: 0.25, driverPaidRate: 0.35 },
];

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function coinFlip(probability: number): boolean {
  return Math.random() < probability;
}

async function seed() {
  const ds = new DataSource({
    type: 'postgres',
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    username: process.env.POSTGRES_USER || 'lol',
    password: process.env.POSTGRES_PASSWORD || 'lol_secret',
    database: process.env.POSTGRES_DB || 'lol_vnext',
    entities: [User, Week, Load, SalaryRule, Driver, Unit, Brokerage],
    synchronize: false,
  });

  await ds.initialize();
  console.log('Connected to database.');

  const userRepo = ds.getRepository(User);
  const weekRepo = ds.getRepository(Week);
  const loadRepo = ds.getRepository(Load);
  const ruleRepo = ds.getRepository(SalaryRule);
  const driverRepo = ds.getRepository(Driver);
  const unitRepo = ds.getRepository(Unit);
  const brokerageRepo = ds.getRepository(Brokerage);

  const hash = await bcrypt.hash('password123', 10);

  // ── 1. Users ────────────────────────────────────────────────────
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
    let existing = await userRepo.findOne({ where: { email: u.email } });
    if (!existing) {
      existing = await userRepo.save(
        userRepo.create({ ...u, passwordHash: hash }),
      );
      console.log(`✅ User created: ${u.firstName} ${u.lastName} (${u.role})`);
    } else {
      console.log(`ℹ️  User exists: ${u.firstName} ${u.lastName}`);
    }
    users.push(existing);
  }

  const admin = users[0];
  const dispatchers = users.filter((u) => u.role === Role.Dispatcher);

  // ── 2. Drivers ──────────────────────────────────────────────────
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
    let existing = await driverRepo.findOne({ where: { firstName: d.firstName, lastName: d.lastName } });
    if (!existing) {
      existing = await driverRepo.save(driverRepo.create(d));
      console.log(`✅ Driver created: ${d.firstName} ${d.lastName}`);
    } else {
      console.log(`ℹ️  Driver exists: ${d.firstName} ${d.lastName}`);
    }
    drivers.push(existing);
  }

  // ── 3. Units ────────────────────────────────────────────────────
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
    let existing = await unitRepo.findOne({ where: { unitNumber: u.unitNumber } });
    if (!existing) {
      existing = await unitRepo.save(unitRepo.create(u));
      console.log(`✅ Unit created: ${u.unitNumber} (${u.make})`);
    } else {
      console.log(`ℹ️  Unit exists: ${u.unitNumber}`);
    }
    units.push(existing);
  }

  // ── 4. Brokerages ──────────────────────────────────────────────
  const brokeragesData = [
    { name: 'FedEx Freight', mcNumber: 'MC-123456' },
    { name: 'Swift Transport', mcNumber: 'MC-234567' },
    { name: 'Werner Logistics', mcNumber: 'MC-345678' },
    { name: 'JB Hunt', mcNumber: 'MC-456789' },
    { name: 'XPO Logistics', mcNumber: 'MC-567890' },
  ];

  const brokerages: Brokerage[] = [];
  for (const b of brokeragesData) {
    let existing = await brokerageRepo.findOne({ where: { name: b.name } });
    if (!existing) {
      existing = await brokerageRepo.save(brokerageRepo.create(b));
      console.log(`✅ Brokerage created: ${b.name}`);
    } else {
      console.log(`ℹ️  Brokerage exists: ${b.name}`);
    }
    brokerages.push(existing);
  }

  // ── 5. Weeks (W6–W13 of 2026) ──────────────────────────────────
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
    let existing = await weekRepo.findOne({ where: { label: w.label } });
    if (!existing) {
      existing = await weekRepo.save(weekRepo.create(w));
      console.log(`✅ Week created: ${w.label}`);
    } else {
      console.log(`ℹ️  Week exists: ${w.label}`);
    }
    weeks.push(existing);
  }

  // ── 6. Loads — with distinct weekly variation ───────────────────
  const existingLoadCount = await loadRepo.count({
    where: weeks.map((w) => ({ weekId: w.id })),
  });

  if (existingLoadCount > 0) {
    console.log(`ℹ️  ${existingLoadCount} loads already exist, skipping load seed.`);
  } else {
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
    let weekTotals: { label: string; loads: number; gross: number; net: number }[] = [];

    for (let wi = 0; wi < weeks.length; wi++) {
      const week = weeks[wi];
      const profile = WEEKLY_PROFILES[wi];
      let weekGross = 0;
      let weekNet = 0;
      let weekLoads = 0;

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

          const quickPay = coinFlip(profile.quickPayRate);
          const directPay = coinFlip(profile.directPayRate);
          const factoring = coinFlip(profile.factoringRate);
          const driverPaid = coinFlip(profile.driverPaidRate);

          await loadRepo.save(
            loadRepo.create({
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
              quickPayFlag: quickPay,
              directPaymentFlag: directPay,
              factoringFlag: factoring,
              driverPaidFlag: driverPaid,
              externalSource: null,
              externalLoadKey: null,
              netsuiteRef: null,
              comment: null,
            }),
          );

          weekGross += gross;
          weekNet += netProfit;
          weekLoads++;
          loadNum++;
        }
      }

      weekTotals.push({ label: week.label, loads: weekLoads, gross: weekGross, net: weekNet });
    }

    console.log(`\n✅ ${loadNum - 1} loads created across ${weeks.length} weeks\n`);
    console.log('Weekly breakdown:');
    console.log('─'.repeat(60));
    for (const wt of weekTotals) {
      console.log(`  ${wt.label}: ${wt.loads} loads | Gross $${wt.gross.toLocaleString()} | Net $${wt.net.toLocaleString()}`);
    }
    console.log('─'.repeat(60));
  }

  // ── 7. Salary Rule Set ─────────────────────────────────────────
  const existingRule = await ruleRepo.findOne({ where: { isActive: true } });
  if (!existingRule) {
    await ruleRepo.save(
      ruleRepo.create({
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
    console.log('✅ Salary rule set created: Standard Tiers 2026');
  } else {
    console.log(`ℹ️  Active salary rule exists: ${existingRule.name}`);
  }

  console.log('\n🎉 Demo seed complete!');
  console.log('\nLogin credentials:');
  console.log('  Admin:      admin@tlslogistics.us / password123');
  console.log('  Accountant: accounting@tlslogistics.us / password123');
  console.log('  Dispatcher: alex.petrov@tlslogistics.us / password123');
  console.log('              maria.gonzalez@tlslogistics.us / password123');
  console.log('              james.chen@tlslogistics.us / password123');
  console.log('              anna.kowalski@tlslogistics.us / password123');
  console.log('  Assistant:  assistant@tlslogistics.us / password123');
  await ds.destroy();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
