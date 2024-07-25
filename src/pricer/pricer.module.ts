import { Module } from '@nestjs/common';
import { PricerService } from './pricer.service';

@Module({
  providers: [PricerService]
})
export class PricerModule {}
