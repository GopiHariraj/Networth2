import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { OpenAiService } from '../common/openai/openai.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('expenses')
@UseGuards(JwtAuthGuard)
export class ExpensesController {
    constructor(private readonly openAiService: OpenAiService) { }

    @Post('ai-parse-text')
    async parseExpenseText(@Body() body: { text: string }) {
        if (!body.text || body.text.trim().length === 0) {
            return { error: 'Text is required' };
        }

        try {
            const result = await this.openAiService.parseExpenseText(body.text);
            return result;
        } catch (error) {
            return {
                error: 'Failed to parse expenses',
                message: error.message
            };
        }
    }
}
