import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OrderCategory, OrderStatus } from '../../domain/models/order';
import { Priority, RequestStatus, ServiceType } from '../../domain/models/request';
import { colors, fonts, radius, spacing } from '../theme';
import { ORDER_CATEGORY_META, ORDER_STATUS_META } from '../utils/orderMeta';
import { IconName, PRIORITY_META, SERVICE_META, STATUS_META } from '../utils/requestMeta';

interface ChipProps {
  label: string;
  color: string;
  background: string;
  icon?: IconName;
  size?: 'sm' | 'md';

  variant?: 'filled' | 'outline';
  accessibilityLabel?: string;
}

export function Chip({ label, color, background, icon, size = 'sm', variant = 'filled', accessibilityLabel }: ChipProps) {
  const sm = size === 'sm';
  const outline = variant === 'outline';
  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel ?? label}
      style={[
        styles.chip,
        sm ? styles.sm : styles.md,
        outline
          ? { backgroundColor: colors.surface, borderColor: color, borderWidth: 1 }
          : { backgroundColor: background, borderColor: background, borderWidth: 1 },
      ]}
    >
      {icon && <Ionicons name={icon} size={sm ? 12 : 14} color={color} />}
      <Text style={[styles.label, { color, fontSize: sm ? 11 : 13 }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export function StatusChip({ status, size }: { status: RequestStatus; size?: 'sm' | 'md' }) {
  const m = STATUS_META[status];
  return (
    <Chip
      label={m.label}
      color={m.color}
      background={m.background}
      icon={m.icon}
      size={size}
      accessibilityLabel={`Estado: ${m.label}`}
    />
  );
}

export function PriorityChip({ priority, size }: { priority: Priority; size?: 'sm' | 'md' }) {
  const m = PRIORITY_META[priority];
  return (
    <Chip
      label={m.label}
      color={m.color}
      background={m.background}
      icon={m.icon}
      size={size}
      variant="outline"
      accessibilityLabel={`Prioridad: ${m.label}`}
    />
  );
}

export function ServiceChip({ service, size }: { service: ServiceType; size?: 'sm' | 'md' }) {
  const m = SERVICE_META[service];
  return (
    <Chip
      label={m.label}
      color={m.color}
      background={m.background}
      icon={m.icon}
      size={size}
      accessibilityLabel={`Servicio: ${m.label}`}
    />
  );
}

export function OrderStatusChip({ status, size }: { status: OrderStatus; size?: 'sm' | 'md' }) {
  const m = ORDER_STATUS_META[status];
  return (
    <Chip
      label={m.label}
      color={m.color}
      background={m.background}
      icon={m.icon}
      size={size}
      accessibilityLabel={`Estado del pedido: ${m.label}`}
    />
  );
}

export function OrderCategoryChip({ category, size }: { category: OrderCategory; size?: 'sm' | 'md' }) {
  const m = ORDER_CATEGORY_META[category];
  return (
    <Chip
      label={m.label}
      color={m.color}
      background={m.background}
      icon={m.icon}
      size={size}
      variant="outline"
      accessibilityLabel={`Categoría: ${m.label}`}
    />
  );
}

const styles = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', borderRadius: radius.sm, gap: 4 },
  sm: { paddingHorizontal: 7, paddingVertical: 2.5 },
  md: { paddingHorizontal: 10, paddingVertical: 4.5 },
  label: { fontFamily: fonts.semibold, letterSpacing: 0.1 },
});
