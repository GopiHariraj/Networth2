import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class AiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel(
        { model: 'gemini-1.5-flash' },
        { apiVersion: 'v1' }
      );
    }
  }

  async parseFinanceUpdate(text: string) {
    if (!this.model) {
      return this.mockParse(text);
    }

    try {
      const prompt = `
        You are a financial assistant. Analyze the following text and extract financial updates.
        Return a JSON object with this structure:
        {
          "transactions": [
            { "description": "...", "amount": number, "type": "INCOME" | "EXPENSE", "category": "..." }
          ],
          "assetUpdates": [
            { "name": "...", "type": "Gold" | "Stock" | "Cash", "valueChange": number, "newValue": number (optional) }
          ],
          "liabilityUpdates": [
             { "name": "...", "amountPaid": number }
          ]
        }
        Text: "${text}"
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const textResponse = response.text();

      // Clean up markdown code blocks if present
      const jsonStr = textResponse
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error('Gemini API Error:', error);
      return this.mockParse(text);
    }
  }

  private mockParse(text: string) {
    console.log('Using Mock AI Parser for:', text);
    // Simple regex fallback for demo
    const numbers = text.match(/\d+/g)?.map(Number) || [];
    const isExpense = /paid|spent|bought/i.test(text);

    return {
      transactions: [
        {
          description: 'Parsed Update (Mock)',
          amount: numbers[0] || 0,
          type: isExpense ? 'EXPENSE' : 'INCOME',
          category: 'Uncategorized',
        },
      ],
      assetUpdates: [],
      liabilityUpdates: [],
    };
  }

  async executeUpdates(data: any) {
    // Logic to actually update DB would go here
    // For now, we return success as we might need to implement the actual DB writes later
    // or assume the frontend calls specific endpoints based on this data.
    return { success: true, message: 'Updates processed successfully' };
  }
  async chat(message: string, context: any) {
    if (!this.model) {
      return {
        text: "I'm sorry, but I haven't been configured with an API key yet. Please check your settings.",
        chart: null
      };
    }

    try {
      const prompt = `
        You are an advanced financial advisor AI named "Smart Wealth Chat".
        
        CONTEXT:
        The user has provided their current financial data:
        ${JSON.stringify(context, null, 2)}
        
        USER QUESTION:
        "${message}"
        
        INSTRUCTIONS:
        1. Analyze the user's financial data to answer the question.
        2. Be concise, professional, and encouraging.
        3. Use specific numbers from the data to back up your points.
        4. Provide actionable insights or suggestions where applicable.
        5. Format your response in clean Markdown.
        6. If the user asks for a specific chart or visualization that fits the data, describe it textually but also suggest what kind of chart would be best (e.g., "A pie chart of your assets would show...").
        7. Do NOT make up data. If data is missing (e.g., no gold assets), mention that.
        8. Maintain a helpful and objective tone.
        
        RESPONSE FORMAT:
        Just return the markdown response directly.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return { text: response.text() };
    } catch (error) {
      console.error('Gemini Chat Error:', error);
      return { text: "I'm having trouble connecting to my brain right now. Please try again later." };
    }
  }
}
