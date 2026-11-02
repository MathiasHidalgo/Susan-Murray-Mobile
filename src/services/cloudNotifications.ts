import { collection, doc, onSnapshot, query, runTransaction, serverTimestamp, Timestamp, where } from 'firebase/firestore';
import { getFirebaseServices } from './firebase';
import { getFirebaseAuth } from './auth';

export type InboxNotice = { id: string; orderId: string; customerId: string; type: 'order_ready' | 'order_picked_up'; createdAt: string; read: boolean };
export function watchNotifications(customerId: string, onData: (notices: InboxNotice[]) => void, onError: (error: unknown) => void) {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error('Please sign in again.');
  return onSnapshot(query(collection(getFirebaseServices().db, 'notifications'), where('customerId', '==', customerId)), snapshot => {
    if (snapshot.metadata.hasPendingWrites) return;
    onData(snapshot.docs.map(entry => {
      const data = entry.data();
      return { id: entry.id, orderId: data.orderId, customerId: data.customerId, type: data.type === 'order_picked_up' ? 'order_picked_up' as const : 'order_ready' as const, createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : '', read: Boolean(data.readBy?.[user.uid]) };
    }).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  }, onError);
}
export async function markNoticeRead(id: string): Promise<void> {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error('Please sign in again.');
  const db = getFirebaseServices().db;
  const reference = doc(db, 'notifications', id);
  await runTransaction(db, async transaction => {
    const snapshot = await transaction.get(reference);
    if (!snapshot.exists()) throw new Error('This notice is no longer available.');
    const data = snapshot.data();
    if (data.readBy?.[user.uid]) return;
    transaction.update(reference, { readBy: { ...(data.readBy ?? {}), [user.uid]: serverTimestamp() } });
  });
}
