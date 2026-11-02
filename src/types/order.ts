import type { CustomerId } from '../data/catalog';

export const statuses = ['In progress', 'Checked', 'Washing', 'Ready for pickup', 'Picked up'] as const;
export type OrderLine = { catalogItemId: string; item: string; quantity: number; receivedQuantity?: number };
export type CountCorrection = { changedBy: string; changedAt: string; reason: string; changes: { catalogItemId: string; item: string; before: number; after: number }[] };
export type Order = { id: number; customerId: CustomerId; lines: OrderLine[]; step: number; countNote?: string; checkedBy?: string; checkedAt?: string; corrections?: CountCorrection[] };
export type DraftLine = { catalogItemId: string; quantity: string };
