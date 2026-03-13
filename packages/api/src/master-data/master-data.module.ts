import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../identity/entities/user.entity';
import { Driver } from './entities/driver.entity';
import { Unit } from './entities/unit.entity';
import { Brokerage } from './entities/brokerage.entity';
import { MasterDataService } from './master-data.service';
import { MasterDataController } from './master-data.controller';
import { IdentityModule } from '../identity/identity.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Driver, Unit, Brokerage]),
    IdentityModule,
  ],
  controllers: [MasterDataController],
  providers: [MasterDataService],
  exports: [MasterDataService],
})
export class MasterDataModule {}
