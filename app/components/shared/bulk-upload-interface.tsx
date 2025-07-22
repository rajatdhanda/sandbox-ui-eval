// app/components/shared/bulk-upload-interface.tsx
// Path: app/components/shared/bulk-upload-interface.tsx
// Enhanced CSV upload and batch operations with real parsing and validation

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import {
  Upload,
  Download,
  FileText,
  CheckCircle2, Circle,
  XCircle,
  AlertCircle,
  Users,
  BookOpen,
  Edit2,
  Trash2,
  X,
  Info,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  AlertTriangle,
  Plus,
  TrendingUp
} from 'lucide-react-native';
import { colors, spacing, typography, borderRadius } from '@/lib/styles';
import { ProgressBar } from './progress-components';
import { SmartSelector } from './selection-components';


interface BulkUploadInterfaceProps {
  uploadType: 'students' | 'activities' | 'curriculum' | 'attendance' | 'photos' | 'progress';
  onUpload: (data: ParsedData) => Promise<UploadResult>;
  onTemplateDownload?: () => void;
  onValidate?: (row: any, index: number) => ValidationError[];
  transformData?: (data: any[]) => any[];
  templateUrl?: string;
  maxFileSize?: number; // in MB
  acceptedFormats?: string[];
  showPreview?: boolean;
  allowEdit?: boolean;
  autoMap?: boolean;
  validateDuplicates?: boolean;
  existingData?: any[]; // For duplicate checking
}

interface ParsedData {
  headers: string[];
  rows: Record<string, any>[];
  totalRows: number;
  validRows: number;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  duplicates: DuplicateInfo[];
}

interface ValidationError {
  row: number;
  column: string;
  message: string;
  severity: 'error' | 'warning';
  value?: any;
}

interface ValidationWarning {
  row: number;
  message: string;
  type: 'duplicate' | 'format' | 'optional';
}

interface DuplicateInfo {
  row: number;
  matchField: string;
  existingId: string;
}

interface UploadResult {
  success: boolean;
  processedCount: number;
  errorCount: number;
  skippedCount: number;
  errors?: ValidationError[];
  warnings?: string[];
  results?: any[];
}

interface ColumnMapping {
  sourceColumn: string;
  targetField: string;
  required: boolean;
  transform?: (value: any) => any;
  validate?: (value: any) => boolean;
}

// Enhanced upload configurations with validation rules
const UPLOAD_CONFIGS = {
  students: {
    icon: Users,
    title: 'Student Enrollment',
    description: 'Upload multiple students at once',
    requiredFields: ['first_name', 'last_name', 'date_of_birth', 'class_id'],
    optionalFields: ['parent_email', 'parent_phone', 'medical_notes', 'allergies', 'emergency_contact'],
    duplicateCheckFields: ['first_name', 'last_name', 'date_of_birth'],
    validations: {
      date_of_birth: (value: string) => {
        const date = new Date(value);
        const now = new Date();
        const age = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24 * 365);
        return age >= 2 && age <= 6;
      },
      parent_email: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      parent_phone: (value: string) => /^\+?\d{10,}$/.test(value.replace(/\D/g, ''))
    },
    transforms: {
      date_of_birth: (value: string) => new Date(value).toISOString().split('T')[0],
      parent_phone: (value: string) => value.replace(/\D/g, '')
    },
    sampleData: [
      { 
        first_name: 'John', 
        last_name: 'Doe', 
        date_of_birth: '2020-01-15', 
        class_id: 'class-1',
        parent_email: 'john.parent@email.com',
        parent_phone: '+1234567890'
      }
    ]
  },
  activities: {
    icon: BookOpen,
    title: 'Curriculum Activities',
    description: 'Import curriculum activities and schedules',
    requiredFields: ['title', 'activity_type', 'duration_minutes', 'week_number', 'day_number'],
    optionalFields: ['description', 'materials', 'objectives', 'kmap_move', 'kmap_think', 'kmap_endure'],
    duplicateCheckFields: ['title', 'week_number', 'day_number'],
    validations: {
      duration_minutes: (value: number) => value > 0 && value <= 180,
      week_number: (value: number) => value >= 1 && value <= 52,
      day_number: (value: number) => value >= 1 && value <= 7,
      activity_type: (value: string) => ['circle_time', 'outdoor_play', 'story_time', 'art_craft', 'music_movement'].includes(value)
    },
    transforms: {
      duration_minutes: (value: any) => parseInt(value),
      week_number: (value: any) => parseInt(value),
      day_number: (value: any) => parseInt(value),
      kmap_move: (value: any) => parseFloat(value) || 0,
      kmap_think: (value: any) => parseFloat(value) || 0,
      kmap_endure: (value: any) => parseFloat(value) || 0
    }
  },
  progress: {
    icon: TrendingUp,
    title: 'Progress Updates',
    description: 'Bulk update student progress',
    requiredFields: ['child_id', 'activity_id', 'date', 'status'],
    optionalFields: ['quality_score', 'engagement_level', 'teacher_notes', 'kmap_move', 'kmap_think', 'kmap_endure'],
    duplicateCheckFields: ['child_id', 'activity_id', 'date'],
    validations: {
      status: (value: string) => ['completed', 'partial', 'skipped', 'absent'].includes(value),
      quality_score: (value: number) => value >= 1 && value <= 5,
      engagement_level: (value: string) => ['low', 'medium', 'high'].includes(value)
    }
  }
};

