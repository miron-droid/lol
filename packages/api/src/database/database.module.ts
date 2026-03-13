import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { User } from '../identity/entities/user.entity';
import { Week } from '../week/entities/week.entity';
import { Load } from '../load/entities/load.entity';
import { SalaryRule } from '../salary-rule/entities/salary-rule.entity';
import { Driver } from '../master-data/entities/driver.entity';
import { Unit } from '../master-data/entities/unit.entity';
import { Brokerage } from '../master-data/entities/brokerage.entity';
import { SeedService } from './seed.service';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const databaseUrl = config.get<string>('DATABASE_URL');

        // If DATABASE_URL is set (Neon, Railway, Render, etc.), use it
        if (databaseUrl) {
          return {
            type: 'postgres',
            url: databaseUrl,
            ssl: { rejectUnauthorized: false },
            autoLoadEntities: true,
            synchronize: false,
            migrations: [join(__dirname, 'migrations/*.{ts,js}')],
            migrationsRun: true,
            logging: false,
          };
        }

        // Otherwise use individual env vars (local dev)
        return {
          type: 'postgres',
          host: config.get('POSTGRES_HOST', 'localhost'),
          port: config.get<number>('POSTGRES_PORT', 5432),
          username: config.get('POSTGRES_USER', 'lol'),
          password: config.get('POSTGRES_PASSWORD', 'lol_secret'),
          database: config.get('POSTGRES_DB', 'lol_vnext'),
          autoLoadEntities: true,
          synchronize: false,
          migrations: [join(__dirname, 'migrations/*.{ts,js}')],
          migrationsRun: true,
          logging: config.get('NODE_ENV') === 'development',
        };
      },
    }),
    // Register entities needed by SeedService
    TypeOrmModule.forFeature([User, Week, Load, SalaryRule, Driver, Unit, Brokerage]),
  ],
  providers: [SeedService],
})
export class DatabaseModule {}
