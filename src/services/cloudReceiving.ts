import { collection, doc, onSnapshot, runTransaction, serverTimestamp, Timestamp } from 'firebase/firestore';
import type { BusinessProfile } from '../types/profile';
import type { CloudOrder } from './cloudOrders';
import { getFirebaseServices } from './firebase';
import { getFirebaseAuth } from './auth';

export type CountEvent = { revision: number; beforeCounts: number[]; afterCounts: number[]; reason: string; actorId: string; actorName: string; recordedAt: string };
export function watchCountEvents(orderId: string, onData: (events: CountEvent[]) => void, onError: (error: unknown) => void) {
  return onSnapshot(collection(getFirebaseServices().db, 'orders', orderId, 'countEvents'), snapshot => {
    if (snapshot.metadata.hasPendingWrites) return;
    onData(snapshot.docs.map(entry => {
      const data = entry.data();
      return { ...data, recordedAt: data.recordedAt instanceof Timestamp ? data.recordedAt.toDate().toISOString() : '' } as CountEvent;
    }).sort((a, b) => b.revision - a.revision));
  }, onError);
}

export async function saveReceivedCounts(orderId: string, expectedRevision: number, counts: Record<string, string>, note: string, profile: BusinessProfile): Promise<void> {
  const user = getFirebaseAuth().currentUser;
  if (!user || !['staff', 'admin'].includes(profile.role)) throw new Error('Only signed-in staff and administrators can confirm counts.');
  const db = getFirebaseServices().db;
  const reference = doc(db, 'orders', orderId);
  await runTransaction(db, async transaction => {
    const snapshot = await transaction.get(reference);
    if (!snapshot.exists()) throw new Error('This order is no longer available.');
    const order = snapshot.data() as Omit<CloudOrder, 'id'>;
    if (order.step >= 4) throw new Error('Completed orders are locked. Received counts cannot be changed after pickup.');
    const currentRevision = order.countRevision ?? 0;
    if (currentRevision !== expectedRevision) throw new Error('Another person has updated these counts. Cancel your correction and review the latest counts before trying again.');
    const afterCounts = order.lines.map(line => {
      const raw = (counts[line.catalogItemId] ?? '').trim();
      if (!/^\d+$/.test(raw) || Number(raw) > 999) throw new Error('Enter a received count from 0 to 999 for every item.');
      return Number(raw);
    });
    const beforeCounts = order.receivedCounts ?? [];
    const correction = currentRevision > 0;
    if (correction && afterCounts.every((count, index) => count === beforeCounts[index])) throw new Error('Change at least one count or cancel the correction.');
    if ((correction || afterCounts.some((count, index) => count !== order.lines[index].quantity)) && !note.trim()) throw new Error(correction ? 'Add a reason for this correction.' : 'Add a note explaining the quantity differences.');
    if (note.length > 500) throw new Error('Keep the note within 500 characters.');
    const revision = currentRevision + 1;
    transaction.update(reference, { receivedCounts: afterCounts, countRevision: revision, step: order.step === 0 ? 1 : order.step,
      lastCountAt: serverTimestamp(), lastCountById: user.uid, lastCountName: profile.name });
    transaction.set(doc(reference, 'countEvents', String(revision)), {
      revision, beforeCounts, afterCounts, reason: note.trim(), actorId: user.uid, actorName: profile.name, recordedAt: serverTimestamp(),
    });
  });
}

export async function advanceCloudOrder(orderId: string, expectedStep: number, profile: BusinessProfile): Promise<void> {
  const user = getFirebaseAuth().currentUser;
  if (!user || !['staff', 'admin'].includes(profile.role)) throw new Error('Only signed-in staff and administrators can update order status.');
  const db = getFirebaseServices().db;
  const reference = doc(db, 'orders', orderId);
  await runTransaction(db, async transaction => {
    const snapshot = await transaction.get(reference);
    const order = snapshot.data();
    if (!order || order.step !== expectedStep) throw new Error('This order has changed. Review its latest status before continuing.');
    if (expectedStep < 1 || expectedStep >= 3 || !order.countRevision) throw new Error('Confirm received counts before moving the order forward.');
    transaction.update(reference, { step: expectedStep + 1, statusChangedAt: serverTimestamp(), statusChangedById: user.uid, statusChangedBy: profile.name });
    if (expectedStep === 2) {
      transaction.set(doc(db, 'notifications', `${orderId}__ready`), {
        orderId, customerId: order.customerId, type: 'order_ready', createdAt: serverTimestamp(), createdBy: user.uid, readBy: {},
      });
    }
  });
}


export async function confirmCloudPickup(orderId: string, profile: BusinessProfile): Promise<void> {
  const user = getFirebaseAuth().currentUser;
  if (!user || !['staff', 'admin'].includes(profile.role)) throw new Error('Only signed-in staff and administrators can confirm pickup.');
  const db = getFirebaseServices().db;
  const reference = doc(db, 'orders', orderId);
  await runTransaction(db, async transaction => {
    const snapshot = await transaction.get(reference);
    const order = snapshot.data();
    if (!order || order.step !== 3) throw new Error('Pickup can only be confirmed for an order that is Ready for pickup. Review its latest status.');
    transaction.update(reference, { step: 4, pickedUpAt: serverTimestamp(), pickedUpById: user.uid, pickedUpBy: profile.name });
    transaction.set(doc(db, 'notifications', `${orderId}__pickedup`), {
      orderId, customerId: order.customerId, type: 'order_picked_up', createdAt: serverTimestamp(), createdBy: user.uid, readBy: {},
    });
  });
}
