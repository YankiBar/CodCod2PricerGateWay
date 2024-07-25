import { Module } from '@nestjs/common';
import { CodcodService } from './codcod.service';

@Module({
  providers: [CodcodService]
})
export class CodcodModule {}
