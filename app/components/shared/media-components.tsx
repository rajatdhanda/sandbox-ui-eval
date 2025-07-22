// app/components/shared/media-components.tsx
// Path: app/components/shared/media-components.tsx
// Unified media handling components

import React, { useState, useRef,useEffect } from 'react';
import { Platform, View, TouchableOpacity, Text, ScrollView, Image, Alert,Modal } from 'react-native';
import { Camera, Upload, X, File, Image as ImageIcon, Paperclip, Check, FileText, Video as VideoIcon, Link as LinkIcon } from 'lucide-react-native';
import { colors, spacing, typography, borderRadius, shadows } from '@/lib/styles';
import { supabase } from '@/lib/supabase';
import * as ImagePicker from 'expo-image-picker';

// ============================================
// MediaItem interface - EXPORTED for use in other components
// ============================================
export interface MediaItem {
  id: string;
  url: string;
  type: 'image' | 'video' | 'document' | 'pdf' | 'link';
  name?: string;
  size?: number;
  thumbnail?: string;
  caption?: string;
  uploadedBy?: string;
  uploadedAt?: string;
  metadata?: {
    bucket?: string;
    path?: string;
    mimeType?: string;
  };
}

interface MediaUploaderProps {
  onUpload: (files: File[]) => void | Promise<void>;
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  maxFiles?: number;
  showPreview?: boolean;
  compact?: boolean;
}

// ============================================
// Helper functions
// ============================================

// Helper function to get icon for media type
export const getMediaIcon = (item: MediaItem, size = 24) => {
  // YouTube detection
  if (item.type === 'link' && (item.url.includes('youtube.com') || item.url.includes('youtu.be'))) {
    return <VideoIcon size={size} color={colors.error} />;
  }
  
  switch (item.type) {
    case 'image':
      return <ImageIcon size={size} color={colors.success} />;
    case 'video':
      return <VideoIcon size={size} color={colors.warning} />;
    case 'pdf':
      return <FileText size={size} color={colors.error} />;
    case 'document':
      return <File size={size} color={colors.gray600} />;
    case 'link':
      return <LinkIcon size={size} color={colors.info} />;
    default:
      return <Paperclip size={size} color={colors.gray500} />;
  }
};

// Helper function to format file size
export const formatFileSize = (bytes?: number): string => {
  if (!bytes) return '';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};

// Supabase upload function
export async function uploadToSupabase(
  file: File | any,
  bucket: string = 'attachments',
  path: string = 'general'
): Promise<MediaItem> {
  const fileName = `${path}/${Date.now()}-${file.name}`;
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file);
    
  if (error) throw error;
  
  const { data: publicUrl } = supabase.storage
    .from(bucket)
    .getPublicUrl(fileName);
    
  return {
    id: data.path,
    url: publicUrl.publicUrl,
    type: file.type.startsWith('image/') ? 'image' : 
          file.type.includes('pdf') ? 'pdf' :
          file.type.startsWith('video/') ? 'video' : 'document',
    name: file.name,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    metadata: {
      bucket,
      path: data.path,
      mimeType: file.type
    }
  };
}

