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
        // Ensure proper date conversion
        const dateObj = dto.date.includes('T')
            ? new Date(dto.date)
            : new Date(dto.date + 'T00:00:00.000Z');

        return this.prisma.$transaction(async (tx) => {
            // 1. Create the expense
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
                    toBankAccountId: dto.toBankAccountId,
                    recurrence: dto.recurrence || 'one-time',
                    periodTag: dto.periodTag,
                    notes: dto.notes,
                    source: dto.source || 'manual',
                    receiptUrl: dto.receiptUrl,
                    confidence: dto.confidence,
                } as any,
            });

            // 2. Adjust balances based on payment method
            const amount = Number(dto.amount);

            if (dto.paymentMethod === 'credit_card' && dto.creditCardId) {
                await tx.creditCard.update({
                    where: { id: dto.creditCardId },
                    data: { usedAmount: { increment: amount } },
                });
            } else if ((dto.paymentMethod === 'debit_card' || dto.paymentMethod === 'cash') && dto.accountId) {
                await tx.bankAccount.update({
                    where: { id: dto.accountId },
                    data: { balance: { decrement: amount } },
                });
            } else if (dto.paymentMethod === 'bank' && dto.accountId) {
                // Bank Transfer
                // Increment target if provided (Bank or Credit Card payment)
                if (dto.toBankAccountId) {
                    await tx.bankAccount.update({
                        where: { id: dto.toBankAccountId },
                        data: { balance: { increment: amount } },
                    });
                } else if (dto.creditCardId) {
                    // This is a Credit Card payment via Bank Transfer
                    await tx.creditCard.update({
                        where: { id: dto.creditCardId },
                        data: { usedAmount: { decrement: amount } },
                    });
                }

                // Decrement source bank account
                await tx.bankAccount.update({
                    where: { id: dto.accountId },
                    data: { balance: { decrement: amount } },
                });
            }

            return expense;
        });
    }

    async update(id: string, userId: string, dto: UpdateExpenseDto) {
        const oldExpense = await this.findOne(id, userId);
        if (!oldExpense) {
            throw new NotFoundException('Expense not found');
        }

        return this.prisma.$transaction(async (tx) => {
            // 1. Reverse old balance adjustments
            const oldAmount = Number(oldExpense.amount);
            if (oldExpense.paymentMethod === 'credit_card' && oldExpense.creditCardId) {
                await tx.creditCard.update({
                    where: { id: oldExpense.creditCardId },
                    data: { usedAmount: { decrement: oldAmount } },
                });
            } else if ((oldExpense.paymentMethod === 'debit_card' || oldExpense.paymentMethod === 'cash') && oldExpense.accountId) {
                await tx.bankAccount.update({
                    where: { id: oldExpense.accountId },
                    data: { balance: { increment: oldAmount } },
                });
            } else if (oldExpense.paymentMethod === 'bank' && oldExpense.accountId) {
                if ((oldExpense as any).toBankAccountId) {
                    await tx.bankAccount.update({
                        where: { id: (oldExpense as any).toBankAccountId },
                        data: { balance: { decrement: oldAmount } },
                    });
                } else if (oldExpense.creditCardId) {
                    await tx.creditCard.update({
                        where: { id: oldExpense.creditCardId },
                        data: { usedAmount: { increment: oldAmount } },
                    });
                }
                await tx.bankAccount.update({
                    where: { id: oldExpense.accountId },
                    data: { balance: { increment: oldAmount } },
                });
            }

            // 2. Update the expense record
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
                    toBankAccountId: dto.toBankAccountId === null ? null : dto.toBankAccountId,
                    recurrence: dto.recurrence,
                    periodTag: dto.periodTag,
                    notes: dto.notes,
                    source: dto.source,
                    receiptUrl: dto.receiptUrl,
                    confidence: dto.confidence,
                } as any,
            });

            // 3. Apply new balance adjustments
            const newAmount = Number(updatedExpense.amount);
            const newPaymentMethod = updatedExpense.paymentMethod;
            const newAccountId = updatedExpense.accountId;
            const newCreditCardId = updatedExpense.creditCardId;
            const newToBankId = (updatedExpense as any).toBankAccountId;

            if (newPaymentMethod === 'credit_card' && newCreditCardId) {
                await tx.creditCard.update({
                    where: { id: newCreditCardId },
                    data: { usedAmount: { increment: newAmount } },
                });
            } else if ((newPaymentMethod === 'debit_card' || newPaymentMethod === 'cash') && newAccountId) {
                await tx.bankAccount.update({
                    where: { id: newAccountId },
                    data: { balance: { decrement: newAmount } },
                });
            } else if (newPaymentMethod === 'bank' && newAccountId) {
                if (newToBankId) {
                    await tx.bankAccount.update({
                        where: { id: newToBankId },
                        data: { balance: { increment: newAmount } },
                    });
                } else if (newCreditCardId) {
                    await tx.creditCard.update({
                        where: { id: newCreditCardId },
                        data: { usedAmount: { decrement: newAmount } },
                    });
                }
                await tx.bankAccount.update({
                    where: { id: newAccountId },
                    data: { balance: { decrement: newAmount } },
                });
            }

            return updatedExpense;
        });
    }

    async delete(id: string, userId: string) {
        const expense = await this.findOne(id, userId);
        if (!expense) {
            throw new NotFoundException('Expense not found');
        }

        return this.prisma.$transaction(async (tx) => {
            const amount = Number(expense.amount);

            // Reverse balance adjustments
            if (expense.paymentMethod === 'credit_card' && expense.creditCardId) {
                await tx.creditCard.update({
                    where: { id: expense.creditCardId },
                    data: { usedAmount: { decrement: amount } },
                });
            } else if ((expense.paymentMethod === 'debit_card' || expense.paymentMethod === 'cash') && expense.accountId) {
                await tx.bankAccount.update({
                    where: { id: expense.accountId },
                    data: { balance: { increment: amount } },
                });
            } else if (expense.paymentMethod === 'bank' && expense.accountId) {
                // Bank Transfer Reversal
                // Reverse target if provided
                if ((expense as any).toBankAccountId) {
                    await tx.bankAccount.update({
                        where: { id: (expense as any).toBankAccountId },
                        data: { balance: { decrement: amount } },
                    });
                } else if (expense.creditCardId) {
                    await tx.creditCard.update({
                        where: { id: expense.creditCardId },
                        data: { usedAmount: { increment: amount } },
                    });
                }

                // Reverse source bank account
                await tx.bankAccount.update({
                    where: { id: expense.accountId },
                    data: { balance: { increment: amount } },
                });
            }

            // Delete the expense
            await tx.expense.delete({ where: { id } });

            return { success: true, message: 'Expense deleted and balances restored' };
        });
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

        // Group by payment method
        const costByPaymentMethod = expenses.reduce((acc: any, exp) => {
            const method = exp.paymentMethod || 'cash';
            if (!acc[method]) acc[method] = 0;
            acc[method] += Number(exp.amount);
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
            costByPaymentMethod,
            monthlyTrend: Object.keys(monthlyTrend).map(month => ({ month, amount: monthlyTrend[month] })),
        };
    }
}
