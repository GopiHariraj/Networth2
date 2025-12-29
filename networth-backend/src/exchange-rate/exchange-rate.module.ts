import { Module } from '@nestjs/common';
import { ExchangeRateService } from './exchange-rate.service';
import { ExchangeRateController } from './exchange-rate.controller';
import { PrismaModule } from '../common/prisma/prisma.module';
import { GeminiModule } from '../common/openai/gemini.module';

@Module({
    imports: [PrismaModule, GeminiModule],
    controllers: [ExchangeRateController],
    providers: [ExchangeRateService],
    exports: [ExchangeRateService],
})
export class ExchangeRateModule { }
