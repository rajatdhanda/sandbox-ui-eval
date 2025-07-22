// app/components/shared/attachment-field.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, TextInput } from 'react-native';
import { 
  Paperclip, 
  File, 
  Image, 
  Video, 
  Link as LinkIcon, 
  X, 
  
  FileText,
} from 'lucide-react-native';
import { colors } from '@/lib/styles';

interface Attachment {
  id: string;
  type: 'pdf' | 'video' | 'photo' | 'link' | 'document';
  name: string;
  url: string;
  size?: number;
  metadata?: any;
}

interface AttachmentFieldProps {
  label: string;
  attachments: Attachment[];
  onUpdate: (attachments: Attachment[]) => void;
  placeholder?: string;
  maxAttachments?: number;
  allowedTypes?: ('pdf' | 'video' | 'photo' | 'link' | 'document')[];
  disabled?: boolean;
}

export const AttachmentField: React.FC<AttachmentFieldProps> = ({
  label,
  attachments = [],
  onUpdate,
  placeholder = "Add attachments",
  maxAttachments = 10,
  allowedTypes = ['pdf', 'video', 'photo', 'link', 'document'],
  disabled = false
}) => {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkName, setLinkName] = useState('');

  console.log('📎 [ATTACHMENT_FIELD] Rendering with attachments:', attachments.length);

  const getAttachmentIcon = (type: string, size = 20) => {
    switch (type) {
      case 'pdf':
        return <FileText size={size} color={colors.error} />;
      case 'video':
        return <Video size={size} color={colors.warning} />;
      case 'photo':
        return <Image size={size} color={colors.success} />;
      case 'link':
        return <LinkIcon size={size} color={colors.info} />;
      case 'document':
        return <File size={size} color={colors.gray600} />;
      default:
        return <File size={size} color={colors.gray600} />;
    }
  };

  const getAttachmentTypeColor = (type: string) => {
    switch (type) {
      case 'pdf': return colors.error;
      case 'video': return colors.warning;
      case 'photo': return colors.success;
      case 'link': return colors.info;
      case 'document': return colors.gray600;
      default: return colors.gray600;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const generateId = () => {
    return `attachment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const handleFileSelection = (type: 'pdf' | 'video' | 'photo' | 'document') => {
    if (disabled) return;
    
    // In a real app, this would open a file picker
    // For now, we'll simulate file selection
    Alert.alert(
      'File Selection',
      `This would open a ${type} file picker. For demo purposes, we'll add a sample ${type}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Add Sample', 
          onPress: () => {
            const newAttachment: Attachment = {
              id: generateId(),
              type,
              name: `Sample ${type} file.${type === 'document' ? 'docx' : type}`,
              url: `https://example.com/sample.${type}`,
              size: Math.floor(Math.random() * 5000000) + 100000, // Random size
              metadata: { uploadedAt: new Date().toISOString() }
            };
            
            const updatedAttachments = [...attachments, newAttachment];
            onUpdate(updatedAttachments);
            console.log('📎 [ATTACHMENT_FIELD] Added attachment:', newAttachment);
          }
        }
      ]
    );
  };

  const handleAddLink = () => {
    if (!linkUrl.trim()) {
      Alert.alert('Error', 'Please enter a valid URL');
      return;
    }

    try {
      new URL(linkUrl); // Validate URL
      
      const newAttachment: Attachment = {
        id: generateId(),
        type: 'link',
        name: linkName.trim() || 'Link',
        url: linkUrl.trim(),
        metadata: { addedAt: new Date().toISOString() }
      };
      
      const updatedAttachments = [...attachments, newAttachment];
      onUpdate(updatedAttachments);
      
      setLinkUrl('');
      setLinkName('');
      setShowLinkInput(false);
      
      console.log('🔗 [ATTACHMENT_FIELD] Added link:', newAttachment);
    } catch (error) {
      Alert.alert('Error', 'Please enter a valid URL (e.g., https://example.com)');
    }
  };

  const handleRemoveAttachment = (id: string) => {
    if (disabled) return;
    
    Alert.alert(
      'Remove Attachment',
      'Are you sure you want to remove this attachment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const updatedAttachments = attachments.filter(att => att.id !== id);
            onUpdate(updatedAttachments);
            console.log('🗑️ [ATTACHMENT_FIELD] Removed attachment:', id);
          }
        }
      ]
    );
  };

  const handleAttachmentPress = (attachment: Attachment) => {
    // In a real app, this would open/download the file
    Alert.alert(
      attachment.name,
      `Type: ${attachment.type}\nURL: ${attachment.url}${attachment.size ? `\nSize: ${formatFileSize(attachment.size)}` : ''}`,
      [
        { text: 'Close', style: 'cancel' },
        { text: 'Open', onPress: () => console.log('🔗 Opening:', attachment.url) }
      ]
    );
  };

  const canAddMore = attachments.length < maxAttachments;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      
      {/* Attachment Buttons */}
      {canAddMore && !disabled && (
        <View style={styles.buttonContainer}>
          {allowedTypes.includes('photo') && (
            <TouchableOpacity 
              style={[styles.attachButton, styles.photoButton]} 
              onPress={() => handleFileSelection('photo')}
            >
              <Image size={16} color={colors.white} />
              <Text style={styles.attachButtonText}>Photo</Text>
            </TouchableOpacity>
          )}
          
          {allowedTypes.includes('video') && (
            <TouchableOpacity 
              style={[styles.attachButton, styles.videoButton]} 
              onPress={() => handleFileSelection('video')}
            >
              <Video size={16} color={colors.white} />
              <Text style={styles.attachButtonText}>Video</Text>
            </TouchableOpacity>
          )}
          
          {allowedTypes.includes('pdf') && (
            <TouchableOpacity 
              style={[styles.attachButton, styles.pdfButton]} 
              onPress={() => handleFileSelection('pdf')}
            >
              <FileText size={16} color={colors.white} />
              <Text style={styles.attachButtonText}>PDF</Text>
            </TouchableOpacity>
          )}
          
          {allowedTypes.includes('document') && (
            <TouchableOpacity 
              style={[styles.attachButton, styles.docButton]} 
              onPress={() => handleFileSelection('document')}
            >
              <File size={16} color={colors.white} />
              <Text style={styles.attachButtonText}>Doc</Text>
            </TouchableOpacity>
          )}
          
          {allowedTypes.includes('link') && (
            <TouchableOpacity 
              style={[styles.attachButton, styles.linkButton]} 
              onPress={() => setShowLinkInput(true)}
            >
              <LinkIcon size={16} color={colors.white} />
              <Text style={styles.attachButtonText}>Link</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Link Input */}
      {showLinkInput && (
        <View style={styles.linkInputContainer}>
          <View style={styles.linkInputRow}>
            <TextInput
              style={[styles.linkInput, { flex: 2 }]}
              placeholder="Enter URL"
              value={linkUrl}
              onChangeText={setLinkUrl}
              autoCapitalize="none"
              keyboardType="url"
            />
            <TextInput
              style={[styles.linkInput, { flex: 1, marginLeft: 8 }]}
              placeholder="Link name"
              value={linkName}
              onChangeText={setLinkName}
            />
          </View>
          <View style={styles.linkButtonRow}>
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={() => {
                setShowLinkInput(false);
                setLinkUrl('');
                setLinkName('');
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addButton} onPress={handleAddLink}>
              <Text style={styles.addButtonText}>Add Link</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Attachments List */}
      {attachments.length > 0 && (
        <ScrollView style={styles.attachmentsList} nestedScrollEnabled={true}>
          {attachments.map((attachment) => (
            <TouchableOpacity
              key={attachment.id}
              style={styles.attachmentItem}
              onPress={() => handleAttachmentPress(attachment)}
            >
              <View style={styles.attachmentIcon}>
                {getAttachmentIcon(attachment.type, 24)}
              </View>
              
              <View style={styles.attachmentInfo}>
                <Text style={styles.attachmentName} numberOfLines={1}>
                  {attachment.name}
                </Text>
                <View style={styles.attachmentMeta}>
                  <Text style={[
                    styles.attachmentType,
                    { color: getAttachmentTypeColor(attachment.type) }
                  ]}>
                    {attachment.type.toUpperCase()}
                  </Text>
                  {attachment.size && (
                    <Text style={styles.attachmentSize}>
                      • {formatFileSize(attachment.size)}
                    </Text>
                  )}
                </View>
              </View>
              
              {!disabled && (
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveAttachment(attachment.id)}
                >
                  <X size={18} color={colors.gray500} />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Placeholder */}
      {attachments.length === 0 && (
        <View style={styles.placeholder}>
          <Paperclip size={24} color={colors.gray400} />
          <Text style={styles.placeholderText}>{placeholder}</Text>
        </View>
      )}

      {/* Attachment Count */}
      {attachments.length > 0 && (
        <Text style={styles.countText}>
          {attachments.length} attachment{attachments.length !== 1 ? 's' : ''}
          {maxAttachments && ` (max ${maxAttachments})`}
        </Text>
      )}
    </View>
  );
};

const styles = {
  container: {
    marginBottom: 16
  },
  label: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.gray700,
    marginBottom: 8
  },
  buttonContainer: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
    marginBottom: 12
  },
  attachButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6
  },
  photoButton: {
    backgroundColor: colors.success
  },
  videoButton: {
    backgroundColor: colors.warning
  },
  pdfButton: {
    backgroundColor: colors.error
  },
  docButton: {
    backgroundColor: colors.gray600
  },
  linkButton: {
    backgroundColor: colors.info
  },
  attachButtonText: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: colors.white
  },
  linkInputContainer: {
    backgroundColor: colors.gray50,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.gray200
  },
  linkInputRow: {
    flexDirection: 'row' as const,
    marginBottom: 8
  },
  linkInput: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
    backgroundColor: colors.white
  },
  linkButtonRow: {
    flexDirection: 'row' as const,
    justifyContent: 'flex-end' as const,
    gap: 8
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.gray300
  },
  cancelButtonText: {
    fontSize: 14,
    color: colors.gray600
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: colors.primary
  },
  addButtonText: {
    fontSize: 14,
    color: colors.white,
    fontWeight: '500' as const
  },
  attachmentsList: {
    maxHeight: 200,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 8,
    backgroundColor: colors.white
  },
  attachmentItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100
  },
  attachmentIcon: {
    width: 40,
    height: 40,
    backgroundColor: colors.gray50,
    borderRadius: 8,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 12
  },
  attachmentInfo: {
    flex: 1
  },
  attachmentName: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.gray900,
    marginBottom: 2
  },
  attachmentMeta: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const
  },
  attachmentType: {
    fontSize: 10,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const
  },
  attachmentSize: {
    fontSize: 12,
    color: colors.gray500,
    marginLeft: 4
  },
  removeButton: {
    padding: 8,
    borderRadius: 4
  },
  placeholder: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: 32,
    borderWidth: 2,
    borderColor: colors.gray200,
    borderStyle: 'dashed' as const,
    borderRadius: 8,
    backgroundColor: colors.gray50
  },
  placeholderText: {
    fontSize: 14,
    color: colors.gray500,
    marginTop: 8,
    fontStyle: 'italic' as const
  },
  countText: {
    fontSize: 12,
    color: colors.gray500,
    marginTop: 8,
    textAlign: 'center' as const
  }
};