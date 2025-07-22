// app/components/shared/hide-on-scroll.tsx
// Path: app/components/shared/hide-on-scroll.tsx

import React, { useRef, useState, useCallback } from 'react';
import { 
  ScrollView, 
  Animated, 
  ScrollViewProps, 
  LayoutChangeEvent,
  NativeSyntheticEvent,
  NativeScrollEvent 
} from 'react-native';

interface HideOnScrollProps extends ScrollViewProps {
  children: React.ReactNode;
  headerHeight?: number;
  hideThreshold?: number;
  animationDuration?: number;
}

export const HideOnScroll: React.FC<HideOnScrollProps> = ({
  children,
  headerHeight = 120, // Adjust based on your header height
  hideThreshold = 50,
  animationDuration = 200,
  onScroll,
  ...scrollViewProps
}) => {
  const scrollY = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  
  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, headerHeight],
    outputRange: [0, -headerHeight],
    extrapolate: 'clamp',
  });

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    
    // Determine scroll direction
    if (currentScrollY > lastScrollY.current + hideThreshold && currentScrollY > headerHeight) {
      // Scrolling down - hide header
      if (isHeaderVisible) {
        setIsHeaderVisible(false);
        Animated.timing(scrollY, {
          toValue: headerHeight,
          duration: animationDuration,
          useNativeDriver: true,
        }).start();
      }
    } else if (currentScrollY < lastScrollY.current - hideThreshold || currentScrollY < headerHeight) {
      // Scrolling up or near top - show header
      if (!isHeaderVisible) {
        setIsHeaderVisible(true);
        Animated.timing(scrollY, {
          toValue: 0,
          duration: animationDuration,
          useNativeDriver: true,
        }).start();
      }
    }
    
    lastScrollY.current = currentScrollY;
    
    // Call the original onScroll if provided
    if (onScroll) {
      onScroll(event);
    }
  }, [isHeaderVisible, headerHeight, hideThreshold, animationDuration, scrollY, onScroll]);

  return (
    <>
      <Animated.View 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          transform: [{ translateY: headerTranslateY }],
        }}
      >
        {/* This will contain the header content */}
      </Animated.View>
      
      <ScrollView
        {...scrollViewProps}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={[
          scrollViewProps.contentContainerStyle,
          { paddingTop: headerHeight } // Add padding to account for absolute header
        ]}
      >
        {children}
      </ScrollView>
    </>
  );
};