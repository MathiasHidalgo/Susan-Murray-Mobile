import { administrator, staffMembers } from '../data/people';
import { useReducer, useState } from 'react';
import { CatalogRequestForm } from '../components/CatalogRequestForm';
import { addDraftItem, buildOrderLines } from '../data/orderDraft';
import { reviewReducer } from '../data/catalogRequests';
import { OrderCard } from '../components/OrderCard';
import { AdminReview } from '../components/AdminReview';
import { StatusBar } from 'expo-status-bar';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { DraftLine, Order } from '../types/order';
import { catalog, customers, CustomerId, describeItem } from '../data/catalog';

export default function DemoApp() {
  const [review, dispatchReview] = useReducer(reviewReducer, { requests: [], message: '' });
  const requests = review.requests;
  const activeCatalog = [...catalog, ...requests.filter(r => r.status === 'approved')];
  const [role, setRole] = useState<'customer' | 'staff' | 'admin'>('customer');
  const [staffId, setStaffId] = useState<string>(staffMembers[0].id);
  const selectedStaff = staffMembers.find(member => member.id === staffId)!;
  const canManageOrders = role !== 'customer';
  const [customerId, setCustomerId] = useState<CustomerId>('customer-001');
  const [selectedId, setSelectedId] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const customer = customers.find(c => c.id === customerId)!;
  const selectedItem = activeCatalog.find(i => i.id === selectedId && i.customerId === customerId);
  const visibleItems = activeCatalog.filter(i => i.customerId === customerId && (category === 'All' || i.type === category) && describeItem(i).toLowerCase().includes(search.trim().toLowerCase()));
  const [drafts, setDrafts] = useState<Record<string, DraftLine[]>>({});
  const draft = drafts[customerId] ?? [];
  const [orderMessage, setOrderMessage] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [error, setError] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const visibleOrders = canManageOrders ? orders : orders.filter(o => o.customerId === customerId);
  function changeCustomer(id: CustomerId) {
    setCustomerId(id); setSelectedId(''); setSearch(''); setCategory('All'); setQuantity('1'); setError(''); setOrderMessage('');
  }
  function addItem() {
    setOrderMessage('');
    if (!selectedItem) { setError('Select an approved catalog item first.'); return; }
    try {
      const next = addDraftItem(draft, selectedItem.id, quantity);
      setDrafts(current => ({ ...current, [customerId]: next }));
      setSelectedId(''); setQuantity('1'); setError('');
    } catch (error) { setError((error as Error).message); }
  }
  function create() {
    setOrderMessage('');
    if (selectedItem) { setError('Add the selected item to the order, or deselect it before submitting.'); return; }
    try {
      const lines = buildOrderLines(customerId, draft, activeCatalog);
      setOrders(current => [{ id: Date.now(), customerId, lines, step: 0 }, ...current]);
      setDrafts(current => ({ ...current, [customerId]: [] }));
      setQuantity('1'); setError(''); setOrderMessage(`Order submitted for ${customer.name}.`);
    } catch (error) { setError((error as Error).message); }
  }
  return <KeyboardAvoidingView style={s.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <StatusBar style="dark" />
    <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <Text style={s.eyebrow}>LAUNDRY, TAKEN CARE OF</Text>
      <Text style={s.title}>Susan Murray</Text>
      <Text style={s.body}>linen, tools and services</Text>
      <Text style={s.notice}>Demo · Orders and requests reset when you restart. Switching roles does not sign you in.</Text>
      <View style={s.wrap}>{(['customer', 'staff', 'admin'] as const).map(value => <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: role === value }} style={[s.chip, role === value && s.selected]} onPress={() => setRole(value)}><Text style={role === value ? s.white : s.body}>{value === 'admin' ? `${administrator.name} · Admin demo` : value === 'staff' ? 'Staff demo' : 'Customer demo'}</Text></Pressable>)}</View>
      {role === 'staff' && <View style={s.card}>
        <Text style={s.heading}>Staff profile · Demo</Text>
        <Text style={s.body}>Choose who is checking orders. Real sign-in will replace this selector.</Text>
        <View style={s.wrap}>{staffMembers.map(member => <Pressable key={member.id} accessibilityRole="button" accessibilityState={{ selected: staffId === member.id }} style={[s.chip, staffId === member.id && s.selected]} onPress={() => setStaffId(member.id)}><Text style={staffId === member.id ? s.white : s.body}>{member.name}</Text></Pressable>)}</View>
      </View>}
      {role === 'admin' && <AdminReview catalog={activeCatalog} requests={requests} message={review.message} orderCount={orders.length} onReview={(id, decision, note) => dispatchReview({ type: decision, id, note, catalog, reviewedAt: new Date().toISOString() })} />}
      {role === 'customer' && <View style={s.card}>
        <Text style={s.heading}>Customer catalog</Text>
        <Text style={s.body}>Choose a sample customer</Text>
        <View style={s.wrap}>{customers.map(c => <Pressable key={c.id} accessibilityRole="button" accessibilityState={{ selected: customerId === c.id }} style={[s.chip, customerId === c.id && s.selected]} onPress={() => changeCustomer(c.id)}><Text style={customerId === c.id ? s.white : s.body}>{c.name}</Text></Pressable>)}</View>
        <Text style={s.heading}>{customer.name}</Text>
        <Text style={s.body}>Catalog for {customer.name}. Request your own linen items below. Once Ryan approves them, you can add them to orders.</Text>
        <TextInput accessibilityLabel="Search catalog" style={s.input} placeholder="Search name, fabric, color, or size" value={search} onChangeText={setSearch} />
        <View style={s.wrap}>{['All', 'Tablecloth', 'Napkin'].map(type => <Pressable key={type} accessibilityRole="button" accessibilityState={{ selected: category === type }} style={[s.chip, category === type && s.selected]} onPress={() => setCategory(type)}><Text style={category === type ? s.white : s.body}>{type === 'All' ? 'All items' : `${type}s`}</Text></Pressable>)}</View>
        <Text style={s.reference}>{visibleItems.length} matching items</Text>
        {visibleItems.length === 0 && <Text style={s.body}>{activeCatalog.some(item => item.customerId === customerId) ? 'No items match. Try another search or category.' : 'Your catalog is empty. Tap Request a new item below to get started.'}</Text>}
        {visibleItems.map(entry => <Pressable key={entry.id} accessibilityRole="button" accessibilityLabel={`Select ${describeItem(entry)}`} accessibilityState={{ selected: selectedId === entry.id }} onPress={() => { setSelectedId(selectedId === entry.id ? '' : entry.id); setError(''); setOrderMessage(''); }} style={[s.catalogItem, selectedId === entry.id && s.catalogSelected]}>
          <Text style={s.itemName}>{selectedId === entry.id ? '✓ ' : ''}{entry.name}</Text>
          <Text style={s.body}>{entry.type} · {entry.color} · {entry.size}</Text>
          <Text style={s.reference}>Fabric / design: {entry.fabric}</Text>
        </Pressable>)}
        <CatalogRequestForm catalog={activeCatalog} key={customerId} customerId={customerId} customerName={customer.name} requests={requests} onSubmit={request => dispatchReview({ type: 'submit', request, catalog })} />
        <Text style={s.heading}>Build your order</Text>
        <Text style={s.body}>{selectedItem ? `Selected: ${describeItem(selectedItem)}` : 'Select an item from the catalog above.'}</Text>
        <Text style={s.body}>Quantity</Text>
        <TextInput accessibilityLabel="Quantity" style={s.input} keyboardType="number-pad" maxLength={3} value={quantity} onChangeText={setQuantity} />
        <Pressable accessibilityRole="button" style={s.button} onPress={addItem}><Text style={s.white}>Add item to order</Text></Pressable>
        <Text style={s.heading}>Order summary · {draft.length} item types</Text>
        {draft.length === 0 && <Text style={s.body}>Your order is empty. Select a catalog item and add its quantity.</Text>}
        {draft.map(line => <View key={line.catalogItemId} style={s.catalogItem}>
          <Text style={s.itemName}>{describeItem(activeCatalog.find(item => item.id === line.catalogItemId && item.customerId === customerId)!)}</Text>
          <Text style={s.body}>Quantity</Text>
          <TextInput accessibilityLabel={`Order quantity for ${line.catalogItemId}`} style={s.input} keyboardType="number-pad" maxLength={3} value={line.quantity} onChangeText={value => {
            setDrafts(current => ({ ...current, [customerId]: (current[customerId] ?? []).map(entry => entry.catalogItemId === line.catalogItemId ? { ...entry, quantity: value } : entry) })); setError(''); setOrderMessage('');
          }} />
          <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${line.catalogItemId} from order`} style={s.chip} onPress={() => {
            setDrafts(current => ({ ...current, [customerId]: (current[customerId] ?? []).filter(entry => entry.catalogItemId !== line.catalogItemId) })); setError(''); setOrderMessage('');
          }}><Text style={s.body}>Remove item</Text></Pressable>
        </View>)}
        <Text style={s.body}>Total pieces: {draft.every(line => /^\d+$/.test(line.quantity) && Number(line.quantity) >= 1) ? draft.reduce((total, line) => total + Number(line.quantity), 0) : 'Check quantities'}</Text>
        {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
        {!!orderMessage && <Text accessibilityLiveRegion="polite" style={s.body}>{orderMessage}</Text>}
        <Pressable accessibilityRole="button" style={s.button} onPress={create}><Text style={s.white}>Submit order</Text></Pressable>
      </View>}
      <Text style={s.heading}>{canManageOrders ? 'Manage orders' : 'My sample orders'} · {visibleOrders.length}</Text>
      {visibleOrders.length === 0 && <Text style={s.body}>No orders yet for {customer.name}.</Text>}
      {visibleOrders.map(order => <OrderCard key={`${role}-${staffId}-${order.id}`} reviewerName={role === 'admin' ? administrator.name : selectedStaff.name} order={order} role={role} onUpdate={updated => setOrders(current => current.map(existing => existing.id === updated.id && existing.step === order.step ? updated : existing))} />)}
      <Text style={s.body}>Order saving and notifications are coming soon.</Text>
    </ScrollView>
  </KeyboardAvoidingView>;
}
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFF7FA' },
  content: { padding: 24, paddingTop: 64, paddingBottom: 48, gap: 18, maxWidth: 640, width: '100%', alignSelf: 'center' },
  eyebrow: { color: '#A52C65', fontSize: 11, letterSpacing: 2, fontWeight: '700' },
  title: { fontSize: 44, fontWeight: '800', color: '#541B38' },
  body: { color: '#744259', lineHeight: 22 },
  notice: { backgroundColor: '#FCE4EF', color: '#744259', padding: 14, borderRadius: 12, lineHeight: 22 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { padding: 12, borderRadius: 12, backgroundColor: '#FCE4EF' },
  catalogItem: { padding: 14, gap: 6, borderRadius: 12, borderWidth: 1, borderColor: '#F3D7E4' },
  catalogSelected: { borderColor: '#B52F70', backgroundColor: '#FFF0F6', borderWidth: 2 },
  itemName: { color: '#541B38', fontWeight: '700', fontSize: 16 },
  row: { flexDirection: 'row', gap: 8 },
  tab: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center', backgroundColor: '#FCE4EF' },
  selected: { backgroundColor: '#B52F70' },
  white: { color: '#FFFFFF', fontWeight: '600', textAlign: 'center' },
  card: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 20, gap: 12, borderWidth: 1, borderColor: '#F3D7E4' },
  heading: { fontSize: 20, color: '#541B38', fontWeight: '700' },
  input: { borderWidth: 1, borderColor: '#DCA5BF', padding: 14, borderRadius: 10, fontSize: 16, color: '#541B38' },
  button: { backgroundColor: '#B52F70', padding: 16, borderRadius: 12 },
  reference: { fontSize: 12, color: '#86576D' },
  segment: { flex: 1, height: 5, borderRadius: 4, backgroundColor: '#F7DFEB' },
  filled: { backgroundColor: '#D84C91' },
  error: { color: '#A61F49' },
});
