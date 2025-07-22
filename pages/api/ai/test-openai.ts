// pages/api/ai/test-openai.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { aiClient } from '@/lib/ai/client';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    console.log('Testing OpenAI connection...');
    const result = await aiClient.testConnection();
    console.log('OpenAI test result:', result);
    
    return res.status(200).json({ 
      success: true, 
      message: result 
    });
  } catch (error: any) {
    console.error('OpenAI test failed:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}