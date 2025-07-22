// lib/hooks/use-kmap-crud.ts
import { useCRUD } from './use-crud';
import { 
  progressTrackingSchema, 
  progressTrackingInputSchema,
  milestoneDefinitionSchema,
  childMilestoneSchema,
  progressSummarySchema,
  type ProgressTracking,
  type MilestoneDefinition,
  type ChildMilestone,
  type ProgressSummary
} from '@/lib/schemas/kmap-schemas';

// Progress Tracking Hook
export function useProgressTracking() {
  const crud = useCRUD<ProgressTracking>({
    table: 'progress_tracking',
    schema: progressTrackingSchema,
    inputSchema: progressTrackingInputSchema,
    defaultFilters: { parent_visible: true }
  });

  // Custom methods for progress tracking
  const markClassProgress = async (
    classId: string, 
    curriculumItemId: string, 
    date: string,
    status: 'completed' | 'partial' | 'skipped',
    kMapScores: { move: number; think: number; endure: number }
  ) => {
    // Get all children in the class
    const { data: assignments } = await supabase
      .from('child_class_assignments')
      .select('child_id')
      .eq('class_id', classId)
      .eq('status', 'enrolled');

    if (!assignments) return { error: 'No children found in class' };

    // Create progress entries for all children
    const progressEntries = assignments.map(a => ({
      child_id: a.child_id,
      class_id: classId,
      curriculum_item_id: curriculumItemId,
      execution_date: date,
      execution_type: 'class' as const,
      status,
      kmap_scores: kMapScores,
      teacher_id: auth.uid()
    }));

    return await crud.createMany(progressEntries);
  };

  const getChildProgress = async (childId: string, startDate: string, endDate: string) => {
    return await crud.list({
      child_id: childId,
      execution_date: { gte: startDate, lte: endDate }
    }, {
      orderBy: { column: 'execution_date', ascending: false }
    });
  };

  return {
    ...crud,
    markClassProgress,
    getChildProgress
  };
}

// Milestone Tracking Hook
export function useMilestones() {
  const definitions = useCRUD<MilestoneDefinition>({
    table: 'milestone_definitions',
    schema: milestoneDefinitionSchema,
    defaultFilters: { is_active: true }
  });

  const childMilestones = useCRUD<ChildMilestone>({
    table: 'child_milestones',
    schema: childMilestoneSchema
  });

  // Track milestone achievement
  const achieveMilestone = async (
    childId: string,
    milestoneDefinitionId: string,
    achievementDate: string,
    notes?: string
  ) => {
    // Calculate age in months
    const { data: child } = await supabase
      .from('children')
      .select('date_of_birth')
      .eq('id', childId)
      .single();

    if (!child) return { error: 'Child not found' };

    const birthDate = new Date(child.date_of_birth);
    const achieved = new Date(achievementDate);
    const ageMonths = Math.floor((achieved.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44));

    return await childMilestones.upsert({
      child_id: childId,
      milestone_definition_id: milestoneDefinitionId,
      status: 'achieved',
      achievement_date: achievementDate,
      achievement_age_months: ageMonths,
      evidence_notes: notes,
      assessed_by: auth.uid(),
      assessment_date: new Date().toISOString().split('T')[0]
    });
  };

  // Get milestone progress for a child
  const getChildMilestoneProgress = async (childId: string, category?: string) => {
    let query = supabase
      .from('child_milestones')
      .select(`
        *,
        milestone_definition:milestone_definitions(*)
      `)
      .eq('child_id', childId);

    if (category) {
      query = query.eq('milestone_definition.category', category);
    }

    return await query;
  };

  return {
    definitions,
    childMilestones,
    achieveMilestone,
    getChildMilestoneProgress
  };
}

// Progress Summary Hook
export function useProgressSummaries() {
  const crud = useCRUD<ProgressSummary>({
    table: 'progress_summaries',
    schema: progressSummarySchema
  });

  // Generate summary for a period
  const generateSummary = async (
    childId: string,
    periodType: 'weekly' | 'monthly' | 'quarterly',
    startDate: string,
    endDate: string
  ) => {
    // Get all progress data for the period
    const { data: progressData } = await supabase
      .from('progress_tracking')
      .select('*')
      .eq('child_id', childId)
      .gte('execution_date', startDate)
      .lte('execution_date', endDate);

    if (!progressData || progressData.length === 0) {
      return { error: 'No progress data found for period' };
    }

    // Calculate averages
    const kMapTotals = { move: 0, think: 0, endure: 0 };
    let completedCount = 0;

    progressData.forEach(p => {
      if (p.status === 'completed') completedCount++;
      kMapTotals.move += p.kmap_scores?.move || 0;
      kMapTotals.think += p.kmap_scores?.think || 0;
      kMapTotals.endure += p.kmap_scores?.endure || 0;
    });

    const count = progressData.length;
    const averageScores = {
      move: Math.round(kMapTotals.move / count * 10) / 10,
      think: Math.round(kMapTotals.think / count * 10) / 10,
      endure: Math.round(kMapTotals.endure / count * 10) / 10
    };

    // Get milestone data
    const { data: milestones } = await supabase
      .from('child_milestones')
      .select('status')
      .eq('child_id', childId)
      .gte('achievement_date', startDate)
      .lte('achievement_date', endDate);

    const milestonesAchieved = milestones?.filter(m => m.status === 'achieved').length || 0;
    const milestonesInProgress = milestones?.filter(m => ['emerging', 'progressing'].includes(m.status)).length || 0;

    return await crud.create({
      child_id: childId,
      period_type: periodType,
      start_date: startDate,
      end_date: endDate,
      average_kmap_scores: averageScores,
      total_activities: count,
      completion_rate: Math.round(completedCount / count * 100),
      milestones_achieved: milestonesAchieved,
      milestones_in_progress: milestonesInProgress,
      generated_by: auth.uid()
    });
  };

  return {
    ...crud,
    generateSummary
  };
}