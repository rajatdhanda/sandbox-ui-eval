// lib/ai/types.ts
// Path: lib/ai/types.ts

// ============================================
// EXISTING TYPES (keep these)
// ============================================

export type AIModel = 'gpt-3.5-turbo' | 'gpt-4' | 'gpt-4-turbo-preview' | 'gpt-4o' | 'gpt-4o-mini';
export interface AIRequest {
  prompt: string;
  model?: AIModel;
  temperature?: number;
  maxTokens?: number;
  userId: string;
  context?: Record<string, any>;
}

export interface AIResponse {
  success: boolean;
  data?: any;
  error?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cached?: boolean;
  model?: AIModel;
}

export interface AIError extends Error {
  code: string;
  statusCode?: number;
  details?: any;
}

// ============================================
// NEW AGENT TYPES
// ============================================

// Input types for different media
export type InputType = 'text' | 'photo' | 'voice' | 'video' | 'worksheet';

export interface RawInput {
  type: InputType;
  content: string; // URL for media, text for observations
  metadata?: {
    childId: string;
    observationDate: string;
    attachmentId?: string;
    progressTrackingId?: string;
  };
}

// ============================================
// READER AGENT TYPES
// ============================================

export interface ReaderInput {
  observation: RawInput;
  childAge?: number; // in months
  context?: {
    activityName?: string;
    activityType?: string;
  };
}

export interface ReaderOutput {
  // Core extraction - AI decides what to include
  extracted: Record<string, any>;
  
  // Confidence in extraction
  confidence: number;
  
  // Any errors or warnings
  warnings?: string[];
  
  // Processing metadata
  processingTime: number;
  model: AIModel;
}

// ============================================
// OBSERVER AGENT TYPES
// ============================================

export interface ObserverInput {
  observations: Array<{
    readerOutput: ReaderOutput;
    childId: string;
    observationDate: string;
  }>;
  timeRange?: {
    start: string;
    end: string;
  };
}

export interface ObserverOutput {
  // Discovered patterns - AI decides structure
  patterns: Record<string, any>;
  
  // Pattern metadata
  patternCount: number;
  confidenceScores: Record<string, number>;
  
  // Processing info
  observationsAnalyzed: number;
  processingTime: number;
}

// ============================================
// SCHOLAR AGENT TYPES
// ============================================

export interface ScholarInput {
  pattern: Record<string, any>; // From Observer
  childrenAffected: string[];
  ageRange?: {
    min: number;
    max: number;
  };
}

export interface ScholarOutput {
  // Insights and explanations - AI decides structure
  insights: Record<string, any>;
  
  // Research references if found
  references?: Array<{
    source: string;
    relevance: number;
  }>;
  
  // Confidence in explanation
  confidence: number;
  processingTime: number;
}

// ============================================
// INVENTOR AGENT TYPES
// ============================================

export interface InventorInput {
  insights: Record<string, any>; // From Scholar
  constraints?: {
    materials?: string[];
    duration?: number;
    groupSize?: number;
  };
}

export interface InventorOutput {
  // Generated activities - AI decides structure
  activities: Record<string, any>;
  
  // Predicted effectiveness
  predictedSuccess: number;
  
  // Alternative variations
  variations?: Record<string, any>[];
  
  processingTime: number;
}

// ============================================
// DATABASE TYPES
// ============================================

export interface AIProcessingRecord {
  id: string;
  source_type: 'observation' | 'attachment';
  source_id: string;
  child_id: string;
  
  // Agent outputs (flexible JSONB)
  reader_output?: ReaderOutput;
  observer_output?: ObserverOutput;
  scholar_output?: ScholarOutput;
  inventor_output?: InventorOutput;
  
  // Metadata
  created_at: string;
  updated_at: string;
}

// ============================================
// PROCESSING PIPELINE TYPES
// ============================================

export interface ProcessingOptions {
  skipCache?: boolean;
  priority?: 'low' | 'normal' | 'high';
  models?: {
    reader?: AIModel;
    observer?: AIModel;
    scholar?: AIModel;
    inventor?: AIModel;
  };
}

export interface ProcessingResult {
  success: boolean;
  recordId: string;
  errors?: Array<{
    agent: string;
    error: string;
  }>;
  totalProcessingTime: number;
}

// ============================================
// FEEDBACK TYPES
// ============================================

export interface ActivityFeedback {
  activityId: string;
  implemented: boolean;
  childrenParticipated: string[];
  engagement: 'low' | 'medium' | 'high';
  modifications?: string;
  outcome: 'failure' | 'partial' | 'success' | 'exceptional';
  teacherNotes?: string;
}

export interface FeedbackResult {
  success: boolean;
  confidenceAdjustment?: number;
  message: string;
}