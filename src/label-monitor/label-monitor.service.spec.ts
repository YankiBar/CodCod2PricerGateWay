import { Test, TestingModule } from '@nestjs/testing';
import { LabelMonitorService } from './label-monitor.service';

describe('LabelMonitorService', () => {
  let service: LabelMonitorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LabelMonitorService],
    }).compile();

    service = module.get<LabelMonitorService>(LabelMonitorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
