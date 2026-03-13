import { Test, TestingModule } from '@nestjs/testing';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../identity/guards/jwt-auth.guard';
import type { DashboardDto } from '@lol/shared';

describe('DashboardController', () => {
  let controller: DashboardController;
  let service: Partial<DashboardService>;

  const mockDashboard: DashboardDto = {
    totals: {
      loadCount: 5,
      grossAmount: 23000,
      driverCostAmount: 16100,
      profitAmount: 6900,
      otrAmount: 287.5,
      netProfitAmount: 6612.5,
    },
    weeks: [],
    statusBreakdown: [{ status: 'completed', count: 5 }],
    averages: { avgGross: 4600, avgProfit: 1380, avgMiles: 800, avgProfitMargin: 30 },
    topCorridors: [],
    flags: { quickPay: 1, directPayment: 0, factoring: 2, driverPaid: 3 },
  };

  beforeEach(async () => {
    service = {
      aggregate: jest.fn().mockResolvedValue(mockDashboard),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [{ provide: DashboardService, useValue: service }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<DashboardController>(DashboardController);
  });

  it('should parse comma-separated weekIds and call service', async () => {
    const result = await controller.aggregate('w1,w2,w3');

    expect(service.aggregate).toHaveBeenCalledWith(['w1', 'w2', 'w3']);
    expect(result).toEqual(mockDashboard);
  });

  it('should handle single weekId', async () => {
    await controller.aggregate('w1');

    expect(service.aggregate).toHaveBeenCalledWith(['w1']);
  });

  it('should filter empty strings from weekIds', async () => {
    await controller.aggregate('w1,,w2,');

    expect(service.aggregate).toHaveBeenCalledWith(['w1', 'w2']);
  });
});
