// components/shared/responsive-header.tsx
import React from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { Plus, Activity, MoreHorizontal } from 'lucide-react-native';
import { colors } from '@/lib/styles';

const { width: screenWidth } = Dimensions.get('window');
const isMobile = screenWidth < 480;

interface ResponsiveHeaderProps {
  title: string;
  subtitle: string;
  onAdd: () => void;
  onShowLogs?: () => void;
  addButtonText?: string;
  extraActions?: Array<{
    icon: React.ReactNode;
    label: string;
    onPress: () => void;
  }>;
}

export const ResponsiveHeader = ({ 
  title, 
  subtitle, 
  onAdd, 
  onShowLogs, 
  addButtonText = 'Add', 
  extraActions = [] 
}: ResponsiveHeaderProps) => {
  
  if (isMobile) {
    // Mobile layout: Stack vertically, compact buttons
    return (
      <View style={styles.mobileContainer}>
        <View style={styles.mobileHeader}>
          <View style={styles.titleContainer}>
            <Text style={styles.mobileTitle}>{title}</Text>
            <Text style={styles.mobileSubtitle}>{subtitle}</Text>
          </View>
        </View>
        
        <View style={styles.mobileActions}>
          <TouchableOpacity style={styles.mobilePrimaryButton} onPress={onAdd}>
            <Plus size={18} color={colors.white} />
            <Text style={styles.mobilePrimaryButtonText}>{addButtonText}</Text>
          </TouchableOpacity>
          
          {extraActions.length > 0 && (
            <TouchableOpacity style={styles.mobileSecondaryButton}>
              <MoreHorizontal size={18} color={colors.primary} />
            </TouchableOpacity>
          )}
          
          {onShowLogs && (
            <TouchableOpacity style={styles.mobileSecondaryButton} onPress={onShowLogs}>
              <Activity size={18} color={colors.gray600} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  // Desktop layout: Side by side
  return (
    <View style={styles.desktopContainer}>
      <View style={styles.titleContainer}>
        <Text style={styles.desktopTitle}>{title}</Text>
        <Text style={styles.desktopSubtitle}>{subtitle}</Text>
      </View>
      
      <View style={styles.desktopActions}>
        {onShowLogs && (
          <TouchableOpacity style={styles.desktopSecondaryButton} onPress={onShowLogs}>
            <Activity size={16} color={colors.gray600} />
          </TouchableOpacity>
        )}
        
        {extraActions.map((action, index) => (
          <TouchableOpacity key={index} style={styles.desktopSecondaryButton} onPress={action.onPress}>
            {action.icon}
          </TouchableOpacity>
        ))}
        
        <TouchableOpacity style={styles.desktopPrimaryButton} onPress={onAdd}>
          <Plus size={20} color={colors.white} />
          <Text style={styles.desktopPrimaryButtonText}>{addButtonText}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = {
  // Mobile styles
  mobileContainer: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    paddingBottom: 12
  },
  mobileHeader: {
    padding: 16,
    paddingBottom: 8
  },
  mobileTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.gray900,
    marginBottom: 2
  },
  mobileSubtitle: {
    fontSize: 14,
    color: colors.gray600
  },
  mobileActions: {
    flexDirection: 'row' as const,
    paddingHorizontal: 16,
    gap: 8
  },
  mobilePrimaryButton: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6
  },
  mobilePrimaryButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600' as const
  },
  mobileSecondaryButton: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray300
  },
  
  // Desktop styles
  desktopContainer: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    padding: 20,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200
  },
  titleContainer: {
    flex: 1
  },
  desktopTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: colors.gray900,
    marginBottom: 2
  },
  desktopSubtitle: {
    fontSize: 14,
    color: colors.gray600
  },
  desktopActions: {
    flexDirection: 'row' as const,
    gap: 12,
    alignItems: 'center' as const
  },
  desktopPrimaryButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6
  },
  desktopPrimaryButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600' as const
  },
  desktopSecondaryButton: {
    padding: 8,
    borderRadius: 6
  }
};