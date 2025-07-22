// components/shared/tab-navigation.tsx
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { colors } from '@/lib/styles';

interface Tab {
  key: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

interface TabNavigationProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabKey: string) => void;
  scrollable?: boolean;
}

export const TabNavigation = ({ tabs, activeTab, onTabChange, scrollable = false }: TabNavigationProps) => {
  const renderTabs = () => (
    <View style={scrollable ? styles.scrollableContainer : styles.container}>
      {tabs.map(tab => (
        <TouchableOpacity
          key={tab.key}
          style={[
            scrollable ? styles.scrollableTab : styles.tab,
            activeTab === tab.key && styles.activeTab
          ]}
          onPress={() => onTabChange(tab.key)}
        >
          {tab.icon}
          <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
            {tab.label}{tab.count !== undefined && ` (${tab.count})`}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return scrollable ? (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollView}>
      {renderTabs()}
    </ScrollView>
  ) : renderTabs();
};

const styles = {
  container: { flexDirection: 'row' as const, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.gray200 },
  scrollableContainer: { flexDirection: 'row' as const, paddingHorizontal: 4 },
  scrollView: { backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.gray200 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' as const, flexDirection: 'row' as const, justifyContent: 'center' as const, gap: 6 },
  scrollableTab: { paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center' as const, flexDirection: 'row' as const, gap: 6, marginHorizontal: 4 },
  activeTab: { borderBottomWidth: 2, borderBottomColor: colors.primary },
  tabText: { fontSize: 14, color: colors.gray600, textAlign: 'center' as const },
  activeTabText: { color: colors.primary, fontWeight: '600' as const }
};