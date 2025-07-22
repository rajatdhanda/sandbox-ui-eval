// app/components/shared/quick-observation-panel.tsx
// Path: app/components/shared/quick-observation-panel.tsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StudentSelector } from '../shared/student-selector';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  KeyboardAvoidingView,
  Platform,
  Modal,
  Animated,
  Alert
} from 'react-native';
import { 
  FileText, Camera, Mic, Tag, Eye, EyeOff, 
  Send, X, Smile, Zap, Brain, Heart, 
  Save, Clock, AlertTriangle, CheckCircle,
  Video as VideoIcon, StopCircle, Pause, Play  // Change this line
} from 'lucide-react-native';
import { colors, spacing, typography, borderRadius, shadows} from '@/lib/styles';
import { useLearningTracking } from '@/hooks/use-learning-tracking';
import { useAttachments } from '@/hooks/use-attachments';
import { DimensionPills } from './progress-components';
import { MediaGallery, PhotoCapture, VideoCapture, MediaUploader } from './media-components';
import { MediaItem } from './media-components';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';

interface QuickObservationPanelProps {
  visible: boolean;
  onClose: () => void;
  activityId?: string;
  childId?: string;
  childName?: string;
  activityTitle?: string;
  onSubmit?: (observation: ObservationData) => void;
  allowDraft?: boolean;
  maxCharacters?: number;
  children?: any[];
  students?: any[];  // NEW - preferred prop name
  initialData?: {
    type: ObservationData['type'];
    description: string;
    tags: string[];
    parentVisible: boolean;
    childId?: string;
  };
  mode?: 'create' | 'edit';  // Optional: to show different title
  existingAttachments?: any[]; // For edit mode
}

interface ObservationData {
  type: 'behavioral' | 'academic' | 'social' | 'physical' | 'creative';
  description: string;
  tags: string[];
  parentVisible: boolean;
  mediaAttachments?: string[];
  kmapDimensions?: ('move' | 'think' | 'endure')[];
  timestamp?: string;
  isDraft?: boolean;
  selectedStudentIds?: string[];
  progressRecordIds?: string[];
}

interface ObservationType {
  key: ObservationData['type'];
  label: string;
  icon: any;
  color: string;
  kmapDimensions: ('move' | 'think' | 'endure')[];
  quickTemplates: string[];
}

const OBSERVATION_TYPES: ObservationType[] = [
  { 
    key: 'behavioral', 
    label: 'Behavior', 
    icon: Smile, 
    color: colors.primary,
    kmapDimensions: ['endure'],
    quickTemplates: [
      'Showed excellent self-control during...',
      'Demonstrated patience when...',
      'Helped a friend with...'
    ]
  },
  { 
    key: 'academic', 
    label: 'Academic', 
    icon: Brain, 
    color: colors.success,
    kmapDimensions: ['think'],
    quickTemplates: [
      'Solved problem independently...',
      'Asked thoughtful questions about...',
      'Demonstrated understanding of...'
    ]
  },
  { 
    key: 'social', 
    label: 'Social', 
    icon: Heart, 
    color: colors.warning,
    kmapDimensions: ['endure', 'think'],
    quickTemplates: [
      'Collaborated well with peers on...',
      'Showed empathy when...',
      'Led the group in...'
    ]
  },
  { 
    key: 'physical', 
    label: 'Physical', 
    icon: Zap, 
    color: colors.info,
    kmapDimensions: ['move'],
    quickTemplates: [
      'Demonstrated improved coordination in...',
      'Showed stamina during...',
      'Mastered new skill...'
    ]
  },
  { 
    key: 'creative', 
    label: 'Creative', 
    icon: FileText, 
    color: colors.secondary,
    kmapDimensions: ['think', 'move'],
    quickTemplates: [
      'Created unique solution for...',
      'Expressed creativity through...',
      'Showed imagination when...'
    ]
  },
];

const QUICK_TAGS = [
  'engaged', 'collaborative', 'independent', 'creative', 'helpful',
  'focused', 'problem-solving', 'leadership', 'needs-support', 'milestone',
  'breakthrough', 'persistent', 'curious', 'confident'
];

const CHAR_LIMIT = 500;

