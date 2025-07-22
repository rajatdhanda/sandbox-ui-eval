// lib/ai/services/ai-database.service.ts

import { db } from '@/lib/supabase/services/database.service';
import { logger } from '@/lib/utils/logger';
import type { 
  AIProcessingRecord, 
  ReaderOutput, 
  ObserverOutput, 
  ScholarOutput, 
  InventorOutput 
} from '../types';

export class AIDataService {
  private static instance: AIDataService;

  static getInstance(): AIDataService {
    if (!AIDataService.instance) {
      AIDataService.instance = new AIDataService();
    }
    return AIDataService.instance;
  }

  async createProcessingRecord(data: {
    source_type: 'observation' | 'attachment';
    source_id: string;
    child_id: string;
  }): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const { data: record, error } = await db.supabase
        .from('ai_processing')
        .insert({
          source_type: data.source_type,
          source_id: data.source_id,
          child_id: data.child_id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (error) throw error;

      return { success: true, id: record.id };
    } catch (error: any) {
      logger.error('AI_DATABASE', 'CREATE_ERROR', error);
      return { success: false, error: error.message };
    }
  }

  async updateReaderOutput(
    recordId: string, 
    output: ReaderOutput
  ): Promise<{ success: boolean }> {
    try {
      const { error } = await db.supabase
        .from('ai_processing')
        .update({
          reader_output: output,
          updated_at: new Date().toISOString()
        })
        .eq('id', recordId);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      logger.error('AI_DATABASE', 'UPDATE_ERROR', error);
      return { success: false };
    }
  }

  async getUnprocessedObservations(limit: number = 10): Promise<{
    success: boolean;
    data?: any[];
  }> {
    try {
      const { data, error } = await db.supabase
        .from('progress_tracking')
        .select(`
          id,
          teacher_notes,
          child_id,
          execution_date,
          children!inner (
            date_of_birth
          )
        `)
        .not('teacher_notes', 'is', null)
        .not('id', 'in', 
          db.supabase
            .from('ai_processing')
            .select('source_id')
            .eq('source_type', 'observation')
        )
        .limit(limit);

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error: any) {
      logger.error('AI_DATABASE', 'FETCH_ERROR', error);
      return { success: false, data: [] };
    }
  }

  async findExisting(
    sourceType: 'observation' | 'attachment',
    sourceId: string
  ): Promise<AIProcessingRecord | null> {
    try {
      const { data, error } = await db.supabase
        .from('ai_processing')
        .select('*')
        .eq('source_type', sourceType)
        .eq('source_id', sourceId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    } catch (error: any) {
      logger.error('AI_DATABASE', 'FIND_ERROR', error);
      return null;
    }
  }

  async getRecordsForObserver(limit: number = 10): Promise<{
    success: boolean;
    data?: AIProcessingRecord[];
  }> {
    try {
      const { data, error } = await db.supabase
        .from('ai_processing')
        .select('*')
        .not('reader_output', 'is', null)
        .is('observer_output', null)
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error: any) {
      logger.error('AI_DATABASE', 'OBSERVER_FETCH_ERROR', error);
      return { success: false, data: [] };
    }
  }
  
  async updateObserverOutput(
    recordId: string, 
    output: ObserverOutput
  ): Promise<{ success: boolean }> {
    try {
      const { error } = await db.supabase
        .from('ai_processing')
        .update({
          observer_output: output,
          updated_at: new Date().toISOString()
        })
        .eq('id', recordId);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      logger.error('AI_DATABASE', 'UPDATE_OBSERVER_ERROR', error);
      return { success: false };
    }
  }
  // Add more methods as needed for Observer, Scholar, Inventor

  // Add more methods as needed for Observer, Scholar, Inventor
}

export const aiDataService = AIDataService.getInstance();