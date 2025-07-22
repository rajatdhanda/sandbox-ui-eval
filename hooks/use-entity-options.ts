// hooks/use-entity-options.ts
// Path: hooks/use-entity-options.ts

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/supabase/services/database.service';

export interface EntityOption {
  id: string;
  label: string;
  subtitle?: string;
  searchText: string;
  metadata?: any;
}

interface UseEntityOptionsConfig {
  parents?: boolean;
  children?: boolean;
  teachers?: boolean;
  classes?: boolean;
  templates?: boolean;
}

interface EntityData {
  parents: any[];
  children: any[];
  teachers: any[];
  classes: any[];
  templates: any[];
}

export function useEntityOptions(config: UseEntityOptionsConfig = {}) {
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [rawData, setRawData] = useState<EntityData>({
    parents: [],
    children: [],
    teachers: [],
    classes: [],
    templates: []
  });

  const loadData = useCallback(async () => {
    if (loading) return; // Prevent duplicate loads
    
    setLoading(true);
    console.log('🔄 [useEntityOptions] Starting data load...');
    
    try {
      const results: EntityData = {
        parents: [],
        children: [],
        teachers: [],
        classes: [],
        templates: []
      };

      // Load parents if requested
      if (config.parents) {
        console.log('👤 Loading parents...');
        const res = await db.read('users', { 
          filters: { role: 'parent', is_active: true },
          orderBy: [{ column: 'full_name' }]
        });
        results.parents = res.data || [];
        console.log(`✅ Loaded ${results.parents.length} parents`);
      }

      // Load children if requested
      // Load children with enrollment data if requested
// Load children with enrollment data if requested
if (config.children) {
  console.log('👶 Loading children with enrollments...');
  
  // First get children
  const res = await db.read('children', { 
    filters: { is_active: true },
    orderBy: [{ column: 'first_name' }]
  });
  
  // Then get their enrollments
  if (res.data && res.data.length > 0) {
    const childIds = res.data.map((c: any) => c.id);
    const enrollments = await db.supabase
      .from('child_class_assignments')
      .select('child_id, class_id')
      .in('child_id', childIds)
      .eq('is_active', true)
      .eq('status', 'enrolled');
    
    // Map enrollments to children
    const enrollmentMap = new Map<string, string>();
    enrollments.data?.forEach((e: any) => {
      enrollmentMap.set(e.child_id, e.class_id);
    });
    
    // Add enrollment data to children
    results.children = res.data.map((child: any) => ({
      ...child,
      enrollment: {
        classId: enrollmentMap.get(child.id) || null
      }
    }));
  } else {
    results.children = res.data || [];
  }
  
  console.log(`✅ Loaded ${results.children.length} children with enrollments`);
}

      // Load teachers if requested
      if (config.teachers) {
        console.log('👨‍🏫 Loading teachers...');
        const res = await db.read('users', { 
          filters: { role: 'teacher', is_active: true },
          orderBy: [{ column: 'full_name' }]
        });
        results.teachers = res.data || [];
        console.log(`✅ Loaded ${results.teachers.length} teachers`);
      }

      // Load classes if requested
      if (config.classes) {
        console.log('🏫 Loading classes...');
        const res = await db.read('classes', { 
          filters: { is_active: true },
          orderBy: [{ column: 'name' }]
        });
        results.classes = res.data || [];
        console.log(`✅ Loaded ${results.classes.length} classes`);
      }

      // Load templates if requested
      if (config.templates) {
        console.log('📚 Loading curriculum templates...');
        const res = await db.read('curriculum_templates', { 
          filters: { is_active: true },
          orderBy: [{ column: 'name' }]
        });
        results.templates = res.data || [];
        console.log(`✅ Loaded ${results.templates.length} templates`);
      }

      setRawData(results);
      setLoaded(true);
      console.log('✅ [useEntityOptions] Data load complete');
      
    } catch (error) {
      console.error('❌ [useEntityOptions] Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [config.parents, config.children, config.teachers, config.classes, config.templates]);

  // Load on mount if any entity is requested
  useEffect(() => {
    const shouldLoad = config.parents || config.children || config.teachers || config.classes || config.templates;
    if (shouldLoad && !loaded && !loading) {
      loadData();
    }
  }, [config, loaded, loading, loadData]);

  // Convert raw data to options format
  const parentOptions = rawData.parents.map(p => ({
    id: p.id,
    label: p.full_name || p.name || 'Unknown Parent',
    subtitle: p.email,
    searchText: `${p.full_name || p.name || ''} ${p.email || ''}`.toLowerCase(),
    metadata: p
  }));
  
  const childOptions = rawData.children.map(c => ({
    id: c.id,
    label: `${c.first_name || ''} ${c.last_name || ''}`.trim() || 'Unknown Child',
    subtitle: c.date_of_birth ? `Born: ${new Date(c.date_of_birth).toLocaleDateString()}` : undefined,
    searchText: `${c.first_name || ''} ${c.last_name || ''}`.toLowerCase(),
    metadata: c
  }));
  
  const teacherOptions = rawData.teachers.map(t => ({
    id: t.id,
    label: t.full_name || t.name || 'Unknown Teacher',
    subtitle: t.email,
    searchText: `${t.full_name || t.name || ''} ${t.email || ''}`.toLowerCase(),
    metadata: t
  }));
  
  const classOptions = rawData.classes.map(c => ({
    id: c.id,
    label: c.name || 'Unknown Class',
    subtitle: c.age_group,
    searchText: `${c.name || ''} ${c.age_group || ''}`.toLowerCase(),
    metadata: c
  }));
  
  const templateOptions = rawData.templates.map(t => ({
    id: t.id,
    label: t.name || 'Unknown Template',
    subtitle: t.subject_area,
    searchText: `${t.name || ''} ${t.subject_area || ''}`.toLowerCase(),
    metadata: t
  }));

  return {
    loading,
    loaded,
    rawData,
    // Return individual arrays instead of nested object
    parentOptions,
    childOptions,
    teacherOptions,
    classOptions,
    templateOptions,
    reload: loadData
  };
}