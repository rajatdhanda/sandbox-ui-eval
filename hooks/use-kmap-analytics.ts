// hooks/use-kmap-analytics.ts
// Path: hooks/use-kmap-analytics.ts

import { useState, useCallback } from 'react';
import { db } from '@/lib/supabase/services/database.service';

interface KMapScores {
  move: number;
  think: number;
  endure: number;
}

interface KMapAnalysis {
  current: KMapScores;
  average: KMapScores;
  trends: {
    move: { date: string; value: number }[];
    think: { date: string; value: number }[];
    endure: { date: string; value: number }[];
  };
  gaps: {
    dimension: 'move' | 'think' | 'endure';
    score: number;
    deficit: number;
  }[];
  recommendations: {
    activity_id: string;
    title: string;
    targetDimension: string;
    expectedImprovement: number;
  }[];
}

export function useKMapAnalytics() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateChildKMap = useCallback(async (
    childId: string,
    dateRange?: { start: string; end: string }
  ): Promise<KMapAnalysis | null> => {
    setLoading(true);
    setError(null);
    
    try {
      // Get latest K-Map profile
      const { data: profile } = await db.supabase
        .from('kmap_profiles')
        .select('*')
        .eq('child_id', childId)
        .order('assessment_date', { ascending: false })
        .limit(1)
        .single();
      
      // Get progress data for trends
      let progressQuery = db.supabase
        .from('progress_tracking')
        .select('execution_date, kmap_scores')
        .eq('child_id', childId)
        .not('kmap_scores', 'is', null);
      
      if (dateRange) {
        progressQuery = progressQuery
          .gte('execution_date', dateRange.start)
          .lte('execution_date', dateRange.end);
      }
      
      const { data: progressData } = await progressQuery.order('execution_date');
      
      // Calculate current scores
      const current: KMapScores = profile ? {
        move: profile.move_score || 0,
        think: profile.think_score || 0,
        endure: profile.endure_score || 0
      } : { move: 0, think: 0, endure: 0 };
      
      // Calculate averages and trends
      const trends = { move: [], think: [], endure: [] };
      let sumMove = 0, sumThink = 0, sumEndure = 0;
      let count = 0;
      
      progressData?.forEach(p => {
        if (p.kmap_scores) {
          const scores = p.kmap_scores as any;
          trends.move.push({ date: p.execution_date, value: scores.move || 0 });
          trends.think.push({ date: p.execution_date, value: scores.think || 0 });
          trends.endure.push({ date: p.execution_date, value: scores.endure || 0 });
          
          sumMove += scores.move || 0;
          sumThink += scores.think || 0;
          sumEndure += scores.endure || 0;
          count++;
        }
      });
      
      const average: KMapScores = count > 0 ? {
        move: Math.round((sumMove / count) * 10) / 10,
        think: Math.round((sumThink / count) * 10) / 10,
        endure: Math.round((sumEndure / count) * 10) / 10
      } : { move: 0, think: 0, endure: 0 };
      
      // Identify gaps (dimensions below 5)
      const gaps = [];
      const targetScore = 5;
      
      if (current.move < targetScore) {
        gaps.push({
          dimension: 'move' as const,
          score: current.move,
          deficit: targetScore - current.move
        });
      }
      if (current.think < targetScore) {
        gaps.push({
          dimension: 'think' as const,
          score: current.think,
          deficit: targetScore - current.think
        });
      }
      if (current.endure < targetScore) {
        gaps.push({
          dimension: 'endure' as const,
          score: current.endure,
          deficit: targetScore - current.endure
        });
      }
      
      // Sort gaps by deficit (biggest gap first)
      gaps.sort((a, b) => b.deficit - a.deficit);
      
      // Get recommendations
      const recommendations = await getActivityRecommendationsInternal(childId, gaps);
      
      return {
        current,
        average,
        trends,
        gaps,
        recommendations
      };
    } catch (err: any) {
      setError(err.message || 'Failed to calculate K-Map');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Internal function for getting recommendations
  const getActivityRecommendationsInternal = async (
    childId: string,
    gaps: any[]
  ) => {
    if (gaps.length === 0) return [];
    
    const primaryGap = gaps[0];
    
    // Get activities that target the weakest dimension
    const { data: activities } = await db.supabase
      .from('curriculum_items')
      .select('*')
      .gt(`kmap_dimensions->>${primaryGap.dimension}`, 0.5)
      .limit(5);
    
    return (activities || []).map(activity => ({
      activity_id: activity.id,
      title: activity.title,
      targetDimension: primaryGap.dimension,
      expectedImprovement: (activity.kmap_dimensions?.[primaryGap.dimension] || 0) * 10
    }));
  };

  // Public function for getting recommendations
  const getActivityRecommendations = useCallback(async (childId: string) => {
    try {
      // First calculate the child's K-Map to identify gaps
      const analysis = await calculateChildKMap(childId);
      if (!analysis || !analysis.gaps || analysis.gaps.length === 0) {
        return [];
      }
      
      return await getActivityRecommendationsInternal(childId, analysis.gaps);
    } catch (err: any) {
      console.error('Error getting recommendations:', err);
      return [];
    }
  }, [calculateChildKMap]);

  const compareToClassAverage = useCallback(async (
    childId: string,
    classId: string
  ) => {
    try {
      // Get all children in class
      const { data: classChildren } = await db.supabase
        .from('child_class_assignments')
        .select('child_id')
        .eq('class_id', classId)
        .eq('status', 'enrolled');
      
      if (!classChildren || classChildren.length === 0) {
        return null;
      }
      
      // Get K-Map profiles for all children
      const { data: profiles } = await db.supabase
        .from('kmap_profiles')
        .select('*')
        .in('child_id', classChildren.map(c => c.child_id))
        .order('assessment_date', { ascending: false });
      
      // Get latest profile for each child
      const latestProfiles = new Map();
      profiles?.forEach(profile => {
        if (!latestProfiles.has(profile.child_id) || 
            profile.assessment_date > latestProfiles.get(profile.child_id).assessment_date) {
          latestProfiles.set(profile.child_id, profile);
        }
      });
      
      // Calculate class averages
      let sumMove = 0, sumThink = 0, sumEndure = 0;
      let count = 0;
      
      latestProfiles.forEach(profile => {
        sumMove += profile.move_score || 0;
        sumThink += profile.think_score || 0;
        sumEndure += profile.endure_score || 0;
        count++;
      });
      
      const classAverage = count > 0 ? {
        move: Math.round((sumMove / count) * 10) / 10,
        think: Math.round((sumThink / count) * 10) / 10,
        endure: Math.round((sumEndure / count) * 10) / 10
      } : { move: 0, think: 0, endure: 0 };
      
      // Get child's profile
      const childProfile = latestProfiles.get(childId);
      const childScores = childProfile ? {
        move: childProfile.move_score || 0,
        think: childProfile.think_score || 0,
        endure: childProfile.endure_score || 0
      } : { move: 0, think: 0, endure: 0 };
      
      return {
        childScores,
        classAverage,
        comparison: {
          move: childScores.move - classAverage.move,
          think: childScores.think - classAverage.think,
          endure: childScores.endure - classAverage.endure
        }
      };
    } catch (err: any) {
      console.error('Error comparing to class:', err);
      return null;
    }
  }, []);


  const getDimensionBalance = useCallback(async (childId: string) => {
    try {
      const analysis = await calculateChildKMap(childId);
      if (!analysis) return null;
      
      const targetScore = 7.5; // Target balanced score
      
      return [
        {
          dimension: 'move',
          currentScore: analysis.current.move,
          targetScore,
          difference: analysis.current.move - targetScore,
          status: Math.abs(analysis.current.move - targetScore) < 1 ? 'on-track' : 
                  analysis.current.move > targetScore ? 'exceeded' : 'needs-attention'
        },
        {
          dimension: 'think',
          currentScore: analysis.current.think,
          targetScore,
          difference: analysis.current.think - targetScore,
          status: Math.abs(analysis.current.think - targetScore) < 1 ? 'on-track' : 
                  analysis.current.think > targetScore ? 'exceeded' : 'needs-attention'
        },
        {
          dimension: 'endure',
          currentScore: analysis.current.endure,
          targetScore,
          difference: analysis.current.endure - targetScore,
          status: Math.abs(analysis.current.endure - targetScore) < 1 ? 'on-track' : 
                  analysis.current.endure > targetScore ? 'exceeded' : 'needs-attention'
        }
      ];
    } catch (err: any) {
      console.error('Error getting dimension balance:', err);
      return null;
    }
  }, [calculateChildKMap]);

  return {
    loading,
    error,
    calculateChildKMap,
    compareToClassAverage,
    getActivityRecommendations,  // Now properly exported
    getDimensionBalance
  };
}