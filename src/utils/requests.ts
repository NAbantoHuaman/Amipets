import { Priority, RequestStatus, VeterinaryRequest } from '../models/request';
import { PRIORITY_META, SERVICE_META, SPECIES_META, STATUS_META } from './requestMeta';
import { normalizePhone } from './validation';

export const priorityWeight = (p: Priority) => PRIORITY_META[p].order;

const statusWeight = (s: RequestStatus) => (s === 'FINALIZADO' ? 1 : 0);

export function sortByAttentionOrder(list: VeterinaryRequest[]): VeterinaryRequest[] {
  return [...list].sort((a, b) => {
    const byStatus = statusWeight(a.estado) - statusWeight(b.estado);
    if (byStatus !== 0) return byStatus;
    const byPriority = priorityWeight(a.prioridad) - priorityWeight(b.prioridad);
    if (byPriority !== 0) return byPriority;
    return new Date(a.fechaRegistro).getTime() - new Date(b.fechaRegistro).getTime();
  });
}

export function sortByNewest(list: VeterinaryRequest[]): VeterinaryRequest[] {
  return [...list].sort(
    (a, b) => new Date(b.fechaRegistro).getTime() - new Date(a.fechaRegistro).getTime(),
  );
}

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

export interface RequestFilters {
  query: string;
  status: RequestStatus | 'TODOS';
  priority: Priority | 'TODAS';
}

export function filterRequests(list: VeterinaryRequest[], filters: RequestFilters): VeterinaryRequest[] {
  const q = normalize(filters.query);
  const qPhone = normalizePhone(filters.query);
  return list.filter((r) => {
    if (filters.status !== 'TODOS' && r.estado !== filters.status) return false;
    if (filters.priority !== 'TODAS' && r.prioridad !== filters.priority) return false;
    if (!q) return true;
    return (
      normalize(r.mascotaNombre).includes(q) ||
      normalize(r.clienteNombre).includes(q) ||
      (qPhone.length > 0 && normalizePhone(r.telefono).includes(qPhone))
    );
  });
}

export function countByStatus(list: VeterinaryRequest[]): Record<RequestStatus, number> {
  return list.reduce(
    (acc, r) => {
      acc[r.estado] += 1;
      return acc;
    },
    { PENDIENTE: 0, EN_ATENCION: 0, FINALIZADO: 0 } as Record<RequestStatus, number>,
  );
}

export const activeUrgent = (list: VeterinaryRequest[]) =>
  list.filter((r) => r.prioridad === 'URGENTE' && r.estado !== 'FINALIZADO');

export const shortCode = (id: string) => `#AP-${id.slice(-4).toUpperCase()}`;

export function describeRequest(r: VeterinaryRequest): string {
  return [
    r.mascotaNombre,
    r.especie ? SPECIES_META[r.especie].label : '',
    SERVICE_META[r.tipoServicio].label,
    `prioridad ${PRIORITY_META[r.prioridad].label}`,
    STATUS_META[r.estado].label,
    `cliente ${r.clienteNombre}`,
  ]
    .filter(Boolean)
    .join(', ');
}
