import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

interface ParsedTransaction {
  type: 'EXPENSE' | 'GOLD' | 'STOCK' | 'BOND' | 'INCOME' | 'BANK_DEPOSIT';
  amount: number;
  currency?: string;
  merchant?: string;
  category?: string;
  date: Date;
  description: string;
  source: string;
  // Gold-specific
  weight?: number;
  purity?: string;
  ornamentName?: string;
  // Stock-specific
  stockSymbol?: string;
  units?: number;
  unitPrice?: number;
  market?: string;
  // Bond-specific
  bondName?: string;
  interestRate?: number;
  maturityDate?: string;
  confidence?: number;
}

@Injectable()
export class OpenAIService {
  private openai: OpenAI | null = null;
  private readonly defaultCurrency = 'AED';

  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      console.log('[OpenAIService] Initialized OpenAI Client');
    } else {
      console.warn('[OpenAIService] OpenAI API Key missing!');
    }
  }

  async parseSMS(smsText: string): Promise<ParsedTransaction> {
    if (!this.openai) {
      console.warn('OpenAI not configured, falling back to mock parser');
      return this.mockParseSMS(smsText);
    }

    try {
      const prompt = `
      You are a financial transaction parser. Extract details from this SMS text into a JSON object.
      
      Transaction Types: 'EXPENSE', 'INCOME', 'GOLD', 'STOCK', 'BOND', 'BANK_DEPOSIT'

      Rules:
      - Default currency is AED if not specified.
      - Convert dates to ISO string.
      - For Gold, extract weight (grams), purity (e.g. 22K), and item name.
      - For Stocks, extract symbol, units, and price.
      
      SMS: "${smsText}"

      Return JSON format:
      {
        "type": "EXPENSE" | "GOLD" | "STOCK" | "BOND" | "INCOME" | "BANK_DEPOSIT",
        "amount": number,
        "currency": "AED" | "USD" | etc,
        "date": "YYYY-MM-DD", 
        "merchant": "string (or source)",
        "category": "string (infer category for expense)",
        "description": "string",
        
        // Specific Fields
        "weight": number (for gold),
        "purity": "string" (for gold),
        "ornamentName": "string" (for gold),
        
        "stockSymbol": "string" (for stock),
        "units": number (for stock),
        "unitPrice": number (for stock),
        "market": "string" (for stock),
        
        "bondName": "string" (for bond),
        "interestRate": number (for bond),
        "maturityDate": "YYYY-MM-DD" (for bond)
      }
      `;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful financial assistant that outputs strict JSON.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
      });

      const content = response.choices[0].message.content;
      if (!content) throw new Error('Empty response from OpenAI');

      const data = JSON.parse(content);

      // Normalize date
      const dateObj = data.date ? new Date(data.date) : new Date();

      return {
        ...data,
        date: dateObj,
        source: 'SMS (OpenAI)',
        description: data.description || `Transaction parsed from SMS`
      };

    } catch (error) {
      console.error('OpenAI SMS Parsing Error:', error);
      return this.mockParseSMS(smsText);
    }
  }

  private mockParseSMS(smsText: string): ParsedTransaction {
    // Basic regex fallback
    console.log('[OpenAIService] Using Mock Parser');
    const amountMatch = smsText.match(/(\d+(?:,\d{3})*(?:\.\d{2})?)/);
    const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 0;

    return {
      type: 'EXPENSE',
      amount,
      currency: 'AED',
      date: new Date(),
      description: 'Parsed via Mock (OpenAI Failed)',
      category: 'Uncategorized',
      merchant: 'Unknown',
      source: 'SMS (Mock)'
    };
  }

  async analyzeReceipt(imageBase64: string): Promise<any> {
    if (!this.openai) {
      throw new Error('OpenAI API Key not configured');
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Analyze this receipt image and extract details in JSON format: { merchant, date, total, currency, category, items: [{name, quantity, price}] }' },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64.replace(/^data:image\/\w+;base64,/, '')}`,
                },
              },
            ],
          },
        ],
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0].message.content;
      return content ? JSON.parse(content) : {};
    } catch (error) {
      console.error('OpenAI Receipt Analysis Error:', error);
      throw error;
    }
  }
}
