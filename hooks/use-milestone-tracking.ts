// hooks/use-milestone-tracking.ts
import { useState, useCallback } from 'react';
import { db } from '@/lib/supabase/services/database.service';

interface Milestone {
  id: string;
  child_id: string;
  milestone_definition_id: string;
  achievement_date: string;
  evidence_type?: string;
  evidence_url?: string;
  notes?: string;
  verified_by?: string;
  milestone_definition?: {
    title: string;
    description: string;
    age_group: string;
    category: string;
    dimension_weights: any;
  };
}

export function useMilestoneTracking() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkMilestoneAchievement = useCallback(async (
    childId: string,
    activityId: string
  ) => {
    try {
      // Get activity details
      const { data: activity } = await db.supabase
        .from('curriculum_items')
        .select('*')
        .eq('id', activityId)
        .single();
      
      if (!activity) return [];
      
      // Get child's age group
      const { data: child } = await db.supabase
        .from('children')
        .select('date_of_birth')
        .eq('id', childId)
        .single();
      
      if (!child) return [];
      
      const age = new Date().getFullYear() - new Date(child.date_of_birth).getFullYear();
      const ageGroup = `${age}-${age + 1} years`;
      
      // Get relevant milestone definitions
      const { data: definitions } = await db.supabase
        .from('milestone_definitions')
        .select('*')
        .eq('age_group', ageGroup)
        .eq('is_active', true);
      
      // Check which milestones might be achieved
      const potentialMilestones = [];
      
      for (const def of definitions || []) {
        // Simple check - would need more sophisticated logic
        if (def.category === activity.activity_type) {
          potentialMilestones.push(def);
        }
      }
      
      return potentialMilestones;
    } catch (err: any) {
      console.error('Error checking milestones:', err);
      return [];
    }
  }, []);

  const recordMilestone = useCallback(async (
    childId: string,
    milestoneDefinitionId: string,
    evidence: {
      type: 'photo' | 'video' | 'observation' | 'assessment';
      url?: string;
      notes: string;
    }
  ) => {
    try {
      const { data: { user } } = await db.supabase.auth.getUser();
      
      const result = await db.create('child_milestones', {
        child_id: childId,
        milestone_definition_id: milestoneDefinitionId,
        achievement_date: new Date().toISOString().split('T')[0],
        evidence_type: evidence.type,
        evidence_url: evidence.url,
        notes: evidence.notes,
        verified_by: user?.id
      });
      
      if (result.error) throw result.error;
      
      // Trigger celebration (would send notification)
      await celebrateMilestone(result.data.id);
      
      return { success: true, data: result.data };
    } catch (err: any) {
      console.error('Error recording milestone:', err);
      return { success: false, error: err.message };
    }
  }, []);

  const getMilestoneProgress = useCallback(async (
    childId: string,
    ageGroup?: string
  ) => {
    try {
      // Get all milestones for child
      const { data: achieved } = await db.supabase
        .from('child_milestones')
        .select(`
          *,
          milestone_definition:milestone_definitions!inner(*)
        `)
        .eq('child_id', childId);
      
      // Get all milestone definitions for age group
      let definitionsQuery = db.supabase
        .from('milestone_definitions')
        .select('*')
        .eq('is_active', true);
      
      if (ageGroup) {
        definitionsQuery = definitionsQuery.eq('age_group', ageGroup);
      }
      
      const { data: allDefinitions } = await definitionsQuery;
      
      // Calculate progress
      const achievedIds = new Set(achieved?.map(m => m.milestone_definition_id) || []);
      const total = allDefinitions?.length || 0;
      const completed = achieved?.length || 0;
      
      const progress = {
        total,
        completed,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
        achieved: achieved || [],
        pending: allDefinitions?.filter(d => !achievedIds.has(d.id)) || []
      };
      
      return progress;
    } catch (err: any) {
      console.error('Error getting milestone progress:', err);
      return null;
    }
  }, []);

  const celebrateMilestone = async (milestoneId: string) => {
    try {
      // This would trigger notifications, updates, etc.
      console.log('🎉 Celebrating milestone:', milestoneId);
      
      // Could create a notification record
      await db.create('notifications', {
        type: 'milestone_achieved',
        entity_id: milestoneId,
        title: 'Milestone Achieved!',
        message: 'A new milestone has been reached!',
        priority: 'high'
      });
      
      return { success: true };
    } catch (err: any) {
      console.error('Error celebrating milestone:', err);
      return { success: false };
    }
  };

  return {
    loading,
    error,
    checkMilestoneAchievement,
    recordMilestone,
    getMilestoneProgress
  };
}