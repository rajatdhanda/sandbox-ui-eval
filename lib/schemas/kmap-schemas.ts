// lib/schemas/kmap-schemas.ts
import { z } from 'zod';

// =====================================================
// K-MAP SCHEMAS
// =====================================================

// K-Map Dimensions
export const kMapDimensionSchema = z.object({
  id: z.string().uuid(),
  name: z.enum(['move', 'think', 'endure']),
  display_name: z.string(),
  description: z.string().optional(),
  color: z.string(),
  icon: z.string(),
  sort_order: z.number(),
  created_at: z.string(),
  updated_at: z.string()
});

export const kMapScoresSchema = z.object({
  move: z.number().min(0).max(10),
  think: z.number().min(0).max(10),
  endure: z.number().min(0).max(10)
});

// Progress Tracking
export const progressTrackingSchema = z.object({
  id: z.string().uuid(),
  curriculum_item_id: z.string().uuid().optional(),
  class_id: z.string().uuid().optional(),
  child_id: z.string().uuid(),
  teacher_id: z.string().uuid().optional(),
  
  execution_date: z.string(), // date format
  execution_type: z.enum(['class', 'individual']).default('class'),
  status: z.enum(['completed', 'partial', 'skipped', 'absent']),
  
  duration_minutes: z.number().optional(),
  quality_score: z.number().min(1).max(5).optional(),
  engagement_level: z.enum(['low', 'medium', 'high']).optional(),
  
  kmap_scores: kMapScoresSchema,
  
  milestone_achieved: z.boolean().default(false),
  teacher_notes: z.string().optional(),
  parent_visible: z.boolean().default(true),
  
  created_at: z.string(),
  updated_at: z.string()
});

// Progress Attachments
export const progressAttachmentSchema = z.object({
  id: z.string().uuid(),
  progress_tracking_id: z.string().uuid(),
  
  type: z.enum(['photo', 'video', 'document', 'audio']),
  url: z.string().url(),
  thumbnail_url: z.string().url().optional(),
  file_size: z.number().optional(),
  mime_type: z.string().optional(),
  
  caption: z.string().optional(),
  tags: z.array(z.string()).optional(),
  is_featured: z.boolean().default(false),
  parent_visible: z.boolean().default(true),
  
  uploaded_by: z.string().uuid().optional(),
  created_at: z.string()
});

// Milestone Definitions
export const milestoneDefinitionSchema = z.object({
  id: z.string().uuid(),
  
  category: z.enum(['physical', 'cognitive', 'social-emotional', 'language', 'self-care']),
  subcategory: z.string().optional(),
  age_group: z.string(), // '0-6 months', '6-12 months', etc.
  
  code: z.string(),
  title: z.string(),
  description: z.string().optional(),
  
  primary_dimension: z.enum(['move', 'think', 'endure']).optional(),
  dimension_weights: kMapScoresSchema,
  
  typical_age_months: z.number().optional(),
  importance_level: z.enum(['core', 'supplementary', 'advanced']).optional(),
  
  is_active: z.boolean().default(true),
  created_at: z.string(),
  updated_at: z.string()
});

// Child Milestones
export const childMilestoneSchema = z.object({
  id: z.string().uuid(),
  
  child_id: z.string().uuid(),
  milestone_definition_id: z.string().uuid(),
  
  status: z.enum(['not_started', 'emerging', 'progressing', 'achieved', 'exceeded']).default('not_started'),
  achievement_date: z.string().optional(),
  achievement_age_months: z.number().optional(),
  
  evidence_notes: z.string().optional(),
  progress_tracking_ids: z.array(z.string().uuid()).optional(),
  
  assessed_by: z.string().uuid().optional(),
  assessment_date: z.string().optional(),
  confidence_level: z.enum(['low', 'medium', 'high']).optional(),
  
  created_at: z.string(),
  updated_at: z.string()
});

// Progress Summaries
export const progressSummarySchema = z.object({
  id: z.string().uuid(),
  
  child_id: z.string().uuid(),
  period_type: z.enum(['weekly', 'monthly', 'quarterly', 'custom']),
  start_date: z.string(),
  end_date: z.string(),
  
  average_kmap_scores: kMapScoresSchema.optional(),
  total_activities: z.number().optional(),
  completion_rate: z.number().min(0).max(100).optional(),
  
  milestones_achieved: z.number().optional(),
  milestones_in_progress: z.number().optional(),
  
  key_achievements: z.array(z.string()).optional(),
  areas_of_focus: z.array(z.string()).optional(),
  teacher_summary: z.string().optional(),
  
  generated_by: z.string().uuid().optional(),
  generated_at: z.string(),
  approved_by: z.string().uuid().optional(),
  approved_at: z.string().optional(),
  
  shared_with_parents: z.boolean().default(false),
  parent_viewed_at: z.string().optional()
});

// =====================================================
// MEAL TRACKING SCHEMAS
// =====================================================

// Meal Records
export const mealRecordSchema = z.object({
  id: z.string().uuid(),
  
  meal_date: z.string(),
  meal_type: z.enum(['morning_snack', 'lunch', 'evening_snack', 'other']),
  other_meal_details: z.string().optional(),
  
  class_id: z.string().uuid().optional(),
  prepared_by: z.string().uuid().optional(),
  
  scheduled_time: z.string().optional(), // time format
  served_time: z.string().optional(),
  
  menu_notes: z.string().optional(),
  allergen_info: z.array(z.string()).optional(),
  
  created_at: z.string(),
  created_by: z.string().uuid().optional(),
  updated_at: z.string()
});

