import type { CatalogItem } from './catalog';

// Mirrored in Firestore rules: punctuation, spacing, and case cannot create duplicates.
// Equivalent fabric names and equivalent units still require human review.
export function catalogRequestId(item: Pick<CatalogItem, 'customerId' | 'type' | 'fabric' | 'color' | 'size'>): string {
  const parts = [item.type, item.fabric, item.color, item.size].map(value => value.toLowerCase().replace(/[^a-z0-9]/g, ''));
  if (parts.some(part => !part)) throw new Error('Type, fabric, color, and size must each include at least one English letter or number.');
  if (!/^[a-zA-Z0-9-]+$/.test(item.customerId)) throw new Error('Your customer profile needs administrator attention.');
  return [item.customerId, ...parts].join('__');
}
