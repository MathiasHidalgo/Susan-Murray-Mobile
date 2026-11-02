import { Link, router } from 'expo-router';
import { OnlineOrderCard } from './OnlineOrderCard';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { type CatalogItem, type CustomerId, customers, describeItem } from '../data/catalog';
import { addDraftItem, buildOrderLines } from '../data/orderDraft';
import { type DraftLine } from '../types/order';
import type { BusinessProfile } from '../types/profile';
import { type CloudOrder, createCloudOrder, MAX_ORDER_ITEMS, newOrderId, watchOrders } from '../services/cloudOrders';
import { cloudMessage } from '../services/cloudCatalog';

type Props = { profile: BusinessProfile; catalog: CatalogItem[]; mode?: 'list' | 'create' | 'combined' };
export function OnlineOrders({ profile, catalog, mode = 'combined' }: Props) {
  const [orderView, setOrderView] = useState<'active' | 'completed'>('active');
  const [orderSearch, setOrderSearch] = useState('');
  const [orders, setOrders] = useState<CloudOrder[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [retry, setRetry] = useState(0);
  const [draft, setDraft] = useState<DraftLine[]>([]);
  const [selected, setSelected] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const attempt = useRef<{ id: string; signature: string } | null>(null);
  const customerId = profile.customerId as CustomerId;
  const activeOrders = orders.filter(order => order.step !== 4);
  const completedOrders = orders.filter(order => order.step === 4);
  const visibleOrders = (orderView === 'active' ? activeOrders : completedOrders).filter(order =>
    `${order.id} ${customers.find(customer => customer.id === order.customerId)?.name ?? ''} ${order.lines.map(line => line.item).join(' ')}`.toLowerCase().includes(orderSearch.trim().toLowerCase()));
  const ownItems = catalog.filter(item => item.customerId === customerId);
  useEffect(() => {
    if (mode === 'create') return;
    return watchOrders(profile, data => { setOrders(data); setLoaded(true); setLoadError(''); }, failure => {
    setOrders([]); setLoaded(false); setLoadError(cloudMessage(failure));
    });
  }, [profile, retry, mode]);

  function add() {
    if (busy) return;
    setMessage('');
    try {
      if (!ownItems.some(item => item.id === selected)) throw new Error('Select an approved catalog item first.');
      const next = addDraftItem(draft, selected, quantity);
      if (next.length > MAX_ORDER_ITEMS) throw new Error(`Use up to ${MAX_ORDER_ITEMS} different items per order for now.`);
      setDraft(next); setSelected(''); setQuantity('1'); setError('');
    } catch (failure) { setError((failure as Error).message); }
  }
  async function submit() {
    if (inFlight.current) return;
    setMessage('');
    try {
      if (selected) throw new Error('Add the selected item to your order, or deselect it before submitting.');
      const lines = buildOrderLines(customerId, draft, ownItems);
      const signature = JSON.stringify(lines);
      if (!attempt.current || attempt.current.signature !== signature) attempt.current = { id: newOrderId(customerId), signature };
      inFlight.current = true; setBusy(true); setError('');
      await createCloudOrder(attempt.current.id, customerId, lines);
      setDraft([]); setSelected(''); setQuantity('1'); attempt.current = null;
      setMessage('Your order is saved. Staff can now see it for receiving.');
      if (mode === 'create') router.replace('/orders');
    } catch (failure) { setError(cloudMessage(failure)); }
    finally { inFlight.current = false; setBusy(false); }
  }
  return <View style={s.section}>
    {profile.role === 'customer' && mode !== 'list' && <View style={s.card}>
      <Text style={s.heading}>Create an order</Text>
      <Text style={s.body}>Choose your approved items and quantities. Up to {MAX_ORDER_ITEMS} different items per order.</Text>
      {ownItems.length === 0 ? <Text style={s.body}>You can create an order once your first catalog item is approved.</Text> : <>
        <TextInput accessibilityLabel="Search items for order" editable={!busy} style={s.input} placeholder="Search your approved items" value={search} onChangeText={setSearch} />
        {ownItems.filter(item => describeItem(item).toLowerCase().includes(search.trim().toLowerCase())).map(item => <Pressable key={item.id} disabled={busy} accessibilityRole="button" accessibilityState={{ selected: selected === item.id }} style={[s.line, selected === item.id && s.selected]} onPress={() => { setSelected(selected === item.id ? '' : item.id); setError(''); setMessage(''); }}><Text style={s.body}>{selected === item.id ? '✓ ' : ''}{describeItem(item)}</Text></Pressable>)}
        {!ownItems.some(item => describeItem(item).toLowerCase().includes(search.trim().toLowerCase())) && <Text style={s.body}>No approved items match your search.</Text>}
        <Text style={s.body}>{selected ? `Selected: ${ownItems.find(item => item.id === selected)?.name}` : 'Select an item above.'}</Text>
        <Text style={s.body}>Quantity to add</Text>
        <TextInput accessibilityLabel="Quantity to add to online order" editable={!busy} style={s.input} keyboardType="number-pad" maxLength={3} value={quantity} onChangeText={setQuantity} />
        <Pressable disabled={busy} accessibilityRole="button" style={s.button} onPress={add}><Text style={s.white}>Add item to order</Text></Pressable>
      </>}
      <Text style={s.heading}>Order summary · {draft.length} item types</Text>
      {!draft.length && <Text style={s.body}>No items added yet.</Text>}
      {draft.map(line => <View style={s.line} key={line.catalogItemId}>
        <Text style={s.body}>{ownItems.find(item => item.id === line.catalogItemId) ? describeItem(ownItems.find(item => item.id === line.catalogItemId)!) : 'Item no longer available'}</Text>
        <Text style={s.body}>Quantity</Text>
        <TextInput accessibilityLabel={`Draft quantity for ${line.catalogItemId}`} editable={!busy} style={s.input} keyboardType="number-pad" maxLength={3} value={line.quantity} onChangeText={value => { setDraft(current => current.map(entry => entry.catalogItemId === line.catalogItemId ? { ...entry, quantity: value } : entry)); setError(''); }} />
        <Pressable disabled={busy} accessibilityRole="button" style={s.secondary} onPress={() => { setDraft(current => current.filter(entry => entry.catalogItemId !== line.catalogItemId)); setError(''); }}><Text style={s.body}>Remove item</Text></Pressable>
      </View>)}
      <Text style={s.body}>Total pieces: {draft.every(line => /^\d+$/.test(line.quantity) && Number(line.quantity) >= 1 && Number(line.quantity) <= 999) ? draft.reduce((sum, line) => sum + Number(line.quantity), 0) : 'Check quantities'}</Text>
      {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
      {!!message && <Text accessibilityLiveRegion="polite" style={s.body}>{message}</Text>}
      <Pressable disabled={busy || !draft.length} accessibilityRole="button" style={[s.button, (busy || !draft.length) && s.dim]} onPress={submit}><Text style={s.white}>{busy ? 'Saving order…' : 'Submit order'}</Text></Pressable>
      <Text style={s.body}>Drafts are temporary. Submitted orders are saved online.</Text>
    </View>}
    {mode !== 'create' && <View style={s.card}>
      {profile.role === 'customer' && <Link href="/new-order" asChild><Pressable accessibilityRole="button" style={s.button}><Text style={s.white}>Create a new order</Text></Pressable></Link>}
      <Text style={s.heading}>{profile.role === 'customer' ? 'My orders' : 'Customer orders'}</Text>
      <View style={s.row}>{(['active', 'completed'] as const).map(view => <Pressable key={view} accessibilityRole="button" accessibilityState={{ selected: orderView === view }} style={[s.secondary, orderView === view && s.selected]} onPress={() => setOrderView(view)}><Text style={s.body}>{view === 'active' ? `Active · ${activeOrders.length}` : `Completed · ${completedOrders.length}`}</Text></Pressable>)}</View>
      <TextInput accessibilityLabel="Search orders" style={s.input} placeholder="Search order, customer, or item" value={orderSearch} onChangeText={setOrderSearch} />
      {!!loadError && <>
        <Text accessibilityRole="alert" style={s.error}>{loadError}</Text>
        <Pressable accessibilityRole="button" style={s.secondary} onPress={() => { setLoadError(''); setRetry(value => value + 1); }}><Text style={s.body}>Retry orders connection</Text></Pressable>
      </>}
      {!loaded && !loadError && <ActivityIndicator accessibilityLabel="Loading orders" color="#B52F70" />}
      {loaded && !visibleOrders.length && <Text style={s.body}>{orderSearch.trim() ? 'No orders match your search in this view.' : orderView === 'completed' ? 'No collected orders yet.' : 'No active orders. Collected orders are kept under Completed.'}</Text>}
      {visibleOrders.map(order => <OnlineOrderCard key={order.id} order={order} profile={profile} />)}
    </View>}
  </View>;
}
const s = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  section: { gap: 18 },
  card: { backgroundColor: '#FFFFFF', padding: 18, borderRadius: 18, gap: 12, borderWidth: 1, borderColor: '#F3D7E4' },
  heading: { fontSize: 21, color: '#541B38', fontWeight: '700' },
  body: { color: '#744259', lineHeight: 22 },
  label: { color: '#541B38', fontWeight: '700' },
  reference: { color: '#86576D', fontSize: 12 },
  error: { color: '#A61F49', lineHeight: 22 },
  line: { padding: 12, gap: 10, borderRadius: 12, borderWidth: 1, borderColor: '#F3D7E4' },
  selected: { borderColor: '#B52F70', backgroundColor: '#FFF0F6' },
  input: { borderWidth: 1, borderColor: '#DCA5BF', padding: 14, borderRadius: 10, fontSize: 16, color: '#541B38' },
  button: { backgroundColor: '#B52F70', padding: 16, borderRadius: 12 },
  secondary: { backgroundColor: '#FCE4EF', padding: 16, borderRadius: 12 },
  white: { color: '#FFFFFF', fontWeight: '600', textAlign: 'center' },
  dim: { opacity: 0.6 },
});
