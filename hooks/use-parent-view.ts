// hooks/use-parent-view.ts
import { useState, useCallback, useEffect } from 'react';
import { db } from '@/lib/supabase/services/database.service';

interface DailyUpdate {
  date: string;
  attendance: string;
  activities: Array<{
    title: string;
    status: string;
    engagement_score?: number;
    teacher_notes?: string;
  }>;
  photos: Array<{
    url: string;
    caption?: string;
    activity?: string;
  }>;
  meals: Array<{
    meal_type: string;
    items_consumed: string[];
    quantity: string;
  }>;
}

export function useParentView(parentId: string) {
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  // Extract loadChildren as a callable function
  const loadChildren = useCallback(async () => {
    if (!parentId) return { success: false, error: 'No parent ID provided' };
    
    try {
      setLoading(true);
      const { data, error } = await db.supabase
        .from('parent_child_relationships')
        .select(`
          child_id,
          children!inner(id, first_name, last_name, date_of_birth)
        `)
        .eq('parent_id', parentId)
        .eq('is_active', true);
      
      if (error) throw error;
      
      const childrenData = data?.map(r => r.children) || [];
      setChildren(childrenData);
      
      if (childrenData.length > 0 && !selectedChildId) {
        setSelectedChildId(childrenData[0].id);
      }
      
      return { success: true, data: childrenData };
    } catch (err: any) {
      console.error('Error loading children:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [parentId, selectedChildId]);


   // Load parent's children
  useEffect(() => {
    if (parentId) {
      loadChildren();
    }
  }, [parentId, loadChildren]);

  const getChildDailyUpdate = useCallback(async (
    childId: string,
    date: string
  ): Promise<DailyUpdate | null> => {
    setLoading(true);
    setError(null);
    
    try {
      // Get attendance
      const { data: attendance } = await db.supabase
        .from('attendance_records')
        .select('status')
        .eq('child_id', childId)
        .eq('attendance_date', date)
        .single();
      
      // Get activities (only parent_visible)
      const { data: activities } = await db.supabase
        .from('progress_tracking')
        .select(`
          status,
          quality_score,
          teacher_notes,
          curriculum_items!inner(title, activity_type)
        `)
        .eq('child_id', childId)
        .eq('execution_date', date)
        .eq('parent_visible', true);
      
      // Get photos (only parent_visible)
      const { data: photos } = await db.supabase
        .from('activity_attachments')
        .select('*')
        .eq('child_id', childId)
        .gte('created_at', `${date}T00:00:00`)
        .lt('created_at', `${date}T23:59:59`)
        .eq('parent_visible', true)
        .eq('attachment_type', 'photo');
      
      // Get meals
      const { data: meals } = await db.supabase
        .from('meal_consumption')
        .select(`
          quantity_consumed,
          meal_records!inner(meal_type),
          meal_items!inner(item_name)
        `)
        .eq('child_id', childId)
        .eq('meal_date', date);
      
      return {
        date,
        attendance: attendance?.status || 'absent',
        activities: activities?.map(a => ({
          title: a.curriculum_items.title,
          status: a.status,
          engagement_score: a.quality_score,
          teacher_notes: a.teacher_notes
        })) || [],
        photos: photos?.map(p => ({
          url: p.file_url,
          caption: p.caption,
          activity: p.tags?.[0] // Assuming first tag is activity
        })) || [],
        meals: meals?.reduce((acc, m) => {
          const mealType = m.meal_records.meal_type;
          const existing = acc.find(meal => meal.meal_type === mealType);
          
          if (existing) {
            existing.items_consumed.push(m.meal_items.item_name);
          } else {
            acc.push({
              meal_type: mealType,
              items_consumed: [m.meal_items.item_name],
              quantity: m.quantity_consumed
            });
          }
          
          return acc;
        }, []) || []
      };
    } catch (err: any) {
      setError(err.message || 'Failed to get daily update');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getChildPhotos = useCallback(async (
    childId: string,
    dateRange: { start: string; end: string }
  ) => {
    try {
      const { data } = await db.supabase
        .from('activity_attachments')
        .select('*')
        .eq('child_id', childId)
        .eq('parent_visible', true)
        .eq('attachment_type', 'photo')
        .gte('activity_date', dateRange.start)
        .lte('activity_date', dateRange.end)
        .order('created_at', { ascending: false });
      
      return data || [];
    } catch (err: any) {
      console.error('Error getting photos:', err);
      return [];
    }
  }, []);

  const getProgressSummary = useCallback(async (
    childId: string,
    period: 'weekly' | 'monthly'
  ) => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      
      if (period === 'weekly') {
        startDate.setDate(endDate.getDate() - 7);
      } else {
        startDate.setMonth(endDate.getMonth() - 1);
      }
      
      const { data: summary } = await db.supabase
        .from('progress_summaries')
        .select('*')
        .eq('child_id', childId)
        .eq('period_type', period)
        .gte('start_date', startDate.toISOString().split('T')[0])
        .lte('end_date', endDate.toISOString().split('T')[0])
        .eq('shared_with_parents', true)
        .order('end_date', { ascending: false })
        .limit(1)
        .single();
      
      return summary;
    } catch (err: any) {
      console.error('Error getting progress summary:', err);
      return null;
    }
  }, []);

  const getKMapVisualization = useCallback(async (childId: string) => {
    try {
      const { data: profile } = await db.supabase
        .from('kmap_profiles')
        .select('*')
        .eq('child_id', childId)
        .order('assessment_date', { ascending: false })
        .limit(1)
        .single();
      
      if (!profile) return null;
      
      return {
        move: profile.move_score || 0,
        think: profile.think_score || 0,
        endure: profile.endure_score || 0,
        overall: profile.overall_development_score || 0,
        strengths: profile.strengths || [],
        areasForGrowth: profile.areas_for_growth || [],
        lastUpdated: profile.assessment_date
      };
    } catch (err: any) {
      console.error('Error getting K-Map:', err);
      return null;
    }
  }, []);

  return {
    children,
    selectedChildId,
    setSelectedChildId,
    loading,
    error,
    loadChildren,  // Add this
    getChildDailyUpdate,
    getChildPhotos,
    getProgressSummary,
    getKMapVisualization
  };
}