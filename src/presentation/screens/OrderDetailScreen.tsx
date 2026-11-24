import React, { useEffect, useMemo, useState } from 'react';
import { Image, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { calculateOrderTotal, orderShortCode } from '../../application/services/orderService';
import {
  buildDigitalReceiptUri,
  generateReceiptCode,
  parseDigitalReceiptUri,
  PAYMENT_METHODS,
  PaymentMethod,
} from '../../application/services/receiptService';
import { ORDER_STATUSES, OrderStatus } from '../../domain/models/order';
import { findCatalogProductAsset } from '../../infrastructure/services/catalogApiService';
import {
  Chip,
  ConfirmDialog,
  EmptyState,
  FadeInView,
  IconTile,
  OrderCategoryChip,
  OrderStatusChip,
  PawBackdrop,
  PaymentReceiptCard,
  PaymentReceiptModal,
  PetAvatar,
  PressableScale,
  PrimaryButton,
  ScreenHeader,
} from '../components';
import { fullName, useAuth } from '../context/AuthContext';
import { useOrders } from '../context/OrdersContext';
import { useToast } from '../context/ToastContext';
import { RootStackParamList } from '../navigation/types';
import { colors, common, fonts, radius, shadows, spacing, typography } from '../theme';
import { formatDateTime, formatRelative } from '../utils/date';
import { ORDER_CATEGORY_META, ORDER_STATUS_META } from '../utils/orderMeta';
import { SPECIES_META } from '../utils/requestMeta';

type Props = NativeStackScreenProps<RootStackParamList, 'OrderDetail'>;

export function OrderDetailScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { orderId } = route.params;
  const { session, isAdmin } = useAuth();
  const { getOrderById, updateOrder, changeOrderStatus, deleteOrder, isOnline, syncNow } =
    useOrders();
  const { showToast } = useToast();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptLoadError, setReceiptLoadError] = useState(false);

  const order = getOrderById(orderId);
  const receiptUriValue = order ? order.comprobanteUrl || order.comprobanteLocalUri : undefined;
  const parsedReceipt = useMemo(
    () => parseDigitalReceiptUri(order?.comprobanteUrl),
    [order?.comprobanteUrl],
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('YAPE_PLIN');
  const [generatingReceipt, setGeneratingReceipt] = useState(false);

  useEffect(() => {
    setReceiptLoadError(false);
    if (parsedReceipt?.method) {
      setPaymentMethod(parsedReceipt.method);
    }
  }, [receiptUriValue, parsedReceipt?.method]);

  if (!order) {
    return (
      <SafeAreaView style={common.screen} edges={['top']}>
        <PawBackdrop variant="detail" />
        <ScreenHeader title="Detalle del Pedido" onBack={() => navigation.goBack()} />
        <EmptyState
          icon="alert-circle-outline"
          title="Pedido no encontrado"
          message="Este pedido fue eliminado o ya no se encuentra disponible."
          actionLabel="Volver al listado"
          onAction={() => navigation.goBack()}
        />
      </SafeAreaView>
    );
  }

  const cat = ORDER_CATEGORY_META[order.categoria] ?? ORDER_CATEGORY_META.ACCESORIOS;
  const catalogAsset = findCatalogProductAsset(order.productoId, order.producto);
  const brandLabel = order.marca ?? catalogAsset?.brand;
  const skuLabel = order.sku ?? catalogAsset?.sku;
  const total = calculateOrderTotal(order.cantidad, order.precio);

  const handleStatusChange = async (newStatus: OrderStatus) => {
    if (newStatus === order.estado) return;
    const prevStatus = order.estado;
    try {
      await changeOrderStatus(order.id, newStatus);
      showToast(
        'success',
        'Estado actualizado',
        `El pedido ${orderShortCode(order.id)} ahora está: ${ORDER_STATUS_META[newStatus].label}.`,
        {
          label: 'Deshacer',
          onPress: () => {
            changeOrderStatus(order.id, prevStatus);
            showToast('info', 'Acción deshecha', `Estado restaurado a ${ORDER_STATUS_META[prevStatus].label}.`);
          },
        },
      );
    } catch (err: any) {
      showToast('error', 'No se pudo actualizar', err?.message || 'Error al actualizar el estado.');
    }
  };

  const handleDelete = async () => {
    if (!isAdmin && order.userId && session?.uid && order.userId !== session.uid) {
      setConfirmDelete(false);
      showToast(
        'info',
        'Permiso requerido',
        'Solo quien registró este pedido o el Director Médico puede eliminarlo.',
      );
      return;
    }
    try {
      await deleteOrder(order.id);
      showToast('info', 'Pedido eliminado', `Se eliminó ${order.producto}.`);
      setConfirmDelete(false);
      navigation.goBack();
    } catch (err: any) {
      setConfirmDelete(false);
      showToast('error', 'Error al eliminar', err?.message || 'No se pudo eliminar el pedido.');
    }
  };

  const handleRepeatOrder = () => {
    if (!catalogAsset) return;
    navigation.navigate('CreateOrder', {
      initialProductId: catalogAsset.id,
      initialQuantity: order.cantidad,
      initialClientName: order.clienteNombre,
      initialPhone: order.telefono,
      initialPetName: order.mascotaNombre,
      initialSpecies: order.especie,
    });
  };

  const callPhone = () => {
    if (!order.telefono) return;
    const cleanPhone = order.telefono.replace(/\s+/g, '');
    Linking.openURL(`tel:${cleanPhone}`).catch(() => {
      showToast('error', 'No se pudo abrir el marcador', `Número: ${order.telefono}`);
    });
  };

  const openWhatsApp = () => {
    if (!order.telefono) return;
    const digits = order.telefono.replace(/\D/g, '');
    const intlPhone = digits.length === 9 && digits.startsWith('9') ? `51${digits}` : digits;
    const text = encodeURIComponent(
      `Hola ${order.clienteNombre}, te escribimos de Amipets sobre tu pedido ${orderShortCode(order.id)} (${order.producto}, x${order.cantidad}, Total S/. ${total.toFixed(2)}). Estado actual: ${ORDER_STATUS_META[order.estado].label}.`,
    );
    Linking.openURL(`https://wa.me/${intlPhone}?text=${text}`).catch(() => {
      showToast('error', 'No se pudo abrir WhatsApp', `Número: ${order.telefono}`);
    });
  };

  const nextAction =
    order.estado === 'PENDIENTE'
      ? { label: 'Iniciar preparación', status: 'EN_PROCESO' as OrderStatus, icon: 'construct-outline' as const }
      : order.estado === 'EN_PROCESO'
      ? { label: 'Marcar como entregado', status: 'ENTREGADO' as OrderStatus, icon: 'checkmark-done-outline' as const }
      : null;

  const isSynced = order.syncStatus === 'SYNCED';
  const receiptUri = order.comprobanteUrl || order.comprobanteLocalUri;

  const generateAndSaveReceipt = async (overrideMethod?: PaymentMethod) => {
    const chosenMethod = overrideMethod ?? paymentMethod;
    setGeneratingReceipt(true);
    try {
      const uri = buildDigitalReceiptUri({
        code: parsedReceipt?.code ?? generateReceiptCode(order.id),
        method: chosenMethod,
        issuedAt: parsedReceipt?.issuedAt ?? new Date().toISOString(),
        cashier: fullName(session) || order.registradoPor || undefined,
      });
      await updateOrder(order.id, {
        comprobanteUrl: uri,
        comprobanteLocalUri: undefined,
      });
      showToast(
        'success',
        'Comprobante emitido y guardado',
        'La boleta digital quedó registrada y sincronizada con el pedido.',
      );
    } catch {
      showToast('error', 'Error', 'No se pudo generar el comprobante.');
    } finally {
      setGeneratingReceipt(false);
    }
  };

  return (
    <SafeAreaView style={common.screen} edges={['top', 'bottom']}>
      <PawBackdrop variant="detail" />
      <ScreenHeader
        title="Detalle del Pedido"
        onBack={() => navigation.goBack()}
        right={
          <PressableScale
            onPress={() => navigation.navigate('CreateOrder', { orderId: order.id })}
            accessibilityRole="button"
            accessibilityLabel="Editar pedido"
            style={styles.editPill}
            testID="order-detail-edit"
          >
            <Ionicons name="create-outline" size={15} color={colors.primaryDark} />
            <Text style={styles.editPillText}>Editar</Text>
          </PressableScale>
        }
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <FadeInView delay={30} distance={8}>
          <View style={styles.heroCard}>
            <View style={styles.heroTopRow}>
              {catalogAsset ? (
                <View style={styles.heroImageFrame}>
                  <Image
                    source={catalogAsset.image}
                    style={styles.heroImage}
                    resizeMode="contain"
                  />
                </View>
              ) : (
                <IconTile icon={cat.icon} color={cat.color} background={cat.background} size={68} />
              )}

              <View style={{ flex: 1, gap: 4 }}>
                {(brandLabel || skuLabel) && (
                  <Text style={styles.brandSkuText} numberOfLines={1}>
                    {[brandLabel, skuLabel].filter(Boolean).join(' · ')}
                  </Text>
                )}
                <View style={styles.titleCodeRow}>
                  <Text style={styles.productTitle} numberOfLines={2}>
                    {order.producto}
                  </Text>
                  <View style={styles.codeBadge}>
                    <Text style={styles.codeText}>{orderShortCode(order.id)}</Text>
                  </View>
                </View>
                <Text style={styles.registeredSub}>
                  Registrado {formatRelative(order.fechaRegistro)}
                  {order.registradoPor ? ` · Por ${order.registradoPor}` : ''}
                </Text>
              </View>
            </View>

            <View style={styles.chipsRow}>
              <OrderCategoryChip category={order.categoria} />
              <OrderStatusChip status={order.estado} />
              {isSynced ? (
                <Chip
                  label="Sincronizado"
                  color={colors.done}
                  background={colors.doneSoft}
                  icon="cloud-done-outline"
                  accessibilityLabel="Pedido sincronizado"
                />
              ) : (
                <PressableScale
                  onPress={() => isOnline && syncNow(false)}
                  disabled={!isOnline}
                  accessibilityRole="button"
                  accessibilityLabel="Pendiente de envío"
                >
                  <Chip
                    label="Pendiente de envío"
                    color={colors.pending}
                    background={colors.pendingSoft}
                    icon="cloud-upload-outline"
                  />
                </PressableScale>
              )}
            </View>

            <View style={styles.metricsStrip}>
              <View style={styles.metricCell}>
                <Text style={styles.metricLabel}>Cantidad</Text>
                <Text style={styles.metricValue}>{order.cantidad} und.</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricCell}>
                <Text style={styles.metricLabel}>Precio unit.</Text>
                <Text style={styles.metricValue}>S/. {order.precio.toFixed(2)}</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricCell}>
                <Text style={styles.metricLabel}>Total</Text>
                <Text style={[styles.metricValue, { color: colors.primaryDark }]}>
                  S/. {total.toFixed(2)}
                </Text>
              </View>
            </View>
          </View>
        </FadeInView>

        <FadeInView delay={80} distance={8}>
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="swap-horizontal-outline" size={18} color={colors.primary} />
              <Text style={typography.heading}>Estado del Pedido</Text>
            </View>
            <Text style={styles.sectionCaption}>
              Selecciona el estado actual de entrega:
            </Text>

            <View style={styles.statusGrid}>
              {ORDER_STATUSES.map((st) => {
                const active = order.estado === st;
                const meta = ORDER_STATUS_META[st];
                return (
                  <PressableScale
                    key={st}
                    onPress={() => handleStatusChange(st)}
                    style={[
                      styles.statusGridCard,
                      active && { borderColor: meta.color, backgroundColor: meta.background, borderWidth: 2 },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`Cambiar estado a ${meta.label}`}
                    testID={`order-status-${st}`}
                  >
                    <Ionicons name={meta.icon} size={17} color={active ? meta.color : colors.textMuted} />
                    <Text
                      style={[
                        styles.statusGridText,
                        active && { color: meta.color, fontFamily: fonts.bold },
                      ]}
                      numberOfLines={1}
                    >
                      {meta.label}
                    </Text>
                  </PressableScale>
                );
              })}
            </View>

            <View style={styles.statusNoticeBox}>
              <Ionicons
                name={ORDER_STATUS_META[order.estado].icon}
                size={15}
                color={ORDER_STATUS_META[order.estado].color}
              />
              <Text style={styles.statusNoticeText}>
                {ORDER_STATUS_META[order.estado].description}
              </Text>
            </View>
          </View>
        </FadeInView>

        <FadeInView delay={120} distance={8}>
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="document-text-outline" size={18} color={colors.primary} />
              <Text style={typography.heading}>Detalles</Text>
            </View>

            {(order.mascotaNombre || order.especie) && (
              <View style={styles.petRow}>
                <PetAvatar species={order.especie} size={38} shape="circle" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.petLabel}>Para mascota</Text>
                  <Text style={styles.petValue}>
                    {order.mascotaNombre
                      ? `${order.mascotaNombre}${order.especie ? ` (${SPECIES_META[order.especie].label})` : ''}`
                      : order.especie
                      ? SPECIES_META[order.especie].label
                      : 'Mascota'}
                  </Text>
                </View>
              </View>
            )}

            <Text style={styles.notesText}>
              {order.notas || 'Sin notas adicionales.'}
            </Text>

            <View style={styles.divider} />

            <View style={styles.metaStack}>
              <View style={styles.metaRow}>
                <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.metaLabel}>Registrado:</Text>
                <Text style={styles.metaVal}>{formatDateTime(order.fechaRegistro)}</Text>
              </View>
              {order.registradoPor && (
                <View style={styles.metaRow}>
                  <Ionicons name="person-circle-outline" size={16} color={colors.textSecondary} />
                  <Text style={styles.metaLabel}>Registrado por:</Text>
                  <Text style={styles.metaVal}>{order.registradoPor}</Text>
                </View>
              )}
            </View>
          </View>
        </FadeInView>

        <FadeInView delay={160} distance={8}>
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="person-outline" size={18} color={colors.primary} />
              <Text style={typography.heading}>Cliente</Text>
            </View>

            <View style={styles.clientInfoRow}>
              <View style={styles.clientAvatar}>
                <Text style={styles.clientAvatarText}>
                  {order.clienteNombre.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.clientName}>{order.clienteNombre}</Text>
                <Text style={styles.clientPhone}>
                  {order.telefono || 'Sin teléfono registrado'}
                </Text>
              </View>
              {order.telefono && (
                <View style={styles.contactButtonsRow}>
                  <PressableScale
                    onPress={openWhatsApp}
                    style={styles.whatsappButton}
                    accessibilityRole="button"
                    accessibilityLabel={`Enviar WhatsApp a ${order.clienteNombre}`}
                  >
                    <Ionicons name="logo-whatsapp" size={16} color={colors.white} />
                    <Text style={styles.contactText}>WhatsApp</Text>
                  </PressableScale>
                  <PressableScale
                    onPress={callPhone}
                    style={styles.callButton}
                    accessibilityRole="button"
                    accessibilityLabel={`Llamar a ${order.clienteNombre}`}
                  >
                    <Ionicons name="call" size={15} color={colors.white} />
                    <Text style={styles.contactText}>Llamar</Text>
                  </PressableScale>
                </View>
              )}
            </View>
          </View>
        </FadeInView>

        <FadeInView delay={190} distance={8}>
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="receipt-outline" size={18} color={colors.primary} />
              <Text style={typography.heading}>Comprobante de pago</Text>
            </View>

            {parsedReceipt ? (
              <View style={styles.receiptBox}>
                <PaymentReceiptCard
                  receipt={parsedReceipt}
                  order={{
                    clienteNombre: order.clienteNombre,
                    telefono: order.telefono,
                    mascotaNombre: order.mascotaNombre,
                    producto: order.producto,
                    sku: skuLabel,
                    cantidad: order.cantidad,
                    precio: order.precio,
                    registradoPor: order.registradoPor,
                    synced: isSynced,
                  }}
                  compact
                  onPress={() => setShowReceiptModal(true)}
                />

                <View style={styles.paymentMethodsRow}>
                  {PAYMENT_METHODS.map((pm) => {
                    const active = parsedReceipt.method === pm.value;
                    return (
                      <PressableScale
                        key={pm.value}
                        onPress={() => {
                          setPaymentMethod(pm.value);
                          if (!active) void generateAndSaveReceipt(pm.value);
                        }}
                        style={[
                          styles.paymentMethodChip,
                          active && styles.paymentMethodChipActive,
                        ]}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: active }}
                      >
                        <Ionicons
                          name={pm.icon}
                          size={13}
                          color={active ? colors.primaryDark : colors.textMuted}
                        />
                        <Text
                          style={[
                            styles.paymentMethodText,
                            active && styles.paymentMethodTextActive,
                          ]}
                        >
                          {pm.label}
                        </Text>
                      </PressableScale>
                    );
                  })}
                </View>

                <View style={styles.receiptMetaRow}>
                  <Text style={styles.receiptCaption}>
                    Toca la boleta para ampliar o enviar al cliente
                  </Text>
                  <PressableScale
                    onPress={() => setShowReceiptModal(true)}
                    style={styles.receiptChangeBtn}
                    accessibilityRole="button"
                  >
                    <Text style={styles.receiptChangeText}>Ver boleta</Text>
                  </PressableScale>
                </View>
              </View>
            ) : receiptUri ? (
              <View style={styles.receiptBox}>
                {receiptLoadError ? (
                  <View style={styles.receiptOfflineBox}>
                    <Ionicons name="image-outline" size={24} color={colors.textMuted} />
                    <Text style={styles.receiptOfflineText}>
                      Comprobante disponible al conectar a internet
                    </Text>
                  </View>
                ) : (
                  <PressableScale
                    onPress={() => setShowReceiptModal(true)}
                    style={styles.receiptImageWrap}
                    accessibilityRole="button"
                    accessibilityLabel="Ver comprobante de pago en pantalla completa"
                  >
                    <Image
                      source={{ uri: receiptUri }}
                      style={styles.receiptImage}
                      resizeMode="cover"
                      onError={() => setReceiptLoadError(true)}
                    />
                  </PressableScale>
                )}
                <View style={styles.receiptMetaRow}>
                  <Text style={styles.receiptCaption}>
                    {receiptLoadError ? 'Guardado en la nube' : 'Toca la imagen para ampliar'}
                  </Text>
                  <PressableScale
                    onPress={() => generateAndSaveReceipt()}
                    style={styles.receiptChangeBtn}
                    accessibilityRole="button"
                  >
                    <Text style={styles.receiptChangeText}>Generar boleta digital</Text>
                  </PressableScale>
                </View>
              </View>
            ) : (
              <View style={styles.receiptEmptyWrap}>
                <Text style={styles.receiptEmptyText}>
                  Selecciona el medio de pago y emite el comprobante digital del pedido.
                </Text>
                <View style={styles.paymentMethodsRow}>
                  {PAYMENT_METHODS.map((pm) => {
                    const active = paymentMethod === pm.value;
                    return (
                      <PressableScale
                        key={pm.value}
                        onPress={() => setPaymentMethod(pm.value)}
                        style={[
                          styles.paymentMethodChip,
                          active && styles.paymentMethodChipActive,
                        ]}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: active }}
                      >
                        <Ionicons
                          name={pm.icon}
                          size={14}
                          color={active ? colors.primaryDark : colors.textMuted}
                        />
                        <Text
                          style={[
                            styles.paymentMethodText,
                            active && styles.paymentMethodTextActive,
                          ]}
                        >
                          {pm.label}
                        </Text>
                      </PressableScale>
                    );
                  })}
                </View>
                <PrimaryButton
                  title="Generar comprobante y guardar"
                  onPress={() => generateAndSaveReceipt()}
                  loading={generatingReceipt}
                  variant="secondary"
                  icon="receipt-outline"
                  trailingIcon={null}
                  compact
                />
              </View>
            )}
          </View>
        </FadeInView>

        <View style={styles.footerActions}>
          {catalogAsset && (
            <PrimaryButton
              title="Repetir pedido"
              onPress={handleRepeatOrder}
              variant="secondary"
              icon="repeat-outline"
              trailingIcon={null}
              compact
              testID="order-detail-repeat"
            />
          )}
          <PrimaryButton
            title="Eliminar este pedido"
            onPress={() => setConfirmDelete(true)}
            variant="danger"
            icon="trash-outline"
            trailingIcon={null}
            compact
            testID="order-detail-delete"
          />
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 14) }]}>
        {nextAction ? (
          <PrimaryButton
            title={nextAction.label}
            onPress={() => handleStatusChange(nextAction.status)}
            icon={nextAction.icon}
            style={styles.mainActionButton}
          />
        ) : (
          <PrimaryButton
            title="Editar Pedido"
            onPress={() => navigation.navigate('CreateOrder', { orderId: order.id })}
            icon="create-outline"
            variant="outline"
            style={styles.mainActionButton}
          />
        )}
      </View>

      <ConfirmDialog
        visible={confirmDelete}
        title="¿Eliminar pedido?"
        message={`¿Seguro que deseas eliminar el pedido "${order.producto}" de ${order.clienteNombre}? Esta acción no se puede deshacer.`}
        confirmLabel="Sí, eliminar"
        cancelLabel="Cancelar"
        destructive
        icon="trash"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
      />

      {parsedReceipt ? (
        <PaymentReceiptModal
          visible={showReceiptModal}
          receipt={parsedReceipt}
          order={{
            clienteNombre: order.clienteNombre,
            telefono: order.telefono,
            mascotaNombre: order.mascotaNombre,
            producto: order.producto,
            sku: skuLabel,
            cantidad: order.cantidad,
            precio: order.precio,
            registradoPor: order.registradoPor,
            synced: isSynced,
          }}
          onClose={() => setShowReceiptModal(false)}
        />
      ) : (
        <Modal
          visible={showReceiptModal && Boolean(receiptUri)}
          transparent
          animationType="fade"
          onRequestClose={() => setShowReceiptModal(false)}
        >
          <View style={styles.receiptModalBackdrop}>
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => setShowReceiptModal(false)}
            />
            <View style={styles.receiptModalCard}>
              <View style={styles.receiptModalHeader}>
                <Text style={styles.receiptModalTitle}>Comprobante {orderShortCode(order.id)}</Text>
                <PressableScale
                  onPress={() => setShowReceiptModal(false)}
                  style={styles.receiptModalClose}
                  accessibilityRole="button"
                  accessibilityLabel="Cerrar vista del comprobante"
                >
                  <Ionicons name="close" size={20} color={colors.text} />
                </PressableScale>
              </View>
              {receiptUri && (
                <Image
                  source={{ uri: receiptUri }}
                  style={styles.receiptFullImage}
                  resizeMode="contain"
                />
              )}
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xxl,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
    gap: spacing.md,
  },
  editPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  editPillText: { fontFamily: fonts.medium, fontSize: 13, color: colors.primaryDark },
  heroCard: { ...common.card, padding: spacing.md, gap: spacing.md },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  heroImageFrame: {
    width: 68,
    height: 68,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  brandSkuText: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.35,
  },
  titleCodeRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.xs },
  productTitle: { fontFamily: fonts.bold, fontSize: 17, color: colors.text, flex: 1, lineHeight: 22 },
  codeBadge: {
    backgroundColor: colors.surfaceWarm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  codeText: { fontFamily: fonts.semibold, fontSize: 11.5, color: colors.primaryDark },
  registeredSub: { fontFamily: fonts.regular, fontSize: 12.5, color: colors.textSecondary },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  metricsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metricCell: { flex: 1, alignItems: 'center' },
  metricLabel: { fontFamily: fonts.regular, fontSize: 11, color: colors.textMuted },
  metricValue: { fontFamily: fonts.bold, fontSize: 14, color: colors.text, fontVariant: ['tabular-nums'], marginTop: 2 },
  metricDivider: { width: 1, height: 28, backgroundColor: colors.border },

  sectionCard: { ...common.card, padding: spacing.lg },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: 4 },
  sectionCaption: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary, marginBottom: spacing.sm },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  statusGridCard: {
    flexBasis: '48%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    minHeight: 44,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  statusGridText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.textSecondary,
  },
  statusNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusNoticeText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSecondary,
  },

  petRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceWarm,
    padding: spacing.sm,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  petLabel: { fontFamily: fonts.regular, fontSize: 11.5, color: colors.textMuted },
  petValue: { fontFamily: fonts.semibold, fontSize: 13.5, color: colors.text },
  notesText: { fontFamily: fonts.regular, fontSize: 14, color: colors.text, lineHeight: 21 },
  divider: { height: 1, backgroundColor: colors.divider, marginVertical: spacing.md },
  metaStack: { gap: spacing.xs },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  metaLabel: { fontFamily: fonts.semibold, fontSize: 12, color: colors.textSecondary },
  metaVal: { fontFamily: fonts.regular, fontSize: 12, color: colors.text },

  clientInfoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  clientAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clientAvatarText: { fontFamily: fonts.bold, fontSize: 17, color: colors.primaryDark },
  clientName: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text },
  clientPhone: { fontFamily: fonts.regular, fontSize: 12.5, color: colors.textSecondary, marginTop: 2 },
  contactButtonsRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  whatsappButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.done,
    paddingHorizontal: spacing.sm,
    paddingVertical: 9,
    borderRadius: radius.pill,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 9,
    borderRadius: radius.pill,
  },
  contactText: { fontFamily: fonts.semibold, fontSize: 12, color: colors.white },

  footerActions: {
    marginTop: spacing.xs,
    gap: spacing.xs,
  },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...shadows.raised,
  },
  mainActionButton: { width: '100%', maxWidth: 500, alignSelf: 'center' },

  receiptBox: { gap: spacing.xs, marginTop: spacing.xs },
  receiptImageWrap: {
    height: 170,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  receiptOfflineBox: {
    height: 112,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
  },
  receiptOfflineText: {
    fontFamily: fonts.medium,
    fontSize: 12.5,
    color: colors.textMuted,
    textAlign: 'center',
  },
  receiptImage: { width: '100%', height: '100%' },
  receiptMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  receiptCaption: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted },
  receiptChangeBtn: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  receiptChangeText: { fontFamily: fonts.semibold, fontSize: 12, color: colors.primaryDark },
  receiptEmptyWrap: { gap: spacing.sm, marginTop: spacing.xs },
  receiptEmptyText: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary },
  paymentMethodsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: 2,
  },
  paymentMethodChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceWarm,
  },
  paymentMethodChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  paymentMethodText: {
    fontFamily: fonts.medium,
    fontSize: 11.5,
    color: colors.textMuted,
  },
  paymentMethodTextActive: {
    fontFamily: fonts.semibold,
    color: colors.primaryDark,
  },
  receiptModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  receiptModalCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    width: '100%',
    maxWidth: 460,
    gap: spacing.sm,
    ...shadows.raised,
  },
  receiptModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  receiptModalTitle: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },
  receiptModalClose: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  receiptFullImage: {
    width: '100%',
    height: 380,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
  },
});
