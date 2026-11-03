import React, { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../theme';
import { IconButton } from './IconButton';

interface Props {
  title: string;
  onBack?: () => void;
  right?: ReactNode;
}

export function ScreenHeader({ title, onBack, right }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.side}>
        {onBack && <IconButton icon="arrow-back" onPress={onBack} accessibilityLabel="Volver" testID="header-back" />}
      </View>
      <Text style={styles.title} numberOfLines={1} accessibilityRole="header">
        {title}
      </Text>
      <View style={[styles.side, styles.right]}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  side: { width: 84, flexDirection: 'row' },
  right: { justifyContent: 'flex-end' },
  title: { ...typography.heading, fontSize: 18, flex: 1, textAlign: 'center' },
});
