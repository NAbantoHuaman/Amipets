export const colors = {
  background: '#FAF6EF',
  surface: '#FFFFFF',
  surfaceWarm: '#F4EFE5',
  surfaceMuted: '#F1EBE0',
  border: '#E8E1D5',
  borderStrong: '#D6CEC0',
  divider: '#EFE9DE',
  track: '#E9E2D6',

  primary: '#1F6F5C',
  primaryDark: '#155244',
  primarySoft: '#E6F3EF',
  primaryBorder: '#C0DFD5',
  pawTint: '#66A88E',
  pawTintSoft: '#7DB9A2',
  primaryText: '#FFFFFF',

  accent: '#B8652A',
  accentSoft: '#F8EBE1',

  text: '#1C1917',
  textSecondary: '#44403C',
  textMuted: '#78716C',
  placeholder: '#57534E',
  tabBarInactive: '#57534E',

  sage: '#1F6F5C',
  sageSoft: '#E6F3EF',
  sky: '#2B6CB0',
  skySoft: '#E6F0FA',
  lavender: '#6D55A8',
  lavenderSoft: '#EFEBF8',

  pending: '#B7791F',
  pendingSoft: '#FBF3DC',
  inProgress: '#2B6CB0',
  inProgressSoft: '#E6F0FA',
  done: '#1E7A56',
  doneSoft: '#E3F4EC',

  priorityUrgent: '#DC2626',
  priorityUrgentSoft: '#FEE2E2',
  priorityHigh: '#C2591A',
  priorityHighSoft: '#FCECE2',
  priorityMedium: '#B7791F',
  priorityMediumSoft: '#FBF3DC',
  priorityLow: '#57534E',
  priorityLowSoft: '#F2F0EC',

  danger: '#DC2626',
  dangerStrong: '#B91C1C',
  dangerSoft: '#FEE2E2',
  dangerBorder: '#FECACA',

  overlay: 'rgba(28, 25, 23, 0.48)',
  shadow: '#1C1917',
  white: '#FFFFFF',
} as const;

export type ColorName = keyof typeof colors;