// Meal Items
export const mealItemSchema = z.object({
  id: z.string().uuid(),
  meal_record_id: z.string().uuid(),
  
  item_name: z.string(),
  item_category: z.enum(['grain', 'protein', 'vegetable', 'fruit', 'dairy', 'other']).optional(),
  description: z.string().optional(),
  
  calories: z.number().optional(),
  allergens: z.array(z.string()).optional(),
  
  serving_size: z.string().optional(),
  serving_unit: z.string().optional(),
  
  display_order: z.number().optional(),
  
  created_at: z.string()
});

// Meal Consumption
export const mealConsumptionSchema = z.object({
  id: z.string().uuid(),
  
  child_id: z.string().uuid(),
  meal_record_id: z.string().uuid(),
  meal_item_id: z.string().uuid().optional(),
  
  quantity_consumed: z.enum(['none', 'quarter', 'half', 'three_quarters', 'full']),
  
  liked_item: z.boolean().optional(),
  refused_item: z.boolean().optional(),
  allergy_reaction: z.boolean().default(false),
  special_notes: z.string().optional(),
  
  recorded_by: z.string().uuid().optional(),
  recorded_at: z.string()
});

// =====================================================
// INPUT SCHEMAS (for forms)
// =====================================================

// Progress Tracking Input
export const progressTrackingInputSchema = z.object({
  curriculum_item_id: z.string().uuid().optional(),
  class_id: z.string().uuid().optional(),
  child_id: z.string().uuid(),
  
  execution_date: z.string(),
  execution_type: z.enum(['class', 'individual']).default('class'),
  status: z.enum(['completed', 'partial', 'skipped', 'absent']),
  
  duration_minutes: z.number().optional(),
  quality_score: z.number().min(1).max(5).optional(),
  engagement_level: z.enum(['low', 'medium', 'high']).optional(),
  
  kmap_scores: kMapScoresSchema,
  
  milestone_achieved: z.boolean().default(false),
  teacher_notes: z.string().optional(),
  parent_visible: z.boolean().default(true)
});

// Meal Record Input
export const mealRecordInputSchema = z.object({
  meal_date: z.string(),
  meal_type: z.enum(['morning_snack', 'lunch', 'evening_snack', 'other']),
  other_meal_details: z.string().optional(),
  
  class_id: z.string().uuid().optional(),
  
  scheduled_time: z.string().optional(),
  served_time: z.string().optional(),
  
  menu_notes: z.string().optional(),
  allergen_info: z.array(z.string()).optional()
});

// Meal Item Input
export const mealItemInputSchema = z.object({
  item_name: z.string(),
  item_category: z.enum(['grain', 'protein', 'vegetable', 'fruit', 'dairy', 'other']).optional(),
  description: z.string().optional(),
  
  calories: z.number().optional(),
  allergens: z.array(z.string()).optional(),
  
  serving_size: z.string().optional(),
  serving_unit: z.string().optional(),
  
  display_order: z.number().optional()
});

// Meal Consumption Input
export const mealConsumptionInputSchema = z.object({
  child_id: z.string().uuid(),
  meal_item_id: z.string().uuid().optional(),
  
  quantity_consumed: z.enum(['none', 'quarter', 'half', 'three_quarters', 'full']),
  
  liked_item: z.boolean().optional(),
  refused_item: z.boolean().optional(),
  allergy_reaction: z.boolean().default(false),
  special_notes: z.string().optional()
});

// Batch Meal Consumption (for updating multiple children at once)
export const batchMealConsumptionSchema = z.object({
  meal_record_id: z.string().uuid(),
  consumptions: z.array(z.object({
    child_id: z.string().uuid(),
    items: z.array(z.object({
      meal_item_id: z.string().uuid(),
      quantity_consumed: z.enum(['none', 'quarter', 'half', 'three_quarters', 'full']),
      liked_item: z.boolean().optional(),
      refused_item: z.boolean().optional(),
      special_notes: z.string().optional()
    }))
  }))
});

// =====================================================
// TYPE EXPORTS
// =====================================================

export type KMapDimension = z.infer<typeof kMapDimensionSchema>;
export type KMapScores = z.infer<typeof kMapScoresSchema>;
export type ProgressTracking = z.infer<typeof progressTrackingSchema>;
export type ProgressAttachment = z.infer<typeof progressAttachmentSchema>;
export type MilestoneDefinition = z.infer<typeof milestoneDefinitionSchema>;
export type ChildMilestone = z.infer<typeof childMilestoneSchema>;
export type ProgressSummary = z.infer<typeof progressSummarySchema>;

export type MealRecord = z.infer<typeof mealRecordSchema>;
export type MealItem = z.infer<typeof mealItemSchema>;
export type MealConsumption = z.infer<typeof mealConsumptionSchema>;

export type ProgressTrackingInput = z.infer<typeof progressTrackingInputSchema>;
export type MealRecordInput = z.infer<typeof mealRecordInputSchema>;
export type MealItemInput = z.infer<typeof mealItemInputSchema>;
export type MealConsumptionInput = z.infer<typeof mealConsumptionInputSchema>;
export type BatchMealConsumption = z.infer<typeof batchMealConsumptionSchema>;