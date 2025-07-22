// hooks/use-attachments.ts
import { useState, useCallback } from 'react';
import { db } from '@/lib/supabase/services/database.service';

interface AttachmentData {
  type: 'photo' | 'video' | 'document' | 'pdf' | 'link';
  url: string;
  file_name?: string;
  file_size?: number;
  mime_type?: string;
  child_id?: string;
  class_id?: string;
  progress_tracking_id?: string;
  curriculum_item_id?: string;
  meal_record_id?: string;
  activity_date?: string;
  activity_type?: string;
  caption?: string;
  tags?: string[];
  is_parent_visible?: boolean;
}

export function useAttachments() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Upload a file to Supabase storage first
  const uploadFile = useCallback(async (file: File, path: string = 'attachments') => {
    setLoading(true);
    setError(null);
    
    try {
      // Generate unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${path}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await db.supabase.storage
        .from('attachments')
        .upload(fileName, file);
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: { publicUrl } } = db.supabase.storage
        .from('attachments')
        .getPublicUrl(fileName);
      
      return {
        success: true,
        data: {
          url: publicUrl,
          path: fileName,
          size: file.size,
          type: file.type,
          name: file.name
        }
      };
    } catch (err: any) {
      setError(err.message || 'Failed to upload file');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Save attachment record to database
  const uploadAttachment = useCallback(async (attachmentData: AttachmentData) => {
    setLoading(true);
    setError(null);
    
    try {
      // Get current user
      const { data: { user } } = await db.supabase.auth.getUser();
      
      const { data, error } = await db.supabase
        .from('attachments')
        .insert({
          type: attachmentData.type || 'photo',
          url: attachmentData.url,
          thumbnail_url: attachmentData.type === 'photo' ? attachmentData.url : null,
          file_name: attachmentData.file_name,
          file_size: attachmentData.file_size,
          mime_type: attachmentData.mime_type,
          child_id: attachmentData.child_id,
          class_id: attachmentData.class_id,
          progress_tracking_id: attachmentData.progress_tracking_id,
          curriculum_item_id: attachmentData.curriculum_item_id,
          meal_record_id: attachmentData.meal_record_id,
          activity_date: attachmentData.activity_date || new Date().toISOString().split('T')[0],
          activity_type: attachmentData.activity_type,
          caption: attachmentData.caption || '',
          tags: attachmentData.tags || [],
          is_parent_visible: attachmentData.is_parent_visible ?? true,
          is_archived: false,
          uploaded_by: user?.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      return { success: true, data };
    } catch (err: any) {
      setError(err.message || 'Failed to upload attachment');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Upload multiple attachments
  const uploadMultipleAttachments = useCallback(async (attachments: AttachmentData[]) => {
    setLoading(true);
    setError(null);
    
    try {
      const results = await Promise.all(
        attachments.map(attachment => uploadAttachment(attachment))
      );
      
      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);
      
      if (failed.length > 0) {
        console.error('Some attachments failed to upload:', failed);
      }
      
      return {
        success: failed.length === 0,
        data: successful.map(r => r.data),
        errors: failed.map(r => r.error)
      };
    } catch (err: any) {
      setError(err.message || 'Failed to upload attachments');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [uploadAttachment]);

  // Get attachments for a specific child
  const getAttachmentsForChild = useCallback(async (
    childId: string,
    options?: {
      limit?: number;
      offset?: number;
      startDate?: string;
      endDate?: string;
      type?: string;
    }
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      let query = db.supabase
        .from('attachments')
        .select('*')
        .eq('child_id', childId)
        .eq('is_archived', false)
        .order('created_at', { ascending: false });
      
      if (options?.type) {
        query = query.eq('type', options.type);
      }
      
      if (options?.startDate) {
        query = query.gte('activity_date', options.startDate);
      }
      
      if (options?.endDate) {
        query = query.lte('activity_date', options.endDate);
      }
      
      if (options?.limit) {
        query = query.limit(options.limit);
      }
      
      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (err: any) {
      setError(err.message || 'Failed to get attachments');
      return { success: false, data: [], error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Get attachments for a specific class
  const getAttachmentsForClass = useCallback(async (
    classId: string,
    options?: {
      limit?: number;
      offset?: number;
      startDate?: string;
      endDate?: string;
      type?: string;
    }
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      let query = db.supabase
        .from('attachments')
        .select('*')
        .eq('class_id', classId)
        .eq('is_archived', false)
        .order('created_at', { ascending: false });
      
      if (options?.type) {
        query = query.eq('type', options.type);
      }
      
      if (options?.startDate) {
        query = query.gte('activity_date', options.startDate);
      }
      
      if (options?.endDate) {
        query = query.lte('activity_date', options.endDate);
      }
      
      if (options?.limit) {
        query = query.limit(options.limit);
      }
      
      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (err: any) {
      setError(err.message || 'Failed to get attachments');
      return { success: false, data: [], error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Get media timeline for a child
  const getMediaTimeline = useCallback(async (
    childId: string,
    options?: {
      limit?: number;
      mediaType?: 'photo' | 'video';
    }
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      let query = db.supabase
        .from('attachments')
        .select('*')
        .eq('child_id', childId)
        .eq('is_parent_visible', true)
        .eq('is_archived', false)
        .order('activity_date', { ascending: false });
      
      if (options?.mediaType) {
        query = query.eq('type', options.mediaType);
      } else {
        query = query.in('type', ['photo', 'video']);
      }
      
      if (options?.limit) {
        query = query.limit(options.limit);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (err: any) {
      setError(err.message || 'Failed to get media timeline');
      return { success: false, data: [], error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Update attachment
  const updateAttachment = useCallback(async (
    attachmentId: string,
    updates: Partial<AttachmentData>
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await db.supabase
        .from('attachments')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', attachmentId)
        .select()
        .single();
      
      if (error) throw error;
      return { success: true, data };
    } catch (err: any) {
      setError(err.message || 'Failed to update attachment');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete attachment (soft delete by default)
  const deleteAttachment = useCallback(async (
    attachmentId: string,
    permanent: boolean = false
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      if (permanent) {
        // Get attachment to delete from storage
        const { data: attachment } = await db.supabase
          .from('attachments')
          .select('url')
          .eq('id', attachmentId)
          .single();
        
        // Delete from storage if exists
        if (attachment?.url) {
          const path = attachment.url.split('/').pop();
          if (path) {
            await db.supabase.storage
              .from('attachments')
              .remove([`attachments/${path}`]);
          }
        }
        
        // Delete from database
        const { error } = await db.supabase
          .from('attachments')
          .delete()
          .eq('id', attachmentId);
        
        if (error) throw error;
      } else {
        // Soft delete
        const { error } = await db.supabase
          .from('attachments')
          .update({ 
            is_archived: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', attachmentId);
        
        if (error) throw error;
      }
      
      return { success: true };
    } catch (err: any) {
      setError(err.message || 'Failed to delete attachment');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Get attachment statistics
  const getAttachmentStats = useCallback(async (filters: {
    childId?: string;
    classId?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    setLoading(true);
    setError(null);
    
    try {
      let query = db.supabase
        .from('attachments')
        .select('type, created_at')
        .eq('is_archived', false);
      
      if (filters.childId) {
        query = query.eq('child_id', filters.childId);
      }
      
      if (filters.classId) {
        query = query.eq('class_id', filters.classId);
      }
      
      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate);
      }
      
      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Calculate stats
      const stats = {
        total: data?.length || 0,
        photos: data?.filter(a => a.type === 'photo').length || 0,
        videos: data?.filter(a => a.type === 'video').length || 0,
        documents: data?.filter(a => a.type === 'document' || a.type === 'pdf').length || 0,
        byMonth: {} as Record<string, number>
      };
      
      // Group by month
      data?.forEach(attachment => {
        const month = new Date(attachment.created_at).toISOString().slice(0, 7);
        stats.byMonth[month] = (stats.byMonth[month] || 0) + 1;
      });
      
      return { success: true, data: stats };
    } catch (err: any) {
      setError(err.message || 'Failed to get stats');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Get attachments for a progress tracking record
  const getAttachmentsForProgress = useCallback(async (progressTrackingId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await db.supabase
        .from('attachments')
        .select('*')
        .eq('progress_tracking_id', progressTrackingId)
        .eq('is_archived', false)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (err: any) {
      setError(err.message || 'Failed to get attachments');
      return { success: false, data: [], error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    uploadFile,
    uploadAttachment,
    uploadMultipleAttachments,
    getAttachmentsForChild,
    getAttachmentsForClass,
    getMediaTimeline,
    updateAttachment,
    deleteAttachment,
    getAttachmentStats,
    getAttachmentsForProgress
  };
}