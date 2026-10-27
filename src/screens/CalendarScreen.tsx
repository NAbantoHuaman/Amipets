import React, { useMemo, useState } from 'react';
import {
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
import { EmptyState, PetAvatar, PressableScale, PriorityChip, StatusChip } from '../components';
import { useRequests } from '../context/RequestsContext';
import { TabParamList, RootStackParamList } from '../navigation/types';
import { colors, common, fonts, radius, shadows, spacing, typography } from '../theme';
import { formatTime } from '../utils/date';
import { SERVICE_META } from '../utils/requestMeta';
import { sortByAttentionOrder } from '../utils/requests';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Calendar'>,
  NativeStackScreenProps<RootStackParamList>
>;

function getWeekDays(): { day: string; date: string; isToday: boolean }[] {
  const today = new Date();
  const currentDay = today.getDay();
  const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);

  const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  return dayNames.map((name, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return {
      day: name,
      date: String(d.getDate()),
      isToday: d.toDateString() === today.toDateString(),
    };
  });
}

export function CalendarScreen({ navigation }: Props) {
  const weekDays = useMemo(() => getWeekDays(), []);
  const [selectedDate, setSelectedDate] = useState(() => String(new Date().getDate()));
  const { requests } = useRequests();

  const scheduledList = useMemo(() => {
    const forSelectedDay = requests.filter((r) => {
      const d = new Date(r.fechaRegistro);
      return String(d.getDate()) === selectedDate;
    });
    return sortByAttentionOrder(forSelectedDay.length > 0 ? forSelectedDay : requests);
  }, [requests, selectedDate]);

  return (
    <SafeAreaView style={common.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <View style={styles.headerRow}>
          <View>
            <Text style={styles.subtitle}>Agenda de Atenciones</Text>
            <Text style={typography.title} accessibilityRole="header">
              Calendario Clínico
            </Text>
          </View>
          <PressableScale
            onPress={() => navigation.navigate('CreateRequest')}
            style={styles.newApptButton}
            accessibilityRole="button"
            accessibilityLabel="Nueva solicitud"
          >
            <Ionicons name="add" size={16} color={colors.white} />
            <Text style={styles.newApptButtonText}>Nueva Solicitud</Text>
          </PressableScale>
        </View>

        <View style={styles.weekRow}>
          {weekDays.map((d) => {
            const active = selectedDate === d.date;
            return (
              <Pressable
                key={d.date}
                onPress={() => setSelectedDate(d.date)}
                style={[styles.dayItem, active && styles.dayItemActive]}
                accessibilityRole="button"
                accessibilityLabel={`${d.day} ${d.date}`}
              >
                <Text style={[styles.dayName, active && styles.dayNameActive]}>{d.day}</Text>
                <View style={[styles.dateCircle, active && styles.dateCircleActive]}>
                  <Text style={[styles.dateNumber, active && styles.dateNumberActive]}>{d.date}</Text>
                </View>
                {d.isToday && <View style={[styles.todayDot, active && { backgroundColor: colors.white }]} />}
              </Pressable>
            );
          })}
        </View>

        <View style={styles.shiftCard}>
          <View style={styles.shiftHeader}>
            <View style={styles.shiftBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.shiftBadgeText}>TURNO EN CURSO</Text>
            </View>
            <Text style={styles.shiftTime}>08:00 – 20:00</Text>
          </View>
          <Text style={styles.shiftTitle}>Atención Médica Veterinaria · Consultorio 1</Text>
          <Text style={styles.shiftDoctor}>
            {scheduledList.length} {scheduledList.length === 1 ? 'paciente registrado' : 'pacientes registrados'} en sistema
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={typography.heading}>Cronograma de Pacientes</Text>
            <Text style={styles.countBadge}>{scheduledList.length} atenciones</Text>
          </View>

          {scheduledList.length === 0 ? (
            <EmptyState
              icon="calendar-outline"
              title="Sin atenciones registradas"
              message="Cuando registres una solicitud de atención, aparecerá programada en este cronograma."
              actionLabel="Crear solicitud"
              onAction={() => navigation.navigate('CreateRequest')}
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
    padding: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  dayItem: {
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: radius.md,
    gap: 4,
  },
  dayItemActive: {
    backgroundColor: colors.primary,
  },
  dayName: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textMuted,
  },
  dayNameActive: {
    color: colors.white,
    fontFamily: fonts.medium,
  },
  dateCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateCircleActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  dateNumber: {
    fontFamily: fonts.bold,
    fontSize: 13,
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
  shiftCard: {
    backgroundColor: colors.surfaceWarm,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
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
    letterSpacing: 0.3,
  },
  shiftTime: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.textSecondary,
  },
  shiftTitle: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.text,
  },
  shiftDoctor: {
    fontFamily: fonts.regular,
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
