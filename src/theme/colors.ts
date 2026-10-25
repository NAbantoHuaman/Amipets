/**
 * Paleta de Amipets.
 * Tonos crema, superficies blancas y acento caramelo cálido.
 *
 * Reglas de color:
 * - Estados de atención y prioridades usan familias de color distintas
 *   para que nunca se confundan cuando aparecen juntos en una tarjeta.
 * - Todo texto sobre blanco cumple contraste WCAG AA (≥ 4.5:1),
 *   salvo `placeholder`, que solo se usa como texto de ejemplo en inputs.
 */
export const colors = {
  // Base
  background: '#F8F5F0',
  surface: '#FFFFFF',
  surfaceWarm: '#F3EAE0',
  surfaceMuted: '#FAF7F3',
  border: '#EFE7DD',
  borderStrong: '#E2D6C8',
  divider: '#F2ECE4',
  track: '#F1EBE3',

  // Marca (caramelo)
  primary: '#AD7145',
  primaryDark: '#8A542D',
  primarySoft: '#F6ECE1',
  primaryText: '#FFFFFF',

  // Texto
  text: '#2A2420', // 15.0:1 sobre blanco
  textSecondary: '#5A524C', // 7.6:1
  textMuted: '#756C64', // 5.1:1 (antes #A39A92 = 2.7:1)
  placeholder: '#8F867E', // 3.6:1, solo placeholders

  // Tintes de categorías de servicio (íconos)
  sage: '#2F7A57',
  sageSoft: '#E6F4ED',
  sky: '#2563EB',
  skySoft: '#EFF6FF',
  lavender: '#6D28D9',
  lavenderSoft: '#F3EFFE',

  // Estados de atención (chips rellenos)
  pending: '#475569', // pizarra: en espera, neutro
  pendingSoft: '#E2E8F0',
  inProgress: '#1D4ED8', // azul: en curso
  inProgressSoft: '#DBEAFE',
  done: '#15803D', // verde: terminado
  doneSoft: '#DCFCE7',

  // Prioridades (escala de calor, chips con borde)
  priorityUrgent: '#B91C1C',
  priorityUrgentSoft: '#FEE2E2',
  priorityHigh: '#C2410C',
  priorityHighSoft: '#FFEDD5',
  priorityMedium: '#A16207',
  priorityMediumSoft: '#FEF9C3',
  priorityLow: '#78716C',
  priorityLowSoft: '#F5F5F4',

  // Alertas
  danger: '#B91C1C',
  dangerStrong: '#991B1B',
  dangerSoft: '#FEE2E2',
  dangerBorder: '#F5CFCB',

  overlay: 'rgba(42, 36, 32, 0.45)',
  shadow: '#8C5E37',
  white: '#FFFFFF',
} as const;

export type ColorName = keyof typeof colors;
