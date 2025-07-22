import { Tabs } from 'expo-router';
import { Users, Baby, Link, School, Home, Calendar, BookOpen } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      {/* Teacher Home - Currently Active */}
      <Tabs.Screen
        name="teacher-home"
        options={{
          title: 'Teacher Home',
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
        }}
      />
      
      {/* These will automatically work when you rename .bak files back to .tsx */}
      <Tabs.Screen
        name="classes"
        options={{
          title: 'Classes',
          tabBarIcon: ({ color }) => <School size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          title: 'Users',
          tabBarIcon: ({ color }) => <Users size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="children"
        options={{
          title: 'Children',
          tabBarIcon: ({ color }) => <Baby size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="relationships"
        options={{
          title: 'Relationships',
          tabBarIcon: ({ color }) => <Link size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="attendance"
        options={{
          title: 'Attendance',
          tabBarIcon: ({ color }) => <Calendar size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="curriculum"
        options={{
          title: 'Curriculum',
          tabBarIcon: ({ color }) => <BookOpen size={24} color={color} />,
        }}
      />
      
      {/* Hidden routes */}
      <Tabs.Screen
        name="index"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="curriculum-admin"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="teacher-home-original"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="tests"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}