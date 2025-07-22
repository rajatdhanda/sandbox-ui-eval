// app/components/shared/student-selector.tsx
// Path: app/components/shared/student-selector.tsx

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Check, Users, User, Search } from 'lucide-react-native';
import { colors, spacing, typography, borderRadius, shadows } from '@/lib/styles';
import { TextInput } from './text-inputs';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  photoUrl?: string;
  className?: string;
  present?: boolean;
}

interface StudentSelectorProps {
  students: Student[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  mode?: 'single' | 'multiple';
  showSelectAll?: boolean;
  compact?: boolean;
  showClassName?: boolean;
  showSearch?: boolean;
  title?: string;
}

export function StudentSelector({
  students,
  selectedIds,
  onSelectionChange,
  mode = 'multiple',
  showSelectAll = true,
  compact = false,
  showClassName = false,
  showSearch = false,
  title
}: StudentSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const styles = getStyles(compact);  // ADD THIS LINE HERE
  
  const filteredStudents = students.filter(student => {
    const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  const allSelected = filteredStudents.length > 0 && 
    filteredStudents.every(s => selectedIds.includes(s.id));

  const toggleStudent = (studentId: string) => {
    if (mode === 'single') {
      onSelectionChange([studentId]);
    } else {
      const newSelection = selectedIds.includes(studentId)
        ? selectedIds.filter(id => id !== studentId)
        : [...selectedIds, studentId];
      onSelectionChange(newSelection);
    }
  };

  const toggleAll = () => {
    if (allSelected) {
      // Deselect all filtered students
      const filteredIds = filteredStudents.map(s => s.id);
      onSelectionChange(selectedIds.filter(id => !filteredIds.includes(id)));
    } else {
      // Select all filtered students
      const newIds = [...new Set([...selectedIds, ...filteredStudents.map(s => s.id)])];
      onSelectionChange(newIds);
    }
  };

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      
      {showSearch && (
        <View style={styles.searchContainer}>
          <Search size={16} color={colors.gray500} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search students..."
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>
      )}

      {showSelectAll && mode === 'multiple' && (
        <TouchableOpacity 
          style={styles.selectAllButton}
          onPress={toggleAll}
        >
          <View style={[styles.checkbox, allSelected && styles.checkboxSelected]}>
            {allSelected && <Check size={16} color={colors.white} />}
          </View>
          <Users size={20} color={colors.primary} />
          <Text style={styles.selectAllText}>
            {allSelected ? 'Deselect All' : 'Select All'} ({filteredStudents.length})
          </Text>
        </TouchableOpacity>
      )}

      <ScrollView 
        horizontal={compact}
        showsHorizontalScrollIndicator={false}
        style={styles.studentList}
      >
        <View style={compact ? styles.compactGrid : styles.grid}>
          {filteredStudents.map(student => {
            const isSelected = selectedIds.includes(student.id);
            return (
              <TouchableOpacity
                key={student.id}
                style={[
                  compact ? styles.compactItem : styles.studentItem,
                  isSelected && styles.studentItemSelected,
                  student.present === false && styles.studentItemAbsent
                ]}
                onPress={() => toggleStudent(student.id)}
              >
                <View style={[styles.avatarContainer, isSelected && styles.avatarSelected]}>
                  {student.photoUrl ? (
                    <Image source={{ uri: student.photoUrl }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <User size={compact ? 20 : 24} color={colors.gray500} />
                    </View>
                  )}
                  {isSelected && (
                    <View style={styles.checkmark}>
                      <Check size={12} color={colors.white} />
                    </View>
                  )}
                </View>
                <Text style={[styles.studentName, compact && styles.compactName]} numberOfLines={1}>
                  {student.firstName}
                </Text>
                {!compact && (
                  <Text style={styles.studentLastName} numberOfLines={1}>
                    {student.lastName}
                  </Text>
                )}
                {showClassName && student.className && (
                  <Text style={styles.className}>{student.className}</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {selectedIds.length > 0 && (
        <View style={styles.selectionSummary}>
          <Text style={styles.summaryText}>
            {selectedIds.length} student{selectedIds.length !== 1 ? 's' : ''} selected
          </Text>
        </View>
      )}
    </View>
  );
}

// Replace the entire styles object at the bottom with this:
const getStyles = (compact: boolean) => ({
  container: {
    marginVertical: spacing.sm,
  },
  title: {
    fontSize: typography.sm,
    fontWeight: typography.semibold as any,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  searchContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.sm,
    fontSize: typography.sm,
  },
  selectAllButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.gray400,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  selectAllText: {
    fontSize: typography.sm,
    color: colors.textPrimary,
    flex: 1,
  },
  studentList: {
    maxHeight: compact ? 100 : 300,
  },
  grid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: spacing.sm,
  },
  compactGrid: {
    flexDirection: 'row' as const,
    gap: spacing.sm,
  },
  studentItem: {
    alignItems: 'center' as const,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray200,
    width: 80,
  },
  compactItem: {
    alignItems: 'center' as const,
    padding: spacing.xs,
    width: 60,
  },
  studentItemSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  studentItemAbsent: {
    opacity: 0.5,
  },
  avatarContainer: {
    position: 'relative' as const,
    marginBottom: spacing.xs,
  },
  avatarSelected: {
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 25,
    padding: 2,
  },
  avatar: {
    width: compact ? 40 : 50,
    height: compact ? 40 : 50,
    borderRadius: compact ? 20 : 25,
  },
  avatarPlaceholder: {
    width: compact ? 40 : 50,
    height: compact ? 40 : 50,
    borderRadius: compact ? 20 : 25,
    backgroundColor: colors.gray100,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  checkmark: {
    position: 'absolute' as const,
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.success,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    ...shadows.sm,
  },
  studentName: {
    fontSize: typography.sm,
    fontWeight: typography.medium as any,
    color: colors.textPrimary,
    textAlign: 'center' as const,
  },
  compactName: {
    fontSize: typography.xs,
  },
  studentLastName: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    textAlign: 'center' as const,
  },
  className: {
    fontSize: typography.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  selectionSummary: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  summaryText: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    textAlign: 'center' as const,
  },
});
