import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NavigationAction, usePreventRemove } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  calculateOrderTotal,
  OrderFormErrors,
  orderShortCode,
  validateOrderInput,
} from '../../application/services/orderService';
import {
  buildDigitalReceiptUri,
  generateReceiptCode,
  parseDigitalReceiptUri,
  PAYMENT_METHODS,
  PaymentMethod,
} from '../../application/services/receiptService';
import { OrderInput } from '../../domain/models/order';
import { CatalogProduct } from '../../domain/models/product';
import { SPECIES, Species } from '../../domain/models/request';
import { findCatalogProductAsset } from '../../infrastructure/services/catalogApiService';
import {
  CatalogPickerModal,
  ConfirmDialog,
  EmptyState,
  FadeInView,
  FormField,
  IconTile,
  OrderCategoryChip,
  PawBackdrop,
  PaymentReceiptCard,
  PaymentReceiptModal,
  PetAvatar,
  PressableScale,
  PrimaryButton,
  ScreenHeader,
} from '../components';
import { fullName, useAuth } from '../context/AuthContext';
import { useCatalog } from '../context/CatalogContext';
import { useOrders } from '../context/OrdersContext';
import { useRequests } from '../context/RequestsContext';
import { useToast } from '../context/ToastContext';
import { RootStackParamList } from '../navigation/types';
import { colors, common, fonts, radius, spacing, typography } from '../theme';
import { formatDateTime } from '../utils/date';
import { TARGET_SPECIES_META } from '../utils/orderMeta';
import { SPECIES_META } from '../utils/requestMeta';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateOrder'>;

interface OrderFormState {
  productoId?: number;
  cantidad: string;
  clienteNombre: string;
  telefono: string;
  mascotaNombre: string;
  especie: Species;
  notas: string;
  comprobanteLocalUri?: string;
  comprobanteUrl?: string;
}

interface ClientSuggestion {
  name: string;
  phone?: string;
}

