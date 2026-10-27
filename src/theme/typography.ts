import { TextStyle } from 'react-native';
import { colors } from './colors';

export const fonts = {
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semibold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
  script: 'Caveat_600SemiBold',
} as const;

export const typography = {
  display: { fontFamily: fonts.semibold, fontSize: 26, lineHeight: 34, color: colors.text },
  title: { fontFamily: fonts.semibold, fontSize: 21, lineHeight: 28, color: colors.text },
  heading: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 22, color: colors.text },
  subheading: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 20, color: colors.text },
  body: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, color: colors.textSecondary },
  bodyStrong: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 21, color: colors.text },
  caption: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 17, color: colors.textMuted },
  captionStrong: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 17, color: colors.textSecondary },
  label: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18, color: colors.text },
  tiny: { fontFamily: fonts.medium, fontSize: 11, lineHeight: 14, color: colors.textMuted },
  script: { fontFamily: fonts.script, fontSize: 20, lineHeight: 22, color: colors.textSecondary },
} satisfies Record<string, TextStyle>;
