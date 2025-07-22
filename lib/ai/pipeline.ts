// lib/ai/pipeline.ts

import { readerAgent } from './agents/reader';
import { aiDataService } from './services/ai-database.service';
import { DataService } from '@/lib/services/server-data-service';
import { logger } from '@/lib/utils/logger';
import type { ProcessingResult } from './types';
import { observerAgent } from './agents/observer';
import type { ObserverInput } from './types';
import { db } from '@/lib/supabase/services/database.service';

export class AIPipeline {
  /**
   * Process a single observation through the AI pipeline
   */
  async processObservation(
    progressTrackingId: string
  ): Promise<ProcessingResult> {
    const startTime = Date.now();
    
    try {
        console.log('Pipeline: Starting processing for:', progressTrackingId);
      // Step 1: Get observation from database
      const observation = await this.fetchObservation(progressTrackingId);
      if (!observation) {
        throw new Error('Observation not found');
      }
      console.log('Pipeline: Got observation:', observation ? 'YES' : 'NO');
      console.log('Pipeline: Observation data:', {
        hasNotes: !!observation.teacher_notes,
        notes: observation.teacher_notes,
        childAge: observation.childAgeMonths
      });

      // Check if already processed
      const existing = await aiDataService.findExisting('observation', progressTrackingId);
      if (existing && existing.reader_output) {
        logger.info('AI_PIPELINE', 'ALREADY_PROCESSED', { 
          recordId: existing.id,
          progressTrackingId 
        });
        return {
          success: true,
          recordId: existing.id,
          totalProcessingTime: 0
        };
      }

      // Step 2: Create AI processing record (only if not exists)
      let recordId: string;
      
      if (existing) {
        recordId = existing.id;
        logger.info('AI_PIPELINE', 'USING_EXISTING_RECORD', { recordId });
      } else {
        const { id } = await aiDataService.createProcessingRecord({
          source_type: 'observation',
          source_id: progressTrackingId,
          child_id: observation.child_id
        });

        if (!id) {
          throw new Error('Failed to create processing record');
        }
        recordId = id;
      }

      // Step 3: Run through Reader agent
      console.log('Pipeline: About to call Reader agent...');
      console.log('Pipeline: Reader input:', {
        type: 'text',
        content: this.extractRawText(observation.teacher_notes),
        childAge: observation.childAgeMonths
      });
      const readerOutput = await readerAgent.process({
        observation: {
          type: 'text',
          content: this.extractRawText(observation.teacher_notes),
          metadata: {
            childId: observation.child_id,
            observationDate: observation.execution_date
          }
        },
        childAge: observation.childAgeMonths
      });
      console.log('Pipeline: Reader completed:', readerOutput);

      // Step 4: Save Reader output
      await aiDataService.updateReaderOutput(recordId, readerOutput);

      // TODO: Add Observer, Scholar, Inventor agents here
      // Step 5: Check if we have enough observations for pattern discovery
      const { data: readyRecords } = await aiDataService.getRecordsForObserver(20);
      
      if (readyRecords && readyRecords.length >= 5) {
        logger.info('AI_PIPELINE', 'RUNNING_OBSERVER', { 
          recordCount: readyRecords.length 
        });
        
        // Run Observer on batch
        const observerInput: ObserverInput = {
          observations: readyRecords.map(r => ({
            readerOutput: r.reader_output!,
            childId: r.child_id,
            observationDate: r.created_at
          }))
        };
        
        const observerOutput = await observerAgent.process(observerInput);
        
        // Update all involved records with observer output
        for (const record of readyRecords) {
          await aiDataService.updateObserverOutput(record.id, observerOutput);
        }
      }

      return {
        success: true,
        recordId,
        totalProcessingTime: Date.now() - startTime
      };

    } catch (error: any) {
      logger.error('AI_PIPELINE', 'PROCESSING_ERROR', error);
      return {
        success: false,
        recordId: '',
        errors: [{ agent: 'pipeline', error: error.message }],
        totalProcessingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Process multiple observations in batch
   */
  async processBatch(limit: number = 10): Promise<{
    processed: number;
    failed: number;
    results: ProcessingResult[];
  }> {
    // Get unprocessed observations
    const { data: observations } = await aiDataService.getUnprocessedObservations(limit);
    
    if (!observations || observations.length === 0) {
      return { processed: 0, failed: 0, results: [] };
    }

    const results: ProcessingResult[] = [];
    let processed = 0;
    let failed = 0;

    for (const obs of observations) {
      const result = await this.processObservation(obs.id);
      results.push(result);
      
      if (result.success) processed++;
      else failed++;
      
      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    logger.info('AI_PIPELINE', 'BATCH_COMPLETE', { processed, failed });
    
    return { processed, failed, results };
  }

  /**
   * Process observations with attachments (photos, voice, etc)
   */
  async processObservationWithMedia(
    progressTrackingId: string,
    attachmentId: string
  ): Promise<ProcessingResult> {
    const startTime = Date.now();
    
    try {
      console.log('Pipeline: Processing media for:', { progressTrackingId, attachmentId });
      
      // 1. Fetch observation and attachment
      const observation = await this.fetchObservation(progressTrackingId);
      const { data: attachment } = await db.supabase
        .from('attachments')
        .select('*')
        .eq('id', attachmentId)
        .single();
      
      if (!observation || !attachment) {
        throw new Error('Observation or attachment not found');
      }

      console.log('Pipeline: Found attachment:', attachment.url);

      // 2. Check if already processed
      const existing = await aiDataService.findExisting('attachment', attachmentId);
      if (existing && existing.reader_output) {
        logger.info('AI_PIPELINE', 'MEDIA_ALREADY_PROCESSED', { 
          recordId: existing.id,
          attachmentId 
        });
        return {
          success: true,
          recordId: existing.id,
          totalProcessingTime: 0
        };
      }

      // 3. Create or get processing record
      let recordId: string;
      if (existing) {
        recordId = existing.id;
      } else {
        const { id } = await aiDataService.createProcessingRecord({
          source_type: 'attachment',
          source_id: attachmentId,
          child_id: observation.child_id
        });
        if (!id) throw new Error('Failed to create processing record');
        recordId = id;
      }

      // 4. Determine input type from attachment
      const inputType = attachment.mime_type.includes('pdf') ? 'worksheet' : 
                       attachment.mime_type.includes('image') ? 'worksheet' : 'text';

      console.log('Pipeline: Processing as type:', inputType);

      // 5. Process through Reader
      const readerOutput = await readerAgent.process({
        observation: {
          type: inputType,
          content: attachment.url,
          metadata: {
            childId: observation.child_id,
            observationDate: observation.execution_date,
            attachmentId,
            progressTrackingId
          }
        },
        childAge: observation.childAgeMonths
      });

      // 6. Save Reader output
      await aiDataService.updateReaderOutput(recordId, readerOutput);

      logger.info('AI_PIPELINE', 'MEDIA_PROCESSING_SUCCESS', {
        recordId,
        attachmentId,
        confidence: readerOutput.confidence
      });

      return {
        success: true,
        recordId,
        totalProcessingTime: Date.now() - startTime
      };

    } catch (error: any) {
      logger.error('AI_PIPELINE', 'MEDIA_PROCESSING_ERROR', error);
      return {
        success: false,
        recordId: '',
        errors: [{ agent: 'pipeline', error: error.message }],
        totalProcessingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Helper to fetch observation with child age
   */
  private async fetchObservation(id: string): Promise<any> {
    const { data } = await db.supabase
      .from('progress_tracking')
      .select(`
        *,
        children!inner (
          date_of_birth
        )
      `)
      .eq('id', id)
      .single();

    if (!data) return null;

    // Calculate child age in months
    const birthDate = new Date(data.children.date_of_birth);
    const observationDate = new Date(data.execution_date);
    const ageMonths = Math.floor(
      (observationDate.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
    );

    return {
      ...data,
      childAgeMonths: ageMonths
    };
  }

  /**
   * Extract raw observation from formatted teacher notes
   */
  private extractRawText(teacherNotes: string): string {
    // Format: "type: description | Tags: tag1, tag2"
    const parts = teacherNotes.split(' | ');
    if (parts.length === 0) return teacherNotes;
    
    const firstPart = parts[0];
    const colonIndex = firstPart.indexOf(': ');
    
    if (colonIndex > -1) {
      return firstPart.substring(colonIndex + 2);
    }
    
    return teacherNotes;
  }
}

export const aiPipeline = new AIPipeline();