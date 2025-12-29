import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { GeminiService } from '../common/openai/gemini.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { GoldAssetsService } from '../gold-assets/gold-assets.service';
import { StockAssetsService } from '../stock-assets/stock-assets.service';

@Injectable()
export class TransactionsService {
  constructor(
    private prisma: PrismaService,
    private geminiService: GeminiService,
    @Inject(forwardRef(() => GoldAssetsService))
    private goldAssetsService: GoldAssetsService,
    @Inject(forwardRef(() => StockAssetsService))
    private stockAssetsService: StockAssetsService,
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
    const parsed = await this.geminiService.parseSMSTransaction(smsText);

    // Route based on transaction type
    switch (parsed.type) {
      case 'GOLD':
        return this.createGoldAsset(userId, parsed);

      case 'STOCK':
        return this.createStockAsset(userId, parsed);

      case 'BOND':
        return this.createBondAsset(userId, parsed);

      case 'EXPENSE':
      default:
        return this.createExpenseTransaction(userId, parsed);
    }
  }

  private async createGoldAsset(userId: string, parsed: any) {
    try {
      // Create gold asset using GoldAssetsService
      const goldData = {
        name: parsed.ornamentName || 'Gold Item',
        weightGrams: parsed.weight || 0,
        purchasePrice: parsed.amount,
        currentValue: parsed.amount,
        purchaseDate: typeof parsed.date === 'string' ? parsed.date : new Date().toISOString().split('T')[0],
        notes: `${parsed.purity || '22K'} purity, from SMS`,
      };

      const result = await this.goldAssetsService.create(userId, goldData);
      return { ...result, type: 'GOLD' };
    } catch (error) {
      console.error('Error creating gold asset:', error);
      throw error;
    }
  }

  private async createStockAsset(userId: string, parsed: any) {
    try {
      // Create stock asset using StockAssetsService
      const stockData = {
        symbol: parsed.stockSymbol || 'UNKNOWN',
        name: parsed.stockSymbol || 'Unknown Stock',
        exchange: parsed.market || 'NASDAQ',
        quantity: parsed.units || 1,
        avgPrice: parsed.unitPrice || parsed.amount,
        currentPrice: parsed.unitPrice || parsed.amount,
        notes: 'Added via SMS',
      };

      const result = await this.stockAssetsService.create(userId, stockData);
      return { ...result, type: 'STOCK' };
    } catch (error) {
      console.error('Error creating stock asset:', error);
      throw error;
    }
  }

  private async createBondAsset(userId: string, parsed: any) {
    // Bonds are not yet in database - return mock response
    // In future, create BondsService similar to Gold/Stocks
    return {
      type: 'BOND',
      message: 'Bond created in localStorage (not migrated to DB yet)',
      data: {
        bondName: parsed.bondName,
        amount: parsed.amount,
        interestRate: parsed.interestRate,
        maturityDate: parsed.maturityDate,
        source: 'SMS',
      },
    };
  }

  private async createExpenseTransaction(userId: string, parsed: any) {
    try {
      // Find or create category
      let categoryId = null;
      if (parsed.category) {
        const category = await this.prisma.category.findFirst({
          where: { userId, name: parsed.category },
        });
        if (category) {
          categoryId = category.id;
        } else {
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

      const result = await this.create(userId, {
        amount: parsed.amount,
        description: `${parsed.merchant || 'Expense'} - from SMS`,
        merchant: parsed.merchant,
        type: 'EXPENSE',
        source: 'SMS',
        date: new Date().toISOString(), // Keep date as it was in original
        categoryId: categoryId || undefined,
      });

      return { ...result, type: 'EXPENSE', merchant: parsed.merchant, category: parsed.category };
    } catch (error) {
      console.error('Error creating expense transaction:', error);
      throw error;
    }
  }

  async findAll(userId: string) {
    return this.prisma.transaction.findMany({
      where: { userId },
      include: { category: true },
      orderBy: { date: 'desc' },
    });
  }

  async getDashboardData(userId: string) {
    const [incomeResult, transactionExpenseResult, expensesResult, recentTransactions, categoryData] = await Promise.all([
      this.prisma.transaction.aggregate({
        where: { userId, type: 'INCOME' },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: { userId, type: 'EXPENSE' },
        _sum: { amount: true },
      }),
      // Also get expenses from the dedicated expenses table
      this.prisma.expense.aggregate({
        where: { userId },
        _sum: { amount: true },
      }),
      this.prisma.transaction.findMany({
        where: { userId },
        include: { category: true },
        orderBy: { date: 'desc' },
        take: 5,
      }),
      this.prisma.transaction.groupBy({
        by: ['categoryId'],
        where: { userId, type: 'EXPENSE' },
        _sum: { amount: true },
      }),
    ]);

    // Fetch category names for the breakdown
    const categoryIds = categoryData.map(c => c.categoryId).filter(Boolean);
    const categories = await this.prisma.category.findMany({
      where: { id: { in: categoryIds as string[] } },
      select: { id: true, name: true },
    });

    const categoryMap = categories.reduce((acc: Record<string, string>, cat) => {
      acc[cat.id] = cat.name;
      return acc;
    }, {});

    const pieChartData = categoryData.map(c => ({
      name: categoryMap[c.categoryId as string] || 'Uncategorized',
      value: Number(c._sum.amount),
    }));

    const income = Number(incomeResult._sum.amount || 0);
    const transactionExpense = Number(transactionExpenseResult._sum.amount || 0);
    const expensesTableTotal = Number(expensesResult._sum.amount || 0);

    // Total expenses = expenses from transactions table + expenses from expenses table
    const totalExpense = transactionExpense + expensesTableTotal;

    return {
      summary: {
        income,
        expense: totalExpense,
        net: income - totalExpense,
      },
      pieChartData,
      recentTransactions,
    };
  }

  async analyzeReceipt(userId: string, imageBase64: string) {
    try {
      const parsed = await this.geminiService.analyzeReceiptImage(imageBase64);

      // Create expense transaction from receipt data
      const expense = await this.prisma.expense.create({
        data: {
          date: parsed.date ? new Date(parsed.date) : new Date(),
          amount: parsed.total,
          currency: parsed.currency || 'AED',
          category: parsed.category || 'Misc',
          merchant: parsed.merchant || 'Unknown',
          paymentMethod: parsed.paymentMethod || 'cash',
          recurrence: 'one-time',
          notes: `Receipt items: ${parsed.items?.map((i: any) => i.name).join(', ') || 'N/A'}`,
          userId,
          source: 'gemini_vision',
          periodTag: 'monthly',
        },
      });

      return {
        success: true,
        type: 'EXPENSE',
        expense,
        receiptData: parsed,
      };
    } catch (error) {
      console.error('Receipt analysis error:', error);
      throw error;
    }
  }
}
