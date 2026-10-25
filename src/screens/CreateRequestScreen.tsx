import React, { useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { NavigationAction, usePreventRemove } from '@react-navigation/native';
import {
  ConfirmDialog,
  EmptyState,
  FormField,
  IconTile,
  PetAvatar,
  PressableScale,
  PrimaryButton,
  ScreenHeader,
} from '../components';
import { useRequests } from '../context/RequestsContext';
import { useToast } from '../context/ToastContext';
import { PRIORITIES, Priority, RequestInput, SERVICE_TYPES, ServiceType, SPECIES, Species } from '../models/request';
import { RootStackParamList } from '../navigation/types';
import { colors, common, fonts, radius, shadows, spacing, typography } from '../theme';
import { formatDateTime } from '../utils/date';
import { PRIORITIES_ASC, PRIORITY_EFFECT, PRIORITY_META, SERVICE_META, SPECIES_META } from '../utils/requestMeta';
import { shortCode } from '../utils/requests';
import { FormErrors, hasErrors, LIMITS, validateRequest } from '../utils/validation';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateRequest'>;

interface FormState {
  clienteNombre: string;
  telefono: string;
  mascotaNombre: string;
  especie: Species;
  tipoServicio?: ServiceType;
  prioridad: Priority;
  descripcion: string;
}

const EMPTY_FORM: FormState = {
  clienteNombre: '',
  telefono: '',
  mascotaNombre: '',
  especie: 'PERRO',
  tipoServicio: undefined,
  prioridad: 'MEDIA',
  descripcion: '',
};

/** Formulario para crear (sin requestId) o editar (con requestId) una solicitud. */
export function CreateRequestScreen({ navigation, route }: Props) {
  const { getRequestById, createRequest, updateRequest } = useRequests();
  const { showToast } = useToast();

  const editingId = route.params?.requestId;
  const existing = editingId ? getRequestById(editingId) : undefined;
  const isEdit = Boolean(editingId);

  const initialForm = useMemo<FormState>(() => {
    if (existing) {
      return {
        clienteNombre: existing.clienteNombre,
        telefono: existing.telefono,
        mascotaNombre: existing.mascotaNombre,
        especie: existing.especie ?? 'OTRO',
        tipoServicio: existing.tipoServicio,
        prioridad: existing.prioridad,
        descripcion: existing.descripcion,
      };
    }
    const service = route.params?.service;
    return { ...EMPTY_FORM, tipoServicio: service, prioridad: service === 'EMERGENCIA' ? 'URGENTE' : 'MEDIA' };
    // Solo se calcula al abrir la pantalla.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [pendingAction, setPendingAction] = useState<NavigationAction | null>(null);

  const savedRef = useRef(false);
  const phoneRef = useRef<any>(null);
  const petRef = useRef<any>(null);
  const descRef = useRef<any>(null);

  // Reloj en vivo para la fecha/hora de registro (solo al crear).
  useEffect(() => {
    if (isEdit) return;
    const timer = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, [isEdit]);

  // Tras el primer intento de guardar, los errores se actualizan en vivo.
  useEffect(() => {
    if (submitted) setErrors(validateRequest(form));
  }, [form, submitted]);

  const isDirty = JSON.stringify(form) !== JSON.stringify(initialForm);

  // Evita perder datos por accidente al salir con cambios sin guardar.
  usePreventRemove(isDirty && !saving, ({ data }) => {
    if (savedRef.current) navigation.dispatch(data.action);
    else setPendingAction(data.action);
  });

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  const handleSave = () => {
    setSubmitted(true);
    const validation = validateRequest(form);
    setErrors(validation);
    if (hasErrors(validation)) {
      showToast('error', 'Faltan datos obligatorios', 'Revisa los campos marcados en rojo.');
      return;
    }

    const input: RequestInput = {
      clienteNombre: form.clienteNombre,
      telefono: form.telefono,
      mascotaNombre: form.mascotaNombre,
      especie: form.especie,
      tipoServicio: form.tipoServicio as ServiceType,
      prioridad: form.prioridad,
      descripcion: form.descripcion,
    };

    setSaving(true);
    savedRef.current = true; // permite salir sin el diálogo de descartar
    if (isEdit && editingId) {
      updateRequest(editingId, input);
      showToast('success', 'Cambios guardados', `La solicitud de ${input.mascotaNombre.trim()} se actualizó.`);
      navigation.goBack();
    } else {
      const created = createRequest(input);
      showToast('success', 'Solicitud registrada', `${created.mascotaNombre} quedó en la lista de pendientes.`);
      navigation.replace('RequestDetail', { requestId: created.id });
    }
  };

  if (isEdit && !existing) {
    return (
      <SafeAreaView style={common.screen}>
        <ScreenHeader title="Editar solicitud" onBack={() => navigation.goBack()} />
        <EmptyState
          icon="alert-circle-outline"
          title="Solicitud no encontrada"
          message="Es posible que haya sido eliminada. Vuelve al listado para continuar."
          actionLabel="Volver"
          onAction={() => navigation.goBack()}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={common.screen} edges={['top', 'bottom']}>
      <ScreenHeader
        title={isEdit ? 'Editar solicitud' : 'Nueva solicitud'}
        onBack={() => navigation.goBack()}
        right={existing ? <Text style={styles.code}>{shortCode(existing.id)}</Text> : undefined}
      />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Cliente */}
          <View style={styles.card}>
            <CardTitle icon="person-outline" title="Datos del cliente" />
            <FormField
              testID="form-client"
              label="Nombre del cliente"
              required
              icon="person-circle-outline"
              placeholder="ej. Lucía Fernández"
              value={form.clienteNombre}
              onChangeText={(t) => update('clienteNombre', t)}
              maxLength={LIMITS.nameMax}
              autoCapitalize="words"
              returnKeyType="next"
              onSubmitEditing={() => phoneRef.current?.focus()}
              error={errors.clienteNombre}
            />
            <FormField
              ref={phoneRef}
              testID="form-phone"
              label="Teléfono"
              required
              icon="call-outline"
              placeholder="ej. 987 654 321"
              value={form.telefono}
              onChangeText={(t) => update('telefono', t.replace(/[^\d\s+()-]/g, ''))}
              keyboardType="phone-pad"
              maxLength={18}
              returnKeyType="next"
              onSubmitEditing={() => petRef.current?.focus()}
              error={errors.telefono}
              hint="Celular de 9 dígitos o número fijo."
            />
          </View>

          {/* Mascota */}
          <View style={styles.card}>
            <CardTitle icon="paw-outline" title="Mascota" />
            <Text style={styles.fieldLabel}>Especie</Text>
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
                    testID={`form-species-${s}`}
                  >
                    <View style={[styles.speciesRing, selected && styles.speciesRingActive]}>
                      <PetAvatar species={s} size={54} shape="circle" />
                    </View>
                    <Text style={[styles.speciesLabel, selected && styles.speciesLabelActive]}>{SPECIES_META[s].label}</Text>
                  </Pressable>
                );
              })}
            </View>
            <FormField
              ref={petRef}
              testID="form-pet"
              label="Nombre de la mascota"
              required
              icon="heart-outline"
              placeholder="ej. Toby"
              value={form.mascotaNombre}
              onChangeText={(t) => update('mascotaNombre', t)}
              maxLength={LIMITS.petMax}
              autoCapitalize="words"
              returnKeyType="next"
              onSubmitEditing={() => descRef.current?.focus()}
              error={errors.mascotaNombre}
            />
          </View>

          {/* Servicio */}
          <View style={styles.card}>
            <View style={styles.sectionHeaderBetween}>
              <CardTitle icon="medkit-outline" title="Tipo de servicio solicitado" required />
              <Text style={styles.headerHintTag}>Atención Inmediata</Text>
            </View>

            <View style={styles.serviceGrid} accessibilityRole="radiogroup">
              {SERVICE_TYPES.map((s) => {
                const meta = SERVICE_META[s];
                const selected = form.tipoServicio === s;
                const isEmergency = s === 'EMERGENCIA';

                return (
                  <PressableScale
                    key={s}
                    onPress={() => {
                      update('tipoServicio', s);
                      if (isEmergency && (form.prioridad === 'BAJA' || form.prioridad === 'MEDIA')) {
                        update('prioridad', 'URGENTE');
                      }
                    }}
                    style={[
                      styles.serviceSquareCard,
                      selected && isEmergency && styles.serviceEmergencySelected,
                      selected && !isEmergency && { borderColor: meta.color, backgroundColor: meta.background },
                      !!errors.tipoServicio && styles.tileError,
                    ]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`${meta.label}. ${meta.hint}`}
                    testID={`form-service-${s}`}
                  >
                    <View style={styles.serviceCardTopRow}>
                      <View
                        style={[
                          styles.serviceIconContainer,
                          selected && isEmergency
                            ? { backgroundColor: 'rgba(255,255,255,0.2)' }
                            : { backgroundColor: meta.background },
                        ]}
                      >
                        <Ionicons
                          name={meta.icon}
                          size={20}
                          color={selected && isEmergency ? colors.white : meta.color}
                        />
                      </View>

                      {isEmergency ? (
                        <View style={[styles.uciBadge, selected && styles.uciBadgeSelected]}>
                          <Text style={[styles.uciBadgeText, selected && styles.uciBadgeTextSelected]}>
                            Prioridad UCI
                          </Text>
                        </View>
                      ) : selected ? (
                        <View style={[styles.checkCircle, { backgroundColor: meta.color }]}>
                          <Ionicons name="checkmark" size={11} color={colors.white} />
                        </View>
                      ) : null}
                    </View>

                    <View style={styles.serviceCardBottom}>
                      <Text
                        style={[
                          styles.serviceCardTitle,
                          selected && isEmergency
                            ? { color: colors.white }
                            : selected
                            ? { color: meta.color }
                            : undefined,
                        ]}
                        numberOfLines={1}
                      >
                        {meta.label}
                      </Text>
                      <Text
                        style={[
                          styles.serviceCardHint,
                          selected && isEmergency ? { color: 'rgba(255,255,255,0.85)' } : undefined,
                        ]}
                        numberOfLines={1}
                      >
                        {meta.hint}
                      </Text>
                    </View>
                  </PressableScale>
                );
              })}
            </View>
            {errors.tipoServicio && <InlineError text={errors.tipoServicio} />}
          </View>

          {/* Prioridad */}
          <View style={styles.card}>
            <View style={styles.sectionHeaderBetween}>
              <CardTitle icon="pulse-outline" title="Prioridad Triage" />
              <Text
                style={[
                  styles.priorityStatusTag,
                  { color: PRIORITY_META[form.prioridad].color },
                ]}
              >
                {PRIORITY_META[form.prioridad].label}
              </Text>
            </View>

            {/* Barra segmentada horizontal con pastilla activa (Baja → Urgente) */}
            <View style={styles.triageSegmentBar} accessibilityRole="radiogroup">
              {PRIORITIES_ASC.map((p) => {
                const meta = PRIORITY_META[p];
                const selected = form.prioridad === p;
                return (
                  <Pressable
                    key={p}
                    onPress={() => update('prioridad', p)}
                    style={[
                      styles.triageSegmentItem,
                      selected && [styles.triageSegmentItemActive, { backgroundColor: meta.background, borderColor: meta.color }],
                    ]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`Prioridad ${meta.label}`}
                    testID={`form-priority-${p}`}
                  >
                    <View
                      style={[
                        styles.priorityDot,
                        { backgroundColor: selected ? meta.color : colors.textMuted },
                      ]}
                    />
                    <Text
                      style={[
                        styles.triageSegmentLabel,
                        selected && { color: meta.color, fontFamily: fonts.bold },
                      ]}
                      numberOfLines={1}
                    >
                      {meta.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Explicación real del efecto de la prioridad en la app */}
            <View
              style={[
                styles.triageNoticeCard,
                { backgroundColor: PRIORITY_META[form.prioridad].background, borderColor: PRIORITY_META[form.prioridad].color },
              ]}
            >
              <Ionicons
                name={PRIORITY_META[form.prioridad].icon}
                size={16}
                color={PRIORITY_META[form.prioridad].color}
              />
              <Text style={[styles.triageNoticeText, { color: PRIORITY_META[form.prioridad].color }]}>
                {PRIORITY_EFFECT[form.prioridad]}
              </Text>
            </View>
          </View>

          {/* Motivo */}
          <View style={styles.card}>
            <CardTitle icon="document-text-outline" title="Motivo de atención" />
            <FormField
              ref={descRef}
              testID="form-description"
              label="Descripción"
              placeholder="Describe síntomas, antecedentes o indicaciones del cliente."
              value={form.descripcion}
              onChangeText={(t) => update('descripcion', t)}
              multiline
              maxLength={LIMITS.descriptionMax}
              showCounter
              error={errors.descripcion}
            />

            <View style={styles.registry}>
              <IconTile icon="calendar-outline" color={colors.primary} background={colors.surface} size={40} />
              <View style={{ flex: 1 }}>
                <Text style={typography.captionStrong}>Fecha y hora de registro</Text>
                <Text style={styles.registryValue}>{formatDateTime(existing?.fechaRegistro ?? now.toISOString())}</Text>
                <Text style={typography.caption}>
                  {isEdit ? 'No se modifica al editar.' : 'Se asigna automáticamente al guardar.'}
                </Text>
              </View>
            </View>
          </View>

          <PrimaryButton
            title={isEdit ? 'Guardar cambios' : 'Guardar solicitud'}
            onPress={handleSave}
            loading={saving}
            testID="form-submit"
            style={{ marginTop: spacing.xs }}
          />
          <Text style={styles.requiredNote}>
            <Text style={{ color: colors.danger }}>*</Text> Campos obligatorios
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>

      <ConfirmDialog
        visible={pendingAction !== null}
        title="¿Descartar cambios?"
        message="Los datos que ingresaste no se guardarán."
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

function CardTitle({ icon, title, required }: { icon: React.ComponentProps<typeof Ionicons>['name']; title: string; required?: boolean }) {
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

function InlineError({ text }: { text: string }) {
  return (
    <View style={styles.inlineError} accessibilityLiveRegion="polite">
      <Ionicons name="alert-circle" size={14} color={colors.danger} />
      <Text style={styles.inlineErrorText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingTop: spacing.xs, paddingBottom: spacing.xxl, gap: spacing.md, maxWidth: 640, width: '100%', alignSelf: 'center' },
  code: { fontFamily: fonts.medium, fontSize: 12, color: colors.textMuted },
  card: { ...common.card, padding: spacing.md, paddingBottom: spacing.xs },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.md },
  fieldLabel: { fontFamily: fonts.medium, fontSize: 13, color: colors.text, marginBottom: spacing.xs },

  speciesRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
  speciesItem: { alignItems: 'center', gap: 4, flex: 1 },
  speciesRing: { padding: 3, borderRadius: 40, borderWidth: 2, borderColor: 'transparent' },
  speciesRingActive: { borderColor: colors.primary },
  speciesLabel: { fontFamily: fonts.medium, fontSize: 12, color: colors.textMuted },
  speciesLabelActive: { color: colors.primary, fontFamily: fonts.semibold },

  sectionHeaderBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  headerHintTag: {
    fontFamily: fonts.medium,
    fontSize: 11.5,
    color: colors.primaryDark,
  },
  priorityStatusTag: {
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  serviceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  serviceSquareCard: {
    flexBasis: '47%',
    flexGrow: 1,
    minHeight: 104,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    padding: spacing.sm,
    justifyContent: 'space-between',
  },
  serviceEmergencySelected: {
    backgroundColor: colors.danger,
    borderColor: colors.dangerStrong,
  },
  serviceCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  serviceIconContainer: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uciBadge: {
    backgroundColor: colors.dangerSoft,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  uciBadgeSelected: {
    backgroundColor: '#FFE4E6',
  },
  uciBadgeText: {
    fontFamily: fonts.semibold,
    fontSize: 10,
    color: colors.danger,
  },
  uciBadgeTextSelected: {
    color: '#9F1239',
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceCardBottom: {
    gap: 2,
  },
  serviceCardTitle: {
    fontFamily: fonts.bold,
    fontSize: 13.5,
    color: colors.text,
  },
  serviceCardHint: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textMuted,
  },
  tileError: { borderColor: '#F0BDB8' },
  triageSegmentBar: {
    flexDirection: 'row',
    backgroundColor: colors.track,
    borderRadius: radius.pill,
    padding: 4,
    gap: 4,
    marginBottom: spacing.sm,
  },
  triageSegmentItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    minHeight: 44,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  triageSegmentItemActive: {
    ...shadows.soft,
  },
  priorityDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  triageSegmentLabel: {
    fontFamily: fonts.medium,
    fontSize: 11.5,
    color: colors.textSecondary,
  },
  triageNoticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  triageNoticeCardDanger: {
    backgroundColor: '#FFF1F2',
    borderColor: '#FEE2E2',
  },
  triageNoticeCardNormal: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
  },
  triageNoticeText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 11.5,
    lineHeight: 16,
  },

  registry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  registryValue: { fontFamily: fonts.semibold, fontSize: 14, color: colors.text },

  inlineError: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: spacing.sm },
  inlineErrorText: { fontFamily: fonts.medium, fontSize: 12, color: colors.danger },
  requiredNote: { ...typography.caption, textAlign: 'center' },
});
