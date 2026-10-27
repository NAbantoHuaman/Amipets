import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius, spacing } from '../theme';
import { IconName } from '../utils/requestMeta';

export interface FilterOption<T extends string> {
  value: T;
  label: string;
  count?: number;
  color?: string;
  icon?: IconName;
}

interface Props<T extends string> {
  options: FilterOption<T>[];
  value: T;
  onChange: (value: T) => void;

  variant?: 'underline' | 'chips';
  accessibilityLabel?: string;
}

export function FilterTabs<T extends string>({ options, value, onChange, variant = 'underline', accessibilityLabel }: Props<T>) {
  if (variant === 'chips') {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
        accessibilityRole="tablist"
        accessibilityLabel={accessibilityLabel}
      >
        {options.map((opt) => {
          const active = opt.value === value;
          const tint = opt.color ?? colors.primary;
          return (
            <Pressable
              key={opt.value}
              onPress={() => onChange(opt.value)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`${accessibilityLabel ?? 'Filtro'}: ${opt.label}`}
              style={[
                styles.chip,
                active && { backgroundColor: tint, borderColor: tint },
              ]}
            >
              {opt.icon && <Ionicons name={opt.icon} size={13} color={active ? colors.white : tint} />}
              <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{opt.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    );
  }

  return (
    <View style={styles.tabs} accessibilityRole="tablist" accessibilityLabel={accessibilityLabel}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={styles.tab}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${opt.label}${opt.count !== undefined ? `, ${opt.count}` : ''}`}
          >
            <View style={styles.tabInner}>
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]} numberOfLines={1}>
                {opt.label}
              </Text>
              {opt.count !== undefined && (
                <View style={[styles.count, active && styles.countActive]}>
                  <Text style={[styles.countText, active && styles.countTextActive]}>{opt.count}</Text>
                </View>
              )}
            </View>
            <View style={[styles.indicator, active && styles.indicatorActive]} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border },
  tab: { flex: 1, alignItems: 'center', paddingTop: spacing.xs },
  tabInner: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingBottom: spacing.xs },
  tabLabel: { fontFamily: fonts.medium, fontSize: 13, color: colors.textMuted },
  tabLabelActive: { color: colors.text, fontFamily: fonts.semibold },
  count: { minWidth: 18, paddingHorizontal: 5, height: 18, borderRadius: 9, backgroundColor: colors.divider, alignItems: 'center', justifyContent: 'center' },
  countActive: { backgroundColor: colors.primarySoft },
  countText: { fontFamily: fonts.semibold, fontSize: 10, color: colors.textMuted },
  countTextActive: { color: colors.primaryDark },
  indicator: { height: 2.5, width: '60%', borderRadius: 2, backgroundColor: 'transparent', marginBottom: -1 },
  indicatorActive: { backgroundColor: colors.primary },

  chipsRow: { gap: spacing.xs, paddingVertical: 2 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.sm,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipLabel: { fontFamily: fonts.medium, fontSize: 12, color: colors.textSecondary },
  chipLabelActive: { color: colors.white },
});
