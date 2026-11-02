import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { CloudOrder } from '../services/cloudOrders';
import { advanceCloudOrder, confirmCloudPickup, type CountEvent, saveReceivedCounts, watchCountEvents } from '../services/cloudReceiving';
import { cloudMessage } from '../services/cloudCatalog';
import type { BusinessProfile } from '../types/profile';
import { customers } from '../data/catalog';
import { statuses } from '../types/order';

type Props = { order: CloudOrder; profile: BusinessProfile };
export function OnlineOrderCard({ order, profile }: Props) {
  const [confirmingPickup, setConfirmingPickup] = useState(false);
  const [counts, setCounts] = useState<Record<string, string>>({});
  const [note, setNote] = useState('');
  const [editing, setEditing] = useState(false);
  const [events, setEvents] = useState<CountEvent[]>([]);
  const [historyError, setHistoryError] = useState('');
  const [retry, setRetry] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const revision = useRef(order.countRevision ?? 0);
  const operational = profile.role !== 'customer';
  const canCount = operational && order.step < 4 && (order.step === 0 || editing);
  const submitted = order.lines.reduce((sum, line) => sum + line.quantity, 0);
  const received = order.receivedCounts?.reduce((sum, count) => sum + count, 0);
  useEffect(() => watchCountEvents(order.id, data => { setEvents(data); setHistoryError(''); }, failure => {
    setEvents([]); setHistoryError(cloudMessage(failure));
  }), [order.id, retry]);
  function startCorrection() {
    setCounts(Object.fromEntries(order.lines.map((line, index) => [line.catalogItemId, String(order.receivedCounts?.[index] ?? '')])));
    revision.current = order.countRevision ?? 0;
    setNote(''); setError(''); setEditing(true);
  }
  async function save() {
    if (pending.current) return;
    pending.current = true; setBusy(true); setError('');
    try {
      await saveReceivedCounts(order.id, editing ? revision.current : 0, counts, note, profile);
      setCounts({}); setNote(''); setEditing(false);
    } catch (failure) { setError(cloudMessage(failure)); }
    finally { pending.current = false; setBusy(false); }
  }
  async function advance() {
    if (pending.current) return;
    pending.current = true; setBusy(true); setError('');
    try { await advanceCloudOrder(order.id, order.step, profile); }
    catch (failure) { setError(cloudMessage(failure)); }
    finally { pending.current = false; setBusy(false); }
  }
  async function pickup() {
    if (pending.current) return;
    pending.current = true; setBusy(true); setError('');
    try { await confirmCloudPickup(order.id, profile); setConfirmingPickup(false); }
    catch (failure) { setError(cloudMessage(failure)); }
    finally { pending.current = false; setBusy(false); }
  }
  return <View style={s.card}>
    <Text selectable style={s.reference}>ORDER #{order.id.split('__').at(-1)}</Text>
    {operational && <Text style={s.heading}>{customers.find(customer => customer.id === order.customerId)?.name ?? order.customerId}</Text>}
    <Text style={s.body}>{order.createdAt ? new Date(order.createdAt).toLocaleString() : ''}</Text>
    <Text style={s.heading}>{order.lines.length} item types · {submitted} submitted pieces</Text>
    {received !== undefined && <Text style={s.body}>{received} received pieces · Difference: {received - submitted > 0 ? '+' : ''}{received - submitted}</Text>}
    {order.lines.map((line, index) => {
      const raw = counts[line.catalogItemId] ?? '';
      const valid = /^\d+$/.test(raw.trim()) && Number(raw) <= 999;
      const value = canCount && valid ? Number(raw) : order.receivedCounts?.[index];
      const difference = value === undefined ? undefined : value - line.quantity;
      return <View key={line.catalogItemId} style={s.line}>
        <Text style={s.label}>{line.item}</Text>
        <Text style={s.body}>Customer submitted: {line.quantity}</Text>
        {canCount ? <>
          <Text style={s.body}>Actually received</Text>
          <TextInput accessibilityLabel={`Received count for ${line.item}`} editable={!busy} style={s.input} keyboardType="number-pad" maxLength={3} placeholder="Count (0 if none)" value={raw} onChangeText={value => { setCounts(current => ({ ...current, [line.catalogItemId]: value })); setError(''); }} />
        </> : <Text style={s.body}>Staff received: {order.receivedCounts?.[index] ?? 'Not counted yet'}</Text>}
        {difference !== undefined && <Text style={difference ? s.difference : s.body}>{difference ? `Difference: ${difference > 0 ? '+' : ''}${difference}` : 'Counts match'}</Text>}
      </View>;
    })}
    <Text style={s.label}>Status: {statuses[order.step]}</Text>
    {canCount && <>
      <Text style={s.body}>{editing ? 'Correction reason (required)' : 'Receiving note (required if counts differ)'}</Text>
      <TextInput accessibilityLabel={`Receiving note for order ${order.id}`} editable={!busy} style={s.input} multiline maxLength={500} placeholder={editing ? 'e.g. Found missing linen in another bag' : 'Explain any shortages or extras'} value={note} onChangeText={value => { setNote(value); setError(''); }} />
      <Pressable disabled={busy} accessibilityRole="button" style={s.button} onPress={save}><Text style={s.white}>{busy ? 'Saving…' : editing ? 'Save count correction' : 'Confirm received counts'}</Text></Pressable>
      {editing && <Pressable disabled={busy} accessibilityRole="button" style={s.secondary} onPress={() => { setEditing(false); setCounts({}); setNote(''); setError(''); }}><Text style={s.body}>Cancel correction</Text></Pressable>}
    </>}
    {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
    {operational && order.step > 0 && order.step < 4 && !editing && <>
      <Pressable disabled={busy || confirmingPickup} accessibilityRole="button" style={s.secondary} onPress={startCorrection}><Text style={s.body}>Correct received counts</Text></Pressable>
      {order.step === 3 && (confirmingPickup ? <View style={s.line}>
        <Text style={s.label}>Has the customer collected this order?</Text>
        <Text style={s.body}>Confirm only after handing over the linen. The order will move to Completed.</Text>
        <Pressable disabled={busy} accessibilityRole="button" style={s.button} onPress={pickup}><Text style={s.white}>{busy ? 'Saving…' : 'Yes, confirm pickup'}</Text></Pressable>
        <Pressable disabled={busy} accessibilityRole="button" style={s.secondary} onPress={() => setConfirmingPickup(false)}><Text style={s.body}>Cancel</Text></Pressable>
      </View> : <Pressable disabled={busy} accessibilityRole="button" style={s.button} onPress={() => { setConfirmingPickup(true); setError(''); }}><Text style={s.white}>Mark as picked up</Text></Pressable>)}
      {order.step < 3 && <Pressable disabled={busy} accessibilityRole="button" style={s.button} onPress={advance}><Text style={s.white}>{busy ? 'Saving…' : `Move to ${statuses[order.step + 1]}`}</Text></Pressable>}
    </>}
    {!!order.lastCountName && <Text style={s.body}>Last counted by {order.lastCountName}{order.lastCountAt ? ` · ${new Date(order.lastCountAt).toLocaleString()}` : ''}</Text>}
    {!!events[0]?.reason && <Text style={s.body}>Latest receiving note: {events[0].reason}</Text>}
    {!!historyError && <>
      <Text accessibilityRole="alert" style={s.error}>{historyError}</Text>
      <Pressable accessibilityRole="button" style={s.secondary} onPress={() => { setHistoryError(''); setRetry(value => value + 1); }}><Text style={s.body}>Retry count history</Text></Pressable>
    </>}
    {events.length > 0 && <Pressable accessibilityRole="button" accessibilityState={{ expanded: showHistory }} style={s.secondary} onPress={() => setShowHistory(!showHistory)}><Text style={s.body}>{showHistory ? 'Hide' : 'View'} receiving history · {events.length}</Text></Pressable>}
    {showHistory && events.map(event => <View key={event.revision} style={s.line}>
      <Text style={s.label}>{event.revision === 1 ? 'Initial receiving check' : `Count correction ${event.revision - 1}`}</Text>
      <Text style={s.reference}>{event.actorName} · {event.recordedAt ? new Date(event.recordedAt).toLocaleString() : ''}</Text>
      {order.lines.map((line, index) => (event.revision === 1 || event.beforeCounts[index] !== event.afterCounts[index]) && <Text key={line.catalogItemId} style={s.body}>{line.item}: {event.beforeCounts[index] ?? 'Not counted'} → {event.afterCounts[index]}</Text>)}
      {!!event.reason && <Text style={s.body}>Reason: {event.reason}</Text>}
    </View>)}
    {order.step === 4 && <View style={s.line}>
      <Text style={s.label}>Collected · Order complete</Text>
      <Text style={s.body}>Pickup confirmed by {order.pickedUpBy}{order.pickedUpAt ? ` · ${new Date(order.pickedUpAt).toLocaleString()}` : ''}</Text>
    </View>}
    {order.step === 3 && <Text style={s.label}>Your order is ready for pickup!</Text>}
  </View>;
}
const s = StyleSheet.create({
  card: { padding: 14, gap: 12, borderWidth: 1, borderColor: '#F3D7E4', borderRadius: 14, backgroundColor: '#FFFFFF' },
  heading: { fontSize: 20, color: '#541B38', fontWeight: '700' },
  body: { color: '#744259', lineHeight: 22 },
  label: { color: '#541B38', fontWeight: '700', lineHeight: 22 },
  reference: { color: '#86576D', fontSize: 12 },
  line: { padding: 12, gap: 10, borderRadius: 12, borderWidth: 1, borderColor: '#F3D7E4' },
  input: { borderWidth: 1, borderColor: '#DCA5BF', padding: 14, borderRadius: 10, fontSize: 16, color: '#541B38' },
  error: { color: '#A61F49', lineHeight: 22 },
  difference: { color: '#A61F49', fontWeight: '700' },
  button: { backgroundColor: '#B52F70', padding: 16, borderRadius: 12 },
  secondary: { backgroundColor: '#FCE4EF', padding: 16, borderRadius: 12 },
  white: { color: '#FFFFFF', fontWeight: '600', textAlign: 'center' },
});
