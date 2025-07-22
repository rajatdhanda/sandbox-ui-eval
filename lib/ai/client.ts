// lib/ai/client.ts
import OpenAI from 'openai';


console.log('OPENAI_API_KEY loaded?', !!process.env.OPENAI_API_KEY);
console.log('API Key last 4 chars:', process.env.OPENAI_API_KEY?.slice(-4));

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const aiClient = {
  // Test connection
  async testConnection() {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Say "AI connected!"' }],
        max_tokens: 10,
      });
      return response.choices[0].message.content;
    } catch (error) {
      console.error('AI connection error:', error);
      throw error;
    }
  },

  // Analyze observations for toddlers
  async analyzeObservations(observations: any[], ageMonths: number) {
    const prompt = `You are an early childhood development expert specializing in toddlers aged ${ageMonths} months.
    
Analyze these observations and provide insights:
${observations.map(o => `- ${o.type}: ${o.description}`).join('\n')}

Respond with JSON containing:
1. summary: Brief overall assessment (positive tone)
2. strengths: Array of 2-3 observed strengths
3. emerging: Array of 2-3 emerging skills
4. suggestions: Array of 2-3 activity suggestions

Focus on developmental appropriateness for ${ageMonths}-month-old toddlers.`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error('Analysis error:', error);
      throw error;
    }
  }
};