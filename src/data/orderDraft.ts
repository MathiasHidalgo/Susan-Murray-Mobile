import type { CatalogItem, CustomerId } from './catalog';
import type { DraftLine, OrderLine } from '../types/order';

export function parseQuantity(value: string): number {
  if (!/^\d+$/.test(value.trim())) throw new Error('Enter a whole-number quantity between 1 and 999 for each item.');
  const quantity = Number(value);
  if (quantity < 1 || quantity > 999) throw new Error('Enter a whole-number quantity between 1 and 999 for each item.');
  return quantity;
}

export function addDraftItem(lines: DraftLine[], catalogItemId: string, quantity: string): DraftLine[] {
  const added = parseQuantity(quantity);
  const existing = lines.find(line => line.catalogItemId === catalogItemId);
  if (!existing) return [...lines, { catalogItemId, quantity: String(added) }];
  const combined = parseQuantity(existing.quantity) + added;
  if (combined > 999) throw new Error('The combined quantity for this item cannot exceed 999.');
  return lines.map(line => line.catalogItemId === catalogItemId ? { ...line, quantity: String(combined) } : line);
}

export function buildOrderLines(customerId: CustomerId, draft: DraftLine[], catalog: CatalogItem[]): OrderLine[] {
  if (!draft.length) throw new Error('Add at least one catalog item before submitting the order.');
  const ids = new Set<string>();
  return draft.map(line => {
    const item = catalog.find(item => item.id === line.catalogItemId && item.customerId === customerId);
    if (!item || ids.has(line.catalogItemId)) throw new Error('Review your order: every line must be a different item from your own approved catalog.');
    ids.add(line.catalogItemId);
    return { catalogItemId: item.id, item: `${item.name} · ${item.type} · ${item.fabric} · ${item.color} · ${item.size}`, quantity: parseQuantity(line.quantity) };
  });
}
