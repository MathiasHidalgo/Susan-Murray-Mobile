// Business profiles only. These IDs are not Firebase Authentication UIDs.
// Link each profile to a verified sign-in account when emails are available.
export const administrator = { id: 'admin-001', name: 'Ryan Cohen' } as const;
export const staffMembers = [
  { id: 'staff-001', name: 'Mathias', email: 'camathias2307@gmail.com' },
  { id: 'staff-002', name: 'Nguyen' },
  { id: 'staff-003', name: 'Pavlynna' },
] as const;
