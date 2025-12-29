import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateExpenseDto, UpdateExpenseDto } from './dto/expense.dto';

@Injectable()
export class ExpensesService {
    constructor(private prisma: PrismaService) { }

    async findAll(userId: string) {
        return this.prisma.expense.findMany({
            where: { userId },
            orderBy: { date: 'desc' },
        });
    }

    async findOne(id: string, userId: string) {
        return this.prisma.expense.findFirst({
            where: { id, userId },
        });
    }

    async create(userId: string, dto: CreateExpenseDto) {
        // Ensure proper date conversion - convert to ISO string first, then Date
        const dateObj = dto.date.includes('T')
            ? new Date(dto.date)
            : new Date(dto.date + 'T00:00:00.000Z');

        // If payment method is credit_card and creditCardId is provided
        if (dto.paymentMethod === 'credit_card' && dto.creditCardId) {
            // Use Prisma transaction to ensure atomicity
            return this.prisma.$transaction(async (tx) => {
                // 1. Verify credit card belongs to user
                const creditCard = await tx.creditCard.findUnique({
                    where: { id: dto.creditCardId },
                });

                if (!creditCard || creditCard.userId !== userId) {
                    throw new NotFoundException('Credit card not found or access denied');
                }

                // 2. Create the expense
                const expense = await tx.expense.create({
                    data: {
                        userId,
                        date: dateObj,
                        amount: dto.amount,
                        currency: dto.currency || 'AED',
                        category: dto.category,
                        merchant: dto.merchant,
                        paymentMethod: dto.paymentMethod,
                        accountId: dto.accountId,
                        creditCardId: dto.creditCardId,
                        recurrence: dto.recurrence || 'one-time',
                        periodTag: dto.periodTag,
                        notes: dto.notes,
                        source: dto.source || 'manual',
                        receiptUrl: dto.receiptUrl,
                        confidence: dto.confidence,
                    },
                });

                // 3. Update credit card used amount
                await tx.creditCard.update({
                    where: { id: dto.creditCardId },
                    data: {
                        usedAmount: {
                            increment: Number(dto.amount),
                        },
                    },
                });

                return expense;
            });
        }

        // Regular expense creation (no credit card)
        return this.prisma.expense.create({
            data: {
                userId,
                date: dateObj,
                amount: dto.amount,
                currency: dto.currency || 'AED',
                category: dto.category,
                merchant: dto.merchant,
                paymentMethod: dto.paymentMethod,
                accountId: dto.accountId,
                creditCardId: dto.creditCardId,
                recurrence: dto.recurrence || 'one-time',
                periodTag: dto.periodTag,
                notes: dto.notes,
                source: dto.source || 'manual',
                receiptUrl: dto.receiptUrl,
                confidence: dto.confidence,
            },
        });
    }

