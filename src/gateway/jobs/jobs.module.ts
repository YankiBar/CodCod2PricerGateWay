import { Module } from '@nestjs/common';
import { GatewayService } from './main-flow/Gateway.service';
import { CodcodModule } from 'src/codcod/codcod.module';
import { PricerModule } from 'src/pricer/pricer.module';

@Module({
  imports: [CodcodModule, PricerModule],
  providers: [GatewayService]
})
export class JobsModule {}
