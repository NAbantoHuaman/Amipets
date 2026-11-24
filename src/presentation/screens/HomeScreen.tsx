import React, { useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  OrderCard,
  PawBackdrop,
  PressableScale,
  PrimaryButton,
  PulseView,
  RequestCard,
  SectionHeader,
  WeatherPetCard,
} from '../components';
import { shortGreetingName, useAuth } from '../context/AuthContext';
import { useOrders } from '../context/OrdersContext';
import { useRequests } from '../context/RequestsContext';
import { calculateOrderTotal, countOrdersByStatus } from '../../application/services/orderService';
import { ServiceType } from '../../domain/models/request';
import { RootStackParamList, TabParamList } from '../navigation/types';
import { colors, common, fonts, radius, shadows, spacing, typography } from '../theme';
import { formatRelative, formatShortToday, greeting, isSameDay } from '../utils/date';
import { SERVICE_META } from '../utils/requestMeta';
import { activeUrgent, countByStatus } from '../utils/requests';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Home'>,
  NativeStackScreenProps<RootStackParamList>
>;

export function HomeScreen({ navigation }: Props) {
  const { session } = useAuth();
  const { requests, loading } = useRequests();
  const { orders } = useOrders();
  const [showNotifications, setShowNotifications] = useState(false);
  const [readIds, setReadIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem('amipets_notif_read_v1')
      .then((raw) => {
        if (!active || !raw) return;
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          setReadIds(parsed as Record<string, boolean>);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const persistReadIds = (next: Record<string, boolean>) => {
    void AsyncStorage.setItem('amipets_notif_read_v1', JSON.stringify(next)).catch(() => {});
  };

  const counts = useMemo(() => countByStatus(requests), [requests]);
  const orderCounts = useMemo(() => countOrdersByStatus(orders), [orders]);
  const urgent = useMemo(() => activeUrgent(requests), [requests]);
  const todayCount = useMemo(
    () => requests.filter((r) => isSameDay(r.fechaRegistro, new Date())).length,
    [requests],
  );

  const activeClinicCount = counts.PENDIENTE + counts.EN_ATENCION;
  const activeOrdersCount = orderCounts.PENDIENTE + orderCounts.EN_PROCESO;

  const recentActivity = useMemo(() => {
    const items = [
      ...requests.map((r) => ({
        kind: 'request' as const,
        key: `req-${r.id}`,
        dateMs: new Date(r.fechaRegistro).getTime(),
        request: r,
      })),
      ...orders.map((o) => ({
        kind: 'order' as const,
        key: `ord-${o.id}`,
        dateMs: new Date(o.fechaRegistro).getTime(),
        order: o,
      })),
    ];
    return items.sort((a, b) => b.dateMs - a.dateMs).slice(0, 3);
  }, [requests, orders]);

  const notifications = useMemo(() => {
    const list: {
      id: string;
      kind: 'request' | 'order';
      targetId: string;
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
          kind: 'request',
          targetId: r.id,
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
          kind: 'request',
          targetId: r.id,
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
          kind: 'request',
          targetId: r.id,
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
          kind: 'request',
          targetId: r.id,
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

    for (const o of orders) {
      if (o.estado === 'PENDIENTE') {
        const total = calculateOrderTotal(o.cantidad, o.precio);
        list.push({
          id: `notif-ord-pend-${o.id}`,
          kind: 'order',
          targetId: o.id,
          icon: 'bag-handle',
          color: colors.pending,
          bg: colors.pendingSoft,
          category: 'Pedido nuevo',
          title: `Pedido pendiente: ${o.producto}`,
          message: `${o.clienteNombre} · ${o.cantidad} und. · S/. ${total.toFixed(2)}`,
          time: formatRelative(o.fechaRegistro),
        });
      } else if (o.estado === 'EN_PROCESO') {
        list.push({
          id: `notif-ord-proc-${o.id}`,
          kind: 'order',
          targetId: o.id,
          icon: 'construct',
          color: colors.inProgress,
          bg: colors.inProgressSoft,
          category: 'En preparación',
          title: `Preparando: ${o.producto}`,
          message: `Cliente: ${o.clienteNombre} · ${o.cantidad} und.`,
          time: formatRelative(o.fechaRegistro),
        });
      }
    }

    return list;
  }, [requests, orders]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !readIds[n.id]).length,
    [notifications, readIds],
  );

  const toggleRead = (id: string) => {
    setReadIds((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      persistReadIds(next);
      return next;
    });
  };

  const markAllAsRead = () => {
    const next: Record<string, boolean> = {};
    for (const n of notifications) {
      next[n.id] = true;
    }
    setReadIds(next);
    persistReadIds(next);
  };

  const openDetail = (id: string) => navigation.navigate('RequestDetail', { requestId: id });
  const openOrderDetail = (id: string) => navigation.navigate('OrderDetail', { orderId: id });
  const openCreate = (service?: ServiceType) =>
    navigation.navigate('CreateRequest', service ? { service } : undefined);
  const openRequests = (params: TabParamList['Requests'] = {}) =>
    navigation.navigate('Requests', { status: 'TODOS', priority: 'TODAS', ...params, nonce: Date.now() });
  const openOrders = () =>
    navigation.navigate('Orders', { status: 'TODOS', nonce: Date.now() });

  return (
    <SafeAreaView style={common.screen} edges={['top']}>
      <PawBackdrop variant="home" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <FadeInView style={styles.header}>
          <View style={styles.headerAvatar}>
            <Ionicons name="paw" size={20} color={colors.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting} numberOfLines={1}>
              {greeting().replace(/,$/, '')} · {formatShortToday()}
            </Text>
            <Text style={styles.name} numberOfLines={1}>
              {shortGreetingName(session) || 'Dr. Carlos'}
            </Text>
          </View>
          <IconButton
            icon="calendar-outline"
            onPress={() => navigation.navigate('Calendar')}
            accessibilityLabel="Calendario clínico"
            testID="home-calendar"
          />
          <IconButton
            icon="notifications-outline"
            onPress={() => setShowNotifications(true)}
            accessibilityLabel={unreadCount ? `${unreadCount} notificaciones sin leer` : 'Notificaciones clínicas'}
            badge={unreadCount > 0}
            testID="home-bell"
          />
        </FadeInView>

        <FadeInView delay={70}>
          <View style={styles.hero}>
            <Image
              source={require('../../../assets/images/hero.jpg')}
              style={styles.heroImage}
              resizeMode="cover"
            />
            <View style={styles.heroText}>
              <View style={styles.heroTopPills}>
                <View style={styles.heroPill}>
                  <PulseView minScale={0.7} maxScale={1.3} duration={1300}>
                    <View style={styles.heroPillDot} />
                  </PulseView>
                  <Text style={styles.heroPillText}>
                    {todayCount} {todayCount === 1 ? 'cita hoy' : 'citas hoy'}
                  </Text>
                </View>
                <WeatherPetCard />
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

        <FadeInView delay={120} style={styles.summaryPairRow}>
          <PressableScale
            onPress={() => openRequests()}
            style={styles.summaryPairCard}
            accessibilityRole="button"
            accessibilityLabel={`${activeClinicCount} atenciones clínicas activas`}
            testID="home-summary-clinic"
          >
            <View style={styles.summaryPairTop}>
              <View style={[styles.summaryPairIcon, { backgroundColor: colors.primarySoft }]}>
                <Ionicons name="medkit-outline" size={17} color={colors.primaryDark} />
              </View>
              {loading ? (
                <ActivityIndicator color={colors.primary} size="small" />
              ) : (
                <Text style={styles.summaryPairCount}>{activeClinicCount}</Text>
              )}
            </View>
            <Text style={styles.summaryPairTitle}>Clínica activa</Text>
            <Text style={styles.summaryPairMeta} numberOfLines={1}>
              {activeClinicCount === 0
                ? 'Todo al día'
                : `${counts.PENDIENTE} pend. · ${counts.EN_ATENCION} en curso`}
            </Text>
          </PressableScale>

          <PressableScale
            onPress={openOrders}
            style={styles.summaryPairCard}
            accessibilityRole="button"
            accessibilityLabel={`${activeOrdersCount} pedidos de tienda activos`}
            testID="home-summary-orders"
          >
            <View style={styles.summaryPairTop}>
              <View style={[styles.summaryPairIcon, { backgroundColor: colors.accentSoft }]}>
                <Ionicons name="bag-handle-outline" size={17} color={colors.accent} />
              </View>
              <Text style={styles.summaryPairCount}>{activeOrdersCount}</Text>
            </View>
            <Text style={styles.summaryPairTitle}>Pedidos activos</Text>
            <Text style={styles.summaryPairMeta} numberOfLines={1}>
              {activeOrdersCount === 0
                ? 'Sin pendientes'
                : `${orderCounts.PENDIENTE} pend. · ${orderCounts.EN_PROCESO} en proceso`}
            </Text>
          </PressableScale>
        </FadeInView>

        {urgent.length > 0 && (
          <FadeInView delay={150}>
            <PressableScale
              onPress={() => openRequests({ priority: 'URGENTE' })}
              style={styles.alert}
              accessibilityRole="button"
              accessibilityLabel={`${urgent.length} urgencias activas. Ver solicitudes urgentes`}
              testID="home-urgent"
            >
              <PulseView minScale={0.88} maxScale={1.12} duration={1100}>
                <IconTile icon="alert-circle" color={colors.white} background={colors.danger} size={38} />
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

        <FadeInView delay={180} style={styles.quickRow}>
          <PressableScale
            onPress={() => navigation.navigate('CreateOrder')}
            style={[styles.quickCard, { backgroundColor: colors.accentSoft, borderColor: '#EBD0BC' }]}
            accessibilityRole="button"
            accessibilityLabel="Registrar nuevo pedido de tienda"
            testID="home-new-order"
          >
            <View style={styles.quickIconBox}>
              <Ionicons name="add-circle-outline" size={19} color={colors.accent} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[styles.quickTitle, { color: '#8C4818' }]} numberOfLines={1}>
                Nuevo pedido
              </Text>
              <Text style={styles.quickHint} numberOfLines={1}>
                Tienda Pet Shop
              </Text>
            </View>
          </PressableScale>

          <PressableScale
            onPress={() => navigation.navigate('BreedGuide')}
            style={[styles.quickCard, { backgroundColor: colors.primarySoft, borderColor: colors.primaryBorder }]}
            accessibilityRole="button"
            accessibilityLabel="Abrir guía clínica de razas"
            testID="home-breed-guide"
          >
            <View style={styles.quickIconBox}>
              <Ionicons name="book-outline" size={18} color={colors.primaryDark} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[styles.quickTitle, { color: colors.primaryDark }]} numberOfLines={1}>
                Guía de razas
              </Text>
              <Text style={styles.quickHint} numberOfLines={1}>
                Perros y gatos
              </Text>
            </View>
          </PressableScale>
        </FadeInView>

        <FadeInView delay={220} style={styles.section}>
          <SectionHeader
            title="Actividad reciente"
            actionLabel="Ver pedidos"
            onAction={openOrders}
          />
          {loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.xl }} />
          ) : recentActivity.length === 0 ? (
            <View style={styles.emptyCard}>
              <EmptyState
                compact
                illustration="orders"
                title="Sin actividad reciente"
                message="Registra una atención clínica o un pedido de tienda para verlo aquí."
                actionLabel="Nueva solicitud"
                onAction={() => openCreate()}
              />
            </View>
          ) : (
            <View style={{ gap: spacing.sm }}>
              {recentActivity.map((item) =>
                item.kind === 'request' ? (
                  <RequestCard key={item.key} request={item.request} onPress={openDetail} />
                ) : (
                  <OrderCard key={item.key} order={item.order} onPress={openOrderDetail} />
                ),
              )}
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
                  <Text style={styles.modalTitle}>Avisos</Text>
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
                  message="Los ingresos, atenciones en curso y pedidos se registrarán en este panel."
                />
              ) : (
                <View style={{ gap: spacing.sm, paddingVertical: spacing.xs }}>
                  {notifications.map((n) => {
                    const isRead = Boolean(readIds[n.id]);
                    return (
                      <PressableScale
                        key={n.id}
                        onPress={() => {
                          setReadIds((prev) => {
                            const next = { ...prev, [n.id]: true };
                            persistReadIds(next);
                            return next;
                          });
                          setShowNotifications(false);
                          if (n.kind === 'order') {
                            openOrderDetail(n.targetId);
                          } else {
                            openDetail(n.targetId);
                          }
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
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.xs,
    marginBottom: spacing.md + 2,
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
    marginBottom: 2,
  },
  name: {
    ...typography.display,
    fontSize: 22,
    lineHeight: 27,
  },

  hero: {
    height: 198,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.raised,
  },
  heroImage: {
    position: 'absolute',
    right: -36,
    top: 0,
    bottom: 0,
    width: '112%',
    height: '100%',
  },
  heroText: {
    flex: 1,
    padding: spacing.md + 2,
    justifyContent: 'space-between',
    maxWidth: '68%',
  },
  heroTopPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 9,
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
  heroScript: {
    ...typography.script,
    fontSize: 19,
    lineHeight: 20,
    color: colors.primaryDark,
  },
  heroTitle: {
    fontFamily: fonts.bold,
    fontSize: 19,
    lineHeight: 23,
    letterSpacing: -0.3,
    color: colors.text,
  },
  heroButton: {
    alignSelf: 'flex-start',
    minHeight: 40,
    borderRadius: radius.pill,
  },

  summaryPairRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  summaryPairCard: {
    flex: 1,
    ...common.card,
    padding: spacing.md,
    gap: 4,
  },
  summaryPairTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  summaryPairIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryPairCount: {
    fontFamily: fonts.bold,
    fontSize: 24,
    lineHeight: 28,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  summaryPairTitle: {
    fontFamily: fonts.bold,
    fontSize: 13.5,
    color: colors.text,
  },
  summaryPairMeta: {
    fontFamily: fonts.regular,
    fontSize: 11.5,
    color: colors.textMuted,
  },

  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.dangerSoft,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
  },
  alertTitle: { fontFamily: fonts.bold, fontSize: 14, color: colors.danger },
  alertText: { fontFamily: fonts.medium, fontSize: 12, color: colors.dangerStrong },

  quickRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  quickCard: {
    flex: 1,
    ...common.card,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  quickIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  quickTitle: {
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  quickHint: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textSecondary,
  },

  section: { marginTop: spacing.lg },
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
