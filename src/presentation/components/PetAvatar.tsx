import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Species } from '../../domain/models/request';
import { colors } from '../theme';
import { SPECIES_META } from '../utils/requestMeta';

interface Props {
  species?: Species;
  size?: number;
  shape?: 'circle' | 'rounded';
  selected?: boolean;
  muted?: boolean;
  color?: string;
  background?: string;
  style?: StyleProp<ViewStyle>;
}

export function PetAvatar({
  species,
  size = 52,
  shape = 'rounded',
  selected,
  muted,
  color,
  background,
  style,
}: Props) {
  const meta = SPECIES_META[species ?? 'OTRO'];
  const borderRadius = shape === 'circle' ? size / 2 : size * 0.3;
  const bgColor = background ?? meta.background;
  const iconColor = color ?? meta.color;

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.base,
        { width: size, height: size, borderRadius, backgroundColor: bgColor },
        selected && styles.selected,
        muted && styles.muted,
        style,
      ]}
    >
      <MaterialCommunityIcons name={meta.icon} size={size * 0.5} color={iconColor} />
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  selected: { borderWidth: 2.5, borderColor: colors.primary },
  muted: { opacity: 0.6 },
});
