import React, { useState } from 'react';
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ConfirmDialog,
  EmptyState,
  IconTile,
  PetAvatar,
  PressableScale,
  PrimaryButton,
  PriorityChip,
  ScreenHeader,
  ServiceChip,
  StatusChip,
} from '../components';
import { useRequests } from '../context/RequestsContext';
import { useToast } from '../context/ToastContext';
import { Priority, RequestStatus, REQUEST_STATUSES } from '../models/request';
import { RootStackParamList } from '../navigation/types';
import { colors, common, fonts, radius, shadows, spacing, typography } from '../theme';
import { formatDateTime, formatRelative } from '../utils/date';
import {
  PRIORITIES_ASC,
  PRIORITY_EFFECT,
  PRIORITY_META,
  SERVICE_META,
  SPECIES_META,
  STATUS_META,
} from '../utils/requestMeta';
import { shortCode } from '../utils/requests';

type Props = NativeStackScreenProps<RootStackParamList, 'RequestDetail'>;

export function RequestDetailScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { requestId } = route.params;
  const { getRequestById, changeStatus, updateRequest, deleteRequest } = useRequests();
  const { showToast } = useToast();

  const [confirmDelete, setConfirmDelete] = useState(false);

  const request = getRequestById(requestId);

  if (!request) {
    return (
      <SafeAreaView style={common.screen} edges={['top']}>
        <ScreenHeader title="Detalle de Atención" onBack={() => navigation.goBack()} />
        <EmptyState
          icon="alert-circle-outline"
          title="Solicitud no encontrada"
          message="Esta solicitud pudo haber sido eliminada o el identificador no es válido."
          actionLabel="Volver al listado"
          onAction={() => navigation.goBack()}
        />
      </SafeAreaView>
    );
  }

  const service = SERVICE_META[request.tipoServicio];
  const priority = PRIORITY_META[request.prioridad];
  const species = request.especie ? SPECIES_META[request.especie] : undefined;

  const handleStatusChange = (newStatus: RequestStatus) => {
    if (newStatus === request.estado) return;
    const previousStatus = request.estado;
    changeStatus(request.id, newStatus);

    showToast(
      'success',
      'Estado actualizado',
      `La atención de ${request.mascotaNombre} ahora está en: ${STATUS_META[newStatus].label}.`,
      {
        label: 'Deshacer',
        onPress: () => {
          changeStatus(request.id, previousStatus);
          showToast('info', 'Acción deshecha', `Estado restaurado a ${STATUS_META[previousStatus].label}.`);
        },
      },
    );
  };

  const handlePriorityChange = (newPriority: Priority) => {
    if (newPriority === request.prioridad) return;
    const previousPriority = request.prioridad;
    updateRequest(request.id, { prioridad: newPriority });

    showToast(
      'info',
      'Prioridad actualizada',
      `Prioridad de ${request.mascotaNombre} cambiada a ${PRIORITY_META[newPriority].label}.`,
      {
        label: 'Deshacer',
        onPress: () => {
          updateRequest(request.id, { prioridad: previousPriority });
          showToast('info', 'Acción deshecha', `Prioridad restaurada a ${PRIORITY_META[previousPriority].label}.`);
        },
      },
    );
  };

  const handleDelete = () => {
    deleteRequest(request.id);
    showToast('info', 'Solicitud eliminada', `Se retiró la atención de ${request.mascotaNombre}.`);
    setConfirmDelete(false);
    navigation.goBack();
  };

  const callPhone = () => {
    const cleanPhone = request.telefono.replace(/\s+/g, '');
    Linking.openURL(`tel:${cleanPhone}`).catch(() => {
      showToast('error', 'No se pudo abrir el marcador', `Número: ${request.telefono}`);
    });
  };

  const nextAction =
    request.estado === 'PENDIENTE'
      ? { label: 'Iniciar atención médica', status: 'EN_ATENCION' as RequestStatus, icon: 'play' as const }
      : request.estado === 'EN_ATENCION'
      ? { label: 'Finalizar y dar de alta', status: 'FINALIZADO' as RequestStatus, icon: 'checkmark-done' as const }
      : null;

  return (
    <SafeAreaView style={common.screen} edges={['top', 'bottom']}>
      <ScreenHeader
        title="Ficha del Paciente"
        onBack={() => navigation.goBack()}
        right={
          <PressableScale
            onPress={() => navigation.navigate('CreateRequest', { requestId: request.id })}
            accessibilityRole="button"
            accessibilityLabel="Editar solicitud"
            style={styles.editPill}
            testID="detail-edit-button"
          >
            <Ionicons name="create-outline" size={15} color={colors.primaryDark} />
            <Text style={styles.editPillText}>Editar</Text>
          </PressableScale>
        }
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >

        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <PetAvatar species={request.especie} size={64} shape="rounded" />
            <View style={styles.heroTextCol}>
              <View style={styles.nameAndCodeRow}>
                <Text style={styles.petName} numberOfLines={1}>
                  {request.mascotaNombre}
                </Text>
                <View style={styles.codeBadge}>
                  <Text style={styles.codeText}>{shortCode(request.id)}</Text>
                </View>
              </View>
              <Text style={styles.petSpeciesSubtitle}>
                {species?.label ?? 'Mascota'} · Registrado {formatRelative(request.fechaRegistro)}
              </Text>
            </View>
          </View>

          <View style={styles.chipsRow}>
            <ServiceChip service={request.tipoServicio} />
            <PriorityChip priority={request.prioridad} />
            <StatusChip status={request.estado} />
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="swap-horizontal-outline" size={18} color={colors.primary} />
            <Text style={typography.heading}>Estado de la Atención</Text>
          </View>
          <Text style={styles.sectionCaption}>
            Actualiza el progreso clínico del paciente en el consultorio:
          </Text>

          <View style={styles.statusOptionsList}>
            {REQUEST_STATUSES.map((st) => {
              const active = request.estado === st;
              const meta = STATUS_META[st];
              return (
                <PressableScale
                  key={st}
                  onPress={() => handleStatusChange(st)}
                  style={[
                    styles.statusOptionCard,
                    active && { borderColor: meta.color, backgroundColor: meta.background },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Cambiar estado a ${meta.label}`}
                  testID={`detail-status-${st}`}
                >
                  <View
                    style={[
                      styles.statusOptionIconBox,
                      { backgroundColor: active ? meta.color : colors.surfaceMuted },
                    ]}
                  >
                    <Ionicons
                      name={meta.icon}
                      size={18}
                      color={active ? colors.white : meta.color}
                    />
                  </View>
                  <View style={styles.statusOptionTextCol}>
                    <Text
                      style={[
                        styles.statusOptionTitle,
                        active && { color: meta.color, fontFamily: fonts.bold },
                      ]}
                    >
                      {meta.label}
                    </Text>
                    <Text style={styles.statusOptionSubtitle}>{meta.description}</Text>
                  </View>
                  <View
                    style={[
                      styles.statusOptionRadio,
                      active && { borderColor: meta.color, backgroundColor: meta.color },
                    ]}
                  >
                    {active && <Ionicons name="checkmark" size={14} color={colors.white} />}
                  </View>
                </PressableScale>
              );
            })}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="flag-outline" size={18} color={colors.primary} />
            <Text style={typography.heading}>Nivel de Prioridad Médica</Text>
          </View>
          <Text style={styles.sectionCaption}>
            Define el orden de turno en la lista de atención:
          </Text>

          <View style={styles.priorityGrid}>
            {PRIORITIES_ASC.map((pr) => {
              const active = request.prioridad === pr;
              const meta = PRIORITY_META[pr];
              return (
                <PressableScale
                  key={pr}
                  onPress={() => handlePriorityChange(pr)}
                  style={[
                    styles.priorityCard,
                    active && {
                      backgroundColor: meta.background,
                      borderColor: meta.color,
                      borderWidth: 2,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Cambiar prioridad a ${meta.label}`}
                  testID={`detail-priority-${pr}`}
                >
                  <Ionicons
                    name={meta.icon}
                    size={16}
                    color={meta.color}
                  />
                  <Text
                    style={[
                      styles.priorityCardText,
                      active && { color: meta.color, fontFamily: fonts.bold },
                    ]}
                  >
                    {meta.label}
                  </Text>
                </PressableScale>
              );
            })}
          </View>

          <View style={styles.priorityNoticeBox}>
            <Ionicons name="information-circle-outline" size={16} color={priority.color} />
            <Text style={styles.priorityNoticeText}>
              {PRIORITY_EFFECT[request.prioridad]}
            </Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="document-text-outline" size={18} color={colors.primary} />
            <Text style={typography.heading}>Motivo y Detalles</Text>
          </View>

          <View style={styles.serviceMetaRow}>
            <IconTile icon={service.icon} color={service.color} background={service.background} size={32} shape="rounded" />
            <View style={{ flex: 1 }}>
              <Text style={styles.serviceMetaTitle}>{service.label}</Text>
              <Text style={styles.serviceMetaHint}>{service.hint}</Text>
            </View>
          </View>

          <Text style={styles.descriptionText}>
            {request.descripcion || 'Sin observaciones o síntomas adicionales registrados.'}
          </Text>

          <View style={styles.divider} />

          <View style={styles.infoMetaRow}>
            <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.infoMetaLabel}>Fecha y hora de registro:</Text>
            <Text style={styles.infoMetaValue}>{formatDateTime(request.fechaRegistro)}</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="person-outline" size={18} color={colors.primary} />
            <Text style={typography.heading}>Tutor Responsable</Text>
          </View>

          <View style={styles.clientInfoRow}>
            <View style={styles.clientAvatar}>
              <Text style={styles.clientAvatarText}>
                {request.clienteNombre.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.clientName}>{request.clienteNombre}</Text>
              <Text style={styles.clientPhone}>{request.telefono}</Text>
            </View>
            <PressableScale
              onPress={callPhone}
              style={styles.callButton}
              accessibilityRole="button"
              accessibilityLabel={`Llamar a ${request.clienteNombre}`}
            >
              <Ionicons name="call" size={16} color={colors.white} />
              <Text style={styles.callButtonText}>Llamar</Text>
            </PressableScale>
          </View>
        </View>

        <View style={styles.dangerZone}>
          <PrimaryButton
            title="Eliminar esta solicitud"
            onPress={() => setConfirmDelete(true)}
            variant="danger"
            icon="trash-outline"
            trailingIcon={null}
            compact
            testID="detail-delete-button"
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
            testID="detail-main-action"
            style={styles.mainActionButton}
          />
        ) : (
          <PrimaryButton
            title="Editar Ficha del Paciente"
            onPress={() => navigation.navigate('CreateRequest', { requestId: request.id })}
            icon="create-outline"
            variant="outline"
            testID="detail-main-edit"
            style={styles.mainActionButton}
          />
        )}
      </View>

      <ConfirmDialog
        visible={confirmDelete}
        title="¿Eliminar atención?"
        message={`¿Estás seguro de que deseas eliminar la solicitud de ${request.mascotaNombre}? Esta acción no se puede deshacer.`}
        confirmLabel="Sí, eliminar"
        cancelLabel="Cancelar"
        destructive
        icon="trash"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
      />
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
  editPillText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.primaryDark,
  },

  heroCard: {
    ...common.card,
    padding: spacing.md,
    gap: spacing.md,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  heroTextCol: {
    flex: 1,
    gap: 2,
  },
  nameAndCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  petName: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: colors.text,
    flexShrink: 1,
  },
  petSpeciesSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  codeBadge: {
    backgroundColor: colors.surfaceWarm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  codeText: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.primaryDark,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },

  sectionCard: {
    ...common.card,
    padding: spacing.lg,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 4,
  },
  sectionCaption: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },

  statusOptionsList: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  statusOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    minHeight: 52,
  },
  statusOptionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusOptionTextCol: {
    flex: 1,
    gap: 2,
  },
  statusOptionTitle: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.text,
  },
  statusOptionSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSecondary,
  },
  statusOptionRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  priorityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  priorityCard: {
    flexBasis: '47%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 44,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  priorityCardText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.textSecondary,
  },
  priorityNoticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  priorityNoticeText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 17,
  },

  serviceMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceWarm,
    padding: spacing.sm,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  serviceMetaTitle: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.text,
  },
  serviceMetaHint: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSecondary,
  },
  descriptionText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.text,
    lineHeight: 22,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.md,
  },
  infoMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  infoMetaLabel: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.textSecondary,
  },
  infoMetaValue: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.text,
  },

  clientInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  clientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clientAvatarText: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.primaryDark,
  },
  clientName: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.text,
  },
  clientPhone: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    minHeight: 44,
    borderRadius: radius.pill,
  },
  callButtonText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.white,
  },

  dangerZone: {
    marginTop: spacing.xs,
  },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...shadows.raised,
  },
  mainActionButton: {
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },
});
