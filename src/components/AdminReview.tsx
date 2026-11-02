import { administrator } from '../data/people';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { CatalogItem, customers } from '../data/catalog';
import { CatalogRequest } from '../data/catalogRequests';

type Props = {
  catalog: CatalogItem[];
  requests: CatalogRequest[];
  message: string;
  orderCount: number;
  onReview: (id: string, decision: 'approve' | 'return', note: string) => void;
};

export function AdminReview({ catalog, requests, message, orderCount, onReview }: Props) {
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');
  const pending = requests.filter(r => r.status === 'pending');
  const visible = filter === 'pending' ? pending : requests;
  return <View style={s.section}>
    <View style={s.card}>
      <Text style={s.heading}>{administrator.name} · Admin demo</Text>
      <Text style={s.body}>Business overview</Text>
      <Text style={s.body}>{customers.length} customers · {catalog.length} catalog items · {orderCount} orders · {pending.length} pending requests</Text>
      {customers.map(customer => <Text key={customer.id} style={s.body}>{customer.name}: {catalog.filter(i => i.customerId === customer.id).length} catalog items</Text>)}
      <Text style={s.body}>Admin access will cover customers, catalogs, orders, staff, and permissions. Account management will be added with real sign-ins.</Text>
    </View>
    <View style={s.card}>
      <Text style={s.heading}>Catalog requests</Text>
      <View style={s.row}>{(['pending', 'all'] as const).map(value => <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: filter === value }} style={[s.chip, filter === value && s.selected]} onPress={() => setFilter(value)}><Text style={filter === value ? s.white : s.body}>{value === 'pending' ? 'Pending' : 'All requests'}</Text></Pressable>)}</View>
      {!!message && <Text accessibilityRole="alert" style={s.body}>{message}</Text>}
      {visible.length === 0 && <Text style={s.body}>{filter === 'pending' ? 'No pending requests. Create one in Customer demo to try the review flow.' : 'No requests yet.'}</Text>}
      {visible.map(request => <View key={request.id} style={s.request}>
        <Text style={s.customer}>{customers.find(c => c.id === request.customerId)?.name}</Text>
        <Text style={s.heading}>{request.name}</Text>
        <Text style={s.body}>{request.type} · {request.fabric} · {request.color} · {request.size}</Text>
        <Text style={s.body}>Submitted: {new Date(request.submittedAt).toLocaleString()}</Text>
        <Text style={s.customer}>{request.status === 'pending' ? 'Pending approval' : request.status === 'approved' ? 'Approved' : 'Changes requested'}</Text>
        {request.status === 'pending' ? <>
          <Text style={s.body}>Review note (required when returning)</Text>
          <TextInput accessibilityLabel={`Review note for ${request.name}`} style={s.input} multiline maxLength={500} placeholder="Explain any changes needed" value={notes[request.id] ?? ''} onChangeText={note => setNotes(current => ({ ...current, [request.id]: note }))} />
          <Pressable accessibilityRole="button" style={s.button} onPress={() => onReview(request.id, 'approve', notes[request.id] ?? '')}><Text style={s.white}>Approve item</Text></Pressable>
          <Pressable accessibilityRole="button" style={s.chip} onPress={() => onReview(request.id, 'return', notes[request.id] ?? '')}><Text style={s.customer}>Return for changes</Text></Pressable>
        </> : <>
          <Text style={s.body}>Reviewed by {request.reviewedBy}</Text>
          {!!request.reviewNote && <Text style={s.body}>Note: {request.reviewNote}</Text>}
        </>}
      </View>)}
    </View>
  </View>;
}

const s = StyleSheet.create({
  section: { gap: 18 },
  card: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 20, gap: 12, borderWidth: 1, borderColor: '#F3D7E4' },
  heading: { fontSize: 20, color: '#541B38', fontWeight: '700' },
  body: { color: '#744259', lineHeight: 22 },
  customer: { color: '#8F2658', fontWeight: '700' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { padding: 14, borderRadius: 12, backgroundColor: '#FCE4EF' },
  selected: { backgroundColor: '#B52F70' },
  button: { backgroundColor: '#B52F70', padding: 16, borderRadius: 12 },
  white: { color: '#FFFFFF', fontWeight: '600', textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#DCA5BF', padding: 14, borderRadius: 10, fontSize: 16, color: '#541B38', minHeight: 80, textAlignVertical: 'top' },
  request: { padding: 14, gap: 12, borderRadius: 12, borderWidth: 1, borderColor: '#F3D7E4' },
});
