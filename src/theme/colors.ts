export const colors = {
  background: '#FAF8F6',
  surface: '#FFFFFF',
  surfaceWarm: '#FFF2F0',
  surfaceMuted: '#F6F4F2',
  border: '#ECE7E3',
  borderStrong: '#DCD4CE',
  divider: '#F1ECE8',
  track: '#EFEAE5',

  primary: '#FF5C53',
  primaryDark: '#DE3F35',
  primarySoft: '#FFEBE8',
  primaryText: '#FFFFFF',

  accent: '#FF5C53',

  text: '#18181B',
  textSecondary: '#3F3F46',
  textMuted: '#71717A',
  placeholder: '#52525B',
  tabBarInactive: '#52525B',

  sage: '#059669',
  sageSoft: '#D1FAE5',
  sky: '#2563EB',
  skySoft: '#DBEAFE',
  lavender: '#7C3AED',
  lavenderSoft: '#EDE9FE',

  pending: '#D97706',
  pendingSoft: '#FEF3C7',
  inProgress: '#2563EB',
  inProgressSoft: '#DBEAFE',
  done: '#059669',
  doneSoft: '#D1FAE5',

  priorityUrgent: '#DC2626',
  priorityUrgentSoft: '#FEE2E2',
  priorityHigh: '#EA580C',
  priorityHighSoft: '#FFEDD5',
  priorityMedium: '#D97706',
  priorityMediumSoft: '#FEF3C7',
  priorityLow: '#52525B',
  priorityLowSoft: '#F4F4F5',

  danger: '#E11D48',
  dangerStrong: '#BE123C',
  dangerSoft: '#FFE4E6',
  dangerBorder: '#FECDD3',

  overlay: 'rgba(24, 24, 27, 0.5)',
  shadow: '#FF5C53',
  white: '#FFFFFF',
} as const;

export type ColorName = keyof typeof colors;
