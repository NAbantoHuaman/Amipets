import React, { ReactNode, useEffect, useRef } from 'react';
import { Animated, StyleProp, ViewStyle } from 'react-native';

interface Props {
  children: ReactNode;
  delay?: number;
  duration?: number;
  direction?: 'up' | 'down' | 'none';
  distance?: number;
  scale?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function FadeInView({
  children,
  delay = 0,
  duration = 380,
  direction = 'up',
  distance = 12,
  scale = false,
  style,
}: Props) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration,
      delay,
      useNativeDriver: true,
    }).start();
  }, [anim, delay, duration]);

  const translateY =
    direction === 'none'
      ? 0
      : anim.interpolate({
          inputRange: [0, 1],
          outputRange: [direction === 'up' ? distance : -distance, 0],
        });

  const transform: any[] = [];
  if (direction !== 'none') {
    transform.push({ translateY });
  }
  if (scale) {
    transform.push({
      scale: anim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.96, 1],
      }),
    });
  }

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: anim,
          transform: transform.length > 0 ? transform : undefined,
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
