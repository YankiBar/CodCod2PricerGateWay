import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import configuration from './config/configuration';
import { CodcodModule } from './codcod/codcod.module';
import { PricerModule } from './pricer/pricer.module';
import { GatewayService } from './gateway/jobs/main-flow/main-flow.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
    }),
    HttpModule,
    CodcodModule,
    PricerModule,
    GatewayService
  ],
})
export class AppModule {}
