import React, { useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { EmptyState, FadeInView, PetAvatar, PressableScale, PriorityChip, PulseView, StatusChip } from '../components';
import { useRequests } from '../context/RequestsContext';
import { TabParamList, RootStackParamList } from '../navigation/types';
import { colors, common, fonts, radius, shadows, spacing, typography } from '../theme';
import { formatLongToday, formatTime, isSameDay } from '../utils/date';
import { SERVICE_META } from '../utils/requestMeta';
import { sortByAttentionOrder } from '../utils/requests';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Calendar'>,
  NativeStackScreenProps<RootStackParamList>
>;

interface WeekDayInfo {
  key: string;
  day: string;
  date: string;
  fullDate: Date;
  isToday: boolean;
  longLabel: string;
}

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getWeekDays(): WeekDayInfo[] {
  const today = new Date();
  const currentDay = today.getDay();
  const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);
  monday.setHours(12, 0, 0, 0);

  const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  return dayNames.map((name, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return {
      key: toDateKey(d),
      day: name,
      date: String(d.getDate()),
      fullDate: d,
      isToday: d.toDateString() === today.toDateString(),
      longLabel: formatLongToday(d),
    };
  });
}

export function CalendarScreen({ navigation }: Props) {
  const weekDays = useMemo(() => getWeekDays(), []);
  const [selectedKey, setSelectedKey] = useState(() => toDateKey(new Date()));
  const [showAllDays, setShowAllDays] = useState(false);
  const { requests } = useRequests();

  const selectedDayObj = useMemo(
    () => weekDays.find((d) => d.key === selectedKey) ?? weekDays[0],
    [weekDays, selectedKey],
  );

  const countsByKey = useMemo(() => {
    const map: Record<string, number> = {};
    for (const d of weekDays) {
      map[d.key] = requests.filter((r) => isSameDay(r.fechaRegistro, d.fullDate)).length;
    }
    return map;
  }, [requests, weekDays]);

  const scheduledList = useMemo(() => {
    if (showAllDays) {
      return sortByAttentionOrder(requests);
    }
    const forSelectedDay = requests.filter((r) =>
      isSameDay(r.fechaRegistro, selectedDayObj.fullDate),
    );
    return sortByAttentionOrder(forSelectedDay);
  }, [requests, selectedDayObj, showAllDays]);

  const openCreateForSelectedDay = () => {
    navigation.navigate('CreateRequest', {
      initialDate: selectedDayObj.fullDate.toISOString(),
    });
  };

  return (
    <SafeAreaView style={common.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <FadeInView delay={40} distance={10}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.subtitle}>Agenda de Atenciones</Text>
              <Text style={typography.title} accessibilityRole="header">
                Calendario Clínico
              </Text>
            </View>
            <PressableScale
              onPress={openCreateForSelectedDay}
              style={styles.newApptButton}
              accessibilityRole="button"
              accessibilityLabel="Nueva solicitud"
            >
              <Ionicons name="add" size={16} color={colors.white} />
              <Text style={styles.newApptButtonText}>Nueva Solicitud</Text>
            </PressableScale>
          </View>
        </FadeInView>

        <FadeInView delay={90} distance={12}>
          <View style={styles.weekRow}>
            {weekDays.map((d) => {
              const active = !showAllDays && selectedKey === d.key;
              const dayCount = countsByKey[d.key] ?? 0;
              return (
                <PressableScale
                  key={d.key}
                  onPress={() => {
                    setShowAllDays(false);
                    setSelectedKey(d.key);
                  }}
                  style={[styles.dayItem, active && styles.dayItemActive]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={`${d.day} ${d.date}${dayCount > 0 ? `, ${dayCount} atenciones` : ''}`}
                >
                  <Text style={[styles.dayName, active && styles.dayNameActive]}>{d.day}</Text>
                  <View style={[styles.dateCircle, active && styles.dateCircleActive]}>
                    <Text style={[styles.dateNumber, active && styles.dateNumberActive]}>{d.date}</Text>
                  </View>
                  <View style={styles.dotRow}>
                    {d.isToday && <View style={[styles.todayDot, active && { backgroundColor: colors.white }]} />}
                    {dayCount > 0 && (
                      <View
                        style={[
                          styles.countDot,
                          active ? { backgroundColor: colors.white } : { backgroundColor: colors.sage },
                        ]}
                      />
                    )}
                  </View>
                </PressableScale>
              );
            })}
          </View>
        </FadeInView>

        <FadeInView delay={140} distance={14}>
          <View style={styles.shiftCard}>
            <View style={styles.shiftHeader}>
              <View style={styles.shiftBadge}>
                <PulseView minScale={0.7} maxScale={1.3} duration={1300}>
                  <View style={styles.liveDot} />
                </PulseView>
                <Text style={styles.shiftBadgeText}>
                  {selectedDayObj.isToday && !showAllDays ? 'TURNO EN CURSO · HOY' : 'AGENDA CLÍNICA'}
                </Text>
              </View>
              <Text style={styles.shiftTime}>08:00 – 20:00</Text>
            </View>
            <Text style={styles.shiftTitle}>
              {showAllDays ? 'Todas las atenciones registradas' : `Atención Médica · ${selectedDayObj.longLabel}`}
            </Text>
            <View style={styles.shiftFooterRow}>
              <Text style={styles.shiftDoctor}>
                {scheduledList.length} {scheduledList.length === 1 ? 'paciente programado' : 'pacientes programados'}
              </Text>
              {requests.length > 0 && (
                <Pressable
                  onPress={() => setShowAllDays((prev) => !prev)}
                  style={styles.toggleAllPill}
                  accessibilityRole="button"
                  accessibilityLabel={showAllDays ? 'Ver solo día seleccionado' : 'Ver toda la semana'}
                >
                  <Ionicons
                    name={showAllDays ? 'today-outline' : 'calendar-outline'}
                    size={13}
                    color={colors.primaryDark}
                  />
                  <Text style={styles.toggleAllText}>
                    {showAllDays ? 'Filtrar por día' : `Ver todas (${requests.length})`}
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        </FadeInView>

        <FadeInView delay={190} distance={14}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={typography.heading}>Cronograma de Pacientes</Text>
              <Text style={styles.countBadge}>{scheduledList.length} atenciones</Text>
            </View>

            {scheduledList.length === 0 ? (
              <EmptyState
                icon="calendar-outline"
                title={
                  requests.length === 0
                    ? 'Sin atenciones registradas'
                    : `Sin turnos para el ${selectedDayObj.day} ${selectedDayObj.date}`
                }
                message={
                  requests.length === 0
                    ? 'Cuando registres una solicitud de atención, aparecerá programada en este cronograma.'
                    : 'No hay pacientes programados en esta fecha. Puedes agendar una nueva solicitud para este día.'
                }
                actionLabel="Agendar en este día"
                onAction={openCreateForSelectedDay}
              />
            ) : (
              <View style={{ gap: spacing.sm, marginTop: spacing.xs }}>
                {scheduledList.map((r) => {
                  const service = SERVICE_META[r.tipoServicio];
                  const isEmergency = r.tipoServicio === 'EMERGENCIA' || r.prioridad === 'URGENTE';
                  const timeStr = formatTime(r.fechaRegistro);

                  return (
                    <PressableScale
                      key={r.id}
                      onPress={() => navigation.navigate('RequestDetail', { requestId: r.id })}
                      style={[styles.appointmentCard, isEmergency && styles.emergencyCard]}
                      accessibilityRole="button"
                      accessibilityLabel={`Atención de ${r.mascotaNombre}. Toca para ver detalle`}
                    >
                      {isEmergency && <View style={styles.emergencyBar} />}

                      <View style={styles.timeCol}>
                        <Text style={styles.timeText}>{timeStr.split(' ')[0]}</Text>
                        <Text style={styles.timePeriod}>{timeStr.split(' ').slice(1).join(' ')}</Text>
                      </View>

                      <View style={styles.dividerVertical} />

                      <PetAvatar species={r.especie} size={42} />

                      <View style={styles.detailsCol}>
                        <View style={styles.topDetailsRow}>
                          <Text style={styles.patientName} numberOfLines={1}>
                            {r.mascotaNombre}
                          </Text>
                          <PriorityChip priority={r.prioridad} size="sm" />
                        </View>

                        <Text style={styles.clientText} numberOfLines={1}>
                          Tutor: {r.clienteNombre} · {r.telefono}
                        </Text>

                        {r.registradoPor && (
                          <View style={styles.staffBadgeRow}>
                            <Ionicons name="person-outline" size={11} color={colors.textMuted} />
                            <Text style={styles.staffBadgeText} numberOfLines={1}>
                              {r.registradoPor}
                            </Text>
                          </View>
                        )}

                        <View style={styles.bottomMetaRow}>
                          <View style={styles.serviceTag}>
                            <Ionicons name={service.icon} size={11} color={service.color} />
                            <Text style={[styles.serviceText, { color: service.color }]} numberOfLines={1}>
                              {service.label}
                            </Text>
                          </View>
                          <StatusChip status={r.estado} size="sm" />
                        </View>
                      </View>
                    </PressableScale>
                  );
                })}
              </View>
            )}
          </View>
        </FadeInView>
      </ScrollView>
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
    gap: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  subtitle: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  newApptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    ...shadows.soft,
  },
  newApptButtonText: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.white,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  dayItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: radius.lg,
    minWidth: 42,
    minHeight: 66,
    gap: 4,
  },
  dayItemActive: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    ...Platform.select({
      android: { elevation: 3 },
      default: {
        shadowColor: colors.primary,
        shadowOpacity: 0.35,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
      },
    }),
  },
  dayName: {
    fontFamily: fonts.medium,
    fontSize: 11.5,
    color: colors.textMuted,
  },
  dayNameActive: {
    color: colors.white,
    fontFamily: fonts.bold,
  },
  dateCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateCircleActive: {
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  dateNumber: {
    fontFamily: fonts.bold,
    fontSize: 13.5,
    color: colors.text,
  },
  dateNumberActive: {
    color: colors.white,
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  dotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    minHeight: 5,
  },
  countDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  shiftCard: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#FFD5D1',
    gap: 4,
  },
  shiftFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  toggleAllPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: '#FFD5D1',
  },
  toggleAllText: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: colors.primaryDark,
  },
  shiftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  shiftBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.done,
  },
  shiftBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: colors.done,
    letterSpacing: 0.4,
  },
  shiftTime: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.primaryDark,
    fontVariant: ['tabular-nums'],
  },
  shiftTitle: {
    fontFamily: fonts.bold,
    fontSize: 14.5,
    color: colors.text,
  },
  shiftDoctor: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.textSecondary,
  },
  section: {
    gap: spacing.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  countBadge: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.textSecondary,
  },
  appointmentCard: {
    ...common.card,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
    position: 'relative',
    overflow: 'hidden',
  },
  emergencyCard: {
    borderColor: colors.dangerBorder,
  },
  emergencyBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: colors.danger,
  },
  timeCol: {
    alignItems: 'center',
    minWidth: 44,
  },
  timeText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.text,
  },
  timePeriod: {
    fontFamily: fonts.medium,
    fontSize: 9.5,
    color: colors.textMuted,
  },
  dividerVertical: {
    width: 1,
    height: '75%',
    backgroundColor: colors.divider,
  },
  detailsCol: {
    flex: 1,
    gap: 2,
  },
  topDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 6,
  },
  patientName: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  clientText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSecondary,
  },
  staffBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  staffBadgeText: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.primaryDark,
  },
  bottomMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  serviceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  serviceText: {
    fontFamily: fonts.medium,
    fontSize: 11.5,
  },
});
