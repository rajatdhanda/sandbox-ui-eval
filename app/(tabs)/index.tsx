// app/(tabs)/index.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold' }}>Daycare Management System</Text>
        <Text style={{ fontSize: 16, marginTop: 10 }}>Production Build</Text>
      </View>
    </SafeAreaView>
  );
}