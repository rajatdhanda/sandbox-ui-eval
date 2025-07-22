// app/details/[type]/[id].tsx
import React from 'react';
import { View, Text } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DetailScreen() {
  const { type, id } = useLocalSearchParams<{ type: string; id: string }>();
  
  // Determine title based on type
  const getTitle = () => {
    switch(type) {
      case 'activity': return 'Activity Details';
      case 'child': return 'Child Details';
      case 'class': return 'Class Details';
      default: return 'Details';
    }
  };
  
  return (
    <>
      <Stack.Screen options={{ title: getTitle() }} />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flex: 1, padding: 20 }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold' }}>{getTitle()}</Text>
          <Text>Type: {type}</Text>
          <Text>ID: {id}</Text>
          {/* TODO: Implement dynamic detail view based on type */}
        </View>
      </SafeAreaView>
    </>
  );
}
