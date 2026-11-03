import { Priority, RequestStatus, ServiceType, VeterinaryRequest } from '../../domain/models/request';
import { PRIORITY_META, SERVICE_META, SPECIES_META, STATUS_META } from '../../utils/requestMeta';
import { normalizePhone } from '../../utils/validation';

export const priorityWeight = (p: Priority): number => PRIORITY_META[p].order;

const statusWeight = (s: RequestStatus): number => (s === 'FINALIZADO' ? 1 : 0);

export function sortByAttentionOrder(requests: VeterinaryRequest[]): VeterinaryRequest[] {
  return [...requests].sort((a, b) => {
    const byStatus = statusWeight(a.estado) - statusWeight(b.estado);
    if (byStatus !== 0) return byStatus;

    const byPriority = priorityWeight(a.prioridad) - priorityWeight(b.prioridad);
    if (byPriority !== 0) return byPriority;

    return new Date(a.fechaRegistro).getTime() - new Date(b.fechaRegistro).getTime();
  });
}

export function sortByNewest(requests: VeterinaryRequest[]): VeterinaryRequest[] {
  return [...requests].sort(
    (a, b) => new Date(b.fechaRegistro).getTime() - new Date(a.fechaRegistro).getTime(),
  );
}

export const sortRecentFirst = sortByNewest;

function cleanString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export interface RequestFilters {
  query: string;
  status: RequestStatus | 'TODOS';
  priority: Priority | 'TODAS';
}

export function filterRequests(
  requests: VeterinaryRequest[],
  queryOrFilters: string | RequestFilters,
  statusFilter: RequestStatus | 'TODOS' = 'TODOS',
  priorityFilter: Priority | 'TODAS' = 'TODAS',
): VeterinaryRequest[] {
  const filters: RequestFilters =
    typeof queryOrFilters === 'string'
      ? { query: queryOrFilters, status: statusFilter, priority: priorityFilter }
      : queryOrFilters;

  const q = cleanString(filters.query);
  const qPhone = normalizePhone(filters.query);

  return requests.filter((r) => {
    if (filters.status !== 'TODOS' && r.estado !== filters.status) return false;
    if (filters.priority !== 'TODAS' && r.prioridad !== filters.priority) return false;
    if (!q) return true;

    return (
      cleanString(r.mascotaNombre).includes(q) ||
      cleanString(r.clienteNombre).includes(q) ||
      (qPhone.length > 0 && normalizePhone(r.telefono).includes(qPhone))
    );
  });
}

export function countByStatus(requests: VeterinaryRequest[]): Record<RequestStatus, number> {
  return requests.reduce(
    (acc, r) => {
      acc[r.estado] = (acc[r.estado] ?? 0) + 1;
      return acc;
    },
    { PENDIENTE: 0, EN_ATENCION: 0, FINALIZADO: 0 } as Record<RequestStatus, number>,
  );
}

export function countByService(requests: VeterinaryRequest[]): Record<ServiceType, number> {
  const base: Record<ServiceType, number> = {
    CONSULTA: 0,
    VACUNACION: 0,
    EMERGENCIA: 0,
    GROOMING: 0,
  };
  for (const r of requests) {
    if (r.estado !== 'FINALIZADO') {
      base[r.tipoServicio] = (base[r.tipoServicio] ?? 0) + 1;
    }
  }
  return base;
}

export function activeUrgent(requests: VeterinaryRequest[]): VeterinaryRequest[] {
  return requests.filter((r) => r.prioridad === 'URGENTE' && r.estado !== 'FINALIZADO');
}

export const getUrgentActiveRequests = activeUrgent;

export function shortCode(id: string): string {
  return `#AP-${id.slice(-4).toUpperCase()}`;
}

export const generateShortCode = shortCode;

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
