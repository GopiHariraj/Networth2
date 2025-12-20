import { Injectable } from '@nestjs/common';

@Injectable()
export class OpenAIService {
    constructor() { }

    async parseSMS(smsText: string): Promise<any> {
        // Mock implementation until API Key is provided
        console.log('Mocking OpenAI parsing for:', smsText);

        // Simple regex-based mock parsing for demo purposes
        const amountMatch = smsText.match(/(?:Rs\.|INR|AED|\$)\s*(\d+(?:,\d+)*(?:\.\d{2})?)/i);
        const merchantMatch = smsText.match(/(?:at|to|via)\s+([A-Za-z0-9\s]+?)(?:\son|$|\.)/i);

        const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 0;
        const merchant = merchantMatch ? merchantMatch[1].trim() : 'Unknown Merchant';

        // Random category for demo
        const categories = ['Food', 'Fuel', 'Grocery', 'Shopping', 'Entertainment'];
        const category = categories[Math.floor(Math.random() * categories.length)];

        return {
            amount,
            merchant,
            category,
            date: new Date(),
            description: `Extracted from SMS: ${smsText.substring(0, 30)}...`,
            source: 'SMS',
        };
    }
}
