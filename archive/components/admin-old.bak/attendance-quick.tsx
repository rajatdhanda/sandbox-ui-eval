// components/admin/attendance-quick.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckCircle2, XCircle, Clock, Calendar } from 'lucide-react-native';
import { db } from '@/lib/supabase/services/database.service';
import { colors } from '@/lib/styles';

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  class_id: string;
  attendance_status?: 'present' | 'absent' | 'late' | null;
}

export function AttendanceQuick() {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [classes, setClasses] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const [classesRes, studentsRes, attendanceRes] = await Promise.all([
      db.read('classes', { filters: { is_active: true } }),
      db.read('children', { filters: { is_active: true } }),
      db.read('attendance_records', { filters: { attendance_date: today } })
    ]);

    setClasses(classesRes.data || []);
    
    const studentsWithAttendance = (studentsRes.data || []).map((student: any) => {
      const todayAttendance = (attendanceRes.data || []).find((att: any) => att.child_id === student.id);
      return { ...student, attendance_status: todayAttendance?.status || null };
    });
    
    setStudents(studentsWithAttendance);
    if (classesRes.data?.[0]) setSelectedClass(classesRes.data[0].id);
  };

  const updateAttendance = async (studentId: string, status: 'present' | 'absent' | 'late') => {
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, attendance_status: status } : s));
    
    const data = {
      child_id: studentId,
      class_id: selectedClass,
      attendance_date: today,
      status,
      checked_in_by: 'current_user', // Replace with actual user ID
      check_in_time: new Date().toISOString()
    };

    await db.upsert('attendance_records', data, ['child_id', 'attendance_date']);
  };

  const bulkSave = async () => {
    setSaving(true);
    const updates = students.filter(s => s.attendance_status).map(s => ({
      child_id: s.id,
      class_id: s.class_id,
      attendance_date: today,
      status: s.attendance_status,
      checked_in_by: 'current_user',
      check_in_time: new Date().toISOString()
    }));

    await db.bulkCreate('attendance_records', updates);
    setSaving(false);
    Alert.alert('Success', 'Attendance saved!');
  };

  const filteredStudents = students.filter(s => !selectedClass || s.class_id === selectedClass);
  const selectedClassName = classes.find(c => c.id === selectedClass)?.name || 'All Classes';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Calendar size={24} color={colors.primary} />
        <Text style={styles.title}>Today's Attendance - {selectedClassName}</Text>
        <Text style={styles.date}>{new Date().toLocaleDateString()}</Text>
      </View>

      <ScrollView horizontal style={styles.classSelector} showsHorizontalScrollIndicator={false}>
        {classes.map(cls => (
          <TouchableOpacity
            key={cls.id}
            style={[styles.classChip, selectedClass === cls.id && styles.classChipActive]}
            onPress={() => setSelectedClass(cls.id)}
          >
            <Text style={[styles.classChipText, selectedClass === cls.id && styles.classChipTextActive]}>
              {cls.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.studentList}>
        {filteredStudents.map(student => (
          <View key={student.id} style={styles.studentCard}>
            <Text style={styles.studentName}>{student.first_name} {student.last_name}</Text>
            <View style={styles.attendanceButtons}>
              {(['present', 'late', 'absent'] as const).map(status => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.statusButton,
                    styles[`${status}Button`],
                    student.attendance_status === status && styles[`${status}ButtonActive`]
                  ]}
                  onPress={() => updateAttendance(student.id, status)}
                >
                  {status === 'present' && <CheckCircle2 size={16} color={student.attendance_status === status ? colors.white : colors.green600} />}
                  {status === 'late' && <Clock size={16} color={student.attendance_status === status ? colors.white : colors.orange600} />}
                  {status === 'absent' && <XCircle size={16} color={student.attendance_status === status ? colors.white : colors.red600} />}
                  <Text style={[styles.statusText, student.attendance_status === status && styles.statusTextActive]}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.saveButton} onPress={bulkSave} disabled={saving}>
        <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save Attendance'}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = {
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { padding: 20, backgroundColor: colors.white, alignItems: 'center' as const, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  title: { fontSize: 18, fontWeight: '600' as const, color: '#1F2937', marginTop: 8 },
  date: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  classSelector: { padding: 20, maxHeight: 60 },
  classChip: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: colors.white, borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  classChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  classChipText: { fontSize: 14, color: '#6B7280' },
  classChipTextActive: { color: colors.white, fontWeight: '600' as const },
  studentList: { flex: 1, padding: 20 },
  studentCard: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, backgroundColor: colors.white, padding: 16, borderRadius: 12, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  studentName: { fontSize: 16, fontWeight: '500' as const, color: '#1F2937', flex: 1 },
  attendanceButtons: { flexDirection: 'row' as const, gap: 8 },
  statusButton: { flexDirection: 'row' as const, alignItems: 'center' as const, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, gap: 4 },
  presentButton: { borderColor: colors.green600, backgroundColor: '#F0FDF4' },
  presentButtonActive: { backgroundColor: colors.green600 },
  lateButton: { borderColor: colors.orange600, backgroundColor: '#FFFBEB' },
  lateButtonActive: { backgroundColor: colors.orange600 },
  absentButton: { borderColor: colors.red600, backgroundColor: '#FEF2F2' },
  absentButtonActive: { backgroundColor: colors.red600 },
  statusText: { fontSize: 12, fontWeight: '500' as const },
  statusTextActive: { color: colors.white },
  saveButton: { margin: 20, backgroundColor: colors.primary, padding: 16, borderRadius: 12, alignItems: 'center' as const },
  saveButtonText: { color: colors.white, fontSize: 16, fontWeight: '600' as const },
};