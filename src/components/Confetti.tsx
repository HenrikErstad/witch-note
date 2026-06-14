import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, useWindowDimensions } from 'react-native';

const COLORS = ['#ff9500', '#34c759', '#007aff', '#5e5ce6', '#ff3b30', '#ffcc00'];

interface Props {
  count?: number;
}

// Falling confetti overlay. Mounts, plays once, then the pieces rest off-screen.
export default function Confetti({ count = 90 }: Props) {
  const { width, height } = useWindowDimensions();

  const pieces = useRef(
    Array.from({ length: count }, () => ({
      progress: new Animated.Value(0),
      startX: Math.random() * width,
      drift: (Math.random() - 0.5) * 140,
      size: 6 + Math.random() * 8,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      spin: (Math.random() * 6 - 3) * 360,
      delay: Math.random() * 450,
      duration: 2200 + Math.random() * 1300,
      long: Math.random() > 0.5,
    }))
  ).current;

  useEffect(() => {
    Animated.parallel(
      pieces.map((p) =>
        Animated.timing(p.progress, {
          toValue: 1,
          duration: p.duration,
          delay: p.delay,
          useNativeDriver: true,
        })
      )
    ).start();
  }, [pieces]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {pieces.map((p, i) => {
        const translateY = p.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [-30, height + 30],
        });
        const translateX = p.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [p.startX, p.startX + p.drift],
        });
        const rotate = p.progress.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', `${p.spin}deg`],
        });
        const opacity = p.progress.interpolate({
          inputRange: [0, 0.85, 1],
          outputRange: [1, 1, 0],
        });
        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: p.long ? p.size : p.size * 0.6,
              height: p.long ? p.size * 0.6 : p.size,
              backgroundColor: p.color,
              borderRadius: 1,
              opacity,
              transform: [{ translateX }, { translateY }, { rotate }],
            }}
          />
        );
      })}
    </View>
  );
}
