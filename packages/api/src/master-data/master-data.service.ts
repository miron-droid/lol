import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role, type PickerItem, type DriverDto, type UnitDto, type BrokerageDto } from '@lol/shared';
import { User } from '../identity/entities/user.entity';
import { Driver } from './entities/driver.entity';
import { Unit } from './entities/unit.entity';
import { Brokerage } from './entities/brokerage.entity';

@Injectable()
export class MasterDataService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(Driver)
    private readonly driversRepo: Repository<Driver>,
    @InjectRepository(Unit)
    private readonly unitsRepo: Repository<Unit>,
    @InjectRepository(Brokerage)
    private readonly brokeragesRepo: Repository<Brokerage>,
  ) {}

  /** List users with role=Dispatcher as PickerItems. */
  async listDispatchers(): Promise<PickerItem[]> {
    const users = await this.usersRepo.find({
      where: { role: Role.Dispatcher },
      order: { firstName: 'ASC', lastName: 'ASC' },
    });
    return users.map((u) => ({
      id: u.id,
      label: `${u.firstName} ${u.lastName}`,
    }));
  }

  /** List all drivers. */
  async listDrivers(): Promise<DriverDto[]> {
    const drivers = await this.driversRepo.find({ order: { firstName: 'ASC', lastName: 'ASC' } });
    return drivers.map((d) => ({
      id: d.id,
      firstName: d.firstName,
      lastName: d.lastName,
      phone: d.phone,
      createdAt: d.createdAt.toISOString(),
    }));
  }

  /** List drivers as PickerItems. */
  async listDriverPickers(): Promise<PickerItem[]> {
    const drivers = await this.driversRepo.find({ order: { firstName: 'ASC', lastName: 'ASC' } });
    return drivers.map((d) => ({
      id: d.id,
      label: `${d.firstName} ${d.lastName}`,
    }));
  }

  /** List all units. */
  async listUnits(): Promise<UnitDto[]> {
    const units = await this.unitsRepo.find({ order: { unitNumber: 'ASC' } });
    return units.map((u) => ({
      id: u.id,
      unitNumber: u.unitNumber,
      vin: u.vin,
      make: u.make,
      year: u.year,
      createdAt: u.createdAt.toISOString(),
    }));
  }

  /** List units as PickerItems. */
  async listUnitPickers(): Promise<PickerItem[]> {
    const units = await this.unitsRepo.find({ order: { unitNumber: 'ASC' } });
    return units.map((u) => ({
      id: u.id,
      label: u.unitNumber + (u.make ? ` (${u.make})` : ''),
    }));
  }

  /** List all brokerages. */
  async listBrokerages(): Promise<BrokerageDto[]> {
    const brokerages = await this.brokeragesRepo.find({ order: { name: 'ASC' } });
    return brokerages.map((b) => ({
      id: b.id,
      name: b.name,
      mcNumber: b.mcNumber,
      createdAt: b.createdAt.toISOString(),
    }));
  }

  /** List brokerages as PickerItems. */
  async listBrokeragePickers(): Promise<PickerItem[]> {
    const brokerages = await this.brokeragesRepo.find({ order: { name: 'ASC' } });
    return brokerages.map((b) => ({
      id: b.id,
      label: b.name + (b.mcNumber ? ` (MC#${b.mcNumber})` : ''),
    }));
  }
}
