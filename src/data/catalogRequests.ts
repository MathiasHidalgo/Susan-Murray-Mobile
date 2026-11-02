import { administrator } from './people';
import type { CatalogItem } from './catalog';

export type CatalogRequest = CatalogItem & { status: 'pending' | 'approved' | 'returned'; submittedAt: string; reviewNote?: string; reviewedAt?: string; reviewedBy?: string };
export type ItemDetails = Pick<CatalogItem, 'customerId' | 'type' | 'fabric' | 'color' | 'size'>;

function normalize(value: string): string {
  return value.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
}

// Names are nicknames. The combination identifies an item within one customer.
// Production must enforce uniqueness atomically in Firebase, including approval.
export function sameCatalogItem(a: ItemDetails, b: ItemDetails): boolean {
  return a.customerId === b.customerId && a.type === b.type &&
    normalize(a.fabric) === normalize(b.fabric) &&
    normalize(a.color) === normalize(b.color) && normalize(a.size) === normalize(b.size);
}

export type ReviewState = { requests: CatalogRequest[]; message: string };
export type ReviewAction =
  | { type: 'submit'; request: CatalogRequest; catalog: CatalogItem[] }
  | { type: 'approve' | 'return'; id: string; note: string; catalog: CatalogItem[]; reviewedAt: string };

// Demo workflow only. Real reviewer identity and authorization belong on the server.
export function reviewReducer(state: ReviewState, action: ReviewAction): ReviewState {
  if (action.type === 'submit') {
    const previous = state.requests.find(r => r.id === action.request.id);
    if (previous && (previous.status !== 'returned' || previous.customerId !== action.request.customerId)) return state;
    const duplicate = [...action.catalog, ...state.requests.filter(r => r.id !== action.request.id && r.status !== 'returned')]
      .some(item => sameCatalogItem(item, action.request));
    if (duplicate) return { ...state, message: 'This item already exists in the catalog or pending requests.' };
    return { requests: [action.request, ...state.requests.filter(r => r.id !== action.request.id)], message: '' };
  }
  const request = state.requests.find(r => r.id === action.id);
  if (!request || request.status !== 'pending') return state;
  if (action.type === 'return' && !action.note.trim()) return { ...state, message: 'Add a note explaining what the customer should change.' };
  if (action.type === 'approve' && [...action.catalog, ...state.requests.filter(r => r.status === 'approved')].some(item => sameCatalogItem(item, request))) {
    return { ...state, message: 'Cannot approve: this item is already in the customer’s catalog. Return the request with a note.' };
  }
  return {
    requests: state.requests.map(r => r.id === action.id ? {
      ...r, status: action.type === 'approve' ? 'approved' : 'returned',
      reviewNote: action.note.trim(), reviewedAt: action.reviewedAt, reviewedBy: administrator.name,
    } : r),
    message: action.type === 'approve' ? 'Item approved and added to the customer’s catalog.' : 'Request returned to the customer.',
  };
}
