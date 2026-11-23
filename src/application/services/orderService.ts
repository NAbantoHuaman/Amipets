import { OrderCategory, OrderStatus, PetOrder } from '../../domain/models/order';

export interface OrderFormValidationInput {
  clienteNombre?: string;
  telefono?: string;
  productoId?: number;
  producto?: string;
  cantidad?: string | number;
  precio?: string | number;
  maxStock?: number;
  notas?: string;
}

export type OrderFormErrors = Partial<
  Record<'clienteNombre' | 'telefono' | 'producto' | 'cantidad' | 'precio' | 'notas', string>
>;

export function calculateOrderTotal(cantidad: number, precio: number): number {
  const qty = Number(cantidad);
  const unit = Number(precio);
  if (isNaN(qty) || isNaN(unit) || qty < 0 || unit < 0) return 0;
  return Number((qty * unit).toFixed(2));
}

export function sortOrders(orders: PetOrder[]): PetOrder[] {
  const statusRank: Record<OrderStatus, number> = {
    PENDIENTE: 0,
    EN_PROCESO: 1,
    ENTREGADO: 2,
    CANCELADO: 3,
  };
  return [...orders].sort((a, b) => {
    const rankDiff = statusRank[a.estado] - statusRank[b.estado];
    if (rankDiff !== 0) return rankDiff;
    return new Date(b.fechaRegistro).getTime() - new Date(a.fechaRegistro).getTime();
  });
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function filterOrders(
  orders: PetOrder[],
  query: string,
  status: OrderStatus | 'TODOS' = 'TODOS',
  category: OrderCategory | 'TODAS' = 'TODAS',
): PetOrder[] {
  const q = normalizeText(query);
  return orders.filter((o) => {
    if (status !== 'TODOS' && o.estado !== status) return false;
    if (category !== 'TODAS' && o.categoria !== category) return false;
    if (!q) return true;

    const matchClient = normalizeText(o.clienteNombre).includes(q);
    const matchProduct = normalizeText(o.producto).includes(q);
    const matchBrand = o.marca ? normalizeText(o.marca).includes(q) : false;
    const matchSku = o.sku ? normalizeText(o.sku).includes(q) : false;
    const matchPet = o.mascotaNombre ? normalizeText(o.mascotaNombre).includes(q) : false;
    const matchCode = normalizeText(orderShortCode(o.id)).includes(q);
    return matchClient || matchProduct || matchBrand || matchSku || matchPet || matchCode;
  });
}

export function countOrdersByStatus(orders: PetOrder[]): Record<OrderStatus, number> {
  return orders.reduce(
    (acc, o) => {
      acc[o.estado] = (acc[o.estado] ?? 0) + 1;
      return acc;
    },
    { PENDIENTE: 0, EN_PROCESO: 0, ENTREGADO: 0, CANCELADO: 0 } as Record<OrderStatus, number>,
  );
}

export function orderShortCode(id: string): string {
  return `#PD-${id.slice(-4).toUpperCase()}`;
}

export function getCommittedUnitsForProduct(
  orders: PetOrder[],
  productId: number,
  productTitle?: string,
  excludeOrderId?: string,
): number {
  const normalizedTitle = productTitle ? normalizeText(productTitle) : '';
  return orders.reduce((acc, o) => {
    if (o.estado === 'CANCELADO') return acc;
    if (excludeOrderId && o.id === excludeOrderId) return acc;

    const matchesById = typeof o.productoId === 'number' && o.productoId === productId;
    const matchesByTitle =
      o.productoId === undefined &&
      normalizedTitle.length > 0 &&
      normalizeText(o.producto) === normalizedTitle;

    if (matchesById || matchesByTitle) {
      return acc + Math.max(0, Number(o.cantidad) || 0);
    }
    return acc;
  }, 0);
}

export function validateOrderInput(input: OrderFormValidationInput): OrderFormErrors {
  const errors: OrderFormErrors = {};

  const client = (input.clienteNombre ?? '').trim();
  if (!client) {
    errors.clienteNombre = 'Ingresa el nombre del cliente.';
  } else if (client.length < 3) {
    errors.clienteNombre = 'Usa al menos 3 caracteres.';
  } else if (client.length > 60) {
    errors.clienteNombre = 'Máximo 60 caracteres.';
  }

  const phone = (input.telefono ?? '').replace(/[\s()-]/g, '').trim();
  if (phone && !/^\+?\d{7,15}$/.test(phone)) {
    errors.telefono = 'Ingresa un teléfono válido (ej. 987 654 321).';
  }

  const product = (input.producto ?? '').trim();
  if (!product || !input.productoId) {
    errors.producto = 'Selecciona un producto del catálogo.';
  } else if (product.length < 2) {
    errors.producto = 'El nombre del producto debe tener al menos 2 caracteres.';
  } else if (product.length > 80) {
    errors.producto = 'Máximo 80 caracteres.';
  }

  const rawQty = String(input.cantidad ?? '').trim();
  const parsedQty = Number(rawQty);
  if (!rawQty || isNaN(parsedQty) || !Number.isInteger(parsedQty) || parsedQty < 1) {
    errors.cantidad = 'Ingresa una cantidad entera mayor o igual a 1.';
  } else if (input.maxStock !== undefined) {
    if (input.maxStock <= 0) {
      errors.cantidad = 'Sin stock disponible por el momento.';
    } else if (parsedQty > input.maxStock) {
      errors.cantidad = `Solo hay ${input.maxStock} ${
        input.maxStock === 1 ? 'unidad disponible' : 'unidades disponibles'
      }.`;
    }
  } else if (parsedQty > 999) {
    errors.cantidad = 'La cantidad máxima por pedido es 999.';
  }

  const rawPrice = String(input.precio ?? '').replace(',', '.').trim();
  const parsedPrice = Number(rawPrice);
  if (!rawPrice || isNaN(parsedPrice) || parsedPrice <= 0) {
    errors.precio = 'Ingresa un precio unitario válido mayor a 0.';
  } else if (parsedPrice > 50000) {
    errors.precio = 'El precio excede el límite permitido.';
  }

  if (input.notas && input.notas.trim().length > 250) {
    errors.notas = 'Las notas admiten hasta 250 caracteres.';
  }

  return errors;
}
