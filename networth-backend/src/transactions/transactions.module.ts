import { Module } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { OpenAIModule } from '../openai/openai.module';
import { PrismaModule } from '../common/prisma/prisma.module'; // Adjust path if needed

@Module({
    imports: [OpenAIModule, PrismaModule],
    controllers: [TransactionsController],
    providers: [TransactionsService],
})
export class TransactionsModule { }
