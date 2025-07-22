// pages/api/ai/test-pdf.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { aiPipeline } from '@/lib/ai/pipeline';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { observationId, attachmentId } = req.body;
    
    if (!observationId || !attachmentId) {
      return res.status(400).json({ 
        error: 'Please provide both observationId and attachmentId' 
      });
    }
    
    console.log('Testing PDF processing:', { observationId, attachmentId });
    
    const result = await aiPipeline.processObservationWithMedia(
      observationId,
      attachmentId
    );
    
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('PDF test error:', error);
    return res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  }
}