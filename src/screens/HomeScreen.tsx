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
  PulseView,
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
import { activeUrgent, countByService, countByStatus, sortByNewest } from '../utils/requests';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Home'>,
  NativeStackScreenProps<RootStackParamList>
>;

const SUMMARY: { status: RequestStatus; label: string; countColor: string; labelColor: string }[] = [
  { status: 'PENDIENTE', label: 'Pendientes', countColor: '#18181B', labelColor: '#92400E' },
  { status: 'EN_ATENCION', label: 'En atención', countColor: '#18181B', labelColor: '#1E40AF' },
  { status: 'FINALIZADO', label: 'Finalizadas', countColor: '#18181B', labelColor: '#065F46' },
];

export function HomeScreen({ navigation }: Props) {
  const { session } = useAuth();
  const { requests, loading, servicePrices } = useRequests();
  const [showNotifications, setShowNotifications] = useState(false);
  const [readIds, setReadIds] = useState<Record<string, boolean>>({});

  const counts = useMemo(() => countByStatus(requests), [requests]);
  const urgent = useMemo(() => activeUrgent(requests), [requests]);
  const latest = useMemo(() => sortByNewest(requests).slice(0, 3), [requests]);
  const todayCount = useMemo(() => requests.filter((r) => isSameDay(r.fechaRegistro, new Date())).length, [requests]);
  const serviceCounts = useMemo(() => countByService(requests), [requests]);

  const notifications = useMemo(() => {
    const list: {
      id: string;
      requestId: string;
      icon: any;
      color: string;
      bg: string;
      category: string;
      title: string;
      message: string;
      time: string;
    }[] = [];

    for (const r of requests) {
      if (r.prioridad === 'URGENTE' && r.estado !== 'FINALIZADO') {
        list.push({
          id: `notif-urg-${r.id}`,
          requestId: r.id,
          icon: 'alert-circle',
          color: colors.danger,
          bg: colors.dangerSoft,
          category: 'Urgencia',
          title: `Urgencia activa: ${r.mascotaNombre}`,
          message: `${r.tipoServicio === 'EMERGENCIA' ? 'Atención de emergencia' : 'Prioridad urgente'}. ${r.descripcion || 'Requiere atención médica inmediata.'}`,
          time: formatRelative(r.fechaRegistro),
        });
      } else if (r.estado === 'EN_ATENCION') {
        list.push({
          id: `notif-prog-${r.id}`,
          requestId: r.id,
          icon: 'medical',
          color: colors.inProgress,
          bg: colors.inProgressSoft,
          category: 'En consultorio',
          title: `En atención: ${r.mascotaNombre}`,
          message: `Atendiendo ${SERVICE_META[r.tipoServicio].label}. Tutor: ${r.clienteNombre}.`,
          time: formatRelative(r.fechaRegistro),
        });
      } else if (r.estado === 'PENDIENTE') {
        list.push({
          id: `notif-pend-${r.id}`,
          requestId: r.id,
          icon: 'time',
          color: colors.pending,
          bg: colors.pendingSoft,
          category: 'Sala de espera',
          title: `En espera: ${r.mascotaNombre}`,
          message: `Servicio de ${SERVICE_META[r.tipoServicio].label}. Tutor: ${r.clienteNombre}.`,
          time: formatRelative(r.fechaRegistro),
        });
      } else if (r.estado === 'FINALIZADO') {
        list.push({
          id: `notif-done-${r.id}`,
          requestId: r.id,
          icon: 'checkmark-circle',
          color: colors.done,
          bg: colors.doneSoft,
          category: 'Alta médica',
          title: `Atención completada: ${r.mascotaNombre}`,
          message: `Paciente dado de alta tras ${SERVICE_META[r.tipoServicio].label}.`,
          time: formatRelative(r.fechaRegistro),
        });
      }
    }

    return list;
  }, [requests]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !readIds[n.id]).length,
    [notifications, readIds],
  );

  const toggleRead = (id: string) => {
    setReadIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const markAllAsRead = () => {
    const next: Record<string, boolean> = {};
    for (const n of notifications) {
      next[n.id] = true;
    }
    setReadIds(next);
  };

  const openDetail = (id: string) => navigation.navigate('RequestDetail', { requestId: id });
  const openCreate = (service?: ServiceType) => navigation.navigate('CreateRequest', service ? { service } : undefined);
  const openRequests = (params: TabParamList['Requests'] = {}) =>
    navigation.navigate('Requests', { status: 'TODOS', priority: 'TODAS', ...params, nonce: Date.now() });

  return (
    <SafeAreaView style={common.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <FadeInView style={styles.header}>
          <View style={styles.headerAvatar}>
            <Ionicons name="paw" size={20} color={colors.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>
              {greeting()} · {formatLongToday()}
            </Text>
            <Text style={styles.name} numberOfLines={1}>
              {shortGreetingName(session) || 'Dr. Carlos'}
            </Text>
          </View>
          <IconButton
            icon="notifications-outline"
            onPress={() => setShowNotifications(true)}
            accessibilityLabel={unreadCount ? `${unreadCount} notificaciones sin leer` : 'Notificaciones clínicas'}
            badge={unreadCount > 0}
            testID="home-bell"
          />
        </FadeInView>

        <FadeInView delay={80}>
          <View style={styles.hero}>
            <Image source={require('../../assets/images/hero.jpg')} style={styles.heroImage} resizeMode="cover" />
            <View style={styles.heroText}>
              <View style={styles.heroPill}>
                <PulseView minScale={0.7} maxScale={1.3} duration={1300}>
                  <View style={styles.heroPillDot} />
                </PulseView>
                <Text style={styles.heroPillText}>
                  {todayCount} {todayCount === 1 ? 'atención hoy' : 'atenciones hoy'}
                </Text>
              </View>
              <View>
                <Text style={styles.heroScript}>Mascotas felices</Text>
                <Text style={styles.heroTitle}>Cuidado médico{'\n'}en cada consulta</Text>
              </View>
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

        <FadeInView delay={130} style={styles.summarySection}>
          <View style={styles.summaryRow}>
            {SUMMARY.map(({ status, label, countColor, labelColor }) => {
              const meta = STATUS_META[status];
              return (
                <PressableScale
                  key={status}
                  onPress={() => openRequests({ status })}
                  style={[styles.summaryCard, { backgroundColor: meta.background, borderColor: meta.color + '45' }]}
                  accessibilityRole="button"
                  accessibilityLabel={`${counts[status]} ${label}`}
                  testID={`home-count-${status}`}
                >
                  <View style={styles.summaryTopRow}>
                    <View style={[styles.summaryIcon, { backgroundColor: colors.surface }]}>
                      <Ionicons name={meta.icon} size={16} color={meta.color} />
                    </View>
                    {loading ? (
                      <ActivityIndicator color={meta.color} style={{ height: 28 }} />
                    ) : (
                      <Text style={[styles.summaryCount, { color: countColor }]}>{counts[status]}</Text>
                    )}
                  </View>
                  <Text style={[styles.summaryLabel, { color: labelColor }]}>{label}</Text>
                </PressableScale>
              );
            })}
          </View>
        </FadeInView>

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
                    <View style={styles.serviceFooterRow}>
                      <Text style={styles.serviceCardHint} numberOfLines={1}>
                        {meta.hint}
                      </Text>
                      <Text style={[styles.servicePriceText, { color: meta.color }]}>
                        S/. {servicePrices[s].toFixed(0)}
                      </Text>
                    </View>
                  </View>
                </PressableScale>
              );
            })}
          </View>
        </FadeInView>

        {urgent.length > 0 && (
          <FadeInView delay={220}>
            <PressableScale
              onPress={() => openRequests({ priority: 'URGENTE' })}
              style={styles.alert}
              accessibilityRole="button"
              accessibilityLabel={`${urgent.length} urgencias activas. Ver solicitudes urgentes`}
              testID="home-urgent"
            >
              <PulseView minScale={0.88} maxScale={1.12} duration={1100}>
                <IconTile icon="alert-circle" color={colors.white} background={colors.danger} size={40} />
              </PulseView>
              <View style={{ flex: 1 }}>
                <Text style={styles.alertTitle}>
                  {urgent.length} {urgent.length === 1 ? 'urgencia activa' : 'urgencias activas'}
                </Text>
                <Text style={styles.alertText} numberOfLines={1}>
                  Pacientes: {urgent.map((u) => u.mascotaNombre).join(', ')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.danger} />
            </PressableScale>
          </FadeInView>
        )}

        <FadeInView delay={300} style={styles.section}>
          <SectionHeader title="Ingresos recientes" actionLabel="Directorio completo" onAction={() => openRequests()} />
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
                <View style={styles.modalHeaderIconWrap}>
                  <Ionicons name="notifications-outline" size={18} color={colors.primaryDark} />
                </View>
                <View>
                  <Text style={styles.modalTitle}>Avisos Clínicos</Text>
                  <Text style={styles.modalSubtitle}>
                    {unreadCount > 0
                      ? `${unreadCount} ${unreadCount === 1 ? 'pendiente de revisión' : 'pendientes de revisión'}`
                      : 'Todo revisado al día'}
                  </Text>
                </View>
              </View>
              <View style={styles.modalHeaderActions}>
                {notifications.length > 0 && unreadCount > 0 && (
                  <PressableScale
                    onPress={markAllAsRead}
                    style={styles.markAllPill}
                    accessibilityRole="button"
                    accessibilityLabel="Marcar todas las notificaciones como leídas"
                  >
                    <Ionicons name="checkmark-done" size={15} color={colors.done} />
                    <Text style={styles.markAllText}>Leídas</Text>
                  </PressableScale>
                )}
                <PressableScale
                  onPress={() => setShowNotifications(false)}
                  style={styles.closeButton}
                  accessibilityRole="button"
                  accessibilityLabel="Cerrar notificaciones"
                >
                  <Ionicons name="close" size={20} color={colors.textSecondary} />
                </PressableScale>
              </View>
            </View>

            <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
              {notifications.length === 0 ? (
                <EmptyState
                  compact
                  icon="checkmark-done-circle-outline"
                  title="Sin avisos pendientes"
                  message="Los ingresos, atenciones en curso y altas médicas se registrarán en este panel."
                />
              ) : (
                <View style={{ gap: spacing.sm, paddingVertical: spacing.xs }}>
                  {notifications.map((n) => {
                    const isRead = Boolean(readIds[n.id]);
                    return (
                      <PressableScale
                        key={n.id}
                        onPress={() => {
                          setReadIds((prev) => ({ ...prev, [n.id]: true }));
                          setShowNotifications(false);
                          openDetail(n.requestId);
                        }}
                        style={[styles.notifCard, isRead && styles.notifCardRead]}
                        accessibilityRole="button"
                        accessibilityLabel={n.title}
                      >
                        <View style={[styles.notifIcon, { backgroundColor: n.bg }]}>
                          <Ionicons name={n.icon} size={19} color={n.color} />
                        </View>
                        <View style={{ flex: 1, gap: 2 }}>
                          <View style={styles.notifTopMetaRow}>
                            <Text style={[styles.notifCategory, { color: n.color }]}>{n.category}</Text>
                            <Text style={styles.notifTime}>{n.time}</Text>
                          </View>
                          <Text style={[styles.notifTitle, isRead && styles.notifTitleRead]}>{n.title}</Text>
                          <Text style={styles.notifMessage} numberOfLines={2}>{n.message}</Text>
                        </View>
                        <PressableScale
                          onPress={() => toggleRead(n.id)}
                          style={[
                            styles.checkActionBtn,
                            isRead ? styles.checkActionBtnActive : styles.checkActionBtnIdle,
                          ]}
                          accessibilityRole="checkbox"
                          accessibilityState={{ checked: isRead }}
                          accessibilityLabel={isRead ? 'Marcar como no leído' : 'Marcar como revisado'}
                        >
                          <Ionicons
                            name="checkmark"
                            size={15}
                            color={isRead ? colors.white : colors.textMuted}
                          />
                        </PressableScale>
                      </PressableScale>
                    );
                  })}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.xs,
    marginBottom: spacing.md + 4,
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },
  greeting: {
    fontFamily: fonts.medium,
    fontSize: 12.5,
    color: colors.textMuted,
    marginBottom: 3,
  },
  name: {
    ...typography.display,
    fontSize: 22,
    lineHeight: 27,
    marginTop: 2,
  },

  hero: {
    height: 196,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: '#FFDDD9',
    ...shadows.raised,
  },
  heroImage: { position: 'absolute', right: -36, top: 0, bottom: 0, width: '112%', height: '100%' },
  heroText: { flex: 1, padding: spacing.lg, justifyContent: 'space-between', maxWidth: '64%' },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  heroPillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  heroPillText: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: colors.text,
  },
  heroScript: { ...typography.script, fontSize: 19, lineHeight: 20, color: colors.primaryDark },
  heroTitle: { fontFamily: fonts.bold, fontSize: 19, lineHeight: 23, letterSpacing: -0.3, color: colors.text },
  heroButton: { alignSelf: 'flex-start', minHeight: 40, borderRadius: radius.pill },

  summarySection: {
    marginTop: spacing.md,
  },
  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },

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
    minHeight: 118,
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
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  serviceIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceBadgePill: {
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    alignSelf: 'flex-start',
  },
  serviceBadgeEmergency: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.dangerBorder,
  },
  serviceBadgeText: {
    fontFamily: fonts.semibold,
    fontSize: 10.5,
    color: colors.textSecondary,
  },
  serviceCardBottom: {
    gap: 3,
  },
  serviceCardTitle: {
    fontFamily: fonts.bold,
    fontSize: 14,
    letterSpacing: -0.2,
    color: colors.text,
  },
  serviceFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  serviceCardHint: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textMuted,
    flex: 1,
  },
  servicePriceText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },

  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.dangerSoft,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
  },
  alertTitle: { fontFamily: fonts.bold, fontSize: 14, color: colors.danger },
  alertText: { fontFamily: fonts.medium, fontSize: 12, color: colors.dangerStrong },

  section: { marginTop: spacing.lg },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    width: '100%',
  },
  summaryCard: {
    width: '31.5%',
    borderRadius: radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: 'space-between',
    borderWidth: 1.5,
    gap: 6,
    ...shadows.soft,
  },
  summaryIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCount: { fontFamily: fonts.bold, fontSize: 24, lineHeight: 28, fontVariant: ['tabular-nums'] },
  summaryLabel: {
    fontFamily: fonts.bold,
    fontSize: 12,
    letterSpacing: -0.1,
  },
  todayRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: spacing.sm },
  emptyCard: { ...common.card },

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
    gap: 10,
    flex: 1,
  },
  modalHeaderIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: colors.text,
  },
  modalSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 11.5,
    color: colors.textMuted,
  },
  modalHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  markAllPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.doneSoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  markAllText: {
    fontFamily: fonts.semibold,
    fontSize: 11.5,
    color: colors.done,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalList: {
    marginTop: spacing.xs,
  },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  notifCardRead: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    opacity: 0.85,
  },
  notifIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifTopMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notifCategory: {
    fontFamily: fonts.semibold,
    fontSize: 10.5,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  notifTitle: {
    fontFamily: fonts.semibold,
    fontSize: 13.5,
    color: colors.text,
  },
  notifTitleRead: {
    fontFamily: fonts.medium,
    color: colors.textSecondary,
  },
  notifMessage: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  notifTime: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textMuted,
  },
  checkActionBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  checkActionBtnIdle: {
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
  },
  checkActionBtnActive: {
    backgroundColor: colors.done,
    borderColor: colors.done,
  },
});
