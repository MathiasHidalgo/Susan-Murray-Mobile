import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { getFirebaseAuth, authMessage } from '../services/auth';
import { getFirebaseServices } from '../services/firebase';
import { type BusinessProfile, parseProfile } from '../types/profile';

type Session = { user: User | null; profile: BusinessProfile | null; initializing: boolean; profileStatus: string };
const SessionContext = createContext<Session | null>(null);
export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [profileStatus, setProfileStatus] = useState('');
  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;
    Promise.resolve().then(() => {
      if (!active) return;
      unsubscribe = onAuthStateChanged(getFirebaseAuth(), current => {
        if (!active) return;
        setUser(current); setProfile(null); setInitializing(false);
        setProfileStatus(current ? 'Checking your business profile…' : '');
      }, error => { if (active) { setProfileStatus(authMessage(error)); setInitializing(false); } });
    }).catch(error => { if (active) { setProfileStatus(authMessage(error)); setInitializing(false); } });
    return () => { active = false; unsubscribe?.(); };
  }, []);
  useEffect(() => {
    if (!user) return;
    let active = true;
    let unsubscribe: (() => void) | undefined;
    Promise.resolve().then(() => {
      if (!active) return;
      unsubscribe = onSnapshot(doc(getFirebaseServices().db, 'users', user.uid), snapshot => {
        if (!active) return;
        const linked = snapshot.exists() ? parseProfile(snapshot.data()) : null;
        setProfile(linked?.active ? linked : null);
        setProfileStatus(!snapshot.exists() ? 'Your account is waiting for its business profile to be linked.' : !linked ? 'Your business profile needs to be corrected by the administrator.' : !linked.active ? 'Your business profile is inactive. Contact your administrator.' : 'Business profile connected.');
      }, error => {
        if (!active) return;
        setProfile(null);
        setProfileStatus(error.code === 'permission-denied' ? 'Your profile could not be accessed. Contact your administrator, or sign out and try again.' : 'Could not load your business profile. Check your connection and sign in again.');
      });
    }).catch(() => { if (active) { setProfile(null); setProfileStatus('Could not load your business profile. Please sign in again.'); } });
    return () => { active = false; unsubscribe?.(); };
  }, [user]);
  return <SessionContext.Provider value={{ user, profile, initializing, profileStatus }}>{children}</SessionContext.Provider>;
}
export function useSession(): Session {
  const session = useContext(SessionContext);
  if (!session) throw new Error('Session provider is missing.');
  return session;
}
