import { ComponentProps } from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Priority, RequestStatus, ServiceType, Species } from '../models/request';
import { colors } from '../theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];
export type SpeciesIconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

interface VisualMeta {
  label: string;
  icon: IconName;
  color: string;
  background: string;
}

/**
 * Estados (chips rellenos): pizarra = en espera, azul = en curso, verde = terminado.
 * Usan una familia de color distinta a las prioridades.
 */
export const STATUS_META: Record<RequestStatus, VisualMeta & { description: string }> = {
  PENDIENTE: {
    label: 'Pendiente',
    icon: 'hourglass-outline',
    color: colors.pending,
    background: colors.pendingSoft,
    description: 'En espera de ser atendido.',
  },
  EN_ATENCION: {
    label: 'En atención',
    icon: 'medical-outline',
    color: colors.inProgress,
    background: colors.inProgressSoft,
    description: 'En consulta o procedimiento.',
  },
  FINALIZADO: {
    label: 'Finalizado',
    icon: 'checkmark-circle-outline',
    color: colors.done,
    background: colors.doneSoft,
    description: 'Atención completada.',
  },
};

/** Prioridades (chips con borde): escala de calor de gris a rojo. */
export const PRIORITY_META: Record<Priority, VisualMeta & { order: number }> = {
  URGENTE: { label: 'Urgente', icon: 'flame', color: colors.priorityUrgent, background: colors.priorityUrgentSoft, order: 0 },
  ALTA: { label: 'Alta', icon: 'arrow-up', color: colors.priorityHigh, background: colors.priorityHighSoft, order: 1 },
  MEDIA: { label: 'Media', icon: 'remove', color: colors.priorityMedium, background: colors.priorityMediumSoft, order: 2 },
  BAJA: { label: 'Baja', icon: 'arrow-down', color: colors.priorityLow, background: colors.priorityLowSoft, order: 3 },
};

/** Orden visual de menor a mayor para selectores (Baja → Urgente). */
export const PRIORITIES_ASC: Priority[] = ['BAJA', 'MEDIA', 'ALTA', 'URGENTE'];

/** Explica qué hace realmente cada prioridad dentro de la app. */
export const PRIORITY_EFFECT: Record<Priority, string> = {
  URGENTE: 'Aparece primero en el listado, se cuenta en la alerta de urgencias de Inicio y en el contador de la pestaña Solicitudes.',
  ALTA: 'Se ordena antes que las solicitudes de prioridad media y baja.',
  MEDIA: 'Se atiende en orden de llegada, después de las urgentes y altas.',
  BAJA: 'Se atiende en orden de llegada, después del resto de prioridades.',
};

export const SERVICE_META: Record<ServiceType, VisualMeta & { hint: string }> = {
  CONSULTA: {
    label: 'Consulta General',
    hint: 'Preventiva / Control',
    icon: 'medkit-outline',
    color: colors.sage,
    background: colors.sageSoft,
  },
  VACUNACION: {
    label: 'Vacunación',
    hint: 'Dosis o Refuerzo',
    icon: 'eyedrop-outline',
    color: colors.sky,
    background: colors.skySoft,
  },
  EMERGENCIA: {
    label: 'Emergencia',
    hint: 'Riesgo vital activo',
    icon: 'pulse-outline',
    color: colors.danger,
    background: colors.dangerSoft,
  },
  GROOMING: {
    label: 'Grooming',
    hint: 'Estética e Higiene',
    icon: 'cut-outline',
    color: colors.lavender,
    background: colors.lavenderSoft,
  },
};

/** Las mascotas se representan con un ícono por especie, no con fotos genéricas. */
export const SPECIES_META: Record<Species, { label: string; icon: SpeciesIconName; color: string; background: string }> = {
  PERRO: { label: 'Perro', icon: 'dog', color: colors.primaryDark, background: colors.primarySoft },
  GATO: { label: 'Gato', icon: 'cat', color: colors.lavender, background: colors.lavenderSoft },
  CONEJO: { label: 'Conejo', icon: 'rabbit', color: colors.sage, background: colors.sageSoft },
  OTRO: { label: 'Otro', icon: 'paw', color: colors.textSecondary, background: colors.track },
};
