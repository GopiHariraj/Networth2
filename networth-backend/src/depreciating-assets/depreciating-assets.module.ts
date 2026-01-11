import { Module } from '@nestjs/common';
import { DepreciatingAssetsService } from './depreciating-assets.service';
import { DepreciatingAssetsController } from './depreciating-assets.controller';

@Module({
  providers: [DepreciatingAssetsService],
  controllers: [DepreciatingAssetsController]
})
export class DepreciatingAssetsModule {}
