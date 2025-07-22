// components/shared/file-attachments.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Upload, FileText, Image, Video, Link, X, Plus } from 'lucide-react-native';
import { colors } from '@/lib/styles';

interface FileAttachmentsProps {
  attachments: string[];
  onUpdate: (attachments: string[]) => void;
  label?: string;
}

export const FileAttachments = ({ 
  attachments = [], 
  onUpdate, 
  label = "Attachments" 
}: FileAttachmentsProps) => {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  const addLink = () => {
    if (linkUrl.trim()) {
      onUpdate([...attachments, linkUrl.trim()]);
      setLinkUrl('');
      setShowLinkInput(false);
    }
  };

  const removeAttachment = (index: number) => {
    onUpdate(attachments.filter((_, i) => i !== index));
  };

  const handleFileUpload = (type: 'photo' | 'video' | 'pdf') => {
    Alert.alert(
      'Upload File',
      `Select ${type} file to upload`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Choose File', 
          onPress: () => {
            // TODO: Implement file picker
            Alert.alert('Coming Soon', 'File upload will be implemented with Supabase Storage');
          }
        }
      ]
    );
  };

  const getFileIcon = (url: string) => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      return <Video size={16} color={colors.red600} />;
    }
    if (url.includes('.pdf')) {
      return <FileText size={16} color={colors.red600} />;
    }
    if (url.includes('.jpg') || url.includes('.png') || url.includes('.jpeg')) {
      return <Image size={16} color={colors.green600} />;
    }
    return <Link size={16} color={colors.blue600} />;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      
      {/* Upload buttons */}
      <ScrollView horizontal style={styles.buttonRow} showsHorizontalScrollIndicator={false}>
        <TouchableOpacity style={styles.uploadButton} onPress={() => handleFileUpload('photo')}>
          <Image size={16} color={colors.primary} />
          <Text style={styles.uploadButtonText}>Photo</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.uploadButton} onPress={() => handleFileUpload('video')}>
          <Video size={16} color={colors.primary} />
          <Text style={styles.uploadButtonText}>Video</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.uploadButton} onPress={() => handleFileUpload('pdf')}>
          <FileText size={16} color={colors.primary} />
          <Text style={styles.uploadButtonText}>PDF</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.uploadButton} onPress={() => setShowLinkInput(true)}>
          <Link size={16} color={colors.primary} />
          <Text style={styles.uploadButtonText}>Link</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Link input */}
      {showLinkInput && (
        <View style={styles.linkInput}>
          <TextInput
            style={styles.input}
            value={linkUrl}
            onChangeText={setLinkUrl}
            placeholder="Enter YouTube URL or web link..."
            autoFocus
          />
          <TouchableOpacity style={styles.addButton} onPress={addLink}>
            <Plus size={16} color={colors.white} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={() => {
            setShowLinkInput(false);
            setLinkUrl('');
          }}>
            <X size={16} color={colors.gray600} />
          </TouchableOpacity>
        </View>
      )}

      {/* Attachments list */}
      {attachments.length > 0 && (
        <View style={styles.attachmentsList}>
          {attachments.map((attachment, index) => (
            <View key={index} style={styles.attachmentItem}>
              <View style={styles.attachmentInfo}>
                {getFileIcon(attachment)}
                <Text style={styles.attachmentText} numberOfLines={1}>
                  {attachment.length > 30 ? `${attachment.substring(0, 30)}...` : attachment}
                </Text>
              </View>
              <TouchableOpacity onPress={() => removeAttachment(index)}>
                <X size={16} color={colors.red600} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = {
  container: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600' as const, color: colors.gray700, marginBottom: 8 },
  buttonRow: { marginBottom: 8 },
  uploadButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: colors.purple50,
    gap: 6
  },
  uploadButtonText: { fontSize: 12, color: colors.primary, fontWeight: '500' as const },
  linkInput: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 8
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 8,
    padding: 12,
    fontSize: 14
  },
  addButton: {
    backgroundColor: colors.primary,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center' as const,
    justifyContent: 'center' as const
  },
  cancelButton: {
    padding: 10,
    alignItems: 'center' as const,
    justifyContent: 'center' as const
  },
  attachmentsList: { marginTop: 8 },
  attachmentItem: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.gray50,
    padding: 8,
    borderRadius: 6,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: colors.gray200
  },
  attachmentInfo: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flex: 1,
    gap: 8
  },
  attachmentText: {
    fontSize: 12,
    color: colors.gray700,
    flex: 1
  }
};