import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CodcodService } from './codcod.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [CodcodService],
  exports: [CodcodService],
})
export class CodcodModule {}
