import { Test, TestingModule } from '@nestjs/testing';
import { MasterDataController } from './master-data.controller';
import { MasterDataService } from './master-data.service';
import { JwtAuthGuard } from '../identity/guards/jwt-auth.guard';

describe('MasterDataController', () => {
  let controller: MasterDataController;
  let service: Partial<MasterDataService>;

  const mockDispatchers = [
    { id: 'disp-1', label: 'Jane Doe' },
    { id: 'disp-2', label: 'John Smith' },
  ];
  const mockDrivers = [{ id: 'drv-1', label: 'Driver One' }];
  const mockUnits = [{ id: 'unit-1', label: 'UNIT-001 (Freightliner)' }];
  const mockBrokerages = [{ id: 'brk-1', label: 'Acme Logistics (MC#123456)' }];

  beforeEach(async () => {
    service = {
      listDispatchers: jest.fn().mockResolvedValue(mockDispatchers),
      listDriverPickers: jest.fn().mockResolvedValue(mockDrivers),
      listUnitPickers: jest.fn().mockResolvedValue(mockUnits),
      listBrokeragePickers: jest.fn().mockResolvedValue(mockBrokerages),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MasterDataController],
      providers: [{ provide: MasterDataService, useValue: service }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<MasterDataController>(MasterDataController);
  });

  it('should return dispatcher picker items', async () => {
    const result = await controller.dispatchers();
    expect(result).toHaveLength(2);
    expect(result[0].label).toBe('Jane Doe');
    expect(service.listDispatchers).toHaveBeenCalled();
  });

  it('should return driver picker items', async () => {
    const result = await controller.drivers();
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe('Driver One');
    expect(service.listDriverPickers).toHaveBeenCalled();
  });

  it('should return unit picker items', async () => {
    const result = await controller.units();
    expect(result).toHaveLength(1);
    expect(result[0].label).toContain('UNIT-001');
    expect(service.listUnitPickers).toHaveBeenCalled();
  });

  it('should return brokerage picker items', async () => {
    const result = await controller.brokerages();
    expect(result).toHaveLength(1);
    expect(result[0].label).toContain('Acme Logistics');
    expect(service.listBrokeragePickers).toHaveBeenCalled();
  });
});