    async update(id: string, userId: string, dto: UpdateExpenseDto) {
        const expense = await this.findOne(id, userId);
        if (!expense) {
            throw new NotFoundException('Expense not found');
        }

        const oldPaymentMethod = expense.paymentMethod;
        const oldCreditCardId = expense.creditCardId;
        const oldAmount = Number(expense.amount);
        const newPaymentMethod = dto.paymentMethod ?? oldPaymentMethod;
        const newCreditCardId = dto.creditCardId ?? oldCreditCardId;
        const newAmount = dto.amount ?? oldAmount;

        // Check if credit card handling is needed
        const needsCreditCardUpdate =
            (oldPaymentMethod === 'credit_card' && oldCreditCardId) ||
            (newPaymentMethod === 'credit_card' && newCreditCardId);

        if (needsCreditCardUpdate) {
            return this.prisma.$transaction(async (tx) => {
                // 1. Update the expense
                const updatedExpense = await tx.expense.update({
                    where: { id },
                    data: {
                        date: dto.date ? new Date(dto.date) : undefined,
                        amount: dto.amount,
                        currency: dto.currency,
                        category: dto.category,
                        merchant: dto.merchant,
                        paymentMethod: dto.paymentMethod,
                        accountId: dto.accountId,
                        creditCardId: dto.creditCardId === null ? null : dto.creditCardId,
                        recurrence: dto.recurrence,
                        periodTag: dto.periodTag,
                        notes: dto.notes,
                        source: dto.source,
                        receiptUrl: dto.receiptUrl,
                        confidence: dto.confidence,
                    },
                });

                // 2. Handle credit card balance adjustments
                // Case 1: Changed from credit card to another payment method
                if (oldPaymentMethod === 'credit_card' && oldCreditCardId && newPaymentMethod !== 'credit_card') {
                    await tx.creditCard.update({
                        where: { id: oldCreditCardId },
                        data: {
                            usedAmount: {
                                decrement: oldAmount,
                            },
                        },
                    });
                }
                // Case 2: Changed from another payment method to credit card
                else if (oldPaymentMethod !== 'credit_card' && newPaymentMethod === 'credit_card' && newCreditCardId) {
                    await tx.creditCard.update({
                        where: { id: newCreditCardId },
                        data: {
                            usedAmount: {
                                increment: newAmount,
                            },
                        },
                    });
                }
                // Case 3: Changed between credit cards
                else if (oldCreditCardId && newCreditCardId && oldCreditCardId !== newCreditCardId) {
                    // Decrease old card
                    await tx.creditCard.update({
                        where: { id: oldCreditCardId },
                        data: {
                            usedAmount: {
                                decrement: oldAmount,
                            },
                        },
                    });
                    // Increase new card
                    await tx.creditCard.update({
                        where: { id: newCreditCardId },
                        data: {
                            usedAmount: {
                                increment: newAmount,
                            },
                        },
                    });
                }
                // Case 4: Same credit card but amount changed
                else if (oldCreditCardId && newCreditCardId && oldCreditCardId === newCreditCardId && oldAmount !== newAmount) {
                    const amountDifference = newAmount - oldAmount;
                    await tx.creditCard.update({
                        where: { id: oldCreditCardId },
                        data: {
                            usedAmount: {
                                increment: amountDifference,
                            },
                        },
                    });
                }

                return updatedExpense;
            });
        }

        // Regular update (no credit card involved)
        return this.prisma.expense.update({
            where: { id },
            data: {
                date: dto.date ? new Date(dto.date) : undefined,
                amount: dto.amount,
                currency: dto.currency,
                category: dto.category,
                merchant: dto.merchant,
                paymentMethod: dto.paymentMethod,
                accountId: dto.accountId,
                creditCardId: dto.creditCardId,
                recurrence: dto.recurrence,
                periodTag: dto.periodTag,
                notes: dto.notes,
                source: dto.source,
                receiptUrl: dto.receiptUrl,
                confidence: dto.confidence,
            },
        });
    }

    async delete(id: string, userId: string) {
        const expense = await this.findOne(id, userId);
        if (!expense) {
            throw new NotFoundException('Expense not found');
        }

        // If this is a credit card expense, decrease the card's used amount
        if (expense.paymentMethod === 'credit_card' && expense.creditCardId) {
            return this.prisma.$transaction(async (tx) => {
                // Decrease credit card used amount
                await tx.creditCard.update({
                    where: { id: expense.creditCardId! },
                    data: {
                        usedAmount: {
                            decrement: Number(expense.amount),
                        },
                    },
                });

                // Delete expense
                await tx.expense.delete({ where: { id } });

                return { success: true, message: 'Expense deleted and credit card balance updated' };
            });
        }

        // Regular delete (no credit card involved)
        await this.prisma.expense.delete({
            where: { id },
        });

        return { success: true, message: 'Expense deleted' };
    }

    async getInsights(userId: string) {
        const expenses = await this.findAll(userId);
        const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

        // Group by category
        const constByCategory = expenses.reduce((acc: any, exp) => {
            if (!acc[exp.category]) acc[exp.category] = 0;
            acc[exp.category] += Number(exp.amount);
            return acc;
        }, {});

        // Monthly trend (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1);

        const monthlyTrend = expenses
            .filter(e => new Date(e.date) >= sixMonthsAgo)
            .reduce((acc: any, exp) => {
                const month = new Date(exp.date).toLocaleString('default', { month: 'short', year: '2-digit' });
                if (!acc[month]) acc[month] = 0;
                acc[month] += Number(exp.amount);
                return acc;
            }, {});

        return {
            total,
            count: expenses.length,
            constByCategory,
            monthlyTrend: Object.keys(monthlyTrend).map(month => ({ month, amount: monthlyTrend[month] })),
        };
    }
}
