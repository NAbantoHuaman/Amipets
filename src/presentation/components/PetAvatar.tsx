import React from 'react';
import { Image, ImageSourcePropType, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Species } from '../../domain/models/request';
import { colors } from '../theme';

const PET_IMAGES: Record<Species, ImageSourcePropType> = {
  PERRO: require('../../../assets/pets/dog.jpg'),
  GATO: require('../../../assets/pets/cat.jpg'),
  CONEJO: require('../../../assets/pets/rabbit.jpg'),
  OTRO: require('../../../assets/pets/other.jpg'),
};

interface Props {
  species?: Species;
  size?: number;
  shape?: 'circle' | 'rounded';
  selected?: boolean;
  muted?: boolean;
  color?: string;
  background?: string;
  style?: StyleProp<ViewStyle>;
}

export function PetAvatar({
  species,
  size = 52,
  shape = 'rounded',
  selected,
  muted,
  background,
  style,
}: Props) {
  const borderRadius = shape === 'circle' ? size / 2 : size * 0.28;
  const source = PET_IMAGES[species ?? 'OTRO'];

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.base,
        {
          width: size,
          height: size,
          borderRadius,
          backgroundColor: background ?? colors.surfaceWarm,
        },
        selected && styles.selected,
        muted && styles.muted,
        style,
      ]}
    >
      <Image source={source} style={styles.image} resizeMode="cover" />
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  selected: {
    borderWidth: 2.5,
    borderColor: colors.primary,
  },
  muted: {
    opacity: 0.65,
  },
});
