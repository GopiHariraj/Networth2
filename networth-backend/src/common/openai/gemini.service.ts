import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class GeminiService {
    private genAI: GoogleGenerativeAI | null = null;
    private model: any = null;

    constructor() {
        // Only initialize Gemini if API key is available
        if (process.env.GEMINI_API_KEY) {
            this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
        }
    }

    async parseExpenseText(text: string): Promise<any> {
        try {
            const apiKey = process.env.GEMINI_API_KEY;

            if (!apiKey || !this.model) {
                // Fallback to mock parser when Gemini is not configured
                console.log('Gemini API key not found, using mock parser');
                return this.mockParseExpenseText(text);
            }

            const prompt = `
Parse the following expense description and return a JSON object.

Categories: Groceries, Restaurants, Transport, Fuel, Utilities (DEWA), Rent/EMI, School Fees, Insurance, Self-care, Shopping, Entertainment, Medical, Travel, Misc

Return format (ONLY valid JSON, no markdown):
{
  "items": [
    {
      "date": "YYYY-MM-DD" (use today's date if not specified),
      "amount": number,
      "currency": "AED" (or detected currency),
      "category": "pick from categories above",
      "merchant": "store/company name",
      "paymentMethod": "cash" or "bank" or "credit_card",
      "notes": "additional details",
      "confidence": 0.8
    }
  ]
}

Text to parse: "${text}"

Return ONLY the JSON object, no extra text or markdown.
`;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            let jsonText = response.text();

            // Clean up markdown code blocks if present
            jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

            const parsed = JSON.parse(jsonText);
            return parsed;
        } catch (error) {
            console.error('Gemini API error:', error);
            // Fallback to mock parser if Gemini fails
            return this.mockParseExpenseText(text);
        }
    }

    private mockParseExpenseText(text: string): any {
        // Simple regex-based parser as fallback
        const amountMatch = text.match(/(\d+(?:\.\d{1,2})?)\s*(AED|USD|EUR|dirhams?)?/i);
        const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;
        const currency = amountMatch?.[2]?.toUpperCase().replace('DIRHAMS', 'AED').replace('DIRHAM', 'AED') || 'AED';

        // Detect category based on keywords
        const categoryMap: Record<string, string[]> = {
            Groceries: ['lulu', 'carrefour', 'spinneys', 'grocery', 'groceries', 'supermarket', 'mart'],
            Restaurants: ['restaurant', 'cafe', 'starbucks', 'mcdonalds', 'kfc', 'dining', 'food', 'pizza', 'burger'],
            Transport: ['uber', 'careem', 'taxi', 'metro', 'bus', 'transport', 'ride'],
            Fuel: ['enoc', 'eppco', 'adnoc', 'petrol', 'gasoline', 'fuel', 'gas', 'shell'],
            'Utilities (DEWA)': ['dewa', 'electricity', 'water', 'utility', 'utilities', 'bill'],
            Shopping: ['mall', 'shop', 'shopping', 'clothes', 'amazon', 'noon', 'store'],
            Entertainment: ['cinema', 'movie', 'game', 'entertainment', 'park'],
            Medical: ['hospital', 'clinic', 'pharmacy', 'doctor', 'medical', 'medicine'],
        };

        let category = 'Misc';
        const lowerText = text.toLowerCase();
        for (const [cat, keywords] of Object.entries(categoryMap)) {
            if (keywords.some(keyword => lowerText.includes(keyword))) {
                category = cat;
                break;
            }
        }

        // Extract merchant name from common patterns
        const merchantPatterns = [
            /(?:at|from|to)\s+([A-Z][A-Za-z\s]+?)(?:\s+for|\s+\d|$)/i,
            /([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)?)/,
        ];

        let merchant = 'General';
        for (const pattern of merchantPatterns) {
            const match = text.match(pattern);
            if (match && match[1]) {
                merchant = match[1].trim();
                break;
            }
        }

        // Detect date
        const today = new Date();
        let date = today.toISOString().split('T')[0];

        if (text.match(/yesterday/i)) {
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            date = yesterday.toISOString().split('T')[0];
        }

        return {
            items: [
                {
                    date,
                    amount,
                    currency,
                    category,
                    merchant: merchant.length > 30 ? merchant.substring(0, 30) : merchant,
                    paymentMethod: 'cash',
                    notes: text,
                    confidence: 0.6,
                },
            ],
        };
    }
}
