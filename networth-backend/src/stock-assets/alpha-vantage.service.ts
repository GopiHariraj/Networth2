import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface AlphaVantageQuote {
    'Global Quote': {
        '01. symbol': string;
        '05. price': string;
        '08. previous close': string;
        '09. change': string;
        '10. change percent': string;
    };
}

@Injectable()
export class AlphaVantageService {
    private readonly alphaVantageApiKey: string;
    private readonly indianApiKey: string;
    private readonly alphaVantageUrl = 'https://www.alphavantage.co/query';
    private readonly indianApiUrl = 'https://stock.indianapi.in';

    constructor(private configService: ConfigService) {
        this.alphaVantageApiKey = this.configService.get<string>('ALPHA_VANTAGE_API_KEY') || 'TPVKHORBWQ1ZPWQX';
        this.indianApiKey = this.configService.get<string>('INDIAN_STOCK_API_KEY') || 'sk-live-utjORy15SQm6MLp21E33xRC9pOF3TNJKP33LWzcO';
    }

    private isIndianStock(symbol: string): boolean {
        // Check if symbol ends with .NS (NSE) or .BSE or .BO (Bombay)
        return symbol.endsWith('.NS') || symbol.endsWith('.BSE') || symbol.endsWith('.BO');
    }

    private getCleanSymbol(symbol: string): string {
        // Remove exchange suffix for Indian API (e.g., RELIANCE.NS → RELIANCE)
        return symbol.replace(/\.(NS|BSE|BO)$/, '');
    }

    async getStockQuote(symbol: string): Promise<{ price: number; symbol: string }> {
        if (this.isIndianStock(symbol)) {
            return this.getIndianStockQuote(symbol);
        } else {
            return this.getAlphaVantageQuote(symbol);
        }
    }

    private async getIndianStockQuote(symbol: string): Promise<{ price: number; symbol: string }> {
        try {
            const cleanSymbol = this.getCleanSymbol(symbol);
            const exchange = symbol.endsWith('.BSE') || symbol.endsWith('.BO') ? 'BSE' : 'NSE';

            // Indian API endpoint format - adjust based on actual API documentation
            const url = `${this.indianApiUrl}/market-data/live-price?symbol=${cleanSymbol}&exchange=${exchange}`;

            console.log(`[IndianStockAPI] Fetching ${symbol} from ${exchange}...`);

            const response = await fetch(url, {
                headers: {
                    'X-Api-Key': this.indianApiKey,
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new HttpException(
                    `Indian API error: ${response.statusText}`,
                    response.status,
                );
            }

            const data: any = await response.json();

            // Adjust based on actual API response format
            const price = parseFloat(data.price || data.ltp || data.lastPrice || data.close);

            if (isNaN(price)) {
                throw new HttpException(
                    `No price data found for ${symbol}`,
                    HttpStatus.NOT_FOUND,
                );
            }

            console.log(`[IndianStockAPI] Got price for ${symbol}: ₹${price}`);

            return {
                symbol: symbol,
                price: price,
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            console.error('Indian Stock API error:', error);
            throw new HttpException(
                `Failed to fetch Indian stock price for ${symbol}`,
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    private async getAlphaVantageQuote(symbol: string): Promise<{ price: number; symbol: string }> {
        try {
            const url = `${this.alphaVantageUrl}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${this.alphaVantageApiKey}`;

            const response = await fetch(url);
            const data: AlphaVantageQuote = await response.json();

            // Check for API errors
            if ('Error Message' in data) {
                throw new HttpException(
                    `Invalid stock symbol: ${symbol}`,
                    HttpStatus.BAD_REQUEST,
                );
            }

            if ('Note' in data) {
                throw new HttpException(
                    'Alpha Vantage rate limit exceeded. Please try again later.',
                    HttpStatus.TOO_MANY_REQUESTS,
                );
            }

            const quote = data['Global Quote'];
            if (!quote || !quote['05. price']) {
                throw new HttpException(
                    `No data found for symbol: ${symbol}`,
                    HttpStatus.NOT_FOUND,
                );
            }

            return {
                symbol: quote['01. symbol'],
                price: parseFloat(quote['05. price']),
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            console.error('Alpha Vantage API error:', error);
            throw new HttpException(
                'Failed to fetch stock price from Alpha Vantage',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    async getBatchQuotes(symbols: string[]): Promise<Map<string, number>> {
        const results = new Map<string, number>();

        // Separate Indian and non-Indian stocks
        const indianStocks = symbols.filter(s => this.isIndianStock(s));
        const otherStocks = symbols.filter(s => !this.isIndianStock(s));

        // Process Indian stocks (no delay needed if API allows)
        for (const symbol of indianStocks) {
            try {
                const quote = await this.getStockQuote(symbol);
                results.set(symbol, quote.price);
                // Small delay to be safe
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
                console.error(`Failed to fetch price for ${symbol}:`, error);
            }
        }

        // Process other stocks with Alpha Vantage rate limiting
        for (const symbol of otherStocks) {
            try {
                const quote = await this.getStockQuote(symbol);
                results.set(symbol, quote.price);
                // 12 second delay for Alpha Vantage rate limits
                await new Promise(resolve => setTimeout(resolve, 12000));
            } catch (error) {
                console.error(`Failed to fetch price for ${symbol}:`, error);
            }
        }

        return results;
    }
}
