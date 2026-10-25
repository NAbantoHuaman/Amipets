import React, { forwardRef, useState } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius, spacing } from '../theme';
import { IconName } from '../utils/requestMeta';

interface Props extends TextInputProps {
  label: string;
  icon?: IconName;
  error?: string;
  hint?: string;
  required?: boolean;
  /** Muestra contador de caracteres cuando se define maxLength. */
  showCounter?: boolean;
}

/** Campo de formulario con etiqueta, ícono, error debajo y contador. */
export const FormField = forwardRef<any, Props>(function FormField(
  { label, icon, error, hint, required, showCounter, multiline, maxLength, value = '', style, onFocus, onBlur, ...rest },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const borderColor = error ? colors.danger : focused ? colors.primary : colors.border;

  return (
    <View style={styles.wrapper}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
        {showCounter && maxLength !== undefined && (
          <Text style={styles.counter}>
            {value.length}/{maxLength}
          </Text>
        )}
      </View>
      <View
        style={[
          styles.inputWrap,
          multiline && styles.inputWrapMultiline,
          { borderColor },
          focused && !error && styles.focused,
        ]}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={19}
            color={error ? colors.danger : focused ? colors.primary : colors.textMuted}
            style={multiline ? styles.iconTop : undefined}
          />
        )}
        <TextInput
          ref={ref}
          {...rest}
          value={value}
          maxLength={maxLength}
          multiline={multiline}
          placeholderTextColor={colors.placeholder}
          accessibilityLabel={label}
          accessibilityHint={error ?? hint}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[styles.input, multiline && styles.inputMultiline, style]}
        />
      </View>
      {error ? (
        <View style={styles.errorRow} accessibilityLiveRegion="polite">
          <Ionicons name="alert-circle" size={14} color={colors.danger} />
          <Text style={styles.error}>{error}</Text>
        </View>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.md },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  label: { fontFamily: fonts.medium, fontSize: 13, color: colors.text },
  required: { color: colors.danger },
  counter: { fontFamily: fonts.regular, fontSize: 11, color: colors.textMuted },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1.2,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.sm,
  },
  inputWrapMultiline: { alignItems: 'flex-start', paddingVertical: spacing.sm },
  focused: { backgroundColor: colors.surface },
  iconTop: { marginTop: 2 },
  input: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.text,
    paddingVertical: spacing.xs,
    outlineStyle: 'none',
  } as object,
  inputMultiline: { minHeight: 96, textAlignVertical: 'top', paddingTop: 0 },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  error: { fontFamily: fonts.medium, fontSize: 12, color: colors.danger, flex: 1 },
  hint: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted, marginTop: 6 },
});
