import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CodcodService } from './codcod.service';

@Module({
  imports: [HttpModule],
  providers: [CodcodService],
  exports: [CodcodService],
})
export class CodcodModule {}
