import { collection, doc, onSnapshot, query, runTransaction, serverTimestamp, Timestamp, where } from 'firebase/firestore';
import { FirebaseError } from 'firebase/app';
import type { BusinessProfile } from '../types/profile';
import type { CatalogRequest } from '../data/catalogRequests';
import { catalogRequestId } from '../data/catalogIdentity';
import { getFirebaseServices } from './firebase';
import { getFirebaseAuth } from './auth';

export function cloudMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    if (error.code === 'permission-denied') return 'Database access was denied. Check that the updated rules are published and your account profile is active.';
    if (error.code === 'unavailable') return 'Could not reach the database. Check your connection and try again.';
    return 'The database request could not be completed. Please try again.';
  }
  return error instanceof Error ? error.message : 'The request could not be completed.';
}

function iso(value: unknown): string { return value instanceof Timestamp ? value.toDate().toISOString() : new Date(0).toISOString(); }
export function watchCatalog(profile: BusinessProfile, onData: (requests: CatalogRequest[]) => void, onError: (error: unknown) => void) {
  const collectionRef = collection(getFirebaseServices().db, 'catalogRequests');
  const source = profile.role === 'customer' ? query(collectionRef, where('customerId', '==', profile.customerId)) : query(collectionRef);
  return onSnapshot(source, snapshot => {
    // Do not present unacknowledged local writes as approved or successfully saved.
    if (snapshot.metadata.hasPendingWrites) return;
    const requests = snapshot.docs.map(entry => {
      const data = entry.data();
      return { ...data, id: entry.id, submittedAt: iso(data.submittedAt), ...(data.reviewedAt ? { reviewedAt: iso(data.reviewedAt) } : {}) } as CatalogRequest;
    }).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
    onData(requests);
  }, onError);
}

export async function submitCloudRequest(request: CatalogRequest): Promise<void> {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error('Please sign in again.');
  const reference = doc(getFirebaseServices().db, 'catalogRequests', catalogRequestId(request));
  await runTransaction(getFirebaseServices().db, async transaction => {
    const existing = await transaction.get(reference);
    if (existing.exists() && existing.data().status !== 'returned') throw new Error('This item is already in your catalog or pending approval.');
    transaction.set(reference, {
      customerId: request.customerId, name: request.name.trim(), type: request.type,
      fabric: request.fabric.trim(), color: request.color.trim(), size: request.size.trim(),
      status: 'pending', submittedBy: user.uid, submittedAt: serverTimestamp(),
    });
  });
}

export async function reviewCloudRequest(id: string, decision: 'approve' | 'return', note: string, profile: BusinessProfile): Promise<void> {
  const user = getFirebaseAuth().currentUser;
  if (!user || profile.role !== 'admin') throw new Error('Only an administrator can review catalog requests.');
  if (decision === 'return' && !note.trim()) throw new Error('Add a note explaining what the customer should change.');
  const reference = doc(getFirebaseServices().db, 'catalogRequests', id);
  await runTransaction(getFirebaseServices().db, async transaction => {
    const snapshot = await transaction.get(reference);
    if (!snapshot.exists() || snapshot.data().status !== 'pending') throw new Error('This request has already been reviewed. Refresh the list before trying again.');
    transaction.update(reference, {
      status: decision === 'approve' ? 'approved' : 'returned', reviewNote: note.trim(),
      reviewedBy: profile.name, reviewedById: user.uid, reviewedAt: serverTimestamp(),
    });
  });
}
