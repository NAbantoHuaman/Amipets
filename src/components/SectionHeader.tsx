import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, HIT_SLOP, spacing, typography } from '../theme';

interface Props {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

/** Título de sección con enlace "Ver todo" en color de marca. */
export function SectionHeader({ title, actionLabel, onAction }: Props) {
  return (
    <View style={styles.row}>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      {actionLabel && onAction && (
        <Pressable onPress={onAction} hitSlop={HIT_SLOP} accessibilityRole="link" accessibilityLabel={`${actionLabel}: ${title}`}>
          <Text style={styles.action}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  title: { ...typography.heading },
  action: { fontFamily: fonts.medium, fontSize: 13, color: colors.primary },
});
