import type { Order } from '../types/order';

export function confirmReceived(order: Order, counts: Record<string, string>, note: string, checkedBy: string, checkedAt: string): Order {
  if (order.step !== 0) throw new Error('This order has already been confirmed.');
  const lines = order.lines.map(line => {
    const raw = (counts[line.catalogItemId] ?? '').trim();
    if (!/^\d+$/.test(raw) || Number(raw) > 999) throw new Error('Enter a received count from 0 to 999 for every item. Zero means none received.');
    return { ...line, receivedQuantity: Number(raw) };
  });
  if (lines.some(line => line.receivedQuantity !== line.quantity) && !note.trim()) {
    throw new Error('Add a note explaining the quantity differences before confirming.');
  }
  return { ...order, lines, step: 1, countNote: note.trim(), checkedBy, checkedAt };
}


export function correctReceived(order: Order, counts: Record<string, string>, reason: string, changedBy: string, changedAt: string): Order {
  if (order.step >= 4) throw new Error('Completed orders are locked. Received counts cannot be changed after pickup.');
  if (order.step < 1 || !order.lines.every(line => line.receivedQuantity !== undefined)) {
    throw new Error('Confirm the initial received counts before making a correction.');
  }
  if (!reason.trim()) throw new Error('Add a reason for the correction, such as finding missing linen.');
  const lines = order.lines.map(line => {
    const raw = (counts[line.catalogItemId] ?? '').trim();
    if (!/^\d+$/.test(raw) || Number(raw) > 999) throw new Error('Enter a received count from 0 to 999 for every item.');
    return { ...line, receivedQuantity: Number(raw) };
  });
  const changes = lines.flatMap((line, index) => line.receivedQuantity === order.lines[index].receivedQuantity ? [] : [{
    catalogItemId: line.catalogItemId, item: line.item,
    before: order.lines[index].receivedQuantity!, after: line.receivedQuantity,
  }]);
  if (!changes.length) throw new Error('Change at least one received count, or cancel the correction.');
  return { ...order, lines, corrections: [...(order.corrections ?? []), { changedBy, changedAt, reason: reason.trim(), changes }] };
}
