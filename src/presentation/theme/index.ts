import { Platform, ViewStyle } from 'react-native';
import { colors } from './colors';

export { colors } from './colors';
export { fonts, typography } from './typography';

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
} as const;

export const shadows = {
  soft: Platform.select<ViewStyle>({
    android: { elevation: 2, shadowColor: colors.shadow },
    default: {
      shadowColor: colors.shadow,
      shadowOpacity: 0.05,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
    },
  }),
  raised: Platform.select<ViewStyle>({
    android: { elevation: 4, shadowColor: colors.shadow },
    default: {
      shadowColor: colors.shadow,
      shadowOpacity: 0.12,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 6 },
    },
  }),
};

export const common = {
  screen: { flex: 1, backgroundColor: colors.background } as ViewStyle,
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  } as ViewStyle,
  row: { flexDirection: 'row', alignItems: 'center' } as ViewStyle,
};

export const HIT_SLOP = { top: 10, bottom: 10, left: 10, right: 10 };
