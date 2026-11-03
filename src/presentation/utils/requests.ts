export {
  priorityWeight,
  sortByAttentionOrder,
  sortByNewest,
  sortRecentFirst,
  filterRequests,
  countByStatus,
  countByService,
  activeUrgent,
  getUrgentActiveRequests,
  shortCode,
  generateShortCode,
  describeRequest,
} from '../../application/services/requestService';

export type { RequestFilters } from '../../application/services/requestService';
