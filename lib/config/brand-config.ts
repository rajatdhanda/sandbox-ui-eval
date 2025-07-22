// lib/config/brand-config.ts
// Path: lib/config/brand-config.ts

export const brand = {
  name: 'Sandbox',
  tagline: 'Where Learning Begins',
  logo: {
    // Using colors from your logo
    primaryColor: '#8B4513', // Brown from figure (main element)
    secondaryColor: '#F5A623', // Yellow/Gold from sun
    backgroundColor: '#FFFFFF',
  },
  colors: {
    // Primary palette based on logo - Using brown as primary
    primary: '#8B4513', // Earth brown (main figure)
    primaryLight: '#A0522D', // Sienna
    primaryDark: '#654321', // Dark brown
    
    // Secondary palette - Using yellow as secondary
    secondary: '#F5A623', // Warm yellow/gold (sun)
    secondaryLight: '#FFD166',
    secondaryDark: '#F39C12',
    
    // Accent colors for different modules
    accent: {
      yellow: '#F5A623', // Our secondary yellow
      teal: '#14B8A6', // Complementary to brown
      coral: '#FB7185', // Warm, playful
      sage: '#86EFAC', // Soft green for success
      sky: '#7DD3FC', // Soft blue for info
      peach: '#FED7AA', // Soft orange
      modules: {
      users: { 
        primary: '#8B4513', 
        light: '#8B451320', // 20% opacity for backgrounds
        border: '#8B451340' // 40% opacity for borders
      },
      children: { 
        primary: '#F5A623', 
        light: '#F5A62320',
        border: '#F5A62340'
      },
      classes: { 
        primary: '#D2691E', 
        light: '#D2691E20',
        border: '#D2691E40'
      },
      curriculum: { 
        primary: '#CD853F', 
        light: '#CD853F20',
        border: '#CD853F40'
      },
      attendance: { 
        primary: '#A0522D', 
        light: '#A0522D20',
        border: '#A0522D40'
      },
      photos: { 
        primary: '#BC8F8F', 
        light: '#BC8F8F20',
        border: '#BC8F8F40'
      },
      config: { 
        primary: '#8B7355', 
        light: '#8B735520',
        border: '#8B735540'
      },
      reports: { 
        primary: '#704214', 
        light: '#70421420',
        border: '#70421440'
      }
    },
    },
    
    // Semantic colors
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    
    // Neutral colors
    white: '#FFFFFF',
    black: '#000000',
    gray: {
      50: '#F9FAFB',
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D1D5DB',
      400: '#9CA3AF',
      500: '#6B7280',
      600: '#4B5563',
      700: '#374151',
      800: '#1F2937',
      900: '#111827',
    },
    
    // Backgrounds
    background: '#FEFEFE',
    surface: '#FFFFFF',
    surfaceHover: '#F9FAFB',
    
    // Text colors
    textPrimary: '#1F2937',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    textInverse: '#FFFFFF',
  },
  
  typography: {
    fontFamily: {
      sans: 'System',
      mono: 'monospace',
    },
    sizes: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 30,
      '4xl': 36,
    },
    weights: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    '4xl': 40,
  },
  
  borderRadius: {
    none: 0,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    '2xl': 20,
    full: 9999,
  },
  
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8,
    },
  },
};