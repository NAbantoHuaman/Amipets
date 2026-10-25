import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  EmptyState,
  FadeInView,
  IconButton,
  IconTile,
  PressableScale,
  PrimaryButton,
  RequestCard,
  SectionHeader,
} from '../components';
import { shortGreetingName, useAuth } from '../context/AuthContext';
import { useRequests } from '../context/RequestsContext';
import { RequestStatus, SERVICE_TYPES, ServiceType } from '../models/request';
import { RootStackParamList, TabParamList } from '../navigation/types';
import { colors, common, fonts, radius, shadows, spacing, typography } from '../theme';
import { formatLongToday, formatRelative, greeting, isSameDay } from '../utils/date';
import { SERVICE_META, STATUS_META } from '../utils/requestMeta';
import { activeUrgent, countByStatus, sortByNewest } from '../utils/requests';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Home'>,
  NativeStackScreenProps<RootStackParamList>
>;

const SUMMARY: { status: RequestStatus; label: string }[] = [
  { status: 'PENDIENTE', label: 'Pendientes' },
  { status: 'EN_ATENCION', label: 'En atención' },
  { status: 'FINALIZADO', label: 'Finalizadas' },
];

/** Inicio: saludo al doctor, accesos rápidos centrados, notificaciones y resumen. */
export function HomeScreen({ navigation }: Props) {
  const { session } = useAuth();
  const { requests, loading } = useRequests();
  const [showNotifications, setShowNotifications] = useState(false);

  // Derivados del estado global: se recalculan en cada cambio del CRUD.
  const counts = useMemo(() => countByStatus(requests), [requests]);
  const urgent = useMemo(() => activeUrgent(requests), [requests]);
  const latest = useMemo(() => sortByNewest(requests).slice(0, 3), [requests]);
  const todayCount = useMemo(() => requests.filter((r) => isSameDay(r.fechaRegistro, new Date())).length, [requests]);

  // Conteos reales de solicitudes activas por cada tipo de servicio
  const serviceCounts = useMemo(() => {
    const map: Record<ServiceType, number> = { CONSULTA: 0, VACUNACION: 0, EMERGENCIA: 0, GROOMING: 0 };
    for (const r of requests) {
      if (r.estado !== 'FINALIZADO') map[r.tipoServicio] = (map[r.tipoServicio] || 0) + 1;
    }
    return map;
  }, [requests]);

  // Lista de notificaciones clínicas en tiempo real
  const notifications = useMemo(() => {
    const list: {
      id: string;
      requestId: string;
      icon: any;
      color: string;
      bg: string;
      title: string;
      message: string;
      time: string;
    }[] = [];

    for (const r of requests) {
      if (r.prioridad === 'URGENTE' && r.estado !== 'FINALIZADO') {
        list.push({
          id: `notif-urg-${r.id}`,
          requestId: r.id,
          icon: 'flame',
          color: colors.danger,
          bg: colors.dangerSoft,
          title: `🚨 Urgencia activa: ${r.mascotaNombre}`,
          message: `${r.tipoServicio === 'EMERGENCIA' ? 'Atención de emergencia' : 'Prioridad urgente'}. ${r.descripcion || 'Requiere atención médica inmediata.'}`,
          time: formatRelative(r.fechaRegistro),
        });
      } else if (r.estado === 'PENDIENTE') {
        list.push({
          id: `notif-pend-${r.id}`,
          requestId: r.id,
          icon: 'hourglass-outline',
          color: colors.pending,
          bg: colors.pendingSoft,
          title: `⏳ En espera: ${r.mascotaNombre}`,
          message: `Servicio de ${SERVICE_META[r.tipoServicio].label}. Tutor: ${r.clienteNombre}.`,
          time: formatRelative(r.fechaRegistro),
        });
      } else if (r.estado === 'FINALIZADO') {
        list.push({
          id: `notif-done-${r.id}`,
          requestId: r.id,
          icon: 'checkmark-circle-outline',
          color: colors.done,
          bg: colors.doneSoft,
          title: `✅ Atención completada: ${r.mascotaNombre}`,
          message: `Paciente dado de alta tras ${SERVICE_META[r.tipoServicio].label}.`,
          time: formatRelative(r.fechaRegistro),
        });
      }
    }

    return list;
  }, [requests]);

  const openDetail = (id: string) => navigation.navigate('RequestDetail', { requestId: id });
  const openCreate = (service?: ServiceType) => navigation.navigate('CreateRequest', service ? { service } : undefined);
  const openRequests = (params: TabParamList['Requests'] = {}) =>
    navigation.navigate('Requests', { status: 'TODOS', priority: 'TODAS', ...params, nonce: Date.now() });

  return (
    <SafeAreaView style={common.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Saludo personalizado al Doctor */}
        <FadeInView style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>{greeting()}</Text>
            <Text style={styles.name} numberOfLines={1}>
              {shortGreetingName(session) || 'Dr. Carlos'} 👋
            </Text>
            <Text style={typography.caption}>
              {session?.clinicName ?? 'Clínica Veterinaria Amipets'} · {formatLongToday()}
            </Text>
          </View>
          <IconButton
            icon="notifications-outline"
            onPress={() => setShowNotifications(true)}
            accessibilityLabel={notifications.length ? `${notifications.length} notificaciones clínicas` : 'Sin notificaciones'}
            badge={notifications.length > 0}
            testID="home-bell"
          />
        </FadeInView>

        {/* Banner principal */}
        <FadeInView delay={80}>
          <View style={styles.hero}>
            <Image source={require('../../assets/images/hero.jpg')} style={styles.heroImage} resizeMode="cover" />
            <View style={styles.heroText}>
              <Text style={styles.heroScript}>Mascotas felices,{'\n'}vidas más sanas ♡</Text>
              <Text style={styles.heroTitle}>Porque ellos{'\n'}merecen lo mejor</Text>
              <PrimaryButton
                title="Nueva solicitud"
                onPress={() => openCreate()}
                compact
                testID="home-create"
                style={styles.heroButton}
              />
            </View>
          </View>
        </FadeInView>

        {/* Servicios Asistenciales Centrados */}
        <FadeInView delay={160} style={styles.section}>
          <SectionHeader
            title="Servicios asistenciales"
            actionLabel="Ver todos"
            onAction={() => openRequests()}
          />
          <View style={styles.servicesGrid}>
            {SERVICE_TYPES.map((s) => {
              const meta = SERVICE_META[s];
              const activeCount = serviceCounts[s];
              const badge = activeCount === 0 ? 'Sin activas' : activeCount === 1 ? '1 activa' : `${activeCount} activas`;

              return (
                <PressableScale
                  key={s}
                  onPress={() => openCreate(s)}
                  style={styles.serviceSquareCard}
                  accessibilityRole="button"
                  accessibilityLabel={`Nueva solicitud de ${meta.label}`}
                  testID={`home-service-${s}`}
                >
                  <View style={styles.serviceCardTopRow}>
                    <View style={[styles.serviceIconContainer, { backgroundColor: meta.background }]}>
                      <Ionicons name={meta.icon} size={20} color={meta.color} />
                    </View>
                    <View
                      style={[
                        styles.serviceBadgePill,
                        s === 'EMERGENCIA' && styles.serviceBadgeEmergency,
                      ]}
                    >
                      <Text
                        style={[
                          styles.serviceBadgeText,
                          s === 'EMERGENCIA' && { color: colors.danger },
                        ]}
                      >
                        {badge}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.serviceCardBottom}>
                    <Text style={styles.serviceCardTitle} numberOfLines={1}>
                      {meta.label}
                    </Text>
                    <Text style={styles.serviceCardHint} numberOfLines={1}>
                      {meta.hint}
                    </Text>
                  </View>
                </PressableScale>
              );
            })}
          </View>
        </FadeInView>

        {/* Indicador de urgencias */}
        {urgent.length > 0 && (
          <FadeInView delay={220}>
            <PressableScale
              onPress={() => openRequests({ priority: 'URGENTE' })}
              style={styles.alert}
              accessibilityRole="button"
              accessibilityLabel={`${urgent.length} urgencias activas. Ver solicitudes urgentes`}
              testID="home-urgent"
            >
              <IconTile icon="flame" color={colors.white} background={colors.danger} size={44} />
              <View style={{ flex: 1 }}>
                <Text style={styles.alertTitle}>
                  {urgent.length} {urgent.length === 1 ? 'urgencia activa' : 'urgencias activas'}
                </Text>
                <Text style={styles.alertText} numberOfLines={1}>
                  {urgent.map((u) => u.mascotaNombre).join(', ')} {urgent.length === 1 ? 'necesita' : 'necesitan'} atención inmediata
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.danger} />
            </PressableScale>
          </FadeInView>
        )}

        {/* Resumen de Atenciones Centrado */}
        <FadeInView delay={280} style={styles.section}>
          <SectionHeader title="Resumen de atenciones" actionLabel="Ver todo" onAction={() => openRequests()} />
          <View style={styles.summaryRow}>
            {SUMMARY.map(({ status, label }) => {
              const meta = STATUS_META[status];
              return (
                <PressableScale
                  key={status}
                  onPress={() => openRequests({ status })}
                  style={[styles.summaryCard, { backgroundColor: meta.background }]}
                  accessibilityRole="button"
                  accessibilityLabel={`${counts[status]} ${label}`}
                  testID={`home-count-${status}`}
                >
                  <View style={styles.summaryIcon}>
                    <Ionicons name={meta.icon} size={18} color={meta.color} />
                  </View>
                  {loading ? (
                    <ActivityIndicator color={meta.color} style={{ height: 34 }} />
                  ) : (
                    <Text style={[styles.summaryCount, { color: meta.color }]}>{counts[status]}</Text>
                  )}
                  <Text style={styles.summaryLabel}>{label}</Text>
                </PressableScale>
              );
            })}
          </View>
          <View style={styles.todayRow}>
            <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
            <Text style={typography.caption}>
              {todayCount} {todayCount === 1 ? 'solicitud registrada' : 'solicitudes registradas'} hoy
            </Text>
          </View>
        </FadeInView>

        {/* Últimas atenciones */}
        <FadeInView delay={340} style={styles.section}>
          <SectionHeader title="Últimas atenciones" actionLabel="Ver todas" onAction={() => openRequests()} />
          {loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.xl }} />
          ) : latest.length === 0 ? (
            <View style={styles.emptyCard}>
              <EmptyState
                compact
                icon="clipboard-outline"
                title="Aún no hay atenciones"
                message="Registra la primera solicitud del día y aparecerá aquí."
                actionLabel="Crear solicitud"
                onAction={() => openCreate()}
              />
            </View>
          ) : (
            <View style={{ gap: spacing.sm }}>
              {latest.map((r) => (
                <RequestCard key={r.id} request={r} onPress={openDetail} />
              ))}
            </View>
          )}
        </FadeInView>
      </ScrollView>

      {/* Modal de Centro de Notificaciones */}
      <Modal
        visible={showNotifications}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowNotifications(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <Ionicons name="notifications" size={20} color={colors.primaryDark} />
                <Text style={styles.modalTitle}>Notificaciones Clínicas</Text>
                {notifications.length > 0 && (
                  <View style={styles.modalBadge}>
                    <Text style={styles.modalBadgeText}>{notifications.length}</Text>
                  </View>
                )}
              </View>
              <PressableScale
                onPress={() => setShowNotifications(false)}
                style={styles.closeButton}
                accessibilityRole="button"
                accessibilityLabel="Cerrar notificaciones"
              >
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </PressableScale>
            </View>

            <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
              {notifications.length === 0 ? (
                <EmptyState
                  compact
                  icon="notifications-off-outline"
                  title="Sin notificaciones pendientes"
                  message="Las alertas de emergencias, turnos en espera y altas médicas aparecerán aquí."
                />
              ) : (
                <View style={{ gap: spacing.sm, paddingVertical: spacing.xs }}>
                  {notifications.map((n) => (
                    <PressableScale
                      key={n.id}
                      onPress={() => {
                        setShowNotifications(false);
                        openDetail(n.requestId);
                      }}
                      style={styles.notifCard}
                      accessibilityRole="button"
                      accessibilityLabel={n.title}
                    >
                      <View style={[styles.notifIcon, { backgroundColor: n.bg }]}>
                        <Ionicons name={n.icon} size={20} color={n.color} />
                      </View>
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={styles.notifTitle}>{n.title}</Text>
                        <Text style={styles.notifMessage} numberOfLines={2}>{n.message}</Text>
                        <Text style={styles.notifTime}>{n.time}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                    </PressableScale>
                  ))}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, maxWidth: 640, width: '100%', alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg },
  greeting: { fontFamily: fonts.regular, fontSize: 14, color: colors.textSecondary },
  name: { ...typography.display, marginVertical: 1 },

  hero: {
    height: 186,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.surfaceWarm,
    ...shadows.soft,
  },
  heroImage: { position: 'absolute', right: -40, top: 0, bottom: 0, width: '115%', height: '100%' },
  heroText: { flex: 1, padding: spacing.lg, justifyContent: 'space-between', maxWidth: '62%' },
  heroScript: { ...typography.script, fontSize: 17, lineHeight: 18, color: colors.textSecondary, transform: [{ rotate: '-4deg' }] },
  heroTitle: { fontFamily: fonts.semibold, fontSize: 19, lineHeight: 24, color: colors.text },
  heroButton: { alignSelf: 'flex-start', minHeight: 40 },

  // Cuadrícula 2x2 centrada y balanceada de servicios asistenciales
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.sm,
    marginTop: spacing.xs,
    width: '100%',
  },
  serviceSquareCard: {
    width: '48.5%',
    minHeight: 112,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md,
    justifyContent: 'space-between',
    ...shadows.soft,
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
  serviceBadgePill: {
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  serviceBadgeEmergency: {
    backgroundColor: colors.dangerSoft,
  },
  serviceBadgeText: {
    fontFamily: fonts.medium,
    fontSize: 10.5,
    color: colors.textSecondary,
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

  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
    padding: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.dangerSoft,
    borderWidth: 1,
    borderColor: '#F5D2CE',
  },
  alertTitle: { fontFamily: fonts.semibold, fontSize: 14, color: colors.danger },
  alertText: { fontFamily: fonts.regular, fontSize: 12, color: '#9A3A36' },

  section: { marginTop: spacing.xl },

  // Fila de 3 tarjetas del resumen de atenciones distribuidas equitativamente
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    width: '100%',
  },
  summaryCard: {
    width: '31.5%',
    borderRadius: radius.lg,
    paddingHorizontal: 6,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  summaryIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  summaryCount: { fontFamily: fonts.bold, fontSize: 22, lineHeight: 28 },
  summaryLabel: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  todayRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: spacing.sm },
  emptyCard: { ...common.card },

  // Modal de Notificaciones
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    maxHeight: '75%',
    ...shadows.raised,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    marginBottom: spacing.sm,
  },
  modalHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.text,
  },
  modalBadge: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  modalBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.primaryDark,
  },
  closeButton: {
    padding: 4,
  },
  modalList: {
    marginTop: spacing.xs,
  },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surfaceMuted,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  notifIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifTitle: {
    fontFamily: fonts.bold,
    fontSize: 13.5,
    color: colors.text,
  },
  notifMessage: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  notifTime: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
});
