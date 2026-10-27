import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VeterinaryRequest } from '../models/request';
import { colors, common, fonts, radius, spacing } from '../theme';
import { formatRelative, formatTime } from '../utils/date';
import { SERVICE_META } from '../utils/requestMeta';
import { describeRequest } from '../utils/requests';
import { PriorityChip, StatusChip } from './Chips';
import { PetAvatar } from './PetAvatar';
import { PressableScale } from './PressableScale';

interface Props {
  request: VeterinaryRequest;
  onPress: (id: string) => void;
}

function RequestCardBase({ request, onPress }: Props) {
  const service = SERVICE_META[request.tipoServicio];
  const isUrgent = request.prioridad === 'URGENTE' && request.estado !== 'FINALIZADO';
  const isDone = request.estado === 'FINALIZADO';

  return (
    <PressableScale
      testID={`request-card-${request.id}`}
      onPress={() => onPress(request.id)}
      accessibilityRole="button"
      accessibilityLabel={describeRequest(request)}
      accessibilityHint="Abre el detalle de la solicitud"
      style={[styles.card, isUrgent && styles.urgent]}
    >
      {isUrgent && <View style={styles.urgentBar} />}
      <PetAvatar species={request.especie} size={58} muted={isDone} />

      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={styles.pet} numberOfLines={1}>
            {request.mascotaNombre}
          </Text>
          <PriorityChip priority={request.prioridad} />
        </View>

        <View style={styles.serviceRow}>
          <Ionicons name={service.icon} size={13} color={service.color} />
          <Text style={styles.service} numberOfLines={1}>
            {service.label} · {request.clienteNombre}
          </Text>
        </View>

        <View style={styles.bottomRow}>
          <View style={styles.dateRow}>
            <Ionicons name="time-outline" size={12} color={colors.textMuted} />
            <Text style={styles.date}>
              {formatRelative(request.fechaRegistro)} · {formatTime(request.fechaRegistro)}
            </Text>
          </View>
          <StatusChip status={request.estado} />
        </View>
      </View>

      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </PressableScale>
  );
}

export const RequestCard = memo(RequestCardBase);

const styles = StyleSheet.create({
  card: {
    ...common.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    paddingRight: spacing.xs,
    overflow: 'hidden',
  },
  urgent: { borderColor: colors.dangerBorder },
  urgentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: colors.danger,
    borderTopLeftRadius: radius.lg,
    borderBottomLeftRadius: radius.lg,
  },
  body: { flex: 1, gap: 3 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  pet: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text, flexShrink: 1 },
  serviceRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  service: { fontFamily: fonts.regular, fontSize: 12.5, color: colors.textSecondary, flex: 1 },
  bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.xs, marginTop: 2 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1 },
  date: { fontFamily: fonts.regular, fontSize: 11, color: colors.textMuted },
});
