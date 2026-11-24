export type PaymentMethod = 'YAPE_PLIN' | 'EFECTIVO' | 'TARJETA';

export interface PaymentMethodMeta {
  value: PaymentMethod;
  label: string;
  icon: 'qr-code-outline' | 'cash-outline' | 'card-outline';
}

export const PAYMENT_METHODS: PaymentMethodMeta[] = [
  { value: 'YAPE_PLIN', label: 'Yape / Plin', icon: 'qr-code-outline' },
  { value: 'EFECTIVO', label: 'Efectivo', icon: 'cash-outline' },
  { value: 'TARJETA', label: 'Tarjeta', icon: 'card-outline' },
];

export interface DigitalReceiptMeta {
  code: string;
  method: PaymentMethod;
  issuedAt: string;
  cashier?: string;
}

export interface ReceiptBreakdown {
  subtotal: number;
  igv: number;
  total: number;
}

const DIGITAL_RECEIPT_PREFIX = 'amipets://boleta?';

export function generateReceiptCode(seed?: string): string {
  if (seed) {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
    }
    const num = (hash % 9000) + 1000;
    return `B001-${num}`;
  }
  const num = Math.floor(1000 + Math.random() * 9000);
  return `B001-${num}`;
}

export function buildDigitalReceiptUri(meta: DigitalReceiptMeta): string {
  const parts = [
    `code=${encodeURIComponent(meta.code.slice(0, 24))}`,
    `method=${encodeURIComponent(meta.method)}`,
    `issuedAt=${encodeURIComponent(meta.issuedAt.slice(0, 40))}`,
  ];
  if (meta.cashier?.trim()) {
    parts.push(`cashier=${encodeURIComponent(meta.cashier.trim().slice(0, 60))}`);
  }
  return `${DIGITAL_RECEIPT_PREFIX}${parts.join('&')}`;
}

export function isDigitalReceiptUri(uri?: string | null): boolean {
  return Boolean(uri && uri.startsWith(DIGITAL_RECEIPT_PREFIX));
}

export function parseDigitalReceiptUri(uri?: string | null): DigitalReceiptMeta | null {
  if (!uri || !uri.startsWith(DIGITAL_RECEIPT_PREFIX)) return null;
  const query = uri.slice(DIGITAL_RECEIPT_PREFIX.length);
  const map: Record<string, string> = {};

  for (const pair of query.split('&')) {
    const eqIdx = pair.indexOf('=');
    if (eqIdx <= 0) continue;
    const k = pair.slice(0, eqIdx);
    const v = pair.slice(eqIdx + 1);
    try {
      map[k] = decodeURIComponent(v);
    } catch {
      map[k] = v;
    }
  }

  const rawMethod = map.method as PaymentMethod | undefined;
  const method: PaymentMethod =
    rawMethod === 'EFECTIVO' || rawMethod === 'TARJETA' || rawMethod === 'YAPE_PLIN'
      ? rawMethod
      : 'YAPE_PLIN';

  return {
    code: map.code || generateReceiptCode(),
    method,
    issuedAt: map.issuedAt || new Date().toISOString(),
    cashier: map.cashier || undefined,
  };
}

export function getPaymentMethodLabel(method: PaymentMethod): string {
  return PAYMENT_METHODS.find((m) => m.value === method)?.label ?? 'Yape / Plin';
}

export function calculateReceiptBreakdown(quantity: number, unitPrice: number): ReceiptBreakdown {
  const safeQty = Math.max(1, Number(quantity) || 1);
  const safePrice = Math.max(0, Number(unitPrice) || 0);
  const total = Math.round(safeQty * safePrice * 100) / 100;
  const subtotal = Math.round((total / 1.18) * 100) / 100;
  const igv = Math.round((total - subtotal) * 100) / 100;
  return { subtotal, igv, total };
}
