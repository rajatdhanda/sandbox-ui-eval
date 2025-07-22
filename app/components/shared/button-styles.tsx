// components/shared/button-styles.tsx
export const buttonStyles = {
  // Standard button (like class management)
  standard: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 6,
    minHeight: 36,
  },
  // Compact button for status
  compact: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 4,
    minHeight: 32,
  },
  // Text styles
  text: {
    fontSize: 14,
    fontWeight: '500' as const,
    textAlign: 'center' as const,
  },
  textSmall: {
    fontSize: 12,
    fontWeight: '500' as const,
    textAlign: 'center' as const,
  }
};