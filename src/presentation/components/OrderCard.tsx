import React, { memo } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { calculateOrderTotal, orderShortCode } from '../../application/services/orderService';
import { PetOrder } from '../../domain/models/order';
import { findCatalogProductAsset } from '../../infrastructure/services/catalogApiService';
import { colors, common, fonts, radius, spacing } from '../theme';
import { formatRelative } from '../utils/date';
import { ORDER_CATEGORY_META } from '../utils/orderMeta';
import { OrderStatusChip } from './Chips';
import { PressableScale } from './PressableScale';

interface Props {
  order: PetOrder;
  onPress: (id: string) => void;
}

function OrderCardBase({ order, onPress }: Props) {
  const cat = ORDER_CATEGORY_META[order.categoria] ?? ORDER_CATEGORY_META.ACCESORIOS;
  const catalogAsset = findCatalogProductAsset(order.productoId, order.producto);
  const brandLabel = order.marca ?? catalogAsset?.brand;
  const total = calculateOrderTotal(order.cantidad, order.precio);
  const isCanceled = order.estado === 'CANCELADO';
  const isSynced = order.syncStatus === 'SYNCED';
  const hasReceipt = Boolean(order.comprobanteUrl || order.comprobanteLocalUri);

  return (
    <PressableScale
      testID={`order-card-${order.id}`}
      onPress={() => onPress(order.id)}
      accessibilityRole="button"
      accessibilityLabel={`Pedido ${orderShortCode(order.id)} de ${order.clienteNombre}: ${order.producto}, total S/. ${total.toFixed(2)}`}
      accessibilityHint="Abre el detalle del pedido"
      style={[styles.card, isCanceled && styles.canceledCard]}
    >
      {catalogAsset ? (
        <View style={styles.imageBox}>
          <Image source={catalogAsset.image} style={styles.productImage} resizeMode="contain" />
        </View>
      ) : (
        <View style={[styles.iconBox, { backgroundColor: cat.background }]}>
          <Ionicons name={cat.icon} size={24} color={cat.color} />
        </View>
      )}

      <View style={styles.body}>
        {brandLabel && (
          <Text style={styles.brand} numberOfLines={1}>
            {brandLabel}
          </Text>
        )}

        <View style={styles.topRow}>
          <Text style={styles.product} numberOfLines={1}>
            {order.producto}
          </Text>
          <Text style={styles.total}>S/. {total.toFixed(2)}</Text>
        </View>

        <View style={styles.clientRow}>
          <Ionicons name="person-outline" size={12} color={colors.textMuted} />
          <Text style={styles.client} numberOfLines={1}>
            {order.clienteNombre} · {order.cantidad} {order.cantidad === 1 ? 'und.' : 'unds.'}
            {order.mascotaNombre ? ` · ${order.mascotaNombre}` : ''}
          </Text>
        </View>

        <View style={styles.bottomRow}>
          <View style={styles.dateRow}>
            <Ionicons
              name={isSynced ? 'cloud-done-outline' : 'cloud-upload-outline'}
              size={13}
              color={isSynced ? colors.done : colors.pending}
            />
            {hasReceipt && (
              <Ionicons name="receipt-outline" size={12} color={colors.textMuted} />
            )}
            <Text style={styles.date} numberOfLines={1}>
              {formatRelative(order.fechaRegistro)} · {orderShortCode(order.id)}
            </Text>
          </View>
          <OrderStatusChip status={order.estado} />
        </View>
      </View>

      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </PressableScale>
  );
}

export const OrderCard = memo(OrderCardBase);

const styles = StyleSheet.create({
  card: {
    ...common.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    paddingRight: spacing.xs,
  },
  canceledCard: {
    opacity: 0.78,
  },
  imageBox: {
    width: 54,
    height: 54,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  iconBox: {
    width: 54,
    height: 54,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    gap: 2,
  },
  brand: {
    fontFamily: fonts.semibold,
    fontSize: 10,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.35,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  product: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  client: {
    fontFamily: fonts.regular,
    fontSize: 12.5,
    color: colors.textSecondary,
    flex: 1,
  },
  total: {
    fontFamily: fonts.bold,
    fontSize: 13.5,
    color: colors.primaryDark,
    fontVariant: ['tabular-nums'],
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
    marginTop: 3,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexShrink: 1,
  },
  date: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textMuted,
  },
});