export function CreateOrderScreen({ navigation, route }: Props) {
  const { session } = useAuth();
  const { getProductById, getAvailableStock } = useCatalog();
  const { orders, getOrderById, createOrder, updateOrder } = useOrders();
  const { requests } = useRequests();
  const { showToast } = useToast();

  const editingId = route.params?.orderId;
  const existing = editingId ? getOrderById(editingId) : undefined;
  const isEdit = Boolean(editingId);

  const initialSetup = useMemo<{ form: OrderFormState; showPet: boolean }>(() => {
    if (existing) {
      const resolvedProductId =
        existing.productoId ?? findCatalogProductAsset(undefined, existing.producto)?.id;
      return {
        form: {
          productoId: resolvedProductId,
          cantidad: String(existing.cantidad),
          clienteNombre: existing.clienteNombre,
          telefono: existing.telefono ?? '',
          mascotaNombre: existing.mascotaNombre ?? '',
          especie: existing.especie ?? 'PERRO',
          notas: existing.notas ?? '',
          comprobanteLocalUri: existing.comprobanteLocalUri,
          comprobanteUrl: existing.comprobanteUrl,
        },
        showPet: Boolean(existing.mascotaNombre || existing.especie),
      };
    }

    const hasInitialPet = Boolean(route.params?.initialPetName || route.params?.initialSpecies);
    return {
      form: {
        productoId: route.params?.initialProductId,
        cantidad: String(Math.max(1, route.params?.initialQuantity ?? 1)),
        clienteNombre: route.params?.initialClientName ?? '',
        telefono: route.params?.initialPhone ?? '',
        mascotaNombre: route.params?.initialPetName ?? '',
        especie: route.params?.initialSpecies ?? 'PERRO',
        notas: '',
      },
      showPet: hasInitialPet,
    };
  }, []);

  const [form, setForm] = useState<OrderFormState>(initialSetup.form);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    () => parseDigitalReceiptUri(initialSetup.form.comprobanteUrl)?.method ?? 'YAPE_PLIN',
  );
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showPetSection, setShowPetSection] = useState<boolean>(initialSetup.showPet);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [hideSuggestions, setHideSuggestions] = useState(false);
  const [errors, setErrors] = useState<OrderFormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [now] = useState(() => new Date());
  const [pendingAction, setPendingAction] = useState<NavigationAction | null>(null);

  const savedRef = useRef(false);
  const phoneRef = useRef<any>(null);
  const petRef = useRef<any>(null);
  const notesRef = useRef<any>(null);

  const selectedProduct = useMemo<CatalogProduct | undefined>(() => {
    if (!form.productoId) return undefined;
    return getProductById(form.productoId) ?? findCatalogProductAsset(form.productoId);
  }, [form.productoId, getProductById]);

  const maxAvailableStock = useMemo(() => {
    if (!selectedProduct) return 0;
    return getAvailableStock(selectedProduct.id, editingId);
  }, [selectedProduct, getAvailableStock, editingId]);

  useEffect(() => {
    if (submitted) {
      setErrors(
        validateOrderInput({
          clienteNombre: form.clienteNombre,
          telefono: form.telefono,
          productoId: selectedProduct?.id,
          producto: selectedProduct?.title ?? '',
          cantidad: form.cantidad,
          precio: selectedProduct?.price ?? 0,
          maxStock: selectedProduct ? maxAvailableStock : undefined,
          notas: form.notas,
        }),
      );
    }
  }, [form, selectedProduct, maxAvailableStock, submitted]);

  const isDirty =
    JSON.stringify(form) !== JSON.stringify(initialSetup.form) ||
    showPetSection !== initialSetup.showPet;

  usePreventRemove(isDirty && !saving, ({ data }) => {
    if (savedRef.current) navigation.dispatch(data.action);
    else setPendingAction(data.action);
  });

  const update = <K extends keyof OrderFormState>(key: K, value: OrderFormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const uniqueClients = useMemo<ClientSuggestion[]>(() => {
    const map = new Map<string, ClientSuggestion>();
    const addEntry = (name?: string, phone?: string) => {
      const cleanName = (name ?? '').trim();
      if (!cleanName) return;
      const key = cleanName.toLowerCase();
      const cleanPhone = phone?.trim() || undefined;
      const prev = map.get(key);
      if (!prev) {
        map.set(key, { name: cleanName, phone: cleanPhone });
      } else if (!prev.phone && cleanPhone) {
        map.set(key, { name: prev.name, phone: cleanPhone });
      }
    };

    for (const o of orders) addEntry(o.clienteNombre, o.telefono);
    for (const r of requests) addEntry(r.clienteNombre, r.telefono);

    return Array.from(map.values());
  }, [orders, requests]);

  const clientSuggestions = useMemo(() => {
    if (hideSuggestions) return [];
    const q = form.clienteNombre.trim().toLowerCase();
    if (q.length < 1) return [];
    const matches = uniqueClients.filter((c) => c.name.toLowerCase().includes(q));
    if (matches.length === 1 && matches[0].name.toLowerCase() === q) {
      return [];
    }
    return matches.slice(0, 3);
  }, [form.clienteNombre, uniqueClients, hideSuggestions]);

  const parsedQty = Math.max(0, parseInt(form.cantidad || '0', 10) || 0);
  const remainingStock = Math.max(0, maxAvailableStock - parsedQty);
  const unitPrice = selectedProduct?.price ?? 0;
  const liveTotal = calculateOrderTotal(parsedQty, unitPrice);

  const adjustQuantity = (delta: number) => {
    const upperBound = Math.max(1, maxAvailableStock);
    const current = parseInt(form.cantidad || '1', 10) || 1;
    const next = Math.max(1, Math.min(upperBound, current + delta));
    update('cantidad', String(next));
  };

  const handleSelectProduct = (product: CatalogProduct) => {
    const stockForProduct = getAvailableStock(product.id, editingId);
    const currentQty = Math.max(1, parseInt(form.cantidad || '1', 10) || 1);
    const nextQty = stockForProduct > 0 ? Math.min(currentQty, stockForProduct) : 1;

    setForm((prev) => ({
      ...prev,
      productoId: product.id,
      cantidad: String(nextQty),
    }));
    setPickerVisible(false);
  };

  const handlePickClientSuggestion = (suggestion: ClientSuggestion) => {
    setForm((prev) => ({
      ...prev,
      clienteNombre: suggestion.name,
      telefono: suggestion.phone ?? prev.telefono,
    }));
    setHideSuggestions(true);
  };

  const handleRemovePet = () => {
    setShowPetSection(false);
    setForm((prev) => ({
      ...prev,
      mascotaNombre: '',
      especie: 'PERRO',
    }));
  };

  const parsedReceipt = useMemo(
    () => parseDigitalReceiptUri(form.comprobanteUrl),
    [form.comprobanteUrl],
  );

  const handleSelectPaymentMethod = (method: PaymentMethod) => {
    setPaymentMethod(method);
    if (parsedReceipt) {
      const updatedUri = buildDigitalReceiptUri({
        ...parsedReceipt,
        method,
      });
      setForm((prev) => ({
        ...prev,
        comprobanteUrl: updatedUri,
        comprobanteLocalUri: undefined,
      }));
    }
  };

  const handleGenerateReceipt = () => {
    if (!selectedProduct) {
      showToast('info', 'Elige un producto', 'Selecciona primero un artículo del catálogo.');
      return;
    }
    const uri = buildDigitalReceiptUri({
      code: parsedReceipt?.code ?? generateReceiptCode(editingId),
      method: paymentMethod,
      issuedAt: parsedReceipt?.issuedAt ?? new Date().toISOString(),
      cashier: fullName(session) || undefined,
    });
    setForm((prev) => ({
      ...prev,
      comprobanteUrl: uri,
      comprobanteLocalUri: undefined,
    }));
    showToast(
      'success',
      'Comprobante generado',
      'Se adjuntó la boleta digital y se respaldará al guardar el pedido.',
    );
  };

  const handleSave = async () => {
    setSubmitted(true);
    const validation = validateOrderInput({
      clienteNombre: form.clienteNombre,
      telefono: form.telefono,
      productoId: selectedProduct?.id,
      producto: selectedProduct?.title ?? '',
      cantidad: form.cantidad,
      precio: selectedProduct?.price ?? 0,
      maxStock: selectedProduct ? maxAvailableStock : undefined,
      notas: form.notas,
    });
    setErrors(validation);

    if (Object.keys(validation).length > 0 || !selectedProduct) {
      showToast(
        'error',
        'Revisa el formulario',
        'Completa los campos obligatorios marcados en rojo.',
      );
      return;
    }

    const input: OrderInput = {
      userId: session?.uid,
      clienteNombre: form.clienteNombre.trim(),
      telefono: form.telefono.trim() || undefined,
      mascotaNombre: showPetSection ? form.mascotaNombre.trim() || undefined : undefined,
      especie: showPetSection ? form.especie : undefined,
      productoId: selectedProduct.id,
      marca: selectedProduct.brand,
      sku: selectedProduct.sku,
      categoria: selectedProduct.category,
      producto: selectedProduct.title,
      cantidad: parseInt(form.cantidad, 10),
      precio: Number(selectedProduct.price.toFixed(2)),
      notas: form.notas.trim() || undefined,
      comprobanteLocalUri: form.comprobanteLocalUri,
      comprobanteUrl: form.comprobanteUrl,
      ...(isEdit
        ? {}
        : {
            registradoPor: fullName(session) || undefined,
            registradoPorUsuario: session?.email,
          }),
    };

    setSaving(true);
    savedRef.current = true;
    try {
      if (isEdit && editingId) {
        await updateOrder(editingId, input);
        showToast('success', 'Cambios guardados', `Se actualizó el pedido de ${input.producto}.`);
        navigation.goBack();
      } else {
        const created = await createOrder(input);
        showToast('success', 'Pedido registrado', `${created.producto} para ${created.clienteNombre}.`);
        navigation.replace('OrderDetail', { orderId: created.id });
      }
    } catch (err: any) {
      savedRef.current = false;
      setSaving(false);
      showToast('error', 'Error al guardar', err?.message || 'No se pudo almacenar el pedido.');
    }
  };

  if (isEdit && !existing) {
    return (
      <SafeAreaView style={common.screen}>
        <PawBackdrop variant="detail" />
        <ScreenHeader title="Editar pedido" onBack={() => navigation.goBack()} />
        <EmptyState
          icon="alert-circle-outline"
          title="Pedido no encontrado"
          message="Es posible que haya sido eliminado de la base local."
          actionLabel="Volver"
          onAction={() => navigation.goBack()}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={common.screen} edges={['top', 'bottom']}>
      <PawBackdrop variant="detail" />
      <ScreenHeader
        title={isEdit ? 'Editar pedido' : 'Nuevo pedido'}
        onBack={() => navigation.goBack()}
        right={existing ? <Text style={styles.code}>{orderShortCode(existing.id)}</Text> : undefined}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <FadeInView delay={40} distance={8}>
            <View style={styles.card}>
              <CardTitle icon="bag-handle-outline" title="Producto del catálogo" required />

              {!selectedProduct ? (
                <View style={styles.selectorWrap}>
                  <PressableScale
                    onPress={() => setPickerVisible(true)}
                    style={[
                      styles.emptySelectorBox,
                      !!errors.producto && styles.inputErrorBorder,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Seleccionar producto del catálogo"
                    testID="order-select-product"
                  >
                    <View style={styles.emptySelectorIcon}>
                      <Ionicons name="storefront-outline" size={24} color={colors.primaryDark} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.emptySelectorTitle}>Seleccionar producto del catálogo</Text>
                      <Text style={styles.emptySelectorSub}>
                        Elige un producto para cargar su precio y stock
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                  </PressableScale>
                  {errors.producto && (
                    <View style={styles.errorRow}>
                      <Ionicons name="alert-circle" size={14} color={colors.danger} />
                      <Text style={styles.inlineErr}>{errors.producto}</Text>
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.selectedWrap}>
                  <View style={styles.selectedCard}>
                    <View style={styles.selectedImageBox}>
                      <Image
                        source={selectedProduct.image}
                        style={styles.selectedImage}
                        resizeMode="contain"
                      />
                    </View>
                    <View style={{ flex: 1, gap: 4 }}>
                      <View style={styles.selectedTopRow}>
                        <Text style={styles.selectedBrandSku} numberOfLines={1}>
                          {selectedProduct.brand} · {selectedProduct.sku}
                        </Text>
                        <PressableScale
                          onPress={() => setPickerVisible(true)}
                          style={styles.changeBtn}
                          accessibilityRole="button"
                          accessibilityLabel="Cambiar producto del catálogo"
                          testID="order-change-product"
                        >
                          <Text style={styles.changeBtnText}>Cambiar</Text>
                        </PressableScale>
                      </View>

                      <Text style={styles.selectedTitle} numberOfLines={2}>
                        {selectedProduct.title}
                      </Text>

                      <View style={styles.selectedMetaRow}>
                        <OrderCategoryChip category={selectedProduct.category} />
                        <View
                          style={[
                            styles.speciesTag,
                            {
                              backgroundColor:
                                TARGET_SPECIES_META[selectedProduct.targetSpecies].background,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.speciesTagText,
                              { color: TARGET_SPECIES_META[selectedProduct.targetSpecies].color },
                            ]}
                          >
                            {TARGET_SPECIES_META[selectedProduct.targetSpecies].label}
                          </Text>
                        </View>
                        <Text
                          style={[
                            styles.stockHintText,
                            (maxAvailableStock <= 0 || parsedQty > maxAvailableStock) && {
                              color: colors.dangerStrong,
                            },
                            maxAvailableStock > 0 &&
                              parsedQty <= maxAvailableStock &&
                              remainingStock === 0 && { color: colors.pending },
                          ]}
                        >
                          {maxAvailableStock <= 0
                            ? 'Sin stock'
                            : parsedQty > maxAvailableStock
                            ? 'Excede stock'
                            : `${remainingStock} disp.`}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.qtyPriceRow}>
                    <View style={styles.qtyCol}>
                      <Text style={styles.inputLabel}>
                        Cantidad <Text style={{ color: colors.danger }}>*</Text>
                      </Text>
                      <View style={[styles.qtyBox, !!errors.cantidad && styles.inputErrorBorder]}>
                        <PressableScale
                          onPress={() => adjustQuantity(-1)}
                          disabled={parsedQty <= 1}
                          style={styles.qtyBtn}
                          accessibilityRole="button"
                          accessibilityLabel="Disminuir cantidad"
                        >
                          <Ionicons name="remove" size={18} color={colors.text} />
                        </PressableScale>
                        <TextInput
                          testID="order-form-qty"
                          value={form.cantidad}
                          onChangeText={(t) => update('cantidad', t.replace(/[^\d]/g, ''))}
                          keyboardType="number-pad"
                          maxLength={3}
                          style={styles.qtyInput}
                          accessibilityLabel="Cantidad"
                        />
                        <PressableScale
                          onPress={() => adjustQuantity(1)}
                          disabled={parsedQty >= maxAvailableStock}
                          style={styles.qtyBtn}
                          accessibilityRole="button"
                          accessibilityLabel="Aumentar cantidad"
                        >
                          <Ionicons name="add" size={18} color={colors.text} />
                        </PressableScale>
                      </View>
                      {errors.cantidad ? (
                        <Text style={styles.inlineErr}>{errors.cantidad}</Text>
                      ) : (
                        <Text style={styles.stockMaxCaption}>
                          {maxAvailableStock <= 0
                            ? 'Sin stock disponible'
                            : parsedQty > maxAvailableStock
                            ? `Máximo ${maxAvailableStock} disponibles`
                            : `Quedan ${remainingStock} de ${maxAvailableStock} disp.`}
                        </Text>
                      )}
                    </View>

                    <View style={styles.priceCol}>
                      <Text style={styles.inputLabel}>Precio unitario</Text>
                      <View style={styles.readonlyPriceBox}>
                        <Text style={styles.currencyLabel}>S/.</Text>
                        <Text style={styles.readonlyPriceVal}>
                          {selectedProduct.price.toFixed(2)}
                        </Text>
                      </View>
                      <Text style={styles.stockMaxCaption}>Precio oficial de catálogo</Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
          </FadeInView>

          <FadeInView delay={90} distance={8}>
            <View style={styles.card}>
              <CardTitle icon="person-outline" title="Datos del cliente" />
              <FormField
                testID="order-form-client"
                label="Nombre del cliente"
                required
                icon="person-circle-outline"
                placeholder="Ej. María Gómez"
                value={form.clienteNombre}
                onChangeText={(t) => {
                  setHideSuggestions(false);
                  update('clienteNombre', t);
                }}
                maxLength={60}
                autoCapitalize="words"
                returnKeyType="next"
                onSubmitEditing={() => phoneRef.current?.focus()}
                error={errors.clienteNombre}
              />

              {clientSuggestions.length > 0 && (
                <View style={styles.suggestionsBox}>
                  <Text style={styles.suggestionsTitle}>Clientes registrados</Text>
                  {clientSuggestions.map((s) => (
                    <PressableScale
                      key={s.name.toLowerCase()}
                      onPress={() => handlePickClientSuggestion(s)}
                      style={styles.suggestionRow}
                      accessibilityRole="button"
                      accessibilityLabel={`Elegir cliente ${s.name}`}
                    >
                      <Ionicons name="person-outline" size={14} color={colors.primaryDark} />
                      <Text style={styles.suggestionName} numberOfLines={1}>
                        {s.name}
                      </Text>
                      {s.phone && <Text style={styles.suggestionPhone}>{s.phone}</Text>}
                    </PressableScale>
                  ))}
                </View>
              )}

              <FormField
                ref={phoneRef}
                testID="order-form-phone"
                label="Teléfono / WhatsApp (opcional)"
                icon="call-outline"
                placeholder="Ej. 987 654 321"
                value={form.telefono}
                onChangeText={(t) => update('telefono', t.replace(/[^\d\s+()-]/g, ''))}
                keyboardType="phone-pad"
                maxLength={18}
                returnKeyType="next"
                onSubmitEditing={() =>
                  showPetSection ? petRef.current?.focus() : notesRef.current?.focus()
                }
                error={errors.telefono}
              />

              {!showPetSection ? (
                <PressableScale
                  onPress={() => setShowPetSection(true)}
                  style={styles.addPetRow}
                  accessibilityRole="button"
                  accessibilityLabel="Asociar a una mascota opcional"
                  testID="order-add-pet"
                >
                  <Ionicons name="paw-outline" size={16} color={colors.primaryDark} />
                  <Text style={styles.addPetText}>+ Asociar a una mascota (opcional)</Text>
                </PressableScale>
              ) : (
                <View style={styles.petSectionBox}>
                  <View style={styles.petSectionHeader}>
                    <View style={styles.petHeaderLeft}>
                      <Ionicons name="paw-outline" size={15} color={colors.primaryDark} />
                      <Text style={styles.petHeaderTitle}>Mascota</Text>
                    </View>
                    <Pressable
                      onPress={handleRemovePet}
                      accessibilityRole="button"
                      accessibilityLabel="Quitar datos de mascota"
                      hitSlop={8}
                    >
                      <Text style={styles.removePetText}>Quitar</Text>
                    </Pressable>
                  </View>

                  <View style={styles.speciesRow} accessibilityRole="radiogroup">
                    {SPECIES.map((s) => {
                      const selected = form.especie === s;
                      return (
                        <Pressable
                          key={s}
                          onPress={() => update('especie', s)}
                          style={styles.speciesItem}
                          accessibilityRole="radio"
                          accessibilityState={{ selected }}
                          accessibilityLabel={SPECIES_META[s].label}
                        >
                          <View style={[styles.speciesRing, selected && styles.speciesRingActive]}>
                            <PetAvatar species={s} size={42} shape="circle" muted={!selected} />
                          </View>
                          <Text
                            style={[styles.speciesLabel, selected && styles.speciesLabelActive]}
                          >
                            {SPECIES_META[s].label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <FormField
                    ref={petRef}
                    label="Nombre de la mascota (opcional)"
                    icon="paw-outline"
                    placeholder="Ej. Toby"
                    value={form.mascotaNombre}
                    onChangeText={(t) => update('mascotaNombre', t)}
                    maxLength={30}
                    autoCapitalize="words"
                    returnKeyType="next"
                    onSubmitEditing={() => notesRef.current?.focus()}
                  />
                </View>
              )}
            </View>
          </FadeInView>

          <FadeInView delay={130} distance={8}>
            <View style={styles.card}>
              <CardTitle icon="document-text-outline" title="Notas de entrega" />
              <FormField
                ref={notesRef}
                testID="order-form-notes"
                label="Indicaciones adicionales (opcional)"
                placeholder="Indicaciones de entrega, horario o referencia."
                value={form.notas}
                onChangeText={(t) => update('notas', t)}
                multiline
                maxLength={250}
                showCounter
                error={errors.notas}
              />

              <Text style={styles.inputLabel}>Comprobante de pago (opcional)</Text>
              <View style={styles.paymentMethodsRow}>
                {PAYMENT_METHODS.map((pm) => {
                  const active = paymentMethod === pm.value;
                  return (
                    <PressableScale
                      key={pm.value}
                      onPress={() => handleSelectPaymentMethod(pm.value)}
                      style={[styles.paymentMethodChip, active && styles.paymentMethodChipActive]}
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

              {parsedReceipt ? (
                <View style={{ gap: spacing.xs, marginBottom: spacing.xs }}>
                  <PaymentReceiptCard
                    receipt={parsedReceipt}
                    order={{
                      clienteNombre: form.clienteNombre.trim() || 'Cliente en mostrador',
                      telefono: form.telefono.trim() || undefined,
                      mascotaNombre: showPetSection ? form.mascotaNombre.trim() || undefined : undefined,
                      producto: selectedProduct?.title ?? existing?.producto ?? 'Producto Pet Shop',
                      sku: selectedProduct?.sku ?? existing?.sku,
                      cantidad: Math.max(1, parseInt(form.cantidad, 10) || 1),
                      precio: selectedProduct?.price ?? existing?.precio ?? 0,
                      registradoPor: fullName(session) || undefined,
                      synced: false,
                    }}
                    compact
                    onPress={() => setShowReceiptModal(true)}
                  />
                  <View style={styles.receiptActionsRow}>
                    <PressableScale
                      onPress={() => setShowReceiptModal(true)}
                      style={styles.receiptActionPill}
                      accessibilityRole="button"
                    >
                      <Text style={styles.receiptActionText}>Ver boleta completa</Text>
                    </PressableScale>
                    <PressableScale
                      onPress={() =>
                        setForm((prev) => ({
                          ...prev,
                          comprobanteLocalUri: undefined,
                          comprobanteUrl: undefined,
                        }))
                      }
                      style={[styles.receiptActionPill, styles.receiptRemovePill]}
                      accessibilityRole="button"
                    >
                      <Text style={styles.receiptRemoveText}>Quitar comprobante</Text>
                    </PressableScale>
                  </View>
                </View>
              ) : (
                <PrimaryButton
                  title="Generar comprobante y adjuntar"
                  onPress={handleGenerateReceipt}
                  variant="secondary"
                  icon="receipt-outline"
                  trailingIcon={null}
                  compact
                  testID="order-receipt-generate"
                />
              )}
            </View>
          </FadeInView>

          <FadeInView delay={160} distance={8}>
            <View style={styles.summaryBox}>
              <IconTile
                icon="receipt-outline"
                color={colors.primaryDark}
                background={colors.surface}
                size={42}
              />
              <View style={{ flex: 1 }}>
                <Text style={typography.captionStrong}>Fecha de registro</Text>
                <Text style={styles.summaryDate}>
                  {formatDateTime(existing?.fechaRegistro ?? now.toISOString())}
                </Text>
              </View>
              <View style={styles.totalBadge}>
                <Text style={styles.totalBadgeLabel}>Total</Text>
                <Text style={styles.totalBadgeValue}>S/. {liveTotal.toFixed(2)}</Text>
              </View>
            </View>

            <PrimaryButton
              title={isEdit ? 'Guardar cambios' : 'Guardar pedido'}
              onPress={handleSave}
              loading={saving}
              icon="save-outline"
              testID="order-form-submit"
              style={{ marginTop: spacing.sm }}
            />
            <Text style={styles.requiredNote}>
              <Text style={{ color: colors.danger }}>*</Text> Campos obligatorios
            </Text>
          </FadeInView>
        </ScrollView>
      </KeyboardAvoidingView>

      <CatalogPickerModal
        visible={pickerVisible}
        selectedProductId={selectedProduct?.id}
        excludeOrderId={editingId}
        onSelect={handleSelectProduct}
        onClose={() => setPickerVisible(false)}
      />

      <PaymentReceiptModal
        visible={showReceiptModal && Boolean(parsedReceipt)}
        receipt={parsedReceipt}
        order={{
          clienteNombre: form.clienteNombre.trim() || 'Cliente en mostrador',
          telefono: form.telefono.trim() || undefined,
          mascotaNombre: showPetSection ? form.mascotaNombre.trim() || undefined : undefined,
          producto: selectedProduct?.title ?? existing?.producto ?? 'Producto Pet Shop',
          sku: selectedProduct?.sku ?? existing?.sku,
          cantidad: Math.max(1, parseInt(form.cantidad, 10) || 1),
          precio: selectedProduct?.price ?? existing?.precio ?? 0,
          registradoPor: fullName(session) || undefined,
          synced: false,
        }}
        onClose={() => setShowReceiptModal(false)}
      />

      <ConfirmDialog
        visible={pendingAction !== null}
        title="¿Descartar cambios?"
        message="Los datos del pedido que ingresaste no se guardarán."
        confirmLabel="Descartar"
        cancelLabel="Seguir editando"
        destructive
        icon="close-circle-outline"
        onCancel={() => setPendingAction(null)}
        onConfirm={() => {
          const action = pendingAction;
          setPendingAction(null);
          if (action) navigation.dispatch(action);
        }}
      />
    </SafeAreaView>
  );
}

function CardTitle({
  icon,
  title,
  required,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  required?: boolean;
}) {
  return (
    <View style={styles.cardTitleRow}>
      <Ionicons name={icon} size={18} color={colors.primary} />
      <Text style={typography.heading} accessibilityRole="header">
        {title}
        {required && <Text style={{ color: colors.danger }}> *</Text>}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  code: { fontFamily: fonts.medium, fontSize: 12, color: colors.textMuted },
  card: { ...common.card, padding: spacing.md, paddingBottom: spacing.sm },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },

  selectorWrap: { marginBottom: spacing.xs },
  emptySelectorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceWarm,
  },
  emptySelectorIcon: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySelectorTitle: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.text,
  },
  emptySelectorSub: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },

  selectedWrap: { gap: spacing.md },
  selectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  selectedImageBox: {
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
  selectedImage: { width: '100%', height: '100%' },
  selectedTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  selectedBrandSku: {
    fontFamily: fonts.semibold,
    fontSize: 10.5,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    flex: 1,
  },
  changeBtn: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  changeBtnText: {
    fontFamily: fonts.semibold,
    fontSize: 11.5,
    color: colors.primaryDark,
  },
  selectedTitle: {
    fontFamily: fonts.semibold,
    fontSize: 13.5,
    color: colors.text,
    lineHeight: 18,
  },
  selectedMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  speciesTag: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: radius.sm,
  },
  speciesTagText: {
    fontFamily: fonts.semibold,
    fontSize: 10.5,
  },
  stockHintText: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.textSecondary,
  },

  qtyPriceRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  qtyCol: { flex: 1 },
  priceCol: { flex: 1.15 },
  inputLabel: {
    fontFamily: fonts.semibold,
    fontSize: 12.5,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  qtyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceWarm,
    paddingHorizontal: 6,
  },
  qtyBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyInput: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  readonlyPriceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.sm,
    gap: 6,
  },
  currencyLabel: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.primaryDark,
  },
  readonlyPriceVal: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  stockMaxCaption: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
  },
  inputErrorBorder: {
    borderColor: colors.danger,
  },
  inlineErr: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.danger,
    marginTop: 4,
  },

  suggestionsBox: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xs,
    marginTop: -spacing.xs,
    marginBottom: spacing.md,
    gap: 4,
  },
  suggestionsTitle: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: colors.textMuted,
    paddingHorizontal: spacing.xs,
    paddingTop: 2,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  suggestionName: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.text,
  },
  suggestionPhone: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSecondary,
  },

  addPetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.xs,
  },
  addPetText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.primaryDark,
  },
  petSectionBox: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    paddingBottom: 0,
    marginBottom: spacing.xs,
  },
  petSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  petHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  petHeaderTitle: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.text,
  },
  removePetText: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.danger,
  },
  speciesRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  speciesItem: { alignItems: 'center', gap: 4, flex: 1 },
  speciesRing: { padding: 3, borderRadius: 40, borderWidth: 2, borderColor: 'transparent' },
  speciesRingActive: { borderColor: colors.primary },
  speciesLabel: { fontFamily: fonts.medium, fontSize: 11.5, color: colors.textMuted },
  speciesLabelActive: { color: colors.primary, fontFamily: fonts.semibold },

  summaryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  summaryDate: {
    fontFamily: fonts.semibold,
    fontSize: 12.5,
    color: colors.text,
    marginTop: 1,
  },
  totalBadge: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'flex-end',
  },
  totalBadgeLabel: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: colors.textMuted,
  },
  totalBadgeValue: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.primaryDark,
    fontVariant: ['tabular-nums'],
  },
  requiredNote: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  paymentMethodsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.sm,
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
  receiptActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.xs,
    marginTop: 2,
  },
  receiptActionPill: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  receiptActionText: {
    fontFamily: fonts.semibold,
    fontSize: 11.5,
    color: colors.primaryDark,
  },
  receiptRemovePill: {
    backgroundColor: colors.dangerSoft,
  },
  receiptRemoveText: {
    fontFamily: fonts.semibold,
    fontSize: 11.5,
    color: colors.dangerStrong,
  },
});
