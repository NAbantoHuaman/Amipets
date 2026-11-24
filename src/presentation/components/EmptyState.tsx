import React from 'react';
import { Image, ImageSourcePropType, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../theme';
import { IconName } from '../utils/requestMeta';
import { PrimaryButton } from './PrimaryButton';

type IllustrationKey = 'orders' | 'clinic';

const ILLUSTRATIONS: Record<IllustrationKey, ImageSourcePropType> = {
  orders: require('../../../assets/images/empty-orders.jpg'),
  clinic: require('../../../assets/images/empty-clinic.jpg'),
};

interface Props {
  icon?: IconName;
  illustration?: IllustrationKey;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
}

export function EmptyState({
  icon = 'paw-outline',
  illustration,
  title,
  message,
  actionLabel,
  onAction,
  compact,
}: Props) {
  return (
    <View style={[styles.container, compact && styles.compact]} accessibilityRole="summary">
      {illustration ? (
        <View style={[styles.illustrationWrap, compact && styles.illustrationWrapCompact]}>
          <Image
            source={ILLUSTRATIONS[illustration]}
            style={styles.illustration}
            resizeMode="cover"
          />
        </View>
      ) : (
        <View style={styles.iconOuter}>
          <View style={styles.iconInner}>
            <Ionicons name={icon} size={30} color={colors.primary} />
          </View>
        </View>
      )}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction && (
        <PrimaryButton
          title={actionLabel}
          onPress={onAction}
          compact
          style={styles.action}
          icon="add"
          trailingIcon={null}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: spacing.xxl, paddingHorizontal: spacing.xl },
  compact: { paddingVertical: spacing.lg },
  illustrationWrap: {
    width: 176,
    height: 176,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  illustrationWrapCompact: {
    width: 132,
    height: 132,
    borderRadius: 22,
    marginBottom: spacing.sm,
  },
  illustration: {
    width: '100%',
    height: '100%',
  },
  iconOuter: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  iconInner: {
    width: 62,
    height: 62,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...typography.heading, textAlign: 'center' },
  message: { ...typography.body, textAlign: 'center', marginTop: 4, maxWidth: 300 },
  action: { marginTop: spacing.md },
});
