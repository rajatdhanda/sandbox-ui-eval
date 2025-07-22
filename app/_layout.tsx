import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Little Stars Preschool' }} />
      <Stack.Screen name="admin-test" options={{ title: 'System Test' }} />
      <Stack.Screen name="admin-dashboard" options={{ title: 'Users Management' }} />
      <Stack.Screen name="children" options={{ title: 'Students Management' }} />
      <Stack.Screen name="classes" options={{ title: 'Classes Management' }} />
    </Stack>
  );
}
