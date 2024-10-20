import { Controller, Get } from '@nestjs/common';
import { GatewayService } from './gateway.service'; // Adjust the import path

@Controller('gateway')
export class GatewayController {
  constructor(private readonly gatewayService: GatewayService) {}

  @Get('trigger-updates')
  async triggerUpdatesManually() {
    await this.gatewayService.processUpdates();
    return { status: 'Updates triggered' };
  }
}