// CSV parsing utility (in real app, use Papa Parse)
const parseCSVContent = (content: string): { headers: string[], rows: any[] } => {
  const lines = content.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
  
  const rows = lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim());
    const row: any = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    return row;
  });
  
  return { headers, rows };
};

export function BulkUploadInterface({
  uploadType,
  onUpload,
  onTemplateDownload,
  onValidate,
  transformData,
  // templateUrl,
  maxFileSize = 10,
  acceptedFormats = ['.csv', '.xlsx'],
  showPreview = true,
  allowEdit = true,
  autoMap = true,
  validateDuplicates = true,
  existingData = []
}: BulkUploadInterfaceProps) {
  const [file, setFile] = useState<any>(null);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [showMapping, setShowMapping] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [editedData, setEditedData] = useState<Record<string, any>[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [showValidationSummary, setShowValidationSummary] = useState(false);
  const [editingMapping, setEditingMapping] = useState<string | null>(null);
  
  const config = UPLOAD_CONFIGS[uploadType as keyof typeof UPLOAD_CONFIGS] || UPLOAD_CONFIGS.students;
  
  // Load entity options for dropdowns

  // Parse and validate file
  const parseFile = useCallback(async (__selectedFile: any, content?: string) => {
    setIsProcessing(true);
    
    try {
      // Simulate file reading (in real app, use FileReader or react-native-fs)
      const mockContent = content || generateMockCSV();
      const { headers, rows } = parseCSVContent(mockContent);
      
      const errors: ValidationError[] = [];
      const warnings: ValidationWarning[] = [];
      const duplicates: DuplicateInfo[] = [];
      
      // Validate each row
      rows.forEach((row, index) => {
        // Check required fields
        config.requiredFields.forEach(field => {
          if (!row[field] || row[field].toString().trim() === '') {
            errors.push({
              row: index + 1,
              column: field,
              message: `${field.replace(/_/g, ' ')} is required`,
              severity: 'error'
            });
          }
        });
        
        // Apply validations
        if (config.validations) {
          Object.entries(config.validations as Record<string, (value: any) => boolean>).forEach(([field, validator]) => {
            if (row[field] && !validator(row[field])) {
              errors.push({
                row: index + 1,
                column: field,
                message: `Invalid ${field.replace(/_/g, ' ')}`,
                severity: 'error',
                value: row[field]
              });
            }
          });
        }        
        // Check for duplicates
        if (validateDuplicates && config.duplicateCheckFields) {
          const isDuplicate = existingData.some(existing => 
            config.duplicateCheckFields.every(field => 
              existing[field]?.toString().toLowerCase() === row[field]?.toString().toLowerCase()
            )
          );
          
          if (isDuplicate) {
            warnings.push({
              row: index + 1,
              message: 'Possible duplicate record',
              type: 'duplicate'
            });
          }
        }
        
        // Custom validation
        if (onValidate) {
          const customErrors = onValidate(row, index);
          errors.push(...customErrors);
        }
      });
      
      const validRows = rows.length - errors.filter(e => e.severity === 'error').length;
      
      setParsedData({
        headers,
        rows,
        totalRows: rows.length,
        validRows,
        errors,
        warnings,
        duplicates
      });
      
      setEditedData([...rows]);
      
      // Auto-map columns
      if (autoMap) {
        autoMapColumns(headers);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to parse file');
      console.error('Parse error:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [config, existingData, validateDuplicates, onValidate, autoMap]);

  // Generate mock CSV for testing
  const generateMockCSV = () => {
    const headers = [...config.requiredFields, ...config.optionalFields].join(',');
    const rows = (config as any).sampleData?.map((row: any) =>
      [...config.requiredFields, ...config.optionalFields].map(field => row[field] || '').join(',')
    );
    return [headers, ...rows].join('\n');
  };

  // Auto-map columns intelligently
  const autoMapColumns = (headers: string[]) => {
    const mappings: ColumnMapping[] = [];
    const allFields = [...config.requiredFields, ...config.optionalFields];
    
    allFields.forEach(field => {
      // Try exact match first
      let matchingHeader = headers.find(h => h === field);
      
      // Try normalized match
      if (!matchingHeader) {
        matchingHeader = headers.find(h => 
          h.toLowerCase().replace(/[_\s-]/g, '') === 
          field.toLowerCase().replace(/[_\s-]/g, '')
        );
      }
      
      // Try partial match
      if (!matchingHeader) {
        matchingHeader = headers.find(h => 
          h.toLowerCase().includes(field.toLowerCase().replace(/_/g, '')) ||
          field.toLowerCase().includes(h.toLowerCase().replace(/[_\s-]/g, ''))
        );
      }
      
      if (matchingHeader) {
        mappings.push({
          sourceColumn: matchingHeader,
          targetField: field,
          required: config.requiredFields.includes(field),
          transform: (config as any).transforms?.[field],
          validate: (config as any).validations?.[field]
        });
      }
    });
    
    setColumnMappings(mappings);
  };

  // Handle file selection
  const handleFileSelect = async () => {
    // In real app, use DocumentPicker
    const mockFile = { 
      name: `${uploadType}_data.csv`, 
      size: 1024 * 500,
      type: 'text/csv'
    };
    setFile(mockFile);
    await parseFile(mockFile);
  };

  // Handle cell edit with validation
  const handleCellEdit = (rowIndex: number, column: string, value: string) => {
    const newData = [...editedData];
    newData[rowIndex] = { ...newData[rowIndex], [column]: value };
    setEditedData(newData);
    
    // Re-validate row
    if (parsedData) {
      const errors = validateRow(newData[rowIndex], rowIndex);
      const newErrors = parsedData.errors.filter(e => e.row !== rowIndex + 1);
      newErrors.push(...errors);
      
      setParsedData({
        ...parsedData,
        errors: newErrors,
        validRows: parsedData.totalRows - newErrors.filter(e => e.severity === 'error').length
      });
    }
  };

  // Validate single row
  const validateRow = (row: Record<string, any>, rowIndex: number): ValidationError[] => {
    const errors: ValidationError[] = [];
    
    // Check mapped fields only
    columnMappings.forEach(mapping => {
      const value = row[mapping.sourceColumn];
      
      // Check required
      if (mapping.required && (!value || value.toString().trim() === '')) {
        errors.push({
          row: rowIndex + 1,
          column: mapping.targetField,
          message: `${mapping.targetField.replace(/_/g, ' ')} is required`,
          severity: 'error'
        });
      }
      
      // Check validation
      if (value && mapping.validate && !mapping.validate(value)) {
        errors.push({
          row: rowIndex + 1,
          column: mapping.targetField,
          message: `Invalid ${mapping.targetField.replace(/_/g, ' ')}`,
          severity: 'error',
          value
        });
      }
    });
    
    return errors;
  };

  // Transform data before upload
  const getTransformedData = (): any[] => {
    return editedData.map(row => {
      const transformed: any = {};
      
      columnMappings.forEach(mapping => {
        let value = row[mapping.sourceColumn];
        
        // Apply transformation
        if (value && mapping.transform) {
          value = mapping.transform(value);
        }
        
        transformed[mapping.targetField] = value;
      });
      
      return transformed;
    });
  };

  // Handle upload with progress
  const handleUpload = async () => {
    if (!parsedData) return;
    
    setIsProcessing(true);
    setUploadProgress(0);
    
    try {
      const transformedData = getTransformedData();
      const validData = transformedData.filter((_, index) => 
        !parsedData.errors.some(e => e.row === index + 1 && e.severity === 'error')
      );
      
      // Apply custom transformation if provided
      const finalData = transformData ? transformData(validData) : validData;
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);
      
      const result = await onUpload({
        ...parsedData,
        rows: finalData
      });
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadResult(result);
      
      if (result.success) {
        Alert.alert(
          'Upload Successful',
          `Successfully processed ${result.processedCount} records${
            result.errorCount > 0 ? ` with ${result.errorCount} errors` : ''
          }${result.skippedCount > 0 ? ` (${result.skippedCount} skipped)` : ''}.`,
          [{ text: 'OK', onPress: resetUpload }]
        );
      } else {
        Alert.alert(
          'Upload Failed', 
          'Please check the errors and try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'An error occurred during upload.');
      console.error('Upload error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Add sample row
  const addSampleRow = () => {
    if (!parsedData) return;
    
    const sampleRow = (config as any).sampleData?.[0] || {};
    const newRow: any = {};
    
    parsedData.headers.forEach(header => {
      newRow[header] = sampleRow[header] || '';
    });
    
    setEditedData([...editedData, newRow]);
    setParsedData({
      ...parsedData,
      rows: [...parsedData.rows, newRow],
      totalRows: parsedData.totalRows + 1
    });
  };

  // Delete selected rows
  const deleteSelectedRows = () => {
    if (selectedRows.size === 0) return;
    
    Alert.alert(
      'Delete Rows',
      `Are you sure you want to delete ${selectedRows.size} rows?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const newData = editedData.filter((_, index) => !selectedRows.has(index));
            setEditedData(newData);
            
            if (parsedData) {
              const deletedRowNumbers = Array.from(selectedRows).map(i => i + 1);
              const newErrors = parsedData.errors.filter(e => !deletedRowNumbers.includes(e.row));
              
              setParsedData({
                ...parsedData,
                rows: newData,
                totalRows: newData.length,
                errors: newErrors,
                validRows: newData.length - newErrors.filter(e => e.severity === 'error').length
              });
            }
            
            setSelectedRows(new Set());
          }
        }
      ]
    );
  };

  // Reset everything
  const resetUpload = () => {
    setFile(null);
    setParsedData(null);
    setColumnMappings([]);
    setUploadProgress(0);
    setUploadResult(null);
    setEditedData([]);
    setExpandedRows(new Set());
    setSelectedRows(new Set());
    setShowMapping(false);
    setShowValidationSummary(false);
  };

  // Toggle row selection
  const toggleRowSelection = (rowIndex: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(rowIndex)) {
      newSelected.delete(rowIndex);
    } else {
      newSelected.add(rowIndex);
    }
    setSelectedRows(newSelected);
  };

  // Toggle all rows selection
  const toggleAllRows = () => {
    if (selectedRows.size === editedData.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(editedData.map((_, i) => i)));
    }
  };

  // Update column mapping
  const updateColumnMapping = (sourceColumn: string, targetField: string) => {
    const newMappings = columnMappings.filter(m => m.sourceColumn !== sourceColumn);
    
    if (targetField && targetField !== 'unmapped') {
      newMappings.push({
        sourceColumn,
        targetField,
        required: config.requiredFields.includes(targetField),
        transform: (config as any).transforms?.[targetField],
        validate: (config as any).validations?.[targetField]
      });
    }
    
    setColumnMappings(newMappings);
    setEditingMapping(null);
    
    // Re-validate all data with new mappings
    if (parsedData) {
      const newErrors: ValidationError[] = [];
      editedData.forEach((row, index) => {
        newErrors.push(...validateRow(row, index));
      });
      
      setParsedData({
        ...parsedData,
        errors: newErrors,
        validRows: parsedData.totalRows - newErrors.filter(e => e.severity === 'error').length
      });
    }
  };

  // Download template
  const handleTemplateDownload = () => {
    if (onTemplateDownload) {
      onTemplateDownload();
    } else {
      // Generate template
      const headers = [...config.requiredFields, ...config.optionalFields].join(',');
      const sampleRows = (config as any).sampleData?.map((row: any) => 
        [...config.requiredFields, ...config.optionalFields].map(field => row[field] || '').join(',')
      );
      const template = [headers, ...sampleRows].join('\n');
      
      Alert.alert(
        'Download Template',
        `Template for ${config.title}:\n\n${template}\n\nSample data included.`,
        [{ text: 'OK' }]
      );
    }
  };

  const renderFileUploadSection = () => (
    <View style={styles.uploadSection}>
      <View style={styles.uploadHeader}>
        <View style={styles.uploadIcon}>
          <config.icon size={32} color={colors.primary} />
        </View>
        <View style={styles.uploadInfo}>
          <Text style={styles.uploadTitle}>{config.title}</Text>
          <Text style={styles.uploadDescription}>{config.description}</Text>
        </View>
      </View>

      {!file ? (
        <>
          <TouchableOpacity
            style={styles.uploadDropzone}
            onPress={handleFileSelect}
          >
            <Upload size={48} color={colors.gray400} />
            <Text style={styles.dropzoneText}>Click to select file</Text>
            <Text style={styles.dropzoneSubtext}>
              Accepts {acceptedFormats.join(', ')} up to {maxFileSize}MB
            </Text>
          </TouchableOpacity>

          <View style={styles.templateSection}>
            <TouchableOpacity
              style={styles.templateButton}
              onPress={handleTemplateDownload}
            >
              <Download size={16} color={colors.primary} />
              <Text style={styles.templateButtonText}>Download Template</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.sampleButton}
              onPress={() => {
                setFile({ name: 'sample.csv', size: 1024 });
                parseFile({ name: 'sample.csv' }, generateMockCSV());
              }}
            >
              <FileSpreadsheet size={16} color={colors.success} />
              <Text style={styles.sampleButtonText}>Use Sample Data</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <View style={styles.fileInfo}>
          <FileText size={24} color={colors.primary} />
          <View style={styles.fileDetails}>
            <Text style={styles.fileName}>{file.name}</Text>
            <Text style={styles.fileSize}>
              {(file.size / 1024).toFixed(1)}KB
            </Text>
          </View>
          <TouchableOpacity onPress={resetUpload}>
            <X size={20} color={colors.gray600} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderColumnMapping = () => {
    const unmappedRequired = config.requiredFields.filter(field => 
      !columnMappings.some(m => m.targetField === field)
    );
    
    const availableTargets = [...config.requiredFields, ...config.optionalFields].filter(field =>
      !columnMappings.some(m => m.targetField === field)
    );

    return (
      <View style={styles.mappingSection}>
        <TouchableOpacity
          style={styles.mappingHeader}
          onPress={() => setShowMapping(!showMapping)}
        >
          <View style={styles.mappingHeaderLeft}>
            <Text style={styles.sectionTitle}>Column Mapping</Text>
            {unmappedRequired.length > 0 && (
              <View style={styles.warningBadge}>
                <AlertTriangle size={14} color={colors.warning} />
                <Text style={styles.warningBadgeText}>
                  {unmappedRequired.length} required fields unmapped
                </Text>
              </View>
            )}
          </View>
          {showMapping ? (
            <ChevronUp size={20} color={colors.gray600} />
          ) : (
            <ChevronDown size={20} color={colors.gray600} />
          )}
        </TouchableOpacity>

        {showMapping && (
          <View style={styles.mappingContent}>
            <View style={styles.mappingGrid}>
              <Text style={[styles.mappingColumnHeader, { flex: 1.5 }]}>CSV Column</Text>
              <Text style={[styles.mappingColumnHeader, { flex: 1.5 }]}>Maps To</Text>
              <Text style={[styles.mappingColumnHeader, { flex: 0.5 }]}>Required</Text>
            </View>
            
            {parsedData?.headers.map(header => {
              const mapping = columnMappings.find(m => m.sourceColumn === header);
              const isEditing = editingMapping === header;
              
              return (
                <View key={header} style={styles.mappingRow}>
                  <Text style={[styles.mappingCell, { flex: 1.5 }]}>{header}</Text>
                  <View style={[styles.mappingCell, { flex: 1.5 }]}>
                    {isEditing ? (
                      <SmartSelector
        label="Map to Field"
                        value={mapping?.targetField || 'unmapped'}
                        onSelect={(value) => updateColumnMapping(header, value)}
                        options={[
                          { id: 'unmapped', label: 'Not mapped', subtitle: 'Skip this column' },
                          ...availableTargets.map(field => ({
                            id: field,
                            label: field.replace(/_/g, ' '),
                            subtitle: config.requiredFields.includes(field) ? 'Required' : 'Optional'
                          }))
                        ]}
                        placeholder="Select mapping"
                      />
                    ) : (
                      <TouchableOpacity
                        style={styles.mappingValue}
                        onPress={() => setEditingMapping(header)}
                      >
                        {mapping ? (
                          <View style={styles.mappedField}>
                            <Text style={styles.mappedFieldText}>
                              {mapping.targetField.replace(/_/g, ' ')}
                            </Text>
                            <Edit2 size={12} color={colors.success} />
                          </View>
                        ) : (
                          <View style={styles.unmappedField}>
                            <Text style={styles.unmappedText}>Click to map</Text>
                            <Plus size={12} color={colors.gray500} />
                          </View>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                  <View style={[styles.mappingCell, { flex: 0.5, alignItems: 'center' }]}>
                    {mapping?.required && (
                      <CheckCircle2 size={16} color={colors.success} />
                    )}
                  </View>
                </View>
              );
            })}
            
            {/* Show unmapped required fields */}
            {unmappedRequired.length > 0 && (
              <View style={styles.unmappedSection}>
                <Text style={styles.unmappedTitle}>Required fields not mapped:</Text>
                {unmappedRequired.map(field => (
                  <View key={field} style={styles.unmappedRequiredRow}>
                    <AlertCircle size={16} color={colors.error} />
                    <Text style={styles.unmappedRequiredText}>
                      {field.replace(/_/g, ' ')}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderDataPreview = () => (
    <View style={styles.previewSection}>
      <View style={styles.previewHeader}>
        <Text style={styles.sectionTitle}>Data Preview</Text>
        <View style={styles.previewActions}>
          {allowEdit && (
            <>
              <TouchableOpacity
                style={styles.previewActionButton}
                onPress={addSampleRow}
              >
                <Plus size={16} color={colors.primary} />
                <Text style={styles.previewActionText}>Add Row</Text>
              </TouchableOpacity>
              
              {selectedRows.size > 0 && (
                <TouchableOpacity
                  style={[styles.previewActionButton, styles.deleteButton]}
                  onPress={deleteSelectedRows}
                >
                  <Trash2 size={16} color={colors.error} />
                  <Text style={[styles.previewActionText, { color: colors.error }]}>
                    Delete ({selectedRows.size})
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}
          
          <TouchableOpacity
            style={styles.previewActionButton}
            onPress={() => setShowValidationSummary(true)}
          >
            <Info size={16} color={colors.info} />
            <Text style={styles.previewActionText}>Validation</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.previewStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{parsedData?.totalRows || 0}</Text>
          <Text style={styles.statLabel}>Total Rows</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.success }]}>
            {parsedData?.validRows || 0}
          </Text>
          <Text style={styles.statLabel}>Valid</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.error }]}>
            {parsedData?.errors.filter(e => e.severity === 'error').length || 0}
          </Text>
          <Text style={styles.statLabel}>Errors</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.warning }]}>
            {parsedData?.warnings.length || 0}
          </Text>
          <Text style={styles.statLabel}>Warnings</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            {allowEdit && (
              <TouchableOpacity
                style={[styles.tableCell, styles.checkboxCell]}
                onPress={toggleAllRows}
              >
                {selectedRows.size === editedData.length ? (
                  <CheckCircle2 size={16} color={colors.primary} />
                ) : (
                  <Circle size={16} color={colors.gray400} />
                )}
              </TouchableOpacity>
            )}
            <Text style={[styles.tableCell, styles.rowNumberCell]}>#</Text>
            {parsedData?.headers.map(header => (
              <Text key={header} style={[styles.tableCell, styles.headerCell]}>
                {header}
              </Text>
            ))}
            <Text style={[styles.tableCell, styles.statusCell]}>Status</Text>
          </View>

          {/* Table Rows */}
          {editedData.map((row, rowIndex) => {
            const rowErrors = parsedData?.errors.filter(e => e.row === rowIndex + 1) || [];
            const hasError = rowErrors.some(e => e.severity === 'error');
            const hasWarning = parsedData?.warnings.some(w => w.row === rowIndex + 1);
            const isExpanded = expandedRows.has(rowIndex);
            const isSelected = selectedRows.has(rowIndex);

            return (
              <View key={rowIndex}>
                <View
                  style={[
                    styles.tableRow,
                    hasError && styles.errorTableRow,
                    hasWarning && !hasError && styles.warningTableRow,
                    isSelected && styles.selectedTableRow
                  ]}
                >
                  {allowEdit && (
                    <TouchableOpacity
                      style={[styles.tableCell, styles.checkboxCell]}
                      onPress={() => toggleRowSelection(rowIndex)}
                    >
                      {isSelected ? (
                        <CheckCircle2 size={16} color={colors.primary} />
                      ) : (
                        <Circle size={16} color={colors.gray400} />
                      )}
                    </TouchableOpacity>
                  )}
                  
                  <TouchableOpacity
                    style={[styles.tableCell, styles.rowNumberCell]}
                    onPress={() => {
                      const newExpanded = new Set(expandedRows);
                      if (newExpanded.has(rowIndex)) {
                        newExpanded.delete(rowIndex);
                      } else {
                        newExpanded.add(rowIndex);
                      }
                      setExpandedRows(newExpanded);
                    }}
                  >
                    <Text style={styles.rowNumber}>{rowIndex + 1}</Text>
                    {(hasError || hasWarning) && (
                      isExpanded ? (
                        <ChevronUp size={14} color={colors.gray600} />
                      ) : (
                        <ChevronDown size={14} color={colors.gray600} />
                      )
                    )}
                  </TouchableOpacity>
                  
                  {parsedData?.headers.map(header => (
                    <View key={header} style={styles.tableCell}>
                      {allowEdit && isExpanded ? (
                        <TextInput
                          style={[
                            styles.cellInput,
                            rowErrors.some(e => e.column === header) && styles.errorCellInput
                          ]}
                          value={row[header]?.toString() || ''}
                          onChangeText={(value) => handleCellEdit(rowIndex, header, value)}
                          placeholder="Enter value"
                          placeholderTextColor={colors.gray400}
                        />
                      ) : (
                        <Text style={styles.cellText} numberOfLines={1}>
                          {row[header]?.toString() || '-'}
                        </Text>
                      )}
                    </View>
                  ))}
                  
                  <View style={[styles.tableCell, styles.statusCell]}>
                    {hasError ? (
                      <XCircle size={16} color={colors.error} />
                    ) : hasWarning ? (
                      <AlertTriangle size={16} color={colors.warning} />
                    ) : (
                      <CheckCircle2 size={16} color={colors.success} />
                    )}
                  </View>
                </View>

                {/* Expanded Error/Warning Details */}
                {isExpanded && (rowErrors.length > 0 || hasWarning) && (
                  <View style={styles.expandedDetails}>
                    {rowErrors.map((error, i) => (
                      <View key={i} style={styles.errorItem}>
                        <AlertCircle 
                          size={14} 
                          color={error.severity === 'error' ? colors.error : colors.warning} 
                        />
                        <Text style={[
                          styles.errorMessage,
                          { color: error.severity === 'error' ? colors.error : colors.warning }
                        ]}>
                          {error.column}: {error.message}
                          {error.value && ` (current: "${error.value}")`}
                        </Text>
                      </View>
                    ))}
                    {parsedData?.warnings
                      .filter(w => w.row === rowIndex + 1)
                      .map((warning, i) => (
                        <View key={`warning-${i}`} style={styles.errorItem}>
                          <AlertTriangle size={14} color={colors.warning} />
                          <Text style={[styles.errorMessage, { color: colors.warning }]}>
                            {warning.message}
                          </Text>
                        </View>
                      ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );

  const renderValidationSummary = () => (
    <Modal
      visible={showValidationSummary}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={() => setShowValidationSummary(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Validation Summary</Text>
          <TouchableOpacity onPress={() => setShowValidationSummary(false)}>
            <X size={24} color={colors.gray600} />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent}>
          {/* Summary Stats */}
          <View style={styles.validationStats}>
            <View style={[styles.validationStatCard, { backgroundColor: colors.success + '10' }]}>
              <CheckCircle2 size={24} color={colors.success} />
              <Text style={[styles.validationStatValue, { color: colors.success }]}>
                {parsedData?.validRows || 0}
              </Text>
              <Text style={styles.validationStatLabel}>Valid Rows</Text>
            </View>
            
            <View style={[styles.validationStatCard, { backgroundColor: colors.error + '10' }]}>
              <XCircle size={24} color={colors.error} />
              <Text style={[styles.validationStatValue, { color: colors.error }]}>
                {parsedData?.errors.filter(e => e.severity === 'error').length || 0}
              </Text>
              <Text style={styles.validationStatLabel}>Errors</Text>
            </View>
            
            <View style={[styles.validationStatCard, { backgroundColor: colors.warning + '10' }]}>
              <AlertTriangle size={24} color={colors.warning} />
              <Text style={[styles.validationStatValue, { color: colors.warning }]}>
                {parsedData?.warnings.length || 0}
              </Text>
              <Text style={styles.validationStatLabel}>Warnings</Text>
            </View>
          </View>

          {/* Errors by Type */}
          {parsedData?.errors?.length || 0 > 0 && (
            <View style={styles.validationSection}>
              <Text style={styles.validationSectionTitle}>Errors by Field</Text>
              {Object.entries(
                (parsedData?.errors || []).reduce((acc, error) => {
                  if (!acc[error.column]) acc[error.column] = [];
                  acc[error.column].push(error);
                  return acc;
                }, {} as Record<string, ValidationError[]>)
              ).map(([column, errors]) => (
                <View key={column} style={styles.validationFieldGroup}>
                  <Text style={styles.validationFieldName}>
                    {column.replace(/_/g, ' ')} ({errors.length})
                  </Text>
                  {errors.slice(0, 3).map((error, i) => (
                    <Text key={i} style={styles.validationFieldError}>
                      Row {error.row}: {error.message}
                    </Text>
                  ))}
                  {errors.length > 3 && (
                    <Text style={styles.validationFieldMore}>
                      ...and {errors.length - 3} more
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Duplicate Warnings */}
          {((parsedData?.warnings || []).filter(w => w.type === 'duplicate').length) > 0 && (
            <View style={styles.validationSection}>
              <Text style={styles.validationSectionTitle}>Possible Duplicates</Text>
              {(parsedData?.warnings || [])
                .filter(w => w.type === 'duplicate')
                .map((warning, i) => (
                  <Text key={i} style={styles.validationDuplicate}>
                    Row {warning.row}: {warning.message}
                  </Text>
                ))}
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );

  const renderUploadProgress = () => (
    <View style={styles.progressSection}>
      <Text style={styles.progressTitle}>Upload Progress</Text>
      <ProgressBar
        current={uploadProgress}
        total={100}
        height={8}
        color={colors.primary}
      />
      <Text style={styles.progressText}>{uploadProgress}% Complete</Text>
      
      {uploadResult && (
        <View style={styles.resultSummary}>
          <View style={styles.resultItem}>
            <CheckCircle2 size={20} color={colors.success} />
            <Text style={styles.resultText}>
              {uploadResult.processedCount} Processed
            </Text>
          </View>
          {uploadResult.errorCount > 0 && (
            <View style={styles.resultItem}>
              <XCircle size={20} color={colors.error} />
              <Text style={styles.resultText}>
                {uploadResult.errorCount} Errors
              </Text>
            </View>
          )}
          {uploadResult.skippedCount > 0 && (
            <View style={styles.resultItem}>
              <AlertTriangle size={20} color={colors.warning} />
              <Text style={styles.resultText}>
                {uploadResult.skippedCount} Skipped
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );

  const canUpload = parsedData && 
    parsedData.validRows > 0 && 
    config.requiredFields.every(field => 
      columnMappings.some(m => m.targetField === field)
    );

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {renderFileUploadSection()}
      
      {parsedData && (
        <>
          {renderColumnMapping()}
          {showPreview && renderDataPreview()}
          
          {isProcessing && uploadProgress > 0 && renderUploadProgress()}
          
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.uploadButton, !canUpload && styles.disabledButton]}
              onPress={handleUpload}
              disabled={!canUpload || isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Upload size={20} color={colors.white} />
              )}
              <Text style={styles.uploadButtonText}>
                {isProcessing 
                  ? 'Uploading...' 
                  : `Upload ${parsedData.validRows} Valid Records`
                }
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={resetUpload}
              disabled={isProcessing}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
      
      {/* Info Section */}
      <View style={styles.infoSection}>
        <Info size={20} color={colors.info} />
        <View style={styles.infoContent}>
          <Text style={styles.infoTitle}>Required Fields</Text>
          <Text style={styles.infoText}>
            {config.requiredFields.map(f => f.replace(/_/g, ' ')).join(', ')}
          </Text>
          {config.optionalFields.length > 0 && (
            <>
              <Text style={[styles.infoTitle, { marginTop: spacing.sm }]}>
                Optional Fields
              </Text>
              <Text style={styles.infoText}>
                {config.optionalFields.map(f => f.replace(/_/g, ' ')).join(', ')}
              </Text>
            </>
          )}
          <Text style={[styles.infoTitle, { marginTop: spacing.sm }]}>
            Accepted Formats
          </Text>
          <Text style={styles.infoText}>
            {acceptedFormats.join(', ')} (max {maxFileSize}MB)
          </Text>
        </View>
      </View>

      {/* Validation Summary Modal */}
      {renderValidationSummary()}
    </ScrollView>
  );
}

// Styles remain largely the same with some additions
const styles = {
  container: {
    flex: 1,
    backgroundColor: colors.gray50,
  },
  uploadSection: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  uploadHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: spacing.md,
  },
  uploadIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary + '10',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: spacing.md,
  },
  uploadInfo: {
    flex: 1,
  },
  uploadTitle: {
    fontSize: typography.xl,
    fontWeight: typography.semibold as any,
    color: colors.textPrimary,
  },
  uploadDescription: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  uploadDropzone: {
    borderWidth: 2,
    borderColor: colors.gray300,
    borderStyle: 'dashed' as const,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center' as const,
    marginVertical: spacing.md,
  },
  dropzoneText: {
    fontSize: typography.base,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  dropzoneSubtext: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  fileInfo: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.gray50,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginVertical: spacing.md,
  },
  fileDetails: {
    flex: 1,
    marginLeft: spacing.md,
  },
  fileName: {
    fontSize: typography.base,
    color: colors.textPrimary,
    fontWeight: typography.medium as any,
  },
  fileSize: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  templateSection: {
    flexDirection: 'row' as const,
    gap: spacing.md,
    marginTop: spacing.md,
  },
  templateButton: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  templateButtonText: {
    fontSize: typography.sm,
    color: colors.primary,
    fontWeight: typography.medium as any,
  },
  sampleButton: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.success,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  sampleButtonText: {
    fontSize: typography.sm,
    color: colors.success,
    fontWeight: typography.medium as any,
  },
  sectionTitle: {
    fontSize: typography.lg,
    fontWeight: typography.semibold as any,
    color: colors.textPrimary,
  },
  mappingSection: {
    backgroundColor: colors.white,
    marginBottom: spacing.sm,
  },
  mappingHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  mappingHeaderLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.md,
    flex: 1,
  },
  warningBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.warning + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  warningBadgeText: {
    fontSize: typography.xs,
    color: colors.warning,
    fontWeight: typography.medium as any,
  },
  mappingContent: {
    padding: spacing.lg,
  },
  mappingGrid: {
    flexDirection: 'row' as const,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    marginBottom: spacing.sm,
  },
  mappingColumnHeader: {
    flex: 1,
    fontSize: typography.sm,
    fontWeight: typography.semibold as any,
    color: colors.textSecondary,
  },
  mappingRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  mappingCell: {
    flex: 1,
  },
  mappingValue: {
    padding: spacing.xs,
  },
  mappedField: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.success + '10',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start' as const,
    gap: spacing.xs,
  },
  mappedFieldText: {
    fontSize: typography.sm,
    color: colors.success,
    fontWeight: typography.medium as any,
    textTransform: 'capitalize' as const,
  },
  unmappedField: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderStyle: 'dashed' as const,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start' as const,
    gap: spacing.xs,
  },
  unmappedText: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    fontStyle: 'italic' as const,
  },
  unmappedSection: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.error + '05',
    borderRadius: borderRadius.md,
  },
  unmappedTitle: {
    fontSize: typography.sm,
    fontWeight: typography.medium as any,
    color: colors.error,
    marginBottom: spacing.sm,
  },
  unmappedRequiredRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  unmappedRequiredText: {
    fontSize: typography.sm,
    color: colors.error,
    textTransform: 'capitalize' as const,
  },
  previewSection: {
    backgroundColor: colors.white,
    marginBottom: spacing.sm,
  },
  previewHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  previewActions: {
    flexDirection: 'row' as const,
    gap: spacing.sm,
  },
  previewActionButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.gray100,
    gap: spacing.xs,
  },
  deleteButton: {
    backgroundColor: colors.error + '10',
  },
  previewActionText: {
    fontSize: typography.xs,
    color: colors.textPrimary,
    fontWeight: typography.medium as any,
  },
  previewStats: {
    flexDirection: 'row' as const,
    gap: spacing.xl,
    padding: spacing.lg,
    backgroundColor: colors.gray50,
  },
  statItem: {
    alignItems: 'center' as const,
  },
  statValue: {
    fontSize: typography.xl,
    fontWeight: typography.bold as any,
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  tableHeader: {
    flexDirection: 'row' as const,
    backgroundColor: colors.gray100,
    paddingVertical: spacing.sm,
  },
  tableRow: {
    flexDirection: 'row' as const,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
    backgroundColor: colors.white,
  },
  errorTableRow: {
    backgroundColor: colors.error + '05',
  },
  warningTableRow: {
    backgroundColor: colors.warning + '05',
  },
  selectedTableRow: {
    backgroundColor: colors.primary + '05',
  },
  tableCell: {
    width: 150,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  checkboxCell: {
    width: 40,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  rowNumberCell: {
    width: 60,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: spacing.xs,
  },
  rowNumber: {
    fontWeight: typography.medium as any,
    color: colors.textSecondary,
  },
  headerCell: {
    fontWeight: typography.semibold as any,
    color: colors.textSecondary,
    fontSize: typography.sm,
  },
  statusCell: {
    width: 80,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  cellText: {
    fontSize: typography.sm,
    color: colors.textPrimary,
  },
  cellInput: {
    fontSize: typography.sm,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.white,
    minHeight: 28,
  },
  errorCellInput: {
    borderColor: colors.error,
    backgroundColor: colors.error + '05',
  },
  expandedDetails: {
    backgroundColor: colors.gray50,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  errorItem: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  errorMessage: {
    fontSize: typography.sm,
    flex: 1,
    lineHeight: 18,
  },
  progressSection: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  progressTitle: {
    fontSize: typography.base,
    fontWeight: typography.medium as any,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  progressText: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    textAlign: 'center' as const,
    marginTop: spacing.sm,
  },
  resultSummary: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    gap: spacing.xl,
    marginTop: spacing.lg,
  },
  resultItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.sm,
  },
  resultText: {
    fontSize: typography.base,
    color: colors.textPrimary,
  },
  actions: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    gap: spacing.md,
  },
  uploadButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  disabledButton: {
    backgroundColor: colors.gray400,
  },
  uploadButtonText: {
    fontSize: typography.base,
    fontWeight: typography.semibold as any,
    color: colors.white,
  },
  cancelButton: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray100,
  },
  cancelButtonText: {
    fontSize: typography.base,
    color: colors.textSecondary,
  },
  infoSection: {
    flexDirection: 'row' as const,
    backgroundColor: colors.info + '10',
    padding: spacing.lg,
    margin: spacing.lg,
    borderRadius: borderRadius.md,
    gap: spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: typography.sm,
    fontWeight: typography.semibold as any,
    color: colors.info,
    marginBottom: spacing.xs,
  },
  infoText: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.white,
  },
  modalHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  modalTitle: {
    fontSize: typography.lg,
    fontWeight: typography.semibold as any,
    color: colors.textPrimary,
  },
  modalContent: {
    flex: 1,
    padding: spacing.lg,
  },
  validationStats: {
    flexDirection: 'row' as const,
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  validationStatCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center' as const,
  },
  validationStatValue: {
    fontSize: typography['2xl'],
    fontWeight: typography.bold as any,
    marginVertical: spacing.xs,
  },
  validationStatLabel: {
    fontSize: typography.sm,
    color: colors.textSecondary,
  },
  validationSection: {
    marginBottom: spacing.xl,
  },
  validationSectionTitle: {
    fontSize: typography.base,
    fontWeight: typography.semibold as any,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  validationFieldGroup: {
    backgroundColor: colors.gray50,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  validationFieldName: {
    fontSize: typography.sm,
    fontWeight: typography.medium as any,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textTransform: 'capitalize' as const,
  },
  validationFieldError: {
    fontSize: typography.xs,
    color: colors.error,
    marginLeft: spacing.md,
    marginBottom: spacing.xs,
  },
  validationFieldMore: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    marginLeft: spacing.md,
    fontStyle: 'italic' as const,
  },
  validationDuplicate: {
    fontSize: typography.sm,
    color: colors.warning,
    backgroundColor: colors.warning + '10',
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
  },
};