import { Controller, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CodcodService } from './codcod.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  exports: [CodcodService],
  imports: [HttpModule, ConfigModule],
  providers: [CodcodService],
})
export class CodcodModule {}
