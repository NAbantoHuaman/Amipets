export const colors = {

  background: '#F8F5F0',
  surface: '#FFFFFF',
  surfaceWarm: '#F3EAE0',
  surfaceMuted: '#FAF7F3',
  border: '#EFE7DD',
  borderStrong: '#E2D6C8',
  divider: '#F2ECE4',
  track: '#F1EBE3',

  primary: '#AD7145',
  primaryDark: '#8A542D',
  primarySoft: '#F6ECE1',
  primaryText: '#FFFFFF',

  text: '#2A2420',
  textSecondary: '#5A524C',
  textMuted: '#756C64',
  placeholder: '#8F867E',

  sage: '#2F7A57',
  sageSoft: '#E6F4ED',
  sky: '#2563EB',
  skySoft: '#EFF6FF',
  lavender: '#6D28D9',
  lavenderSoft: '#F3EFFE',

  pending: '#475569',
  pendingSoft: '#E2E8F0',
  inProgress: '#1D4ED8',
  inProgressSoft: '#DBEAFE',
  done: '#15803D',
  doneSoft: '#DCFCE7',

  priorityUrgent: '#B91C1C',
  priorityUrgentSoft: '#FEE2E2',
  priorityHigh: '#C2410C',
  priorityHighSoft: '#FFEDD5',
  priorityMedium: '#A16207',
  priorityMediumSoft: '#FEF9C3',
  priorityLow: '#78716C',
  priorityLowSoft: '#F5F5F4',

  danger: '#B91C1C',
  dangerStrong: '#991B1B',
  dangerSoft: '#FEE2E2',
  dangerBorder: '#F5CFCB',

  overlay: 'rgba(42, 36, 32, 0.45)',
  shadow: '#8C5E37',
  white: '#FFFFFF',
} as const;

export type ColorName = keyof typeof colors;
