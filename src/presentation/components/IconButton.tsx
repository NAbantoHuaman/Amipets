import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, HIT_SLOP, shadows } from '../theme';
import { IconName } from '../utils/requestMeta';
import { PressableScale } from './PressableScale';

interface Props {
  icon: IconName;
  onPress: () => void;
  accessibilityLabel: string;
  color?: string;
  background?: string;
  size?: number;

  badge?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function IconButton({
  icon,
  onPress,
  accessibilityLabel,
  color = colors.text,
  background = colors.surface,
  size = 44,
  badge,
  style,
  testID,
}: Props) {
  return (
    <PressableScale
      testID={testID}
      onPress={onPress}
      hitSlop={HIT_SLOP}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      pressedScale={0.9}
      style={[
        styles.base,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: background },
        background === colors.surface && shadows.soft,
        style,
      ]}
    >
      <Ionicons name={icon} size={size * 0.45} color={color} />
      {badge && <View style={styles.badge} />}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  badge: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.danger,
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
});
