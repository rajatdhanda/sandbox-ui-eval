// lib/ai/agents/reader.ts

import { aiGateway } from '../framework/gateway';
import { logger } from '@/lib/utils/logger';
import type { ReaderInput, ReaderOutput, AIModel, InputType } from '../types';

export class ReaderAgent {
  private model: AIModel = 'gpt-3.5-turbo';
  
  async process(input: ReaderInput): Promise<ReaderOutput> {
    const startTime = Date.now();

    console.log('Reader: Starting with input:', {
    type: input.observation.type,
    hasContent: !!input.observation.content,
    contentLength: input.observation.content?.length,
    childAge: input.childAge
  });
    
    try {
      logger.info('READER_AGENT', 'PROCESSING_START', {
        type: input.observation.type,
        childAge: input.childAge,
        hasMetadata: !!input.observation.metadata
      });

      let result: any;

      switch (input.observation.type) {
        case 'text':
          result = await this.processText(input);
          break;
        case 'photo':
          result = await this.processPhoto(input);
          break;
        case 'voice':
          result = await this.processVoice(input);
          break;
        case 'video':
          result = await this.processVideo(input);
          break;
        case 'worksheet':
          result = await this.processWorksheet(input);
          break;
        default:
          throw new Error(`Unsupported input type: ${input.observation.type}`);
      }

      // Let AI structure the output however it wants
      const output: ReaderOutput = {
        extracted: result,
        confidence: this.calculateConfidence(result, input.observation.type),
        warnings: result.warnings || [],
        processingTime: Date.now() - startTime,
        model: result.modelUsed || this.model
      };

      logger.info('READER_AGENT', 'PROCESSING_SUCCESS', {
        type: input.observation.type,
        confidence: output.confidence,
        duration: output.processingTime
      });

      return output;

    } catch (error: any) {
      logger.error('READER_AGENT', 'PROCESSING_ERROR', error);
      return {
        extracted: { 
          error: error.message,
          type: input.observation.type,
          timestamp: new Date().toISOString()
        },
        confidence: 0,
        warnings: [error.message],
        processingTime: Date.now() - startTime,
        model: this.model
      };
    }
  }

  private async processText(input: ReaderInput): Promise<any> {
    const prompt = `You are analyzing a teacher's observation of a ${input.childAge || 'young'}-month-old child.

Observation: "${input.observation.content}"
${input.context ? `Activity: ${input.context.activityName || 'Unknown'}` : ''}

Your task: Extract ALL meaningful information without any predetermined framework. 
Look for ANYTHING interesting about:
- What the child did (actions, behaviors, interactions)
- How they did it (approach, strategy, emotions)
- What this might indicate (without limiting to traditional categories)
- Unexpected or novel behaviors
- Social dynamics if mentioned
- Environmental factors
- Duration or persistence patterns
- Any subtle details that might matter

Be creative and thorough. Don't categorize into academic/social/physical - just capture what you observe.

Return as detailed JSON with whatever structure best represents what you found.`;

    const response = await aiGateway.executePrompt(prompt, {
      userId: input.observation.metadata?.childId || 'system',
      model: this.model,
      temperature: 0.7,
      maxTokens: 2000,
      useCache: true,
      tier: 'analysis'
    });

    return response.data || {};
  }

  private async processPhoto(input: ReaderInput): Promise<any> {
    const prompt = `You are analyzing a photo of a ${input.childAge || 'young'}-month-old child.

Your task: Extract EVERYTHING meaningful from this image without predetermined categories.
Look for:
- What the child is doing (all actions, no matter how small)
- Body positioning, posture, grip, stance
- Facial expressions and where they're looking
- Hand positions and what they're manipulating
- Environmental context and available materials
- Peer interactions if visible
- Safety or risk-taking behaviors
- Signs of focus, frustration, joy, discovery
- Unexpected uses of materials
- Problem-solving approaches
- Any subtle developmental indicators

Don't limit yourself to traditional developmental categories. 
Notice everything and report what might be significant.

Return detailed JSON with whatever structure best captures what you observe.`;

    const response = await aiGateway.executePrompt(prompt, {
      userId: input.observation.metadata?.childId || 'system',
      model: 'gpt-4o' as AIModel,
      temperature: 0.7,
      maxTokens: 2000,
      context: { 
        imageUrl: input.observation.content,
        childAge: input.childAge
      }
    });

    return {
      ...response.data,
      modelUsed: 'gpt-4o' as AIModel
    };
  }