// ============================================
// MediaUploader Component
// ============================================
export function MediaUploader({
  onUpload,
  accept = 'image/*,application/pdf,video/*',
  multiple = true,
  maxSize = 10,
  maxFiles = 5,
  showPreview = true,
  compact = false,
}: MediaUploaderProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = () => {
    if (Platform.OS === 'web') {
      // Create and trigger file input for web
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = accept || 'image/*,application/pdf,video/*';
      input.multiple = multiple;
      
      input.onchange = (e: any) => {
        const files = Array.from(e.target.files || []) as File[];
        if (files.length > 0) {
          setSelectedFiles(files);
        }
      };
      
      input.click();
    } else {
      // For mobile, show options
      Alert.alert(
        'Select Files',
        'Choose from:',
        [
          { text: 'Take Photo', onPress: launchCamera },
          { text: 'Photo Library', onPress: launchLibrary },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    
    setUploading(true);
    try {
      const uploadPromises = selectedFiles.map(file => 
        uploadToSupabase(file, 'attachments', 'uploads')
      );
      const uploadedFiles = await Promise.all(uploadPromises);
      
      await onUpload(selectedFiles);
      setSelectedFiles([]);
      Alert.alert('Success', 'Files uploaded successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  const launchCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera permission is required to take photos');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    quality: 0.8,
    aspect: [4, 3], // Add aspect ratio
    base64: false,  // Don't need base64
  });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      const timestamp = Date.now();
      const filename = `photo-${timestamp}.jpg`;
      
      let file: any;
      if (Platform.OS === 'web') {
        if (typeof File !== 'undefined') {
          file = new File([blob], filename, { type: 'image/jpeg' });
        } else {
          file = {
            uri: asset.uri,
            name: filename,
            type: 'image/jpeg',
            size: blob.size,
          };
        }
      } else {
        file = {
          uri: asset.uri,
          name: filename,
          type: 'image/jpeg',
          size: blob.size,
        };
      }
      
      setSelectedFiles([file]);
    }
  };

  const launchLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Photo library permission is required');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: multiple,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      const files = await Promise.all(
        result.assets.map(async (asset) => {
          const response = await fetch(asset.uri);
          const blob = await response.blob();
          const extension = asset.type === 'video' ? 'mp4' : 'jpg';
          const timestamp = Date.now();
          const filename = `media-${timestamp}.${extension}`;
          
          if (Platform.OS === 'web' && typeof File !== 'undefined') {
            return new File([blob], filename, { 
              type: asset.type === 'video' ? 'video/mp4' : 'image/jpeg' 
            });
          } else {
            return {
              uri: asset.uri,
              name: filename,
              type: asset.type === 'video' ? 'video/mp4' : 'image/jpeg',
              size: blob.size,
            };
          }
        })
      );
      setSelectedFiles(files);
    }
  };

  if (compact) {
    return (
      <TouchableOpacity style={uploaderStyles.compactButton} onPress={handleFileSelect}>
        <Paperclip size={16} color={colors.primary} />
        <Text style={uploaderStyles.compactText}>Attach Files</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={uploaderStyles.container}>
      <TouchableOpacity 
        style={uploaderStyles.dropzone} 
        onPress={handleFileSelect}
      >
        <Upload size={32} color={colors.gray400} />
        <Text style={uploaderStyles.dropzoneText}>
          Tap to select files
        </Text>
        <Text style={uploaderStyles.dropzoneHint}>
          {accept.includes('image') ? 'Images' : 'Files'} up to {maxSize}MB
        </Text>
      </TouchableOpacity>

      {showPreview && selectedFiles.length > 0 && (
        <View style={uploaderStyles.previewContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {selectedFiles.map((file, index) => (
              <View key={index} style={uploaderStyles.previewItem}>
                <View style={uploaderStyles.fileIcon}>
                  {getMediaIcon({ 
                    id: index.toString(),
                    url: '',
                    type: file.type.startsWith('image/') ? 'image' : 
                          file.type.includes('pdf') ? 'pdf' : 'document',
                    name: file.name
                  })}
                </View>
                <Text style={uploaderStyles.fileName} numberOfLines={1}>
                  {file.name}
                </Text>
                <TouchableOpacity 
                  style={uploaderStyles.removeButton}
                  onPress={() => handleRemoveFile(index)}
                >
                  <X size={16} color={colors.white} />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
          
          <TouchableOpacity 
            style={[
              uploaderStyles.uploadButton,
              uploading && uploaderStyles.uploadingButton
            ]}
            onPress={handleUpload}
            disabled={uploading}
          >
            {uploading ? (
              <Text style={uploaderStyles.uploadButtonText}>Uploading...</Text>
            ) : (
              <>
                <Check size={16} color={colors.white} />
                <Text style={uploaderStyles.uploadButtonText}>
                  Upload {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const uploaderStyles = {
  container: {
    marginVertical: spacing.md,
  },
  fileSize: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  dropzone: {
    borderWidth: 2,
    borderStyle: 'dashed' as const,
    borderColor: colors.gray300,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: colors.gray50,
  },
  dropzoneText: {
    fontSize: typography.base,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  dropzoneHint: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  compactButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  compactText: {
    fontSize: typography.sm,
    color: colors.primary,
  },
  previewContainer: {
    marginTop: spacing.md,
  },
  previewItem: {
    width: 100,
    marginRight: spacing.sm,
    alignItems: 'center' as const,
  },
  fileIcon: {
    width: 60,
    height: 60,
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.md,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  fileName: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    width: '100%',
    textAlign: 'center' as const,
  },
  removeButton: {
    position: 'absolute' as const,
    top: -5,
    right: -5,
    backgroundColor: colors.error,
    borderRadius: borderRadius.full,
    padding: spacing.xs,
  },
  uploadButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  uploadingButton: {
    backgroundColor: colors.gray400,
  },
  uploadButtonText: {
    color: colors.white,
    fontSize: typography.base,
    fontWeight: typography.medium as any,
  },
};

// ============================================
// MediaGallery Component
// ============================================
interface MediaGalleryProps {
  items: MediaItem[];
  columns?: number;
  onItemPress?: (item: MediaItem) => void;
  onItemDelete?: (item: MediaItem) => void;
  showCaptions?: boolean;
  selectable?: boolean;
}

export function MediaGallery({
  items,
  columns = 3,
  onItemPress,
  onItemDelete,
  showCaptions = true,
  selectable = false,
}: MediaGalleryProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const toggleSelection = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const renderMediaItem = (item: MediaItem) => {
    const isSelected = selectedItems.includes(item.id);
    
    return (
      <TouchableOpacity
        key={item.id}
        style={[
          galleryStyles.item,
          { width: `${100 / columns - 2}%` },
          isSelected && galleryStyles.selectedItem
        ]}
        onPress={() => {
          if (selectable) {
            toggleSelection(item.id);
          } else {
            onItemPress?.(item);
          }
        }}
      >
        {item.type === 'image' ? (
          <Image 
            source={{ uri: item.thumbnail || item.url }} 
            style={galleryStyles.image}
          />
        ) : (
          <View style={galleryStyles.fileContainer}>
            {getMediaIcon(item, 32)}
            <Text style={galleryStyles.fileType}>
              {item.name || item.type.toUpperCase()}
            </Text>
            {item.size && (
              <Text style={galleryStyles.fileSize}>
                {formatFileSize(item.size)}
              </Text>
            )}
          </View>
        )}
        
        {isSelected && (
          <View style={galleryStyles.selectedOverlay}>
            <Check size={24} color={colors.white} />
          </View>
        )}
        
        {onItemDelete && !selectable && (
          <TouchableOpacity 
            style={galleryStyles.deleteButton}
            onPress={(e) => {
              e.stopPropagation();
              onItemDelete(item);
            }}
          >
            <X size={16} color={colors.white} />
          </TouchableOpacity>
        )}
        
        {showCaptions && item.caption && (
          <Text style={galleryStyles.caption} numberOfLines={2}>
            {item.caption}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={galleryStyles.container}>
      <View style={galleryStyles.grid}>
        {items.map(renderMediaItem)}
      </View>
      
      {selectable && selectedItems.length > 0 && (
        <View style={galleryStyles.selectionBar}>
          <Text style={galleryStyles.selectionText}>
            {selectedItems.length} selected
          </Text>
          <TouchableOpacity 
            onPress={() => setSelectedItems([])}
            style={galleryStyles.clearButton}
          >
            <Text style={galleryStyles.clearText}>Clear</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const galleryStyles = {
  container: {
    flex: 1,
  },
  fileSize: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  grid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: spacing.sm,
    padding: spacing.sm,
  },
  item: {
    aspectRatio: 1,
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.md,
    overflow: 'hidden' as const,
    marginBottom: spacing.sm,
  },
  selectedItem: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fileContainer: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: colors.gray50,
  },
  fileType: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  selectedOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.primary + '80',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  deleteButton: {
    position: 'absolute' as const,
    top: spacing.xs,
    right: spacing.xs,
    backgroundColor: colors.error,
    borderRadius: borderRadius.full,
    padding: spacing.xs,
  },
  caption: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    color: colors.white,
    fontSize: typography.xs,
    padding: spacing.xs,
  },
  selectionBar: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.primary,
    padding: spacing.md,
  },
  selectionText: {
    color: colors.white,
    fontSize: typography.base,
  },
  clearButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  clearText: {
    color: colors.white,
    fontSize: typography.sm,
    fontWeight: typography.medium as any,
  },
};

// ============================================
// MediaField Component
// ============================================
interface MediaFieldProps {
  label?: string;
  value: MediaItem[];
  onChange: (items: MediaItem[]) => void;
  maxItems?: number;
  required?: boolean;
  error?: string;
  allowCamera?: boolean;
}

export function MediaField({
  label,
  value,
  onChange,
  maxItems = 5,
  required = false,
  error,
  allowCamera = true,
}: MediaFieldProps) {
  const handleUpload = async (files: File[]) => {
    try {
      const uploadPromises = files.map(file => 
        uploadToSupabase(file, 'attachments', `field-${Date.now()}`)
      );
      const uploadedItems = await Promise.all(uploadPromises);
      
      onChange([...value, ...uploadedItems].slice(0, maxItems));
    } catch (error) {
      Alert.alert('Error', 'Failed to upload files');
    }
  };

  const handleRemove = (item: MediaItem) => {
    onChange(value.filter(i => i.id !== item.id));
  };

  const handleCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera permission is required');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const response = await fetch(asset.uri);
        const blob = await response.blob();
        const timestamp = Date.now();
        const filename = `photo-${timestamp}.jpg`;
        
        let file: any;
        if (Platform.OS === 'web' && typeof File !== 'undefined') {
          file = new File([blob], filename, { type: 'image/jpeg' });
        } else {
          file = {
            uri: asset.uri,
            name: filename,
            type: 'image/jpeg',
            size: blob.size,
          };
        }
        
        const mediaItem = await uploadToSupabase(file, 'attachments', 'field-photos');
        onChange([...value, mediaItem].slice(0, maxItems));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to capture photo');
    }
  };

  return (
    <View style={fieldStyles.container}>
      {label && (
        <Text style={fieldStyles.label}>
          {label}
          {required && <Text style={fieldStyles.required}> *</Text>}
        </Text>
      )}
      
      {value.length > 0 && (
        <MediaGallery
          items={value}
          columns={4}
          onItemDelete={handleRemove}
          showCaptions={false}
        />
      )}
      
      {value.length < maxItems && (
        <View style={fieldStyles.actions}>
          <MediaUploader
            onUpload={handleUpload}
            multiple={maxItems - value.length > 1}
            maxFiles={maxItems - value.length}
            showPreview={false}
            compact
          />
          
          {allowCamera && (
            <TouchableOpacity 
              style={fieldStyles.cameraButton}
              onPress={handleCamera}
            >
              <Camera size={16} color={colors.primary} />
              <Text style={fieldStyles.cameraText}>Camera</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      
      {error && <Text style={fieldStyles.error}>{error}</Text>}
      
      <Text style={fieldStyles.hint}>
        {value.length}/{maxItems} files attached
      </Text>
    </View>
  );
}

// ============================================
// PhotoCapture Component (renamed from QuickPhotoCapture per tech bible)
// ============================================
interface PhotoCaptureProps {
  onCapture: (photo: MediaItem) => void;
  buttonText?: string;
  size?: 'sm' | 'md' | 'lg';
}


export function PhotoCapture({ 
  onCapture, 
  buttonText = 'Take Photo',
  size = 'md' 
}: PhotoCaptureProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [showWebCamera, setShowWebCamera] = useState(false);

  // Define size styles
  const sizes = {
    sm: { padding: spacing.sm, iconSize: 16, fontSize: typography.sm },
    md: { padding: spacing.md, iconSize: 20, fontSize: typography.base },
    lg: { padding: spacing.lg, iconSize: 24, fontSize: typography.lg },
  };
  const sizeStyle = sizes[size];

  // handleFileSelect function - INSIDE the component
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    try {
      const mediaItem = await uploadToSupabase(file, 'attachments', 'photos');
      onCapture(mediaItem);
    } catch (error) {
      Alert.alert('Error', 'Failed to upload photo');
    } finally {
      setUploading(false);
      // Reset input so same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // handlePhotoSelected function for mobile
  const handlePhotoSelected = async (uri: string) => {
    setUploading(true);
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const timestamp = Date.now();
      const filename = `photo-${timestamp}.jpg`;
      
      let file: any;
      if (Platform.OS === 'web' && typeof File !== 'undefined') {
        file = new File([blob], filename, { type: 'image/jpeg' });
      } else {
        file = {
          uri: uri,
          name: filename,
          type: 'image/jpeg',
          size: blob.size,
        };
      }
      const mediaItem = await uploadToSupabase(file, 'attachments', 'photos');
      onCapture(mediaItem);
    } catch (error) {
      Alert.alert('Error', 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  // handleWebCameraCapture function
  // In PhotoCapture component, replace handleWebCameraCapture with:
const handleWebCameraCapture = async (blob: Blob) => {
  setUploading(true);
  setShowWebCamera(false);
  
  try {
    // Convert blob to a File-like object without using File constructor
    const timestamp = Date.now();
    const filename = `photo-${timestamp}.jpg`;
    
    // Create a new blob with the filename property
    const fileBlob = new Blob([blob], { type: 'image/jpeg' });
    Object.defineProperty(fileBlob, 'name', {
      value: filename,
      writable: false,
      configurable: true
    });
    Object.defineProperty(fileBlob, 'lastModified', {
      value: timestamp,
      writable: false,
      configurable: true
    });
    
    const mediaItem = await uploadToSupabase(fileBlob as any, 'attachments', 'photos');
    onCapture(mediaItem);
  } catch (error) {
    console.error('Upload error:', error);
    Alert.alert('Error', 'Failed to upload photo');
  } finally {
    setUploading(false);
  }
};

  // handleCapture function
  const handleCapture = async () => {
    if (Platform.OS === 'web') {
      // Check if we're on a device with camera support
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          // Request permission first
          await navigator.mediaDevices.getUserMedia({ video: true });
          setShowWebCamera(true);
        } catch (error) {
          // Fallback to file input if camera access denied
          fileInputRef.current?.click();
        }
      } else {
        // Fallback for browsers without getUserMedia
        fileInputRef.current?.click();
      }
    } else {
      // Mobile implementation
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera permission is required');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await handlePhotoSelected(result.assets[0].uri);
      }
    }
  };

  return (
    <>
      {Platform.OS === 'web' && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="user"
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />
          <WebCameraCapture
            isOpen={showWebCamera}
            onClose={() => setShowWebCamera(false)}
            onCapture={handleWebCameraCapture}
            mode="photo"
          />
        </>
      )}
      <TouchableOpacity 
        style={[captureStyles.button, { padding: sizeStyle.padding, opacity: uploading ? 0.6 : 1 }]}
        onPress={handleCapture}
        disabled={uploading}
      >
        <Camera size={sizeStyle.iconSize} color={colors.white} />
        <Text style={[captureStyles.text, { fontSize: sizeStyle.fontSize }]}>
          {uploading ? 'Uploading...' : buttonText}
        </Text>
      </TouchableOpacity>
    </>
  );
}

// Add this component in media-components.tsx after PhotoCapture
interface WebCameraCaptureProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (blob: Blob) => void;
  mode: 'photo' | 'video';
}

function WebCameraCapture({ isOpen, onClose, onCapture, mode }: WebCameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    }
    
    // Cleanup function - this ensures camera stops when modal closes
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' }, 
        audio: mode === 'video' 
      });
      streamRef.current = stream;
      
      // Wait for video element to be ready
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Ensure video plays
        videoRef.current.play().catch(console.error);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      Alert.alert('Error', 'Could not access camera');
      onClose();
    }
  };

  const stopCamera = () => {
    // Stop all tracks to turn off camera
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    
    // Clear video element
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    // Stop recording if active
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const capturePhoto = () => {
  if (!videoRef.current) {
    console.error('Video element not ready');
    return;
  }

  if (videoRef.current.readyState < 2) {
    console.error('Video not ready for capture');
    Alert.alert('Error', 'Camera not ready. Please try again.');
    return;
  }

  const canvas = document.createElement('canvas');
  const video = videoRef.current;
  
  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    console.error('Could not get canvas context');
    return;
  }

  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  
  canvas.toBlob((blob) => {
    if (blob) {
      console.log('Photo captured, size:', blob.size);
      onCapture(blob); // Don't stop camera here - let parent handle it
      // Remove: stopCamera();
    } else {
      console.error('Failed to create blob from canvas');
      Alert.alert('Error', 'Failed to capture photo');
    }
  }, 'image/jpeg', 0.9);
};
  const startVideoRecording = () => {
    if (!streamRef.current) {
      console.error('No stream available for recording');
      return;
    }

    try {
      const options = { mimeType: 'video/webm;codecs=vp8' };
      const mediaRecorder = new MediaRecorder(streamRef.current, options);
      mediaRecorderRef.current = mediaRecorder;
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
  const blob = new Blob(chunks, { type: 'video/webm' });
  console.log('Video recorded, size:', blob.size);
  onCapture(blob); // Don't stop camera here - let parent handle it
  // Remove: stopCamera();
};

      mediaRecorder.onerror = (error) => {
        console.error('MediaRecorder error:', error);
        Alert.alert('Error', 'Failed to record video');
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopVideoRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleClose = () => {
    stopCamera(); // Ensure camera is stopped
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal visible={isOpen} animationType="slide" onRequestClose={handleClose}>
      <View style={webCameraStyles.container}>
        <View style={webCameraStyles.header}>
          <TouchableOpacity onPress={handleClose} style={webCameraStyles.closeButton}>
            <X size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={webCameraStyles.title}>
            {mode === 'photo' ? 'Take Photo' : 'Record Video'}
          </Text>
        </View>

        <View style={webCameraStyles.cameraContainer}>
          {Platform.OS === 'web' ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted={mode === 'photo'}
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'cover',
                backgroundColor: '#000'
              }}
              onLoadedMetadata={() => console.log('Video metadata loaded')}
            />
          ) : (
            <View style={{ flex: 1, backgroundColor: '#000' }} />
          )}
        </View>

        <View style={webCameraStyles.controls}>
          {mode === 'photo' ? (
            <TouchableOpacity 
              style={webCameraStyles.captureButton}
              onPress={capturePhoto}
            >
              <View style={webCameraStyles.captureButtonInner} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[
                webCameraStyles.captureButton,
                isRecording && webCameraStyles.recordingButton
              ]}
              onPress={isRecording ? stopVideoRecording : startVideoRecording}
            >
              <View style={[
                webCameraStyles.captureButtonInner,
                isRecording && webCameraStyles.recordingButtonInner
              ]} />
            </TouchableOpacity>
          )}
          {isRecording && (
            <Text style={webCameraStyles.recordingText}>Recording...</Text>
          )}
        </View>
      </View>
    </Modal>
  );
}

const webCameraStyles = {
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    padding: spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.5)',
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  recordingText: {
    color: colors.white,
    fontSize: typography.sm,
    marginTop: spacing.sm,
    textAlign: 'center' as const,
  },
  closeButton: {
    padding: spacing.sm,
  },
  title: {
    color: colors.white,
    fontSize: typography.lg,
    fontWeight: typography.semibold as any,
  },
  cameraContainer: {
    flex: 1,
  },
  controls: {
    position: 'absolute' as const,
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center' as const,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.3)',
    padding: 4,
  },
  captureButtonInner: {
    flex: 1,
    borderRadius: 50,
    backgroundColor: colors.white,
  },
  recordingButton: {
    backgroundColor: 'rgba(255,0,0,0.3)',
  },
  recordingButtonInner: {
    backgroundColor: colors.error,
    borderRadius: 8,
  },
};


// ============================================
// VideoCapture Component
// ============================================
interface VideoCaptureProps {
  onCapture: (video: MediaItem) => void;
  buttonText?: string;
  size?: 'sm' | 'md' | 'lg';
  maxDuration?: number; // in seconds
}

export function VideoCapture({ 
  onCapture, 
  buttonText = 'Record Video',
  size = 'md',
  maxDuration = 60 
}: VideoCaptureProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [showWebCamera, setShowWebCamera] = useState(false);

  // Define size styles
  const sizes = {
    sm: { padding: spacing.sm, iconSize: 16, fontSize: typography.sm },
    md: { padding: spacing.md, iconSize: 20, fontSize: typography.base },
    lg: { padding: spacing.lg, iconSize: 24, fontSize: typography.lg },
  };
  const sizeStyle = sizes[size];

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Check file size (max 50MB for videos)
    if (file.size > 50 * 1024 * 1024) {
      Alert.alert('File too large', 'Please select a video under 50MB');
      return;
    }
    
    setUploading(true);
    try {
      const mediaItem = await uploadToSupabase(file, 'attachments', 'videos');
      onCapture(mediaItem);
    } catch (error) {
      Alert.alert('Error', 'Failed to upload video');
    } finally {
      setUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleVideoSelected = async (uri: string) => {
    setUploading(true);
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const timestamp = Date.now();
      const filename = `video-${timestamp}.mp4`;
      
      let file: any;
      if (Platform.OS === 'web' && typeof File !== 'undefined') {
        file = new File([blob], filename, { type: 'video/mp4' });
      } else {
        file = {
          uri: uri,
          name: filename,
          type: 'video/mp4',
          size: blob.size,
        };
      }
      
      const mediaItem = await uploadToSupabase(file, 'attachments', 'videos');
      onCapture(mediaItem);
    } catch (error) {
      Alert.alert('Error', 'Failed to upload video');
    } finally {
      setUploading(false);
    }
  };

  // In VideoCapture component, replace handleWebCameraCapture with:
const handleWebCameraCapture = async (blob: Blob) => {
  setUploading(true);
  setShowWebCamera(false);
  
  try {
    // Convert blob to a File-like object without using File constructor
    const timestamp = Date.now();
    const filename = `video-${timestamp}.webm`;
    
    // Create a new blob with the filename property
    const fileBlob = new Blob([blob], { type: 'video/webm' });
    Object.defineProperty(fileBlob, 'name', {
      value: filename,
      writable: false,
      configurable: true
    });
    Object.defineProperty(fileBlob, 'lastModified', {
      value: timestamp,
      writable: false,
      configurable: true
    });
    
    const mediaItem = await uploadToSupabase(fileBlob as any, 'attachments', 'videos');
    onCapture(mediaItem);
  } catch (error) {
    console.error('Upload error:', error);
    Alert.alert('Error', 'Failed to upload video');
  } finally {
    setUploading(false);
  }
};

  const handleCapture = async () => {
    if (Platform.OS === 'web') {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          setShowWebCamera(true);
        } catch (error) {
          fileInputRef.current?.click();
        }
      } else {
        fileInputRef.current?.click();
      }
    } else {
      // Mobile: Use ImagePicker
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera permission is required for video recording');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 0.7,
        videoMaxDuration: maxDuration,
      });

      if (!result.canceled && result.assets[0]) {
        await handleVideoSelected(result.assets[0].uri);
      }
    }
  };

  return (
    <>
      {Platform.OS === 'web' && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            capture="user"
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />
          <WebCameraCapture
            isOpen={showWebCamera}
            onClose={() => setShowWebCamera(false)}
            onCapture={handleWebCameraCapture}
            mode="video"
          />
        </>
      )}
      <TouchableOpacity 
        style={[captureStyles.button, { padding: sizeStyle.padding, opacity: uploading ? 0.6 : 1 }]}
        onPress={handleCapture}
        disabled={uploading}
      >
        <VideoIcon size={sizeStyle.iconSize} color={colors.white} />
        <Text style={[captureStyles.text, { fontSize: sizeStyle.fontSize }]}>
          {uploading ? 'Uploading...' : buttonText}
        </Text>
      </TouchableOpacity>
    </>
  );
}


const captureStyles = {
  button: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    gap: spacing.sm,
    ...shadows.sm,
  },
  text: {
    color: colors.white,
    fontWeight: typography.medium as any,
  },
};

const fieldStyles = {
  container: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.sm,
    fontWeight: typography.medium as any,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  required: {
    color: colors.error,
  },
  actions: {
    flexDirection: 'row' as const,
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  cameraButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  cameraText: {
    fontSize: typography.sm,
    color: colors.primary,
  },
  error: {
    fontSize: typography.xs,
    color: colors.error,
    marginTop: spacing.xs,
  },
  hint: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
};