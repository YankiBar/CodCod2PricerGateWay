import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import configuration from './config/configuration';
import { CodcodModule } from './codcod/codcod.module';
import { PricerModule } from './pricer/pricer.module';
import { JobsModule } from './gateway/jobs/jobs.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    JobsModule,
    ScheduleModule.forRoot(),
    ConfigModule.forRoot(),
    HttpModule,
    CodcodModule,
    PricerModule,
  ],
})
export class AppModule {}
