/**
 * Genera un identificador único sin dependencias externas.
 * Combina la marca de tiempo con un sufijo aleatorio.
 */
export function generateId(): string {
  const time = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 8);
  return `req_${time}${random}`;
}
