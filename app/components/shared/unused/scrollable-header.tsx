// app/components/shared/scrollable-header.tsx
// Path: app/components/shared/scrollable-header.tsx

import React, { useRef, useState, useCallback, ReactNode } from 'react';
import { 
  ScrollView, 
  Animated, 
  View,
  NativeSyntheticEvent,
  NativeScrollEvent,
  ViewStyle
} from 'react-native';

interface ScrollableHeaderProps {
  headerComponent: ReactNode;
  children: ReactNode;
  headerHeight?: number;
  minHeaderHeight?: number;
  scrollThreshold?: number;
}

export const ScrollableHeader: React.FC<ScrollableHeaderProps> = ({
  headerComponent,
  children,
  headerHeight = 120,
  minHeaderHeight = 60,
  scrollThreshold = 10,
}) => {
  const scrollY = useRef(new Animated.Value(0)).current;
  const [isScrolling, setIsScrolling] = useState(false);
  
  // Interpolate header height based on scroll
  const headerHeightAnimated = scrollY.interpolate({
    inputRange: [0, scrollThreshold, scrollThreshold + 50],
    outputRange: [headerHeight, headerHeight, minHeaderHeight],
    extrapolate: 'clamp',
  });

  // Interpolate header opacity for smooth transition
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, scrollThreshold],
    outputRange: [1, 0.9],
    extrapolate: 'clamp',
  });

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: false,
      listener: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        setIsScrolling(offsetY > scrollThreshold);
      },
    }
  );

  return (
    <View style={{ flex: 1 }}>
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          height: headerHeightAnimated,
          opacity: headerOpacity,
          overflow: 'hidden',
        }}
      >
        {headerComponent}
      </Animated.View>
      
      <Animated.ScrollView
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{
          paddingTop: headerHeight,
        }}
      >
        {children}
      </Animated.ScrollView>
    </View>
  );
};