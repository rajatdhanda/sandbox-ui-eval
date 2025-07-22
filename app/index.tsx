import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Link } from 'expo-router';

export default function HomePage() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🏫 Little Stars Preschool</Text>
        <Text style={styles.subtitle}>Management System</Text>
      </View>
      
      <View style={styles.grid}>
        <Link href="/admin-dashboard" asChild>
          <Pressable style={[styles.card, styles.primaryCard]}>
            <Text style={styles.cardIcon}>👥</Text>
            <Text style={styles.cardTitle}>Users</Text>
            <Text style={styles.cardDesc}>Manage parents, teachers & admins</Text>
          </Pressable>
        </Link>
        
        <Link href="/children" asChild>
          <Pressable style={[styles.card, styles.childrenCard]}>
            <Text style={styles.cardIcon}>👶</Text>
            <Text style={styles.cardTitle}>Students</Text>
            <Text style={styles.cardDesc}>Manage student enrollment</Text>
          </Pressable>
        </Link>
        
        <Link href="/classes" asChild>
          <Pressable style={[styles.card, styles.classesCard]}>
            <Text style={styles.cardIcon}>🏫</Text>
            <Text style={styles.cardTitle}>Classes</Text>
            <Text style={styles.cardDesc}>Manage classrooms & schedules</Text>
          </Pressable>
        </Link>
        
        <Link href="/admin-test" asChild>
          <Pressable style={[styles.card, styles.testCard]}>
            <Text style={styles.cardIcon}>🔧</Text>
            <Text style={styles.cardTitle}>System Test</Text>
            <Text style={styles.cardDesc}>Connection & diagnostics</Text>
          </Pressable>
        </Link>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { padding: 30, alignItems: 'center', backgroundColor: 'white', marginBottom: 20 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 5 },
  subtitle: { fontSize: 16, color: '#666' },
  grid: { padding: 20, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { width: '48%', backgroundColor: 'white', padding: 20, borderRadius: 12, marginBottom: 15, alignItems: 'center', elevation: 3 },
  primaryCard: { backgroundColor: '#007bff' },
  childrenCard: { backgroundColor: '#28a745' },
  classesCard: { backgroundColor: '#ffc107' },
  testCard: { backgroundColor: '#6c757d' },
  cardIcon: { fontSize: 32, marginBottom: 10 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: 'white', marginBottom: 5, textAlign: 'center' },
  cardDesc: { fontSize: 12, color: 'rgba(255,255,255,0.9)', textAlign: 'center' }
});
