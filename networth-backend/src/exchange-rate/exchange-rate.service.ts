import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { GeminiService } from '../common/openai/gemini.service';

@Injectable()
export class ExchangeRateService {
    constructor(
        private prisma: PrismaService,
        private geminiService: GeminiService,
    ) { }

    /**
     * Fetch live exchange rates from Gemini AI
     */
    async fetchLiveRates(baseCurrency: string, targetCurrencies: string[]) {
        try {
            const prompt = `Provide current real-time exchange rates from ${baseCurrency} to the following currencies: ${targetCurrencies.join(', ')}.

Return ONLY a JSON object with currency codes as keys and exchange rates as values. Format: { "USD": 0.272, "EUR": 0.251, "GBP": 0.214, "INR": 22.74, "SAR": 1.02 }

Do not include any explanatory text, only the JSON object.`;

            const response = await this.geminiService.generateContent(prompt);

            // Parse the JSON response
            const jsonMatch = response.match(/\{[^}]+\}/);
            if (!jsonMatch) {
                throw new Error('Invalid response format from Gemini');
            }

            const rates = JSON.parse(jsonMatch[0]);

            // Store in database
            for (const [currency, rate] of Object.entries(rates)) {
                await this.prisma.exchangeRate.upsert({
                    where: {
                        baseCurrency_targetCurrency: {
                            baseCurrency,
                            targetCurrency: currency
                        }
                    },
                    create: {
                        baseCurrency,
                        targetCurrency: currency,
                        rate: Number(rate),
                        source: 'gemini',
                    },
                    update: {
                        rate: Number(rate),
                        source: 'gemini',
                        fetchedAt: new Date(),
                    },
                });
            }

            return { success: true, rates, fetchedAt: new Date() };
        } catch (error) {
            console.error('Failed to fetch live rates:', error);
            throw error;
        }
    }

    /**
     * Get cached exchange rates from database
     */
    async getCachedRates(baseCurrency: string) {
        const rates = await this.prisma.exchangeRate.findMany({
            where: { baseCurrency },
            orderBy: { fetchedAt: 'desc' },
        });

        if (rates.length === 0) {
            return null;
        }

        const ratesMap = rates.reduce((acc, r) => {
            acc[r.targetCurrency] = {
                rate: Number(r.rate),
                fetchedAt: r.fetchedAt,
                source: r.source,
            };
            return acc;
        }, {} as Record<string, { rate: number; fetchedAt: Date; source: string }>);

        return {
            baseCurrency,
            rates: ratesMap,
            oldestUpdate: rates[rates.length - 1]?.fetchedAt,
            newestUpdate: rates[0]?.fetchedAt,
        };
    }

    /**
     * Get rates with fallback to cached if API fails
     */
    async getRatesWithFallback(baseCurrency: string, targetCurrencies: string[]) {
        try {
            // Try to fetch live rates
            return await this.fetchLiveRates(baseCurrency, targetCurrencies);
        } catch (error) {
            console.warn('Failed to fetch live rates, using cached:', error.message);

            // Fallback to cached rates
            const cached = await this.getCachedRates(baseCurrency);

            if (!cached) {
                throw new Error('No live rates available and no cached rates found');
            }

            return {
                success: true,
                rates: Object.entries(cached.rates).reduce((acc, [curr, data]) => {
                    acc[curr] = data.rate;
                    return acc;
                }, {} as Record<string, number>),
                fetchedAt: cached.newestUpdate,
                usingCache: true,
                warning: 'Using cached exchange rates due to API failure',
            };
        }
    }

    /**
     * Get the latest exchange rate for a specific currency pair
     */
    async getRate(baseCurrency: string, targetCurrency: string) {
        const rate = await this.prisma.exchangeRate.findUnique({
            where: {
                baseCurrency_targetCurrency: { baseCurrency, targetCurrency }
            },
            orderBy: {
                fetchedAt: 'desc'
            }
        });

        if (!rate) {
            return null;
        }

        return {
            rate: Number(rate.rate),
            fetchedAt: rate.fetchedAt,
            source: rate.source,
        };
    }
}
