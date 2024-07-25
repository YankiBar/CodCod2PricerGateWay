import { Test, TestingModule } from '@nestjs/testing';
import { MainFlowService } from './main-flow.service';

describe('MainFlowService', () => {
  let service: MainFlowService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MainFlowService],
    }).compile();

    service = module.get<MainFlowService>(MainFlowService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
