export const customers = [
  { id: 'customer-001', name: 'Scotiabank' },
  { id: 'customer-002', name: 'CIBC' },
  { id: 'customer-003', name: 'Table Tales' },
  { id: 'test-faketales', name: 'Faketales (test)' },
] as const;

export type CustomerId = (typeof customers)[number]['id'];
export type CatalogItem = {
  id: string;
  customerId: CustomerId;
  name: string;
  type: 'Tablecloth' | 'Napkin';
  fabric: string;
  color: string;
  size: string;
};

// Customers submit their own items. Only approved requests enter the catalog.
export const catalog: CatalogItem[] = [];

export function describeItem(item: CatalogItem): string {
  return `${item.name} · ${item.type} · ${item.fabric} · ${item.color} · ${item.size}`;
}
