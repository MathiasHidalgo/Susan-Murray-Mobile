import { collection, doc, onSnapshot, query, runTransaction, serverTimestamp, Timestamp, where } from 'firebase/firestore';
import type { BusinessProfile } from '../types/profile';
import type { OrderLine } from '../types/order';
import { getFirebaseServices } from './firebase';
import { getFirebaseAuth } from './auth';

export const MAX_ORDER_ITEMS = 8;
export type CloudOrder = { id: string; customerId: string; createdBy: string; createdAt: string; step: number; receivedCounts?: number[]; countRevision?: number; lastCountAt?: string; lastCountName?: string; pickedUpAt?: string; pickedUpBy?: string; pickedUpById?: string; lines: OrderLine[] };
export function newOrderId(customerId: string): string {
  return `${customerId}__${doc(collection(getFirebaseServices().db, 'orders')).id}`;
}
export async function createCloudOrder(id: string, customerId: string, lines: OrderLine[]): Promise<void> {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error('Please sign in again.');
  if (!lines.length || lines.length > MAX_ORDER_ITEMS) throw new Error(`Add between 1 and ${MAX_ORDER_ITEMS} different items to an order.`);
  const db = getFirebaseServices().db;
  const reference = doc(db, 'orders', id);
  await runTransaction(db, async transaction => {
    const previous = await transaction.get(reference);
    if (previous.exists()) {
      const data = previous.data();
      if (data.createdBy === user.uid && data.customerId === customerId && Array.isArray(data.lines) && data.lines.length === lines.length && data.lines.every((line: OrderLine, index: number) => line.catalogItemId === lines[index].catalogItemId && line.item === lines[index].item && line.quantity === lines[index].quantity)) return;
      throw new Error('This order reference is already in use. Please try again.');
    }
    transaction.set(reference, { customerId, createdBy: user.uid, createdAt: serverTimestamp(), step: 0, lines, lineIds: lines.map(line => line.catalogItemId) });
  });
}
export function watchOrders(profile: BusinessProfile, onData: (orders: CloudOrder[]) => void, onError: (error: unknown) => void) {
  const reference = collection(getFirebaseServices().db, 'orders');
  const source = profile.role === 'customer' ? query(reference, where('customerId', '==', profile.customerId)) : query(reference);
  return onSnapshot(source, snapshot => {
    if (snapshot.metadata.hasPendingWrites) return;
    onData(snapshot.docs.map(entry => {
      const data = entry.data();
      return { ...data, id: entry.id, createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : '', lastCountAt: data.lastCountAt instanceof Timestamp ? data.lastCountAt.toDate().toISOString() : undefined, pickedUpAt: data.pickedUpAt instanceof Timestamp ? data.pickedUpAt.toDate().toISOString() : undefined } as CloudOrder;
    }).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  }, onError);
}
