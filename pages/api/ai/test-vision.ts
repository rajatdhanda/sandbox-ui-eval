// pages/api/ai/test-vision.ts
import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { imageUrl } = req.body;
    
    console.log('Testing vision with URL:', imageUrl);
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'What do you see in this image? Describe in detail.' },
            { type: 'image_url', image_url: { url: imageUrl } }
          ]
        }
      ],
      max_tokens: 300
    });

    return res.status(200).json({
      success: true,
      description: response.choices[0].message.content
    });
  } catch (error: any) {
    console.error('Vision test error:', error);
    return res.status(500).json({ 
      error: error.message 
    });
  }
}