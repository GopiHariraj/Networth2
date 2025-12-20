import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { OpenAIService } from '../openai/openai.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@Injectable()
export class TransactionsService {
    constructor(
        private prisma: PrismaService,
        private openaiService: OpenAIService,
    ) { }

    async create(userId: string, dto: CreateTransactionDto) {
        return this.prisma.transaction.create({
            data: {
                amount: dto.amount,
                description: dto.description,
                source: dto.source || 'MANUAL',
                date: dto.date ? new Date(dto.date) : new Date(),
                merchant: dto.merchant,
                type: dto.type || 'EXPENSE',
                userId: userId,
                categoryId: dto.categoryId,
            },
        });
    }

    async parseAndCreate(userId: string, smsText: string) {
        const parsed = await this.openaiService.parseSMS(smsText);

        // Find or create category (Simple logic)
        let categoryId = null;
        if (parsed.category) {
            const category = await this.prisma.category.findFirst({
                where: { userId, name: parsed.category },
            });
            if (category) {
                categoryId = category.id;
            } else {
                // Create new category if not exists (or could assign to Misc)
                const newCat = await this.prisma.category.create({
                    data: {
                        userId,
                        name: parsed.category,
                        type: 'EXPENSE',
                    },
                });
                categoryId = newCat.id;
            }
        }

        return this.create(userId, {
            amount: parsed.amount,
            merchant: parsed.merchant,
            description: parsed.description,
            source: 'SMS',
            date: new Date().toISOString(),
            categoryId: categoryId || undefined,
            type: 'EXPENSE',
        });
    }

    async findAll(userId: string) {
        return this.prisma.transaction.findMany({
            where: { userId },
            include: { category: true },
            orderBy: { date: 'desc' },
        });
    }

    async getDashboardData(userId: string) {
        const transactions = await this.prisma.transaction.findMany({
            where: { userId },
            include: { category: true },
        });

        const income = transactions
            .filter((t: any) => t.type === 'INCOME')
            .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

        const expense = transactions
            .filter((t: any) => t.type === 'EXPENSE')
            .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

        const categoryBreakdown: Record<string, number> = {};
        transactions.forEach((t: any) => {
            if (t.type === 'EXPENSE' && t.category) {
                categoryBreakdown[t.category.name] = (categoryBreakdown[t.category.name] || 0) + Number(t.amount);
            }
        });

        const pieChartData = Object.entries(categoryBreakdown).map(([name, value]) => ({
            name,
            value,
        }));

        // Monthly Trend (Simple last 6 months)
        // Group by month-year
        // This is a simplified version

        return {
            summary: {
                income,
                expense,
                net: income - expense,
            },
            pieChartData,
            recentTransactions: transactions.slice(0, 5),
        };
    }
}
