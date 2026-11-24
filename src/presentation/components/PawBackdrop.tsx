import React from 'react';
import { DimensionValue, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

export type PawBackdropVariant = 'auth' | 'home' | 'list' | 'detail';

interface PawSpec {
  top?: DimensionValue;
  bottom?: DimensionValue;
  left?: DimensionValue;
  right?: DimensionValue;
  size: number;
  rotate: string;
  opacity: number;
  soft?: boolean;
}

const PAW_LAYOUTS: Record<PawBackdropVariant, PawSpec[]> = {
  auth: [
    { top: 12, right: 16, size: 42, rotate: '-20deg', opacity: 0.42 },
    { top: 68, left: 6, size: 32, rotate: '22deg', opacity: 0.34, soft: true },
    { top: 118, right: -6, size: 46, rotate: '-26deg', opacity: 0.38 },
    { top: '28%', left: -6, size: 44, rotate: '18deg', opacity: 0.36 },
    { top: '39%', right: 4, size: 34, rotate: '-18deg', opacity: 0.34, soft: true },
    { top: '56%', left: 2, size: 38, rotate: '26deg', opacity: 0.36, soft: true },
    { top: '68%', right: -4, size: 48, rotate: '-22deg', opacity: 0.4 },
    { bottom: 72, left: 14, size: 44, rotate: '16deg', opacity: 0.42 },
    { bottom: 24, left: '44%', size: 28, rotate: '-12deg', opacity: 0.34, soft: true },
    { bottom: 18, right: 18, size: 40, rotate: '-26deg', opacity: 0.42 },
    { bottom: -6, left: '16%', size: 34, rotate: '24deg', opacity: 0.34, soft: true },
  ],
  home: [
    { top: 8, right: 98, size: 34, rotate: '-18deg', opacity: 0.34, soft: true },
    { top: 20, right: 6, size: 44, rotate: '-24deg', opacity: 0.4 },
    { top: 76, left: -6, size: 38, rotate: '24deg', opacity: 0.36 },
    { top: '27%', right: -6, size: 44, rotate: '-18deg', opacity: 0.38 },
    { top: '41%', left: 4, size: 42, rotate: '20deg', opacity: 0.36, soft: true },
    { top: '51%', right: 16, size: 36, rotate: '-22deg', opacity: 0.38 },
    { top: '66%', left: -4, size: 44, rotate: '16deg', opacity: 0.38 },
    { top: '75%', right: -4, size: 38, rotate: '-24deg', opacity: 0.36, soft: true },
    { bottom: 30, left: 18, size: 46, rotate: '18deg', opacity: 0.42 },
    { bottom: 12, left: '46%', size: 30, rotate: '-14deg', opacity: 0.34, soft: true },
    { bottom: 22, right: 20, size: 38, rotate: '-26deg', opacity: 0.4 },
  ],
  list: [
    { top: 12, right: 12, size: 40, rotate: '-20deg', opacity: 0.38 },
    { top: 18, left: '44%', size: 28, rotate: '16deg', opacity: 0.3, soft: true },
    { top: '21%', left: -6, size: 40, rotate: '24deg', opacity: 0.36 },
    { top: '32%', right: -4, size: 38, rotate: '-18deg', opacity: 0.36, soft: true },
    { top: '46%', left: 12, size: 44, rotate: '18deg', opacity: 0.38 },
    { top: '53%', right: 16, size: 48, rotate: '-20deg', opacity: 0.42 },
    { top: '62%', left: '42%', size: 32, rotate: '14deg', opacity: 0.32, soft: true },
    { bottom: 118, left: 22, size: 50, rotate: '16deg', opacity: 0.42 },
    { bottom: 92, right: 26, size: 40, rotate: '-24deg', opacity: 0.4 },
    { bottom: 34, left: '22%', size: 30, rotate: '-16deg', opacity: 0.34, soft: true },
    { bottom: -4, left: '47%', size: 42, rotate: '12deg', opacity: 0.38 },
    { bottom: 18, right: 10, size: 36, rotate: '-22deg', opacity: 0.36, soft: true },
  ],
  detail: [
    { top: 14, right: 8, size: 40, rotate: '-22deg', opacity: 0.36 },
    { top: 86, left: -6, size: 36, rotate: '22deg', opacity: 0.32, soft: true },
    { top: '25%', right: -6, size: 42, rotate: '-18deg', opacity: 0.34 },
    { top: '41%', left: 4, size: 38, rotate: '20deg', opacity: 0.34, soft: true },
    { top: '56%', right: 8, size: 40, rotate: '-24deg', opacity: 0.36 },
    { top: '72%', left: -4, size: 42, rotate: '16deg', opacity: 0.34 },
    { bottom: 84, right: 16, size: 44, rotate: '-18deg', opacity: 0.38 },
    { bottom: 34, left: 20, size: 38, rotate: '20deg', opacity: 0.36 },
    { bottom: 10, left: '46%', size: 28, rotate: '-14deg', opacity: 0.3, soft: true },
    { bottom: 14, right: 10, size: 30, rotate: '-26deg', opacity: 0.34, soft: true },
  ],
};

interface Props {
  variant?: PawBackdropVariant;
}

/**
 * Non-interactive soft sage paw watermark layer over the warm cream canvas.
 */
export function PawBackdrop({ variant = 'list' }: Props) {
  const specs = PAW_LAYOUTS[variant];

  return (
    <View
      style={styles.container}
      pointerEvents="none"
      importantForAccessibility="no-hide-descendants"
    >
      {specs.map((spec, index) => (
        <View
          key={`${variant}-${index}`}
          style={[
            styles.pawItem,
            {
              top: spec.top,
              bottom: spec.bottom,
              left: spec.left,
              right: spec.right,
              opacity: spec.opacity,
              transform: [{ rotate: spec.rotate }],
            },
          ]}
        >
          <Ionicons
            name="paw"
            size={spec.size}
            color={spec.soft ? colors.pawTintSoft : colors.pawTint}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    overflow: 'hidden',
  },
  pawItem: {
    position: 'absolute',
  },
});
