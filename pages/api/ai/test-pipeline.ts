import { aiPipeline } from '@/lib/ai/pipeline';

export default async function handler(req, res) {
  const { recordId, action } = req.query;
  
  try {
    if (action === 'batch') {
      // Process 3 different records
      const testIds = [
        '6dd442a6-69ef-43ed-b39f-d9f52dfbb694', // "Recognized letters in name"
        'a5df8df9-e3d1-4ebe-90f0-a570776f6ad9', // "Demonstrated number concept" 
        'f8995b8e-ecb6-42f6-b37a-b8b9cce6b1d4'  // "Showed excellent self-control"
      ];
      
      const results = [];
      for (const id of testIds) {
        const result = await aiPipeline.processObservation(id);
        results.push({ id, result });
      }
      return res.json({ batch: results });
    }
    
    // Single record processing
    const result = await aiPipeline.processObservation(recordId as string);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}