const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

const pad = (value: number) => value.toString().padStart(2, '0');

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  const hours = d.getHours();
  const suffix = hours >= 12 ? 'p. m.' : 'a. m.';
  const h12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${pad(h12)}:${pad(d.getMinutes())} ${suffix}`;
}

export function formatDateTime(iso: string): string {
  return `${formatDate(iso)} · ${formatTime(iso)}`;
}

export function formatLongToday(date = new Date()): string {
  const longMonths = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
  ];
  return `${WEEKDAYS[date.getDay()]}, ${date.getDate()} de ${longMonths[date.getMonth()]}`;
}

export function formatRelative(iso: string, now = new Date()): string {
  const diffMs = now.getTime() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'Justo ahora';
  if (minutes < 60) return `Hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24 && isSameDay(iso, now)) return `Hace ${hours} h`;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(iso, yesterday)) return 'Ayer';
  return formatDate(iso);
}

export function isSameDay(iso: string, other: Date): boolean {
  const d = new Date(iso);
  return (
    d.getFullYear() === other.getFullYear() &&
    d.getMonth() === other.getMonth() &&
    d.getDate() === other.getDate()
  );
}

export function greeting(date = new Date()): string {
  const h = date.getHours();
  if (h < 12) return 'Buenos días,';
  if (h < 19) return 'Buenas tardes,';
  return 'Buenas noches,';
}
