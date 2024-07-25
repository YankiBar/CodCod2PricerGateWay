import { Test, TestingModule } from '@nestjs/testing';
import { PricerService } from './pricer.service';

describe('PricerService', () => {
  let service: PricerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PricerService],
    }).compile();

    service = module.get<PricerService>(PricerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
