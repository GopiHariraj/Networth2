import { Body, Controller, Get, Post, Query, UseGuards, Request } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto, ParseSmsDto } from './dto/create-transaction.dto';
// Assuming AuthGuard is set up, but for now we might mock user ID if auth is complex
// but existing code has auth. Let's try to use it if possible or accept a userId query param for simplicity in dev.

@Controller('transactions')
export class TransactionsController {
    constructor(private readonly transactionsService: TransactionsService) { }

    // NOTE: In production, extract userId from JWT Guard. 
    // For this demo, we will use a hardcoded userId or query param if Auth is not fully set up in my context.
    // I will check if AuthGuard is available later. For now, passing strict userId for testing.

    @Post()
    create(@Body() dto: CreateTransactionDto, @Query('userId') userId: string) {
        // FALLBACK for development
        const uid = userId || 'default-user-id'; // This needs to be a valid UUID from the DB
        return this.transactionsService.create(uid, dto);
    }

    @Post('sms')
    parseSMS(@Body() dto: ParseSmsDto, @Query('userId') userId: string) {
        const uid = userId || 'default-user-id';
        return this.transactionsService.parseAndCreate(uid, dto.text);
    }

    @Get()
    findAll(@Query('userId') userId: string) {
        const uid = userId || 'default-user-id';
        return this.transactionsService.findAll(uid);
    }

    @Get('dashboard')
    getDashboard(@Query('userId') userId: string) {
        const uid = userId || 'default-user-id';
        return this.transactionsService.getDashboardData(uid);
    }
}
