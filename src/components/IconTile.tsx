import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radius } from '../theme';
import { IconName } from '../utils/requestMeta';

interface Props {
  icon: IconName;
  color: string;
  background: string;
  size?: number;
  shape?: 'circle' | 'rounded';
  style?: StyleProp<ViewStyle>;
}

export function IconTile({ icon, color, background, size = 48, shape = 'rounded', style }: Props) {
  return (
    <View
      style={[
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: shape === 'circle' ? size / 2 : Math.min(radius.md, size * 0.32),
          backgroundColor: background,
        },
        style,
      ]}
    >
      <Ionicons name={icon} size={size * 0.46} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
});
