import type { CatalogRequest } from './catalogRequests';

export function recentApproval(request: CatalogRequest, now: number): boolean {
  const date = Date.parse(request.reviewedAt ?? request.submittedAt);
  // Keep undated records accessible rather than silently hiding them.
  return !Number.isFinite(date) || date >= now - 7 * 24 * 60 * 60 * 1000;
}
