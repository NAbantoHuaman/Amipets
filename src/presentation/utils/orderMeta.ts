import { OrderCategory, OrderStatus } from '../../domain/models/order';
import { TargetSpecies } from '../../domain/models/product';
import { colors } from '../theme';
import { IconName } from './requestMeta';

interface OrderVisualMeta {
  label: string;
  icon: IconName;
  color: string;
  background: string;
}

export const ORDER_STATUS_META: Record<OrderStatus, OrderVisualMeta & { description: string }> = {
  PENDIENTE: {
    label: 'Pendiente',
    icon: 'hourglass-outline',
    color: colors.pending,
    background: colors.pendingSoft,
    description: 'Pedido registrado, pendiente de preparación.',
  },
  EN_PROCESO: {
    label: 'En proceso',
    icon: 'construct-outline',
    color: colors.inProgress,
    background: colors.inProgressSoft,
    description: 'Preparando el pedido para entrega o recojo.',
  },
  ENTREGADO: {
    label: 'Entregado',
    icon: 'checkmark-circle-outline',
    color: colors.done,
    background: colors.doneSoft,
    description: 'Pedido entregado satisfactoriamente al cliente.',
  },
  CANCELADO: {
    label: 'Cancelado',
    icon: 'close-circle-outline',
    color: colors.danger,
    background: colors.dangerSoft,
    description: 'Pedido anulado por el cliente o la tienda.',
  },
};

export const ORDER_CATEGORY_META: Record<OrderCategory, OrderVisualMeta & { hint: string }> = {
  ALIMENTO: {
    label: 'Alimento',
    hint: 'Comida y snacks',
    icon: 'nutrition-outline',
    color: colors.sage,
    background: colors.sageSoft,
  },
  ACCESORIOS: {
    label: 'Accesorios',
    hint: 'Collares, camas y platos',
    icon: 'pricetag-outline',
    color: colors.accent,
    background: colors.accentSoft,
  },
  ROPA: {
    label: 'Ropa',
    hint: 'Poleras y chalecos',
    icon: 'shirt-outline',
    color: colors.lavender,
    background: colors.lavenderSoft,
  },
  JUGUETES: {
    label: 'Juguetes',
    hint: 'Pelotas e interactivos',
    icon: 'tennisball-outline',
    color: colors.sky,
    background: colors.skySoft,
  },
};

export const TARGET_SPECIES_META: Record<TargetSpecies, OrderVisualMeta> = {
  PERRO: {
    label: 'Perro',
    icon: 'paw-outline',
    color: colors.accent,
    background: colors.accentSoft,
  },
  GATO: {
    label: 'Gato',
    icon: 'paw-outline',
    color: colors.lavender,
    background: colors.lavenderSoft,
  },
  AMBOS: {
    label: 'Perro y Gato',
    icon: 'paw-outline',
    color: colors.primaryDark,
    background: colors.primarySoft,
  },
};
