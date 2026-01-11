import { Test, TestingModule } from '@nestjs/testing';
import { DepreciatingAssetsService } from './depreciating-assets.service';

describe('DepreciatingAssetsService', () => {
  let service: DepreciatingAssetsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DepreciatingAssetsService],
    }).compile();

    service = module.get<DepreciatingAssetsService>(DepreciatingAssetsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
