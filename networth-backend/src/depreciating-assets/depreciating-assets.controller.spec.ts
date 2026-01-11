import { Test, TestingModule } from '@nestjs/testing';
import { DepreciatingAssetsController } from './depreciating-assets.controller';

describe('DepreciatingAssetsController', () => {
  let controller: DepreciatingAssetsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DepreciatingAssetsController],
    }).compile();

    controller = module.get<DepreciatingAssetsController>(DepreciatingAssetsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
