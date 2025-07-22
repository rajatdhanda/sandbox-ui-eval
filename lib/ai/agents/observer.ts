// lib/ai/agents/observer.ts
import { aiGateway } from '../framework/gateway';
import { logger } from '@/lib/utils/logger';
import type { ObserverInput, ObserverOutput, AIModel } from '../types';

export class ObserverAgent {
  private model: AIModel = 'gpt-4-turbo-preview';

  async process(input: ObserverInput): Promise<ObserverOutput> {
    const startTime = Date.now();
    
    try {
      logger.info('OBSERVER_AGENT', 'PROCESSING_START', {
        observationCount: input.observations.length,
        timeRange: input.timeRange
      });

      // Build comprehensive prompt with all observations
      const prompt = this.buildPrompt(input);

      // Execute through gateway
      const response = await aiGateway.executePrompt(prompt, {
        userId: 'system',
        model: this.model,
        temperature: 0.8, // Higher for creative pattern discovery
        maxTokens: 3000,
        useCache: false, // Don't cache pattern discovery
        tier: 'analysis'
      });

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to discover patterns');
      }

      // Structure the output
      const patterns = response.data.patterns || {};
      const output: ObserverOutput = {
        patterns,
        patternCount: Object.keys(patterns).length,
        confidenceScores: this.calculateConfidences(patterns),
        observationsAnalyzed: input.observations.length,
        processingTime: Date.now() - startTime
      };

      logger.info('OBSERVER_AGENT', 'PROCESSING_SUCCESS', {
        patternCount: output.patternCount,
        duration: output.processingTime
      });

      return output;

    } catch (error: any) {
      logger.error('OBSERVER_AGENT', 'PROCESSING_ERROR', error);
      return {
        patterns: {},
        patternCount: 0,
        confidenceScores: {},
        observationsAnalyzed: input.observations.length,
        processingTime: Date.now() - startTime
      };
    }
  }

  private buildPrompt(input: ObserverInput): string {
    // Aggregate all observations by child
    const byChild: Record<string, any[]> = {};
    
    input.observations.forEach(obs => {
      if (!byChild[obs.childId]) {
        byChild[obs.childId] = [];
      }
      byChild[obs.childId].push({
        date: obs.observationDate,
        extracted: obs.readerOutput.extracted
      });
    });

    const childSummaries = Object.entries(byChild).map(([childId, obs]) => 
      `Child ${childId}: ${obs.length} observations`
    ).join('\n');

    return `You are a pattern discovery agent analyzing child development observations.

OBSERVATIONS DATA:
${JSON.stringify(input.observations, null, 2)}

ANALYSIS CONTEXT:
- Total observations: ${input.observations.length}
- Unique children: ${Object.keys(byChild).length}
- ${childSummaries}

YOUR TASK: Discover ALL meaningful patterns without any predetermined categories or frameworks.

Look for:
1. Temporal patterns (what changes over time)
2. Cross-child patterns (what's similar/different between children)
3. Behavioral sequences (what leads to what)
4. Environmental influences (context effects)
5. Unexpected correlations
6. Novel phenomena that don't fit existing categories
7. Subtle indicators that might be missed
8. Patterns in teacher observations (what they notice)

DO NOT limit yourself to traditional developmental categories.
DO NOT use terms like "cognitive", "social", "physical" unless they emerge naturally.
DO discover whatever patterns actually exist in the data.

Create pattern names that describe what you actually see.
Be specific about which children show which patterns.
Note frequency, consistency, and variations.

Return JSON with discovered patterns in whatever structure best represents your findings.
Each pattern should include examples, affected children, and why it matters.`;
  }

  private calculateConfidences(patterns: Record<string, any>): Record<string, number> {
    const confidences: Record<string, number> = {};
    
    Object.entries(patterns).forEach(([key, pattern]) => {
      // Base confidence on evidence strength
      let confidence = 0.5;
      
      if (pattern.examples && pattern.examples.length > 2) confidence += 0.2;
      if (pattern.frequency && pattern.frequency > 0.5) confidence += 0.15;
      if (pattern.consistency && pattern.consistency > 0.7) confidence += 0.15;
      
      confidences[key] = Math.min(confidence, 0.95);
    });
    
    return confidences;
  }
}

export const observerAgent = new ObserverAgent();