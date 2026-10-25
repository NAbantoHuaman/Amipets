import React from 'react';
import { ActivityIndicator, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius, shadows, spacing } from '../theme';
import { IconName } from '../utils/requestMeta';
import { PressableScale } from './PressableScale';

type Variant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';

interface Props {
  title: string;
  onPress: () => void;
  variant?: Variant;
  icon?: IconName;
  /** Ícono a la derecha (por defecto, flecha en el botón principal). */
  trailingIcon?: IconName | null;
  loading?: boolean;
  disabled?: boolean;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  accessibilityHint?: string;
}

const VARIANTS: Record<Variant, { bg: string; fg: string; border: string }> = {
  primary: { bg: colors.primary, fg: colors.primaryText, border: colors.primary },
  secondary: { bg: colors.primarySoft, fg: colors.primaryDark, border: colors.primarySoft },
  outline: { bg: colors.surface, fg: colors.text, border: colors.border },
  danger: { bg: colors.dangerSoft, fg: colors.danger, border: colors.dangerSoft },
  ghost: { bg: 'transparent', fg: colors.primaryDark, border: 'transparent' },
};

/** Botón tipo píldora de la referencia visual (p. ej. "Book an Appointment →"). */
export function PrimaryButton({
  title,
  onPress,
  variant = 'primary',
  icon,
  trailingIcon,
  loading,
  disabled,
  compact,
  style,
  testID,
  accessibilityHint,
}: Props) {
  const v = VARIANTS[variant];
  const trailing = trailingIcon === undefined ? (variant === 'primary' ? 'arrow-forward' : null) : trailingIcon;

  return (
    <PressableScale
      testID={testID}
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      style={[
        styles.base,
        compact && styles.compact,
        { backgroundColor: v.bg, borderColor: v.border },
        variant === 'primary' && shadows.raised,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.fg} />
      ) : (
        <View style={styles.content}>
          {icon && <Ionicons name={icon} size={compact ? 16 : 18} color={v.fg} />}
          <Text style={[styles.label, compact && styles.labelCompact, { color: v.fg }]}>{title}</Text>
          {trailing && <Ionicons name={trailing} size={compact ? 16 : 18} color={v.fg} style={styles.trailing} />}
        </View>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 54,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compact: { minHeight: 44, paddingHorizontal: spacing.md },
  content: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  label: { fontFamily: fonts.semibold, fontSize: 15 },
  labelCompact: { fontSize: 13 },
  trailing: { marginLeft: spacing.xs },
});