  private async processVoice(input: ReaderInput): Promise<any> {
    // First, transcribe the audio
    const prompt = `You are analyzing a voice note about a ${input.childAge || 'young'}-month-old child.

The transcribed content: [This would come from Whisper API]
Audio URL: ${input.observation.content}

Extract:
- What was observed (all details)
- Teacher's tone and emphasis (what seemed important to them)
- Any emotions in the teacher's voice
- Background sounds that might indicate context
- Urgency or excitement levels
- Multiple observations if mentioned
- Subtle implications in how things were said

Don't categorize - just extract everything meaningful.

Return detailed JSON capturing all dimensions of the observation.`;

    // TODO: Integrate Whisper API for actual transcription
    const response = await aiGateway.executePrompt(prompt, {
      userId: input.observation.metadata?.childId || 'system',
      model: this.model,
      temperature: 0.7,
      maxTokens: 2000,
      context: {
        audioUrl: input.observation.content,
        needsTranscription: true
      }
    });

    return {
      ...response.data,
      warnings: ['Voice transcription not yet implemented - using mock data']
    };
  }

  private async processVideo(input: ReaderInput): Promise<any> {
    const prompt = `You are analyzing a video of a ${input.childAge || 'young'}-month-old child.

Video URL: ${input.observation.content}

Extract insights about:
- Sequence of actions (what happened in what order)
- Changes in behavior over time
- Persistence and attention span
- Problem-solving progression
- Social interactions and their evolution
- Movement patterns and coordination
- Emotional journey throughout the video
- Unexpected moments or behaviors
- Environmental interactions
- Learning moments (aha! moments, frustration, breakthrough)

Focus on the temporal dimension - what changed and evolved during the video.

Return detailed JSON that captures the dynamic nature of what you observed.`;

    // TODO: Implement actual video processing
    const response = await aiGateway.executePrompt(prompt, {
      userId: input.observation.metadata?.childId || 'system',
      model: this.model,
      temperature: 0.7,
      maxTokens: 2500,
      context: {
        videoUrl: input.observation.content,
        needsVideoProcessing: true
      }
    });

    return {
      ...response.data,
      warnings: ['Video processing not yet implemented - using mock analysis']
    };
  }

  private async processWorksheet(input: ReaderInput): Promise<any> {
    // For PDFs, we can use GPT-4V to analyze them
    const prompt = `You are analyzing a worksheet/PDF document for a ${input.childAge || 'young'}-month-old child.

Analyze this document and extract:
- Type of activity or assessment
- What the child completed vs left blank
- Quality of pencil control, letter formation, or drawing
- Any patterns in responses or errors
- Creative interpretations of instructions
- Evidence of understanding or confusion
- Fine motor skill indicators
- Spatial organization on the page

Look beyond right/wrong answers to understand the child's thinking process.
Focus on developmental indicators rather than academic performance.

Return detailed JSON with all meaningful observations.`;

    const response = await aiGateway.executePrompt(prompt, {
      userId: input.observation.metadata?.childId || 'system',
      model: 'gpt-4o' as AIModel,
      temperature: 0.7,
      maxTokens: 2000,
      context: { 
        imageUrl: input.observation.content,  // PDF URL treated as image
        childAge: input.childAge,
        requiresOCR: true
      }
    });

    return {
      ...response.data,
      modelUsed: 'gpt-4o' as AIModel,
      warnings: ['Using GPT-4V for PDF analysis']
    };
  }

  private calculateConfidence(result: any, inputType: InputType): number {
    // Base confidence by input type
    const baseConfidence: Record<InputType, number> = {
      text: 0.85,      // High confidence in text processing
      photo: 0.75,     // Good confidence with vision
      voice: 0.65,     // Lower until Whisper integration
      video: 0.60,     // Lowest until video processing
      worksheet: 0.70  // Decent with vision API
    };

    let confidence = baseConfidence[inputType] || 0.5;

    // Adjust based on result quality
    if (result.error) return 0;
    
    // More extracted data = higher confidence
    const dataPoints = Object.keys(result).length;
    if (dataPoints > 10) confidence += 0.1;
    if (dataPoints > 20) confidence += 0.05;
    
    // Cap at 0.95
    return Math.min(confidence, 0.95);
  }
}

export const readerAgent = new ReaderAgent();