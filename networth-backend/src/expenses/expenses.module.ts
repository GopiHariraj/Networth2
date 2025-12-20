import { Module } from '@nestjs/common';
import { ExpensesController } from './expenses.controller';
import { OpenAiModule } from '../common/openai/openai.module';

@Module({
    imports: [OpenAiModule],
    controllers: [ExpensesController],
})
export class ExpensesModule { }
