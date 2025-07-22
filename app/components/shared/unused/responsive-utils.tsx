// components/shared/responsive-utils.tsx
import { Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const breakpoints = {
  mobile: 480,
  tablet: 768,
  desktop: 1024
};

export const isMobile = screenWidth < breakpoints.mobile;
export const isTablet = screenWidth >= breakpoints.mobile && screenWidth < breakpoints.desktop;
export const isDesktop = screenWidth >= breakpoints.desktop;

export const getResponsiveValue = (mobile: any, tablet: any, desktop: any) => {
  if (isMobile) return mobile;
  if (isTablet) return tablet;
  return desktop;
};

export const responsiveStyles = {
  // Container styles
  container: {
    padding: getResponsiveValue(12, 16, 20),
    maxWidth: getResponsiveValue('100%', 768, 1200),
    alignSelf: 'center' as const
  },
  
  // Grid layouts
  statsGrid: {
    flexDirection: getResponsiveValue('column', 'row', 'row'),
    gap: getResponsiveValue(8, 12, 16)
  },
  
  // Text sizes
  headerTitle: {
    fontSize: getResponsiveValue(18, 20, 24),
    lineHeight: getResponsiveValue(24, 28, 32)
  },
  
  cardTitle: {
    fontSize: getResponsiveValue(14, 16, 18),
    lineHeight: getResponsiveValue(20, 22, 24)
  },
  
  // Button sizes
  button: {
    paddingHorizontal: getResponsiveValue(12, 16, 20),
    paddingVertical: getResponsiveValue(8, 10, 12),
    minHeight: getResponsiveValue(36, 40, 44)
  },
  
  // Tab styles
  tabContainer: {
    flexDirection: getResponsiveValue('row', 'row', 'row'),
    flexWrap: getResponsiveValue('wrap', 'nowrap', 'nowrap')
  },
  
  tab: {
    minWidth: getResponsiveValue(80, 100, 120),
    paddingVertical: getResponsiveValue(8, 10, 12)
  }
};