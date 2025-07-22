// pages/api/ai/test-reader.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { aiPipeline } from '@/lib/ai/pipeline';
import { logger } from '@/lib/utils/logger';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { observationId, testBatch } = req.body;

    // Single observation test
    if (observationId) {
      logger.info('TEST_READER', 'PROCESSING_SINGLE', { observationId });
      const result = await aiPipeline.processObservation(observationId);
      return res.status(200).json(result);
    }

    // Batch test
    if (testBatch) {
      logger.info('TEST_READER', 'PROCESSING_BATCH', { limit: testBatch });
      const results = await aiPipeline.processBatch(testBatch || 5);
      return res.status(200).json(results);
    }

    return res.status(400).json({ 
      error: 'Please provide observationId or testBatch' 
    });

  } catch (error: any) {
    logger.error('TEST_READER', 'API_ERROR', error);
    return res.status(500).json({ 
      error: error.message || 'Processing failed' 
    });
  }
}