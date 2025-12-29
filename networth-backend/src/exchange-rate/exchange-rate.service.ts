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

Return ONLY a valid JSON object with currency codes as keys and exchange rates as decimal numbers. 
Example format: {"USD":0.272,"EUR":0.251,"GBP":0.214,"INR":22.74,"SAR":1.02}

IMPORTANT: Return ONLY the JSON object, no explanatory text before or after.`;

            console.log('[ExchangeRateService] Fetching rates from Gemini for', baseCurrency, 'to', targetCurrencies);
            const response = await this.geminiService.generateContent(prompt);
            console.log('[ExchangeRateService] Gemini raw response:', response);

            // Try to extract JSON from response - handle markdown code blocks
            let jsonText = response.trim();

            // Remove markdown code blocks if present
            jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '');

            // Find JSON object
            const jsonMatch = jsonText.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/);
            if (!jsonMatch) {
                console.error('[ExchangeRateService] No valid JSON found in response');
                throw new Error('Invalid response format from Gemini - no JSON object found');
            }

            const rates = JSON.parse(jsonMatch[0]);
            console.log('[ExchangeRateService] Parsed rates:', rates);

            // Validate rates object
            if (typeof rates !== 'object' || Object.keys(rates).length === 0) {
                throw new Error('Invalid rates object from Gemini');
            }

            // Store in database
            for (const [currency, rate] of Object.entries(rates)) {
                if (typeof rate !== 'number' || rate <= 0) {
                    console.warn(`[ExchangeRateService] Invalid rate for ${currency}:`, rate);
                    continue;
                }

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

            console.log('[ExchangeRateService] Successfully stored rates in database');
            return { success: true, rates, fetchedAt: new Date() };
        } catch (error) {
            console.error('[ExchangeRateService] Failed to fetch live rates:', error.message, error.stack);
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
