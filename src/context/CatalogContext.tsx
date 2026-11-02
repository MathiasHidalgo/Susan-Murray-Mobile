import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { CatalogRequest } from '../data/catalogRequests';
import type { BusinessProfile } from '../types/profile';
import { cloudMessage, watchCatalog } from '../services/cloudCatalog';

type CatalogState = { requests: CatalogRequest[]; approved: CatalogRequest[]; loaded: boolean; error: string; reload: () => void };
const CatalogContext = createContext<CatalogState | null>(null);
export function CatalogProvider({ profile, children }: { profile: BusinessProfile; children: ReactNode }) {
  const [requests, setRequests] = useState<CatalogRequest[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => watchCatalog(profile, data => { setRequests(data); setLoaded(true); setError(''); }, failure => {
    setRequests([]); setLoaded(false); setError(cloudMessage(failure));
  }), [profile, retry]);
  const approved = useMemo(() => requests.filter(request => request.status === 'approved'), [requests]);
  const reload = useCallback(() => setRetry(value => value + 1), []);
  return <CatalogContext.Provider value={{ requests, approved, loaded, error, reload }}>{children}</CatalogContext.Provider>;
}
export function useCatalog(): CatalogState {
  const state = useContext(CatalogContext);
  if (!state) throw new Error('Catalog provider is missing.');
  return state;
}