export function QuickObservationPanel({ 
  visible, 
  onClose, 
  activityId,
  childId, 
  childName,
  activityTitle,
  onSubmit,
  allowDraft = true,
  maxCharacters = CHAR_LIMIT,
  children = [],
  students,  // ADD THIS LINE
  initialData,
  mode = 'create',
  existingAttachments
}: QuickObservationPanelProps) {
  const studentList = students || children || [];
  const [observationType, setObservationType] = useState<ObservationData['type']>(
  initialData?.type || 'behavioral'
);
const [description, setDescription] = useState(initialData?.description || '');
const [selectedTags, setSelectedTags] = useState<string[]>(initialData?.tags || []);
const [parentVisible, setParentVisible] = useState(initialData?.parentVisible ?? true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [mediaAttachments, setMediaAttachments] = useState<MediaItem[]>([]);
  const [showMediaUploader, setShowMediaUploader] = useState(false);
  
  
  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const recordingTimer = useRef<NodeJS.Timeout>();
  
  const { trackInformalObservation, getActivityObservations } = useLearningTracking();
  const { uploadAttachment, uploadFile, loading: uploadLoading } = useAttachments();
  

  const descriptionRef = useRef<TextInput>(null);
  const autoSaveTimer = useRef<NodeJS.Timeout>();

  // Get current observation type data
  const currentType = OBSERVATION_TYPES.find(t => t.key === observationType)!;

  // Reset form properly when modal opens
  // Reset form properly when modal opens
useEffect(() => {
  if (visible) {
    if (!initialData) {
      resetForm();
    }
  }
}, [visible]);

  // Auto-save draft
  useEffect(() => {
    if (allowDraft && description.length > 10) {
      clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = setTimeout(() => {
        saveDraft();
      }, 2000);
    }
    return () => clearTimeout(autoSaveTimer.current);
  }, [description, selectedTags, observationType, parentVisible]);

  // Load previous observations
  useEffect(() => {
    if (visible && activityId) {
      loadPreviousObservations();
    }
  }, [visible, activityId]);

  // Setup audio permissions
  useEffect(() => {
    if (Platform.OS !== 'web') {
      Audio.requestPermissionsAsync();
      Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
    }
  }, []);
  // Auto-select students when panel opens
useEffect(() => {
  if (visible && !childId && studentList.length > 0 && selectedStudentIds.length === 0) {
    const allIds = studentList.map(s => s.id);
    setSelectedStudentIds(allIds);
  }
}, [visible, childId, studentList.length]); // Note: using .length to avoid dependency array issues



// Handle initial data and student selection for edit mode
useEffect(() => {
  if (visible && initialData) {
    // If editing a specific child's observation
    if (initialData.childId) {
      setSelectedStudentIds([initialData.childId]);
    }
  }
}, [visible, initialData]);

// Load existing attachments when editing
useEffect(() => {
  if (visible && mode === 'edit' && existingAttachments && existingAttachments.length > 0) {
    setMediaAttachments(existingAttachments);
  }
}, [visible, mode, existingAttachments]);




  const loadPreviousObservations = async () => {
    if (!activityId) return;
    
    console.log('Loading observations for activity:', activityId);
    const result = await getActivityObservations(activityId);
    
    if (result.success && result.data.length > 0) {
      console.log('Found previous observations:', result.data.length);
      
      // Get child IDs from the most recent batch of observations only
      const mostRecentTime = result.data[0].created_at;
      const recentBatchTime = new Date(mostRecentTime);
      const timeThreshold = new Date(recentBatchTime.getTime() - 60000); // 1 minute window
      
      const observedChildIds = new Set<string>();
      result.data.forEach(obs => {
        const obsTime = new Date(obs.created_at);
        if (obs.child_id && obsTime >= timeThreshold) {
          observedChildIds.add(obs.child_id);
        }
      });
      
      // Pre-select these students
      if (observedChildIds.size > 0) {
        const childIdsArray = Array.from(observedChildIds);
        console.log('Pre-selecting students from recent batch:', childIdsArray);
        setSelectedStudentIds(childIdsArray);
      }
      
      // Parse the most recent observation
      const lastObservation = result.data[0];
      console.log('Last observation:', lastObservation);
      
      // Parse the teacher notes to extract data
      if (lastObservation.teacher_notes) {
        // Extract observation type from notes
        const typeMatch = lastObservation.teacher_notes.match(/^(\w+):/);
        if (typeMatch) {
          const type = typeMatch[1].toLowerCase();
          const validType = OBSERVATION_TYPES.find(t => t.key === type);
          if (validType) {
            setObservationType(validType.key);
          }
        }
        
        // Extract description
        const descMatch = lastObservation.teacher_notes.match(/^\w+:\s*(.+?)(?:\s*\[Activity:|(?:\s*\|\s*Tags:)|$)/);
        if (descMatch) {
          const extractedDesc = descMatch[1].trim();
          console.log('Extracted description:', extractedDesc);
          setDescription(extractedDesc);
        }
        
        // Extract tags
        const tagsMatch = lastObservation.teacher_notes.match(/Tags:\s*([^|]+)/);
        if (tagsMatch) {
          const tags = tagsMatch[1].split(',').map(t => t.trim());
          setSelectedTags(tags.filter(t => QUICK_TAGS.includes(t)));
        }
      }
      
      // Set parent visibility
      if (lastObservation.parent_visible !== undefined) {
        setParentVisible(lastObservation.parent_visible);
      }
    } else {
      // No previous observations - select all students as default for new observation
      console.log('No previous observations found, selecting all students as default');
      if (children && children.length > 0) {
        const uniqueChildIds = [...new Set(children.map(child => child.id))];
        setSelectedStudentIds(uniqueChildIds);
      }
    }
  };

  const saveDraft = () => {
    // In a real app, save to AsyncStorage or backend
    setDraftSaved(true);
    setTimeout(() => setDraftSaved(false), 2000);
  };

  const resetForm = () => {
    setDescription('');
    setSelectedTags([]);
    setObservationType('behavioral');
    setParentVisible(true);
    setShowTemplates(false);
    setSelectedStudentIds([]);
    setMediaAttachments([]);
    setShowMediaUploader(false);
    setIsRecording(false);
    setRecordingDuration(0);
    if (recording) {
      recording.stopAndUnloadAsync();
      setRecording(null);
    }
    clearTimeout(autoSaveTimer.current);
  };

  const handlePhotoCapture = async (photo: MediaItem) => {
    // Upload to Supabase storage first
    try {
      const response = await fetch(photo.url);
      const blob = await response.blob();
      const file = new File([blob], photo.name || `photo-${Date.now()}.jpg`, { 
        type: photo.metadata?.mimeType || 'image/jpeg' 
      });
      
      const uploadResult = await uploadFile(file, 'observations');
      if (uploadResult.success && uploadResult.data) {
        const enhancedPhoto: MediaItem = {
          ...photo,
          id: Date.now().toString(),
          url: uploadResult.data.url,
          metadata: {
            bucket: 'attachments',
            path: uploadResult.data.path,
            mimeType: uploadResult.data.type
          }
        };
        setMediaAttachments(prev => [...prev, enhancedPhoto]);
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      Alert.alert('Error', 'Failed to upload photo');
    }
  };

  const handleFileUpload = async (files: File[]) => {
    try {
      const uploadPromises = files.map(async (file) => {
        const result = await uploadFile(file, 'observations');
        if (result.success && result.data) {
          return {
            id: Date.now().toString() + Math.random(),
            url: result.data.url,
            type: file.type.startsWith('image/') ? 'image' as const : 
                  file.type.includes('pdf') ? 'pdf' as const : 'document' as const,
            name: file.name,
            size: file.size,
            uploadedAt: new Date().toISOString(),
            metadata: {
              bucket: 'attachments',
              path: result.data.path,
              mimeType: file.type
            }
          };
        }
        return null;
      });
      
      const uploadedFiles = await Promise.all(uploadPromises);
      const validFiles = uploadedFiles.filter(f => f !== null) as MediaItem[];
      
      setMediaAttachments(prev => [...prev, ...validFiles]);
      setShowMediaUploader(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to upload files');
    }
  };

  const handleRemoveAttachment = (item: MediaItem) => {
    setMediaAttachments(prev => prev.filter(a => a.id !== item.id));
  };

  const startVoiceRecording = async () => {
    try {
      console.log('Starting voice recording...');
      
      if (Platform.OS !== 'web') {
        await Audio.requestPermissionsAsync();
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
      }

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(recording);
      setIsRecording(true);
      setRecordingDuration(0);
      
      // Start duration timer
      recordingTimer.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Could not start voice recording');
    }
  };

  const stopVoiceRecording = async () => {
    if (!recording) return;
    
    try {
      console.log('Stopping voice recording...');
      setIsRecording(false);
      clearInterval(recordingTimer.current);
      
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      console.log('Recording stopped and stored at', uri);
      
      if (uri) {
        // Upload audio to Supabase
        const response = await fetch(uri);
        const blob = await response.blob();
        const file = new File([blob], `voice-${Date.now()}.m4a`, { type: 'audio/m4a' });
        
        const uploadResult = await uploadFile(file, 'observations/audio');
        if (uploadResult.success && uploadResult.data) {
          const audioItem: MediaItem = {
            id: Date.now().toString(),
            url: uploadResult.data.url,
            type: 'document', // Using document type for audio
            name: `Voice Note (${formatDuration(recordingDuration)})`,
            size: file.size,
            uploadedAt: new Date().toISOString(),
            metadata: {
              bucket: 'attachments',
              path: uploadResult.data.path,
              mimeType: 'audio/m4a'
            }
          };
          setMediaAttachments(prev => [...prev, audioItem]);
        }
      }
      
      setRecording(null);
      setRecordingDuration(0);
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Error', 'Failed to save voice recording');
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async () => {
    console.log('Edit Debug:', {
    mode,
    initialDataTags: initialData?.tags,
    selectedTags,
    existingEditTag: initialData?.tags?.find(tag => tag.startsWith('edited_'))
  });
    if (!description.trim()) {
      Alert.alert('Required', 'Please add an observation description');
      return;
    }
    
    if (description.length > maxCharacters) {
      Alert.alert('Too Long', `Please keep observations under ${maxCharacters} characters`);
      return;
    }

    if (selectedStudentIds.length === 0 && !childId) {
      Alert.alert('Required', 'Please select at least one student');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const progressRecordIds: string[] = [];
      const studentIds = childId ? [childId] : selectedStudentIds;
      // Calculate final tags including edit tracking
const finalTags = mode === 'edit' 
  ? (() => {
      const existingEditTag = initialData?.tags?.find(tag => tag.startsWith('edited_'));
      const editCount = existingEditTag 
        ? parseInt(existingEditTag.split('_')[1] || '0') + 1 
        : 1;
      const filteredTags = selectedTags.filter(tag => !tag.startsWith('edited_'));
      return [...filteredTags, `edited_${editCount}`];
    })()
  : selectedTags;
      
      // First, create progress tracking records
      console.log('Creating progress records for students:', studentIds);
      
      const progressResults = await Promise.all(
        studentIds.map(studentId => 
         trackInformalObservation(studentId, {
  type: observationType,
  description: description.trim(),
  tags: finalTags,
  parentVisible,
  activityScheduleId: activityId,
})
        )
      );
      
      // Collect successful progress record IDs
      const successfulRecords: Array<{progressId: string, childId: string}> = [];
      progressResults.forEach((result, index) => {
        if (result.success && result.data) {
          progressRecordIds.push(result.data.id);
          successfulRecords.push({
            progressId: result.data.id,
            childId: studentIds[index]
          });
        }
      });
      
      // Now link attachments to progress records
      if (mediaAttachments.length > 0 && successfulRecords.length > 0) {
        console.log('Linking attachments to progress records...');
        
        for (const attachment of mediaAttachments) {
          for (const record of successfulRecords) {
            try {
              await uploadAttachment({
                type: attachment.type,
                url: attachment.url,
                file_name: attachment.name,
                file_size: attachment.size,
                mime_type: attachment.metadata?.mimeType,
                child_id: record.childId,
                progress_tracking_id: record.progressId,
                activity_date: new Date().toISOString().split('T')[0],
                caption: attachment.caption || '',
                is_parent_visible: parentVisible,
                tags: selectedTags
              });
            } catch (error) {
              console.error('Failed to link attachment:', error);
            }
          }
        }
      }
      
      const allSuccess = progressResults.every(r => r.success);
      
      if (allSuccess) {
        const observationData: ObservationData = {
          type: observationType,
          description: description.trim(),
          tags: mode === 'edit' 
  ? (() => {
      // Find existing edited tag
      const existingEditTag = initialData?.tags?.find(tag => tag.startsWith('edited_'));
      const editCount = existingEditTag 
        ? parseInt(existingEditTag.split('_')[1] || '0') + 1 
        : 1;
      // Remove old edited tags and add new one
      const filteredTags = selectedTags.filter(tag => !tag.startsWith('edited_'));
      return [...filteredTags, `edited_${editCount}`];
    })()
  : selectedTags,
          parentVisible,
          kmapDimensions: currentType.kmapDimensions,
          timestamp: new Date().toISOString(),
          selectedStudentIds: studentIds,
          mediaAttachments: mediaAttachments.map(m => m.url),
          progressRecordIds
        };
        
        onSubmit?.(observationData);
        resetForm();
        onClose();
      } else {
        const failedCount = progressResults.filter(r => !r.success).length;
        Alert.alert('Partial Success', `Saved for ${progressResults.length - failedCount} of ${progressResults.length} students`);
      }
    } catch (err) {
      console.error('Failed to save observation:', err);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const applyTemplate = (template: string) => {
    setDescription(template);
    setShowTemplates(false);
    descriptionRef.current?.focus();
  };

  const getCharacterColor = () => {
    const remaining = maxCharacters - description.length;
    if (remaining < 0) return colors.error;
    if (remaining < 50) return colors.warning;
    return colors.textSecondary;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => {
        resetForm();
        onClose();
      }}
    >
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerInfo}>
            <Text style={styles.title}>
  {mode === 'edit' ? 'Edit Observation' : 'Quick Observation'}
</Text>
            {childName && (
              <Text style={styles.subtitle}>
                {childName} {activityTitle && `• ${activityTitle}`}
              </Text>
            )}
          </View>
          <View style={styles.headerActions}>
            {draftSaved && (
              <View style={styles.draftIndicator}>
                <CheckCircle size={16} color={colors.success} />
                <Text style={styles.draftText}>Saved</Text>
              </View>
            )}
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Observation Types */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Type</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.typeScroll}
            >
              {OBSERVATION_TYPES.map(type => {
                const Icon = type.icon;
                const isSelected = observationType === type.key;
                return (
                  <TouchableOpacity
                    key={type.key}
                    style={[
                      styles.typeButton,
                      isSelected && { backgroundColor: type.color + '20', borderColor: type.color }
                    ]}
                    onPress={() => setObservationType(type.key)}
                  >
                    <Icon size={20} color={isSelected ? type.color : colors.gray500} />
                    <Text style={[
                      styles.typeLabel,
                      isSelected && { color: type.color }
                    ]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            
            {/* K-Map Dimensions for selected type */}
            <View style={styles.kmapIndicator}>
              <Text style={styles.kmapLabel}>Focus Areas:</Text>
              <DimensionPills 
                dimensions={currentType.kmapDimensions.reduce((acc, dim) => ({
                  ...acc,
                  [dim]: dim === 'move' ? 3 : dim === 'think' ? 2 : 1
                }), {})}
                size="sm"
                showZero={false}
              />
            </View>
          </View>

          {/* Student Selection */}
          {children && children.length > 0 && (
            <View style={styles.section}>
              <StudentSelector
                students={children}
                selectedIds={selectedStudentIds}
                onSelectionChange={setSelectedStudentIds}
                mode="multiple"
                showSelectAll={true}
                compact={true}
                title="Select Students"
                showSearch={children.length > 10}
              />
            </View>
          )}

          {/* Quick Templates */}
          {showTemplates && (
            <View style={styles.templatesSection}>
              <Text style={styles.sectionTitle}>Quick Templates</Text>
              {currentType.quickTemplates.map((template, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.templateButton}
                  onPress={() => applyTemplate(template)}
                >
                  <Text style={styles.templateText}>{template}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Description */}
          <View style={styles.section}>
            <View style={styles.descriptionHeader}>
              <Text style={styles.sectionTitle}>Observation</Text>
              <TouchableOpacity 
                onPress={() => setShowTemplates(!showTemplates)}
                style={styles.templateToggle}
              >
                <FileText size={16} color={colors.primary} />
                <Text style={styles.templateToggleText}>Templates</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              ref={descriptionRef}
              style={[
                styles.textInput,
                description.length > maxCharacters && styles.textInputError
              ]}
              placeholder="What did you observe? Be specific..."
              placeholderTextColor={colors.textSecondary}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={maxCharacters + 50}
            />
            <View style={styles.charCountContainer}>
              <Text style={[styles.charCount, { color: getCharacterColor() }]}>
                {description.length}/{maxCharacters}
              </Text>
              {description.length > maxCharacters && (
                <View style={styles.charWarning}>
                  <AlertTriangle size={14} color={colors.error} />
                  <Text style={styles.charWarningText}>Too long</Text>
                </View>
              )}
            </View>
          </View>

          {/* Quick Tags */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tagContainer}>
              {QUICK_TAGS.map(tag => (
                <TouchableOpacity
                  key={tag}
                  style={[
                    styles.tag,
                    selectedTags.includes(tag) && styles.tagSelected
                  ]}
                  onPress={() => toggleTag(tag)}
                >
                  <Tag size={12} color={
                    selectedTags.includes(tag) ? colors.white : colors.gray600
                  } />
                  <Text style={[
                    styles.tagText,
                    selectedTags.includes(tag) && styles.tagTextSelected
                  ]}>
                    {tag}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Parent Visibility */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.visibilityToggle}
              onPress={() => setParentVisible(!parentVisible)}
            >
              {parentVisible ? (
                <Eye size={20} color={colors.success} />
              ) : (
                <EyeOff size={20} color={colors.gray500} />
              )}
              <Text style={styles.visibilityText}>
                {parentVisible ? 'Visible to parents' : 'Hidden from parents'}
              </Text>
              <View style={styles.visibilityInfo}>
                <Text style={styles.visibilityInfoText}>
                  {parentVisible 
                    ? 'Parents will see this observation' 
                    : 'Only staff can view this'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Media Attachments */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Attachments</Text>
            
            {/* Show attached media */}
            {mediaAttachments.length > 0 && (
              <View style={styles.mediaPreview}>
                <MediaGallery
                  items={mediaAttachments}
                  columns={3}
                  onItemDelete={handleRemoveAttachment}
                  showCaptions={false}
                />
              </View>
            )}
            
            <View style={styles.attachmentButtons}>
              <PhotoCapture
  onCapture={handlePhotoCapture}
  buttonText="Photo"
  size="sm"
/>
              
              <VideoCapture
  onCapture={(video) => {
    setMediaAttachments(prev => [...prev, video]);
  }}
  buttonText="Video"
  size="sm"
  maxDuration={60}
/>
              
              {!isRecording ? (
                <TouchableOpacity 
                  style={styles.attachmentButton}
                  onPress={startVoiceRecording}
                >
                  <Mic size={20} color={colors.primary} />
                  <Text style={styles.attachmentButtonText}>Voice</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  style={[styles.attachmentButton, styles.recordingButton]}
                  onPress={stopVoiceRecording}
                >
                  <StopCircle size={20} color={colors.error} />
                  <Text style={[styles.attachmentButtonText, { color: colors.error }]}>
                    {formatDuration(recordingDuration)}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            
            {/* Add more files option */}
            {showMediaUploader && (
              <View style={styles.uploaderContainer}>
                <MediaUploader
                  onUpload={handleFileUpload}
                  accept="image/*,video/*,application/pdf"
                  multiple={true}
                  maxFiles={5 - mediaAttachments.length}
                  showPreview={true}
                />
                <TouchableOpacity 
                  onPress={() => setShowMediaUploader(false)}
                  style={styles.cancelUpload}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            )}
            
            {!showMediaUploader && mediaAttachments.length < 5 && (
              <TouchableOpacity 
                style={styles.addMoreButton}
                onPress={() => setShowMediaUploader(true)}
              >
                <Text style={styles.addMoreText}>+ Add more files</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!description.trim() || isSubmitting || description.length > maxCharacters || uploadLoading || isRecording) 
                && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={!description.trim() || isSubmitting || description.length > maxCharacters || uploadLoading || isRecording}
          >
            <Send size={20} color={colors.white} />
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Saving...' : uploadLoading ? 'Uploading...' : 'Save Observation'}
            </Text>
          </TouchableOpacity>
          
          {allowDraft && (
            <TouchableOpacity 
              style={styles.saveDraftButton}
              onPress={saveDraft}
            >
              <Save size={16} color={colors.primary} />
              <Text style={styles.saveDraftText}>Save as Draft</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  headerInfo: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.sm,
  },
  title: {
    fontSize: typography.xl,
    fontWeight: typography.semibold as any,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  closeButton: {
    padding: spacing.sm,
  },
  draftIndicator: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.success + '20',
    borderRadius: borderRadius.full,
  },
  draftText: {
    fontSize: typography.xs,
    color: colors.success,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  sectionTitle: {
    fontSize: typography.sm,
    fontWeight: typography.semibold as any,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  typeScroll: {
    flexDirection: 'row' as const,
  },
  typeButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.gray300,
    backgroundColor: colors.white,
    gap: spacing.xs,
  },
  typeLabel: {
    fontSize: typography.sm,
    color: colors.textSecondary,
  },
  kmapIndicator: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  kmapLabel: {
    fontSize: typography.xs,
    color: colors.textSecondary,
  },
  templatesSection: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.gray50,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  templateButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  templateText: {
    fontSize: typography.sm,
    color: colors.textPrimary,
    fontStyle: 'italic' as const,
  },
  descriptionHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: spacing.sm,
  },
  templateToggle: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.xs,
  },
  templateToggleText: {
    fontSize: typography.xs,
    color: colors.primary,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.base,
    color: colors.textPrimary,
    minHeight: 100,
    backgroundColor: colors.gray50,
  },
  textInputError: {
    borderColor: colors.error,
  },
  charCountContainer: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginTop: spacing.xs,
  },
  charCount: {
    fontSize: typography.xs,
    color: colors.textSecondary,
  },
  charWarning: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.xs,
  },
  charWarningText: {
    fontSize: typography.xs,
    color: colors.error,
  },
  tagContainer: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: spacing.sm,
  },
  tag: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray100,
    gap: spacing.xs,
  },
  tagSelected: {
    backgroundColor: colors.primary,
  },
  tagText: {
    fontSize: typography.sm,
    color: colors.textSecondary,
  },
  tagTextSelected: {
    color: colors.white,
  },
  visibilityToggle: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.sm,
  },
  visibilityText: {
    fontSize: typography.base,
    color: colors.textPrimary,
    flex: 1,
  },
  visibilityInfo: {
    marginLeft: 'auto' as const,
  },
  visibilityInfoText: {
    fontSize: typography.xs,
    color: colors.textSecondary,
  },
  attachmentButtons: {
    flexDirection: 'row' as const,
    gap: spacing.sm,
    flexWrap: 'wrap' as const,
  },
  attachmentButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gray300,
    backgroundColor: colors.white,
    gap: spacing.xs,
    minWidth: 90,
    justifyContent: 'center' as const,
  },
  recordingButton: {
    borderColor: colors.error,
    backgroundColor: colors.error + '10',
  },
  attachmentButtonText: {
    fontSize: typography.sm,
    color: colors.primary,
  },
  mediaPreview: {
    marginBottom: spacing.md,
  },
  uploaderContainer: {
    marginTop: spacing.md,
  },
  cancelUpload: {
    alignItems: 'center' as const,
    paddingVertical: spacing.sm,
  },
  cancelText: {
    fontSize: typography.sm,
    color: colors.textSecondary,
  },
  addMoreButton: {
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
  },
  addMoreText: {
    fontSize: typography.sm,
    color: colors.primary,
    textAlign: 'center' as const,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    backgroundColor: colors.white,
    ...shadows.sm,
  },
  submitButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  submitButtonDisabled: {
    backgroundColor: colors.gray400,
  },
  submitButtonText: {
    fontSize: typography.base,
    fontWeight: typography.semibold as any,
    color: colors.white,
  },
  saveDraftButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  saveDraftText: {
    fontSize: typography.sm,
    color: colors.primary,
  },
  
  
};