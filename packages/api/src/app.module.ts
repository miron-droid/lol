import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { IdentityModule } from './identity/identity.module';
import { WeekModule } from './week/week.module';
import { LoadModule } from './load/load.module';
import { IntegrationModule } from './integration/integration.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { StatementModule } from './statement/statement.module';
import { SalaryRuleModule } from './salary-rule/salary-rule.module';
import { SalaryModule } from './salary/salary.module';
import { MasterDataModule } from './master-data/master-data.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),
    DatabaseModule,
    HealthModule,
    IdentityModule,
    WeekModule,
    LoadModule,
    IntegrationModule,
    DashboardModule,
    StatementModule,
    SalaryRuleModule,
    SalaryModule,
    MasterDataModule,
  ],
})
export class AppModule {}
