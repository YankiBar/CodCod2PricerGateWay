import { Module } from '@nestjs/common';
import { MainFlowService } from './main-flow/main-flow.service';

@Module({
  providers: [MainFlowService]
})
export class JobsModule {}
