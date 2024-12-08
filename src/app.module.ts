import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { CodcodModule } from './codcod/codcod.module';
import { PricerModule } from './pricer/pricer.module';
import { JobsModule } from './gateway/jobs/jobs.module';
import { ScheduleModule } from '@nestjs/schedule';
import { LabelMonitorService } from './label-monitor/label-monitor.service';

@Module({
  imports: [
    JobsModule,
    ScheduleModule.forRoot(),
    ConfigModule.forRoot(),
    HttpModule,
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5, 
    }),
    CodcodModule,
    PricerModule,
  ],
  providers: [LabelMonitorService],
})
export class AppModule {}
