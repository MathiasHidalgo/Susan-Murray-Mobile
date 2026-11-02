export type BusinessProfile = {
  name: string;
  role: 'staff' | 'admin' | 'customer';
  profileId: string;
  active: boolean;
  customerId?: string;
};

export function parseProfile(value: unknown): BusinessProfile | null {
  if (!value || typeof value !== 'object') return null;
  const data = value as Record<string, unknown>;
  if (typeof data.name !== 'string' || !data.name.trim() ||
      typeof data.profileId !== 'string' || !data.profileId.trim() ||
      !['staff', 'admin', 'customer'].includes(String(data.role)) || typeof data.active !== 'boolean') return null;
  if (data.role === 'customer' && (typeof data.customerId !== 'string' || !data.customerId.trim())) return null;
  return { name: data.name, role: data.role as BusinessProfile['role'], profileId: data.profileId, active: data.active,
    ...(data.role === 'customer' ? { customerId: data.customerId as string } : {}) };
}
