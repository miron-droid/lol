import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MasterDataService } from './master-data.service';
import { User } from '../identity/entities/user.entity';
import { Driver } from './entities/driver.entity';
import { Unit } from './entities/unit.entity';
import { Brokerage } from './entities/brokerage.entity';
import { Role } from '@lol/shared';

describe('MasterDataService', () => {
  let service: MasterDataService;

  const mockUser = {
    id: 'u1',
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane@test.com',
    role: Role.Dispatcher,
  };

  const mockDriver = {
    id: 'd1',
    firstName: 'Bob',
    lastName: 'Driver',
    phone: '555-0100',
    createdAt: new Date('2026-01-01'),
  };

  const mockUnit = {
    id: 'unit-1',
    unitNumber: 'UNIT-001',
    vin: 'VIN123',
    make: 'Freightliner',
    year: 2024,
    createdAt: new Date('2026-01-01'),
  };

  const mockBrokerage = {
    id: 'brk-1',
    name: 'Acme Logistics',
    mcNumber: '123456',
    createdAt: new Date('2026-01-01'),
  };

  const usersRepo = {
    find: jest.fn().mockResolvedValue([mockUser]),
  };
  const driversRepo = {
    find: jest.fn().mockResolvedValue([mockDriver]),
  };
  const unitsRepo = {
    find: jest.fn().mockResolvedValue([mockUnit]),
  };
  const brokeragesRepo = {
    find: jest.fn().mockResolvedValue([mockBrokerage]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MasterDataService,
        { provide: getRepositoryToken(User), useValue: usersRepo },
        { provide: getRepositoryToken(Driver), useValue: driversRepo },
        { provide: getRepositoryToken(Unit), useValue: unitsRepo },
        { provide: getRepositoryToken(Brokerage), useValue: brokeragesRepo },
      ],
    }).compile();

    service = module.get<MasterDataService>(MasterDataService);
  });

  describe('listDispatchers', () => {
    it('should return users with role=Dispatcher as PickerItems', async () => {
      const result = await service.listDispatchers();
      expect(usersRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { role: Role.Dispatcher } }),
      );
      expect(result).toEqual([{ id: 'u1', label: 'Jane Doe' }]);
    });
  });

  describe('listDriverPickers', () => {
    it('should return drivers as PickerItems', async () => {
      const result = await service.listDriverPickers();
      expect(result).toEqual([{ id: 'd1', label: 'Bob Driver' }]);
    });
  });

  describe('listUnitPickers', () => {
    it('should return units as PickerItems with make', async () => {
      const result = await service.listUnitPickers();
      expect(result).toEqual([{ id: 'unit-1', label: 'UNIT-001 (Freightliner)' }]);
    });

    it('should omit make if null', async () => {
      unitsRepo.find.mockResolvedValueOnce([{ ...mockUnit, make: null }]);
      const result = await service.listUnitPickers();
      expect(result[0].label).toBe('UNIT-001');
    });
  });

  describe('listBrokeragePickers', () => {
    it('should return brokerages as PickerItems with MC number', async () => {
      const result = await service.listBrokeragePickers();
      expect(result).toEqual([{ id: 'brk-1', label: 'Acme Logistics (MC#123456)' }]);
    });

    it('should omit MC number if null', async () => {
      brokeragesRepo.find.mockResolvedValueOnce([{ ...mockBrokerage, mcNumber: null }]);
      const result = await service.listBrokeragePickers();
      expect(result[0].label).toBe('Acme Logistics');
    });
  });

  describe('listDrivers', () => {
    it('should return full DriverDto', async () => {
      const result = await service.listDrivers();
      expect(result).toEqual([{
        id: 'd1',
        firstName: 'Bob',
        lastName: 'Driver',
        phone: '555-0100',
        createdAt: '2026-01-01T00:00:00.000Z',
      }]);
    });
  });

  describe('listUnits', () => {
    it('should return full UnitDto', async () => {
      const result = await service.listUnits();
      expect(result[0].unitNumber).toBe('UNIT-001');
      expect(result[0].vin).toBe('VIN123');
    });
  });

  describe('listBrokerages', () => {
    it('should return full BrokerageDto', async () => {
      const result = await service.listBrokerages();
      expect(result[0].name).toBe('Acme Logistics');
      expect(result[0].mcNumber).toBe('123456');
    });
  });
});
