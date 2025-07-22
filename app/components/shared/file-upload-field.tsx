// app/components/shared/file-upload-field.tsx
// Path: app/components/shared/file-upload-field.tsx

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Upload, X, FileText, Video, ImageIcon, Trash2 } from 'lucide-react-native';
import { colors, commonStyles } from '@/lib/styles';
import { supabase } from '@/lib/supabase/client';

interface FileUploadFieldProps {
  label: string;
  value: any[];
  onChange: (files: any[]) => void;
  acceptedTypes?: string[];
  maxFiles?: number;
  bucket?: string;
  path?: string;
}

export const FileUploadField: React.FC<FileUploadFieldProps> = ({
  label,
  value = [],
  onChange,
  acceptedTypes = ['image/*', 'application/pdf', 'video/*'],
  maxFiles = 10,
  bucket = 'class-attachments',
  path = 'classes'
}) => {
  const [uploading, setUploading] = useState(false);

  const handleFilePick = async () => {
    if (value.length >= maxFiles) {
      Alert.alert('Limit Reached', `You can only upload up to ${maxFiles} files`);
      return;
    }

    try {
      // In a real app, you'd use a file picker here
      // For now, we'll just show the UI structure
      Alert.alert(
        'Select File',
        'In production, this would open a file picker',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Select Image', onPress: () => handleFileUpload('image') },
          { text: 'Select PDF', onPress: () => handleFileUpload('pdf') },
          { text: 'Select Video', onPress: () => handleFileUpload('video') }
        ]
      );
    } catch (error) {
      console.error('File pick error:', error);
      Alert.alert('Error', 'Failed to pick file');
    }
  };

  const handleFileUpload = async (type: string) => {
    setUploading(true);
    
    try {
      // Simulate file upload
      // In production, you'd actually upload to Supabase Storage
      const mockFile = {
        url: `https://example.com/${type}-${Date.now()}.${type === 'pdf' ? 'pdf' : type === 'video' ? 'mp4' : 'jpg'}`,
        name: `${type}-${Date.now()}.${type === 'pdf' ? 'pdf' : type === 'video' ? 'mp4' : 'jpg'}`,
        type: type,
        size: Math.floor(Math.random() * 1000000),
        uploaded_at: new Date().toISOString()
      };

      onChange([...value, mockFile]);
      
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (index: number) => {
    Alert.alert(
      'Remove File',
      'Are you sure you want to remove this file?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => {
            const newFiles = [...value];
            newFiles.splice(index, 1);
            onChange(newFiles);
          }
        }
      ]
    );
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FileText size={24} color={colors.error} />;
      case 'video':
        return <Video size={24} color={colors.primary} />;
      default:
        return <ImageIcon size={24} color={colors.success} />;
    }
  };

  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={[commonStyles.label, { marginBottom: 8 }]}>{label}</Text>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          {value.map((file, index) => (
            <View
              key={index}
              style={{
                width: 100,
                height: 100,
                borderRadius: 8,
                backgroundColor: colors.gray[100],
                borderWidth: 1,
                borderColor: colors.gray[300],
                position: 'relative',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              {file.type === 'image' ? (
                <Image 
                  source={{ uri: file.url }} 
                  style={{ width: '100%', height: '100%', borderRadius: 8 }}
                  resizeMode="cover"
                />
              ) : (
                getFileIcon(file.type)
              )}
              
              <TouchableOpacity
                onPress={() => removeFile(index)}
                style={{
                  position: 'absolute',
                  top: -8,
                  right: -8,
                  backgroundColor: colors.error,
                  borderRadius: 12,
                  width: 24,
                  height: 24,
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                <X size={16} color="white" />
              </TouchableOpacity>
              
              <Text style={{ 
                position: 'absolute', 
                bottom: 4, 
                fontSize: 10, 
                color: colors.textSecondary,
                backgroundColor: 'rgba(255,255,255,0.8)',
                paddingHorizontal: 4,
                borderRadius: 4
              }}>
                {file.name.split('/').pop()?.substring(0, 10)}...
              </Text>
            </View>
          ))}
          
          {value.length < maxFiles && (
            <TouchableOpacity
              onPress={handleFilePick}
              disabled={uploading}
              style={{
                width: 100,
                height: 100,
                borderRadius: 8,
                backgroundColor: colors.gray[50],
                borderWidth: 2,
                borderColor: colors.gray[300],
                borderStyle: 'dashed',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              {uploading ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <>
                  <Upload size={24} color={colors.gray[400]} />
                  <Text style={{ 
                    fontSize: 12, 
                    color: colors.gray[400], 
                    marginTop: 4 
                  }}>
                    Add File
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
      
      <Text style={{ 
        fontSize: 12, 
        color: colors.textSecondary, 
        marginTop: 4 
      }}>
        {value.length}/{maxFiles} files uploaded
      </Text>
    </View>
  );
};