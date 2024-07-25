import { Test, TestingModule } from '@nestjs/testing';
import { CodcodService } from './codcod.service';

describe('CodcodService', () => {
  let service: CodcodService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CodcodService],
    }).compile();

    service = module.get<CodcodService>(CodcodService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
