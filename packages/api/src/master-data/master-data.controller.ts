import { Controller, Get, UseGuards } from '@nestjs/common';
import { MasterDataService } from './master-data.service';
import { JwtAuthGuard } from '../identity/guards/jwt-auth.guard';
import type { PickerItem } from '@lol/shared';

@Controller('master-data')
@UseGuards(JwtAuthGuard)
export class MasterDataController {
  constructor(private readonly masterDataService: MasterDataService) {}

  /** GET /api/master-data/dispatchers — picker items for dispatchers. */
  @Get('dispatchers')
  async dispatchers(): Promise<PickerItem[]> {
    return this.masterDataService.listDispatchers();
  }

  /** GET /api/master-data/drivers — picker items for drivers. */
  @Get('drivers')
  async drivers(): Promise<PickerItem[]> {
    return this.masterDataService.listDriverPickers();
  }

  /** GET /api/master-data/units — picker items for units. */
  @Get('units')
  async units(): Promise<PickerItem[]> {
    return this.masterDataService.listUnitPickers();
  }

  /** GET /api/master-data/brokerages — picker items for brokerages. */
  @Get('brokerages')
  async brokerages(): Promise<PickerItem[]> {
    return this.masterDataService.listBrokeragePickers();
  }
}
