import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { customers } from '../data/catalog';
import { confirmReceived, correctReceived } from '../data/receiving';
import { Order, statuses } from '../types/order';

type Props = { reviewerName: string; order: Order; role: 'customer' | 'staff' | 'admin'; onUpdate: (order: Order) => void };
export function OrderCard({ reviewerName, order, role, onUpdate }: Props) {
  const [editing, setEditing] = useState(false);
  const [counts, setCounts] = useState<Record<string, string>>({});
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const canCount = role !== 'customer' && order.step < 4 && (order.step === 0 || editing);
  const submitted = order.lines.reduce((sum, line) => sum + line.quantity, 0);
  const allCounted = order.lines.every(line => line.receivedQuantity !== undefined);
  const received = order.lines.reduce((sum, line) => sum + (line.receivedQuantity ?? 0), 0);
  function confirm() {
    try {
      onUpdate((editing ? correctReceived : confirmReceived)(order, counts, note, `${reviewerName} (demo)`, new Date().toISOString()));
      setEditing(false); setNote(''); setCounts({});
      setError('');
    } catch (error) { setError((error as Error).message); }
  }
  function startCorrection() {
    setCounts(Object.fromEntries(order.lines.map(line => [line.catalogItemId, String(line.receivedQuantity ?? '')])));
    setNote(''); setError(''); setEditing(true);
  }
  return <View style={s.card}>
    <Text style={s.reference}>ORDER #{order.id} · {customers.find(c => c.id === order.customerId)?.name}</Text>
    <Text style={s.heading}>{order.lines.length} item types · {submitted} submitted pieces</Text>
    {allCounted && <Text style={s.body}>{received} received pieces · Difference: {received - submitted > 0 ? '+' : ''}{received - submitted}</Text>}
    {order.lines.map(line => {
      const raw = counts[line.catalogItemId] ?? '';
      const validDraft = /^\d+$/.test(raw.trim()) && Number(raw) <= 999;
      const count = canCount && validDraft ? Number(raw) : line.receivedQuantity;
      const difference = count === undefined ? undefined : count - line.quantity;
      return <View key={line.catalogItemId} style={s.line}>
        <Text style={s.itemName}>{line.item}</Text>
        <Text style={s.body}>Customer submitted: {line.quantity}</Text>
        {canCount ? <>
          <Text style={s.body}>Actually received</Text>
          <TextInput accessibilityLabel={`Received count for ${line.item}`} style={s.input} keyboardType="number-pad" maxLength={3} placeholder="Enter count (0 if none)" value={raw} onChangeText={value => { setCounts(current => ({ ...current, [line.catalogItemId]: value })); setError(''); }} />
        </> : <Text style={s.body}>Staff received: {line.receivedQuantity ?? 'Not counted yet'}</Text>}
        {difference !== undefined && <Text style={difference === 0 ? s.body : s.difference}>{difference === 0 ? 'Counts match' : `Difference: ${difference > 0 ? '+' : ''}${difference} (${difference > 0 ? 'more' : 'fewer'} received)`}</Text>}
      </View>;
    })}
    <Text style={s.body}>Status: {statuses[order.step]}</Text>
    <View style={s.row}>{statuses.map((status, index) => <View key={status} style={[s.segment, index <= order.step && s.filled]} />)}</View>
    {role !== 'customer' && order.step > 0 && order.step < 4 && !editing && <Pressable accessibilityRole="button" style={s.secondary} onPress={startCorrection}><Text style={s.body}>Correct received counts</Text></Pressable>}
    {canCount && <>
      <Text style={s.body}>{editing ? 'Correction reason (required)' : 'Receiving note (required if any counts differ)'}</Text>
      <TextInput accessibilityLabel={`Receiving note for order ${order.id}`} style={s.input} multiline maxLength={500} placeholder={editing ? 'e.g. Found the missing tablecloths in another bag' : 'Explain any differences'} value={note} onChangeText={value => { setNote(value); setError(''); }} />
      <Text style={s.body}>{editing ? 'The correction will be recorded in the history. The order status stays unchanged.' : 'Confirm after checking every item. Submitted quantities stay unchanged.'}</Text>
      {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
      <Pressable accessibilityRole="button" style={s.button} onPress={confirm}><Text style={s.white}>{editing ? 'Save count correction' : 'Confirm received counts'}</Text></Pressable>
      {editing && <Pressable accessibilityRole="button" style={s.secondary} onPress={() => { setEditing(false); setCounts({}); setNote(''); setError(''); }}><Text style={s.body}>Cancel correction</Text></Pressable>}
    </>}
    {!!order.countNote && <Text style={s.body}>Receiving note: {order.countNote}</Text>}
    {!!order.checkedBy && <Text style={s.reference}>Checked by {order.checkedBy}{order.checkedAt ? ` · ${new Date(order.checkedAt).toLocaleString()}` : ''}</Text>}
    {role !== 'customer' && !editing && order.step > 0 && order.step < 3 && <Pressable accessibilityRole="button" style={s.button} onPress={() => onUpdate({ ...order, step: order.step + 1 })}><Text style={s.white}>Move to {statuses[order.step + 1]}</Text></Pressable>}
    {!!order.corrections?.length && <View style={s.line}>
      <Text style={s.itemName}>Count correction history</Text>
      {order.corrections.map((correction, index) => <View key={`${correction.changedAt}-${index}`} style={s.line}>
        <Text style={s.reference}>{correction.changedBy} · {new Date(correction.changedAt).toLocaleString()}</Text>
        {correction.changes.map(change => <Text key={change.catalogItemId} style={s.body}>{change.item}: {change.before} → {change.after}</Text>)}
        <Text style={s.body}>Reason: {correction.reason}</Text>
      </View>)}
    </View>}
    {order.step === 3 && <Text style={s.body}>Your order is ready for pickup!</Text>}
  </View>;
}

const s = StyleSheet.create({
  card: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 20, gap: 12, borderWidth: 1, borderColor: '#F3D7E4' },
  heading: { fontSize: 20, color: '#541B38', fontWeight: '700' },
  reference: { fontSize: 12, color: '#86576D' },
  body: { color: '#744259', lineHeight: 22 },
  itemName: { color: '#541B38', fontWeight: '700', fontSize: 16 },
  line: { padding: 14, gap: 8, borderRadius: 12, borderWidth: 1, borderColor: '#F3D7E4' },
  input: { borderWidth: 1, borderColor: '#DCA5BF', padding: 14, borderRadius: 10, fontSize: 16, color: '#541B38' },
  difference: { color: '#A61F49', fontWeight: '700', lineHeight: 22 },
  error: { color: '#A61F49' },
  row: { flexDirection: 'row', gap: 8 },
  segment: { flex: 1, height: 5, borderRadius: 4, backgroundColor: '#F7DFEB' },
  filled: { backgroundColor: '#D84C91' },
  secondary: { backgroundColor: '#FCE4EF', padding: 16, borderRadius: 12 },
  button: { backgroundColor: '#B52F70', padding: 16, borderRadius: 12 },
  white: { color: '#FFFFFF', fontWeight: '600', textAlign: 'center' },
});
