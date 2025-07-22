// app/components/shared/scrollable-container.tsx
// Path: app/components/shared/scrollable-container.tsx

import React, { useRef, useState } from 'react';
import { 
  ScrollView, 
  Animated, 
  View,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';

interface ScrollableContainerProps {
  headerComponent: (isCompact: boolean) => React.ReactNode;
  children: React.ReactNode;
  headerHeight?: number;
  minHeaderHeight?: number;
  scrollThreshold?: number;
}

export const ScrollableContainer: React.FC<ScrollableContainerProps> = ({
  headerComponent,
  children,
  headerHeight = 120,
  minHeaderHeight = 60,
  scrollThreshold = 20,
}) => {
  const scrollY = useRef(new Animated.Value(0)).current;
  const [isCompact, setIsCompact] = useState(false);
  
  // Interpolate header height based on scroll
  const headerHeightAnimated = scrollY.interpolate({
    inputRange: [0, scrollThreshold, scrollThreshold + 50],
    outputRange: [headerHeight, headerHeight, minHeaderHeight],
    extrapolate: 'clamp',
  });

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: false,
      listener: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        setIsCompact(offsetY > scrollThreshold);
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
          overflow: 'hidden',
        }}
      >
        {headerComponent(isCompact)}
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