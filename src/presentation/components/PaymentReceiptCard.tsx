import React from 'react';
import { Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  calculateReceiptBreakdown,
  DigitalReceiptMeta,
  getPaymentMethodLabel,
} from '../../application/services/receiptService';
import { colors, fonts, radius, shadows, spacing } from '../theme';
import { formatDateTime } from '../utils/date';
import { PressableScale } from './PressableScale';
import { PrimaryButton } from './PrimaryButton';

export interface ReceiptOrderData {
  clienteNombre: string;
  telefono?: string;
  mascotaNombre?: string;
  producto: string;
  sku?: string;
  cantidad: number;
  precio: number;
  registradoPor?: string;
  synced?: boolean;
}

interface CardProps {
  receipt: DigitalReceiptMeta;
  order: ReceiptOrderData;
  compact?: boolean;
  onPress?: () => void;
}

export function PaymentReceiptCard({ receipt, order, compact = false, onPress }: CardProps) {
  const { subtotal, igv, total } = calculateReceiptBreakdown(order.cantidad, order.precio);
  const methodLabel = getPaymentMethodLabel(receipt.method);
  const cashierName = receipt.cashier || order.registradoPor || 'Recepción Amipets';

  const content = (
    <View style={[styles.ticket, compact && styles.ticketCompact]}>
      <View style={styles.topAccentBar} />

      <View style={styles.headerRow}>
        <View style={styles.brandLeft}>
          <View style={styles.logoCircle}>
            <Ionicons name="paw" size={16} color={colors.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.clinicTitle} numberOfLines={1}>
              Clínica Veterinaria Amipets
            </Text>
            <Text style={styles.rucText}>R.U.C. 20608421951 · Mostrador y Pet Shop</Text>
          </View>
        </View>

        <View style={styles.boletaBox}>
          <Text style={styles.boletaLabel}>BOLETA</Text>
          <Text style={styles.boletaCode}>{receipt.code}</Text>
        </View>
      </View>

      <View style={styles.dashedDivider} />

      <View style={styles.infoGrid}>
        <View style={styles.infoLine}>
          <Text style={styles.infoKey}>Cliente:</Text>
          <Text style={styles.infoVal} numberOfLines={1}>
            {order.clienteNombre.trim() || 'Cliente en mostrador'}
          </Text>
        </View>
        {!compact && order.telefono ? (
          <View style={styles.infoLine}>
            <Text style={styles.infoKey}>Teléfono:</Text>
            <Text style={styles.infoVal}>{order.telefono}</Text>
          </View>
        ) : null}
        {order.mascotaNombre ? (
          <View style={styles.infoLine}>
            <Text style={styles.infoKey}>Mascota:</Text>
            <Text style={styles.infoVal} numberOfLines={1}>
              {order.mascotaNombre}
            </Text>
          </View>
        ) : null}
        <View style={styles.infoLine}>
          <Text style={styles.infoKey}>Emisión:</Text>
          <Text style={styles.infoVal}>{formatDateTime(receipt.issuedAt)}</Text>
        </View>
        <View style={styles.infoLine}>
          <Text style={styles.infoKey}>Pago:</Text>
          <View style={styles.methodPill}>
            <Text style={styles.methodPillText}>{methodLabel}</Text>
          </View>
        </View>
        {!compact && (
          <View style={styles.infoLine}>
            <Text style={styles.infoKey}>Atendió:</Text>
            <Text style={styles.infoVal} numberOfLines={1}>
              {cashierName}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.dashedDivider} />

      <View style={styles.itemBlock}>
        <View style={styles.itemHeaderRow}>
          <Text style={[styles.itemColLabel, { flex: 1 }]}>DESCRIPCIÓN</Text>
          <Text style={styles.itemColLabel}>CANT. x P.U.</Text>
          <Text style={[styles.itemColLabel, { width: 68, textAlign: 'right' }]}>IMPORTE</Text>
        </View>

        <View style={styles.itemDataRow}>
          <View style={{ flex: 1, paddingRight: 6 }}>
            <Text style={styles.itemTitle} numberOfLines={compact ? 1 : 2}>
              {order.producto}
            </Text>
            {order.sku ? <Text style={styles.itemSku}>Cód. {order.sku}</Text> : null}
          </View>
          <Text style={styles.itemQtyPrice}>
            {order.cantidad} x S/. {order.precio.toFixed(2)}
          </Text>
          <Text style={styles.itemSubtotal}>S/. {total.toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.dashedDivider} />

      {!compact && (
        <View style={styles.taxRows}>
          <View style={styles.taxLine}>
            <Text style={styles.taxLabel}>Op. Gravada</Text>
            <Text style={styles.taxValue}>S/. {subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.taxLine}>
            <Text style={styles.taxLabel}>I.G.V. (18%)</Text>
            <Text style={styles.taxValue}>S/. {igv.toFixed(2)}</Text>
          </View>
        </View>
      )}

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>TOTAL PAGADO</Text>
        <Text style={styles.totalAmount}>S/. {total.toFixed(2)}</Text>
      </View>

      <View style={styles.stampRow}>
        <View style={styles.stampPill}>
          <Ionicons
            name={order.synced === false ? 'cloud-upload-outline' : 'checkmark-circle'}
            size={13}
            color={colors.done}
          />
          <Text style={styles.stampText}>
            {order.synced === false
              ? 'Comprobante generado · Listo para respaldar'
              : 'Comprobante emitido y respaldado en la nube'}
          </Text>
        </View>
      </View>
    </View>
  );

  if (onPress) {
    return (
      <PressableScale
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Ver comprobante ${receipt.code}`}
      >
        {content}
      </PressableScale>
    );
  }

  return content;
}

interface ModalProps {
  visible: boolean;
  receipt: DigitalReceiptMeta | null;
  order: ReceiptOrderData;
  onClose: () => void;
}

export function PaymentReceiptModal({ visible, receipt, order, onClose }: ModalProps) {
  if (!receipt) return null;

  const { total } = calculateReceiptBreakdown(order.cantidad, order.precio);
  const methodLabel = getPaymentMethodLabel(receipt.method);

  const shareByWhatsApp = () => {
    if (!order.telefono) return;
    const digits = order.telefono.replace(/\D/g, '');
    const intlPhone = digits.length === 9 && digits.startsWith('9') ? `51${digits}` : digits;
    const msg = encodeURIComponent(
      `Hola ${order.clienteNombre}, te enviamos tu comprobante ${receipt.code} de Clínica Veterinaria Amipets:\n` +
        `• Producto: ${order.producto} (x${order.cantidad})\n` +
        `• Medio de pago: ${methodLabel}\n` +
        `• Total pagado: S/. ${total.toFixed(2)}\n` +
        `¡Gracias por tu preferencia!`,
    );
    Linking.openURL(`https://wa.me/${intlPhone}?text=${msg}`).catch(() => {});
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Comprobante {receipt.code}</Text>
            <PressableScale
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Cerrar comprobante"
            >
              <Ionicons name="close" size={20} color={colors.text} />
            </PressableScale>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <PaymentReceiptCard receipt={receipt} order={order} />
          </ScrollView>

          <View style={styles.modalActions}>
            {order.telefono ? (
              <PrimaryButton
                title="Enviar comprobante por WhatsApp"
                onPress={shareByWhatsApp}
                icon="logo-whatsapp"
                trailingIcon={null}
                compact
              />
            ) : null}
            <PrimaryButton
              title="Cerrar"
              onPress={onClose}
              variant="outline"
              trailingIcon={null}
              compact
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  ticket: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    overflow: 'hidden',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    ...shadows.soft,
  },
  ticketCompact: {
    paddingHorizontal: spacing.sm + 2,
    paddingBottom: spacing.sm + 2,
  },
  topAccentBar: {
    height: 5,
    backgroundColor: colors.primary,
    marginHorizontal: -spacing.xl,
    marginBottom: spacing.sm + 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  brandLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  logoCircle: {
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clinicTitle: {
    fontFamily: fonts.bold,
    fontSize: 12.5,
    color: colors.text,
  },
  rucText: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: colors.textMuted,
  },
  boletaBox: {
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignItems: 'center',
  },
  boletaLabel: {
    fontFamily: fonts.bold,
    fontSize: 9,
    color: colors.primaryDark,
    letterSpacing: 0.5,
  },
  boletaCode: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.primary,
  },
  dashedDivider: {
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.borderStrong,
    marginVertical: spacing.xs + 3,
  },
  infoGrid: {
    gap: 3,
  },
  infoLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  infoKey: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.textMuted,
  },
  infoVal: {
    fontFamily: fonts.semibold,
    fontSize: 11.5,
    color: colors.text,
    flexShrink: 1,
    textAlign: 'right',
  },
  methodPill: {
    backgroundColor: colors.accentSoft,
    paddingHorizontal: 8,
    paddingVertical: 1.5,
    borderRadius: radius.pill,
  },
  methodPillText: {
    fontFamily: fonts.semibold,
    fontSize: 10.5,
    color: colors.accent,
  },
  itemBlock: {
    gap: 4,
  },
  itemHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemColLabel: {
    fontFamily: fonts.semibold,
    fontSize: 9.5,
    color: colors.textMuted,
    letterSpacing: 0.3,
  },
  itemDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemTitle: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.text,
  },
  itemSku: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: colors.textMuted,
  },
  itemQtyPrice: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  itemSubtotal: {
    width: 68,
    textAlign: 'right',
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  taxRows: {
    gap: 2,
    marginBottom: 4,
  },
  taxLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  taxLabel: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textMuted,
  },
  taxValue: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceWarm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.md,
  },
  totalLabel: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.text,
  },
  totalAmount: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.primaryDark,
    fontVariant: ['tabular-nums'],
  },
  stampRow: {
    marginTop: 8,
    alignItems: 'center',
  },
  stampPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.doneSoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  stampText: {
    fontFamily: fonts.medium,
    fontSize: 10.5,
    color: colors.done,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalSheet: {
    backgroundColor: colors.background,
    borderRadius: radius.xl,
    padding: spacing.md,
    maxHeight: '88%',
    gap: spacing.sm,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.text,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalActions: {
    gap: spacing.xs,
    marginTop: 2,
  },
});
