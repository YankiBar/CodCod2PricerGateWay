import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GatewayModule } from './gateway/gateway.module';
import { CodcodModule } from './codcod/codcod.module';
import { PricerModule } from './pricer/pricer.module';

@Module({
  imports: [GatewayModule, CodcodModule, PricerModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
