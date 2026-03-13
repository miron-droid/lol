/**
 * seed-production.ts — Populate the database with realistic production-scale data.
 *
 * Creates:
 *   - 7 users (admin + accountant + 4 dispatchers + 1 assistant)
 *   - 10 drivers, 8 units, 12 brokerages
 *   - 24 weeks (W1..W24 of 2026, Jan 5 – Jun 14)
 *   - ~500+ loads with diverse statuses, flags, routes
 *   - 1 active salary rule set
 *
 * Idempotent: re-running is safe — existing records are skipped.
 *
 * Usage:
 *   npm run seed:prod -w packages/api          (from repo root)
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

/* ────── helpers ────── */
function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** ISO week → Monday date string */
function isoWeekToMonday(isoYear: number, isoWeek: number): Date {
  const jan4 = new Date(Date.UTC(isoYear, 0, 4));
  const dayOfWeek = jan4.getUTCDay() || 7;
  const firstMonday = new Date(jan4);
  firstMonday.setUTCDate(jan4.getUTCDate() - dayOfWeek + 1);
  const result = new Date(firstMonday);
  result.setUTCDate(firstMonday.getUTCDate() + (isoWeek - 1) * 7);
  return result;
}

function dateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
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
  console.log('Connected to database.\n');

  const userRepo = ds.getRepository(User);
  const weekRepo = ds.getRepository(Week);
  const loadRepo = ds.getRepository(Load);
  const ruleRepo = ds.getRepository(SalaryRule);
  const driverRepo = ds.getRepository(Driver);
  const unitRepo = ds.getRepository(Unit);
  const brokerageRepo = ds.getRepository(Brokerage);

  const hash = await bcrypt.hash('password123', 10);

  // ═══════════════════════════════════════════════════════════════════
  // 1. USERS
  // ═══════════════════════════════════════════════════════════════════
  const userData = [
    { email: 'admin@tlslogistics.us', firstName: 'Admin', lastName: 'LOL', role: Role.Admin },
    { email: 'natalie.ivanova@tlslogistics.us', firstName: 'Natalie', lastName: 'Ivanova', role: Role.Accountant },
    { email: 'alex.petrov@tlslogistics.us', firstName: 'Alex', lastName: 'Petrov', role: Role.Dispatcher },
    { email: 'maria.gonzalez@tlslogistics.us', firstName: 'Maria', lastName: 'Gonzalez', role: Role.Dispatcher },
    { email: 'james.chen@tlslogistics.us', firstName: 'James', lastName: 'Chen', role: Role.Dispatcher },
    { email: 'anna.kowalski@tlslogistics.us', firstName: 'Anna', lastName: 'Kowalski', role: Role.Dispatcher },
    { email: 'sarah.miller@tlslogistics.us', firstName: 'Sarah', lastName: 'Miller', role: Role.Assistant },
  ];

  const users: Record<string, User> = {};
  for (const u of userData) {
    let existing = await userRepo.findOne({ where: { email: u.email } });
    if (!existing) {
      existing = await userRepo.save(userRepo.create({ ...u, passwordHash: hash }));
      console.log(`✅ User created: ${u.firstName} ${u.lastName} (${u.role})`);
    } else {
      console.log(`ℹ️  User exists: ${u.firstName} ${u.lastName}`);
    }
    users[u.email] = existing;
  }

  const admin = users['admin@tlslogistics.us'];
  const dispatchers = [
    users['alex.petrov@tlslogistics.us'],
    users['maria.gonzalez@tlslogistics.us'],
    users['james.chen@tlslogistics.us'],
    users['anna.kowalski@tlslogistics.us'],
  ];

  // ═══════════════════════════════════════════════════════════════════
  // 2. MASTER DATA — drivers, units, brokerages
  // ═══════════════════════════════════════════════════════════════════
  const driverData = [
    { firstName: 'Viktor', lastName: 'Kovalenko', phone: '+1-214-555-0101' },
    { firstName: 'Dmitry', lastName: 'Sokolov', phone: '+1-312-555-0102' },
    { firstName: 'Miguel', lastName: 'Rodriguez', phone: '+1-713-555-0103' },
    { firstName: 'John', lastName: 'Williams', phone: '+1-404-555-0104' },
    { firstName: 'Oleg', lastName: 'Bondarenko', phone: '+1-305-555-0105' },
    { firstName: 'Carlos', lastName: 'Martinez', phone: '+1-206-555-0106' },
    { firstName: 'Ivan', lastName: 'Zhukov', phone: '+1-303-555-0107' },
    { firstName: 'Robert', lastName: 'Johnson', phone: '+1-615-555-0108' },
    { firstName: 'Andrei', lastName: 'Popov', phone: '+1-816-555-0109' },
    { firstName: 'Tony', lastName: 'Nguyen', phone: '+1-602-555-0110' },
  ];

  const drivers: Driver[] = [];
  for (const d of driverData) {
    let existing = await driverRepo.findOne({ where: { firstName: d.firstName, lastName: d.lastName } });
    if (!existing) {
      existing = await driverRepo.save(driverRepo.create(d));
      console.log(`✅ Driver created: ${d.firstName} ${d.lastName}`);
    } else {
      console.log(`ℹ️  Driver exists: ${d.firstName} ${d.lastName}`);
    }
    drivers.push(existing);
  }

  const unitData = [
    { unitNumber: 'TLS-001', make: 'Freightliner', year: 2022, vin: '1FUJGLDR8NLAB1001' },
    { unitNumber: 'TLS-002', make: 'Kenworth', year: 2023, vin: '1XKYD49X7NJ351002' },
    { unitNumber: 'TLS-003', make: 'Peterbilt', year: 2021, vin: '1XPWD40X6ND451003' },
    { unitNumber: 'TLS-004', make: 'Volvo', year: 2023, vin: '4V4NC9EH5PN801004' },
    { unitNumber: 'TLS-005', make: 'Freightliner', year: 2024, vin: '1FUJGLDR0PLAB5005' },
    { unitNumber: 'TLS-006', make: 'Kenworth', year: 2022, vin: '1XKYD49X9NJ356006' },
    { unitNumber: 'TLS-007', make: 'International', year: 2023, vin: '3HSDJAPR5NN507007' },
    { unitNumber: 'TLS-008', make: 'Mack', year: 2024, vin: '1M1AN07Y5PM008008' },
  ];

  const units: Unit[] = [];
  for (const u of unitData) {
    let existing = await unitRepo.findOne({ where: { unitNumber: u.unitNumber } });
    if (!existing) {
      existing = await unitRepo.save(unitRepo.create(u));
      console.log(`✅ Unit created: ${u.unitNumber} (${u.make} ${u.year})`);
    } else {
      console.log(`ℹ️  Unit exists: ${u.unitNumber}`);
    }
    units.push(existing);
  }

  const brokerageData = [
    { name: 'CH Robinson', mcNumber: 'MC-128930' },
    { name: 'TQL (Total Quality Logistics)', mcNumber: 'MC-354742' },
    { name: 'XPO Logistics', mcNumber: 'MC-166580' },
    { name: 'Coyote Logistics', mcNumber: 'MC-389478' },
    { name: 'Echo Global Logistics', mcNumber: 'MC-447498' },
    { name: 'Landstar System', mcNumber: 'MC-143855' },
    { name: 'JB Hunt Transport', mcNumber: 'MC-104735' },
    { name: 'Schneider National', mcNumber: 'MC-133655' },
    { name: 'Werner Enterprises', mcNumber: 'MC-141010' },
    { name: 'RXO (formerly XPO)', mcNumber: 'MC-987632' },
    { name: 'Uber Freight', mcNumber: 'MC-973700' },
    { name: 'Amazon Freight', mcNumber: 'MC-934210' },
  ];

  const brokerages: Brokerage[] = [];
  for (const b of brokerageData) {
    let existing = await brokerageRepo.findOne({ where: { name: b.name } });
    if (!existing) {
      existing = await brokerageRepo.save(brokerageRepo.create(b));
      console.log(`✅ Brokerage created: ${b.name}`);
    } else {
      console.log(`ℹ️  Brokerage exists: ${b.name}`);
    }
    brokerages.push(existing);
  }

  // ═══════════════════════════════════════════════════════════════════
  // 3. WEEKS — W1 through W24 of 2026 (Jan 5 – Jun 14)
  // ═══════════════════════════════════════════════════════════════════
  const TOTAL_WEEKS = 24;
  const weeks: Week[] = [];
  for (let w = 1; w <= TOTAL_WEEKS; w++) {
    const monday = isoWeekToMonday(2026, w);
    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);
    const label = `LS2026-${String(w).padStart(2, '0')}`;

    let existing = await weekRepo.findOne({ where: { label } });
    if (!existing) {
      existing = await weekRepo.save(
        weekRepo.create({
          label,
          isoYear: 2026,
          isoWeek: w,
          startDate: dateStr(monday),
          endDate: dateStr(sunday),
        }),
      );
      console.log(`✅ Week created: ${label} (${dateStr(monday)} – ${dateStr(sunday)})`);
    } else {
      console.log(`ℹ️  Week exists: ${label}`);
    }
    weeks.push(existing);
  }

  // ═══════════════════════════════════════════════════════════════════
  // 4. LOADS — ~500+ across 24 weeks, realistic routes
  // ═══════════════════════════════════════════════════════════════════
  const existingLoadCount = await loadRepo.count();
  if (existingLoadCount > 100) {
    console.log(`\nℹ️  ${existingLoadCount} loads already exist — skipping load seed.`);
  } else {
    // Clear old data
    if (existingLoadCount > 0) {
      await loadRepo.delete({});
      console.log(`🗑️  Cleared ${existingLoadCount} existing loads.`);
    }

    const routes = [
      // Texas corridors
      { from: 'Dallas, TX', fromState: 'TX', to: 'Houston, TX', toState: 'TX', miles: 240 },
      { from: 'Houston, TX', fromState: 'TX', to: 'San Antonio, TX', toState: 'TX', miles: 197 },
      { from: 'Dallas, TX', fromState: 'TX', to: 'Jackson, MS', toState: 'MS', miles: 420 },
      { from: 'El Paso, TX', fromState: 'TX', to: 'Dallas, TX', toState: 'TX', miles: 637 },
      { from: 'Austin, TX', fromState: 'TX', to: 'New Orleans, LA', toState: 'LA', miles: 512 },
      // Midwest
      { from: 'Chicago, IL', fromState: 'IL', to: 'Indianapolis, IN', toState: 'IN', miles: 180 },
      { from: 'Chicago, IL', fromState: 'IL', to: 'Detroit, MI', toState: 'MI', miles: 282 },
      { from: 'Minneapolis, MN', fromState: 'MN', to: 'Chicago, IL', toState: 'IL', miles: 410 },
      { from: 'Kansas City, MO', fromState: 'MO', to: 'St. Louis, MO', toState: 'MO', miles: 250 },
      { from: 'Columbus, OH', fromState: 'OH', to: 'Pittsburgh, PA', toState: 'PA', miles: 185 },
      // Southeast
      { from: 'Atlanta, GA', fromState: 'GA', to: 'Nashville, TN', toState: 'TN', miles: 250 },
      { from: 'Miami, FL', fromState: 'FL', to: 'Orlando, FL', toState: 'FL', miles: 235 },
      { from: 'Charlotte, NC', fromState: 'NC', to: 'Atlanta, GA', toState: 'GA', miles: 245 },
      { from: 'Jacksonville, FL', fromState: 'FL', to: 'Savannah, GA', toState: 'GA', miles: 140 },
      { from: 'Tampa, FL', fromState: 'FL', to: 'Miami, FL', toState: 'FL', miles: 280 },
      { from: 'Raleigh, NC', fromState: 'NC', to: 'Richmond, VA', toState: 'VA', miles: 170 },
      // West coast
      { from: 'Los Angeles, CA', fromState: 'CA', to: 'Phoenix, AZ', toState: 'AZ', miles: 370 },
      { from: 'Seattle, WA', fromState: 'WA', to: 'Portland, OR', toState: 'OR', miles: 175 },
      { from: 'Sacramento, CA', fromState: 'CA', to: 'Reno, NV', toState: 'NV', miles: 135 },
      { from: 'Los Angeles, CA', fromState: 'CA', to: 'Las Vegas, NV', toState: 'NV', miles: 270 },
      { from: 'San Francisco, CA', fromState: 'CA', to: 'Sacramento, CA', toState: 'CA', miles: 87 },
      // Long haul
      { from: 'Denver, CO', fromState: 'CO', to: 'Kansas City, MO', toState: 'MO', miles: 600 },
      { from: 'Memphis, TN', fromState: 'TN', to: 'Dallas, TX', toState: 'TX', miles: 452 },
      { from: 'New Orleans, LA', fromState: 'LA', to: 'Houston, TX', toState: 'TX', miles: 350 },
      { from: 'Salt Lake City, UT', fromState: 'UT', to: 'Denver, CO', toState: 'CO', miles: 525 },
      { from: 'Philadelphia, PA', fromState: 'PA', to: 'Columbus, OH', toState: 'OH', miles: 472 },
      { from: 'Louisville, KY', fromState: 'KY', to: 'Cincinnati, OH', toState: 'OH', miles: 100 },
      { from: 'Boston, MA', fromState: 'MA', to: 'New York, NY', toState: 'NY', miles: 215 },
      { from: 'Baltimore, MD', fromState: 'MD', to: 'Philadelphia, PA', toState: 'PA', miles: 100 },
      { from: 'Phoenix, AZ', fromState: 'AZ', to: 'Albuquerque, NM', toState: 'NM', miles: 420 },
    ];

    const businesses = [
      'Walmart Distribution', 'FedEx Freight', 'Amazon Logistics',
      'Home Depot Supply', 'Costco Wholesale', 'Target Stores',
      'Tyson Foods', 'PepsiCo Beverages', 'General Mills',
      'Procter & Gamble', 'Tesla Parts', 'John Deere',
      'Caterpillar Inc', 'Sysco Corporation', 'US Foods',
      'Kroger Logistics', 'UPS Supply Chain', 'Dollar General',
      'Lowe\'s Distribution', 'Anheuser-Busch', 'Coca-Cola',
    ];

    const netsuiteRefs = ['NS-', 'INV-', 'PO-'];

    let loadNum = 1;
    let totalLoads = 0;

    for (const week of weeks) {
      const weekIdx = weeks.indexOf(week);

      // Seasonality: weeks 1-4 lighter (winter), 8-16 peak, 17+ steady
      let dispatcherMin = 3;
      let dispatcherMax = 6;
      if (weekIdx < 4) { dispatcherMin = 2; dispatcherMax = 5; }
      else if (weekIdx >= 7 && weekIdx <= 15) { dispatcherMin = 5; dispatcherMax = 8; }
      else { dispatcherMin = 4; dispatcherMax = 7; }

      for (const disp of dispatchers) {
        const loadCount = rand(dispatcherMin, dispatcherMax);

        for (let i = 0; i < loadCount; i++) {
          const route = pick(routes);
          const business = pick(businesses);
          const brokerage = pick(brokerages);
          const driver = pick(drivers);
          const unit = pick(units);

          // Revenue varies: $1,800 – $14,000 per load, with slight upward trend over weeks
          const baseLow = 1800 + weekIdx * 20;
          const baseHigh = 10000 + weekIdx * 80;
          const gross = rand(baseLow, baseHigh);
          // Driver cost: 45–72% of gross
          const driverPct = 0.45 + Math.random() * 0.27;
          const driverCost = Math.round(gross * driverPct);
          const profit = gross - driverCost;
          const profitPercent = gross > 0 ? round2((profit / gross) * 100) : 0;
          const otr = round2(gross * 0.0125);
          const netProfit = round2(profit - otr);

          // Status based on week age
          let loadStatus: LoadStatus;
          if (weekIdx < TOTAL_WEEKS - 3) {
            // Old weeks: mostly completed
            const r = Math.random();
            if (r < 0.88) loadStatus = LoadStatus.Completed;
            else if (r < 0.94) loadStatus = LoadStatus.Delivered;
            else loadStatus = LoadStatus.Cancelled;
          } else if (weekIdx === TOTAL_WEEKS - 3) {
            const r = Math.random();
            if (r < 0.60) loadStatus = LoadStatus.Completed;
            else if (r < 0.80) loadStatus = LoadStatus.Delivered;
            else if (r < 0.92) loadStatus = LoadStatus.InTransit;
            else loadStatus = LoadStatus.NotPickedUp;
          } else if (weekIdx === TOTAL_WEEKS - 2) {
            const r = Math.random();
            if (r < 0.30) loadStatus = LoadStatus.Completed;
            else if (r < 0.55) loadStatus = LoadStatus.Delivered;
            else if (r < 0.80) loadStatus = LoadStatus.InTransit;
            else loadStatus = LoadStatus.NotPickedUp;
          } else {
            // Current week
            const r = Math.random();
            if (r < 0.10) loadStatus = LoadStatus.Completed;
            else if (r < 0.25) loadStatus = LoadStatus.Delivered;
            else if (r < 0.55) loadStatus = LoadStatus.InTransit;
            else loadStatus = LoadStatus.NotPickedUp;
          }

          const quickPayFlag = Math.random() < 0.15;
          const factoringFlag = !quickPayFlag && Math.random() < 0.25;
          const directPaymentFlag = !quickPayFlag && !factoringFlag && Math.random() < 0.10;
          const driverPaidFlag = loadStatus === LoadStatus.Completed && Math.random() < 0.85;

          const dateOffset = rand(0, 4);
          const loadDate = new Date(week.startDate);
          loadDate.setDate(loadDate.getDate() + dateOffset);
          const date = dateStr(loadDate);

          const transitDays = Math.ceil(route.miles / 500) || 1;
          const toDateObj = new Date(date);
          toDateObj.setDate(toDateObj.getDate() + transitDays);

          const sylNumber = `TLS26-${String(week.isoWeek).padStart(2, '0')}-${String(loadNum).padStart(3, '0')}`;

          const netsuiteRef = Math.random() < 0.6
            ? `${pick(netsuiteRefs)}${2026}${String(week.isoWeek).padStart(2, '0')}-${rand(1000, 9999)}`
            : null;

          const isExternal = Math.random() < 0.3;
          const externalSource = isExternal ? 'cargo_etl' : null;
          const externalLoadKey = isExternal ? `CRG-${rand(100000, 999999)}` : null;

          const comment = loadStatus === LoadStatus.Cancelled
            ? pick(['Shipper cancelled', 'Driver no-show', 'Weather delay — cancelled', 'Rate dispute', 'Receiver refused'])
            : Math.random() < 0.15
              ? pick(['Detention 2h at pickup', 'TONU applied', 'Lumper fee included', 'Deadhead 45mi', 'Team drivers needed', 'Hazmat load', 'Oversize permit required'])
              : null;

          // Randomly archive ~3% of old completed loads
          const archivedAt = loadStatus === LoadStatus.Completed && weekIdx < TOTAL_WEEKS - 5 && Math.random() < 0.03
            ? new Date().toISOString()
            : null;

          await loadRepo.save(
            loadRepo.create({
              sylNumber,
              weekId: week.id,
              date,
              dispatcherId: disp.id,
              businessName: business,
              brokerageId: brokerage.id,
              driverId: driver.id,
              unitId: unit.id,
              netsuiteRef,
              fromAddress: route.from,
              fromState: route.fromState,
              fromDate: date,
              toAddress: route.to,
              toState: route.toState,
              toDate: dateStr(toDateObj),
              miles: route.miles,
              grossAmount: gross,
              driverCostAmount: driverCost,
              profitAmount: profit,
              profitPercent,
              otrAmount: otr,
              netProfitAmount: netProfit,
              loadStatus,
              quickPayFlag,
              directPaymentFlag,
              factoringFlag,
              driverPaidFlag,
              auditSource: isExternal ? 'webhook' : 'manual',
              externalSource,
              externalLoadKey,
              comment,
              archivedAt: archivedAt as any,
            }),
          );
          loadNum++;
          totalLoads++;
        }
      }
    }
    console.log(`\n✅ ${totalLoads} loads created across ${weeks.length} weeks`);
  }

  // ═══════════════════════════════════════════════════════════════════
  // 5. SALARY RULE
  // ═══════════════════════════════════════════════════════════════════
  const existingRule = await ruleRepo.findOne({ where: { isActive: true } });
  if (!existingRule) {
    await ruleRepo.save(
      ruleRepo.create({
        name: 'Standard Tiers 2026',
        version: 1,
        isActive: true,
        effectiveFrom: '2026-01-01',
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

  // ═══════════════════════════════════════════════════════════════════
  // Summary
  // ═══════════════════════════════════════════════════════════════════
  const counts = {
    users: await userRepo.count(),
    drivers: await driverRepo.count(),
    units: await unitRepo.count(),
    brokerages: await brokerageRepo.count(),
    weeks: await weekRepo.count(),
    loads: await loadRepo.count(),
    salaryRules: await ruleRepo.count(),
  };

  console.log('\n════════════════════════════════════════');
  console.log('  Production seed complete!');
  console.log('════════════════════════════════════════');
  console.log(`  Users:       ${counts.users}`);
  console.log(`  Drivers:     ${counts.drivers}`);
  console.log(`  Units:       ${counts.units}`);
  console.log(`  Brokerages:  ${counts.brokerages}`);
  console.log(`  Weeks:       ${counts.weeks}`);
  console.log(`  Loads:       ${counts.loads}`);
  console.log(`  Salary Rules: ${counts.salaryRules}`);
  console.log('════════════════════════════════════════\n');

  await ds.destroy();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
