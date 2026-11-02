import { useCatalog } from '../context/CatalogContext';
import { useHistoryClock } from '../hooks/useHistoryClock';
import { recentApproval } from '../data/requestHistory';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { BusinessProfile } from '../types/profile';
import { customers, type CustomerId } from '../data/catalog';
import { cloudMessage, reviewCloudRequest, submitCloudRequest } from '../services/cloudCatalog';
import { CatalogRequestForm } from './CatalogRequestForm';

export function LiveCatalog({ profile }: { profile: BusinessProfile }) {
  const historyNow = useHistoryClock();
  const { requests, approved, loaded, error, reload } = useCatalog();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState('');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');
  const [olderReviews, setOlderReviews] = useState(false);
  const [allReviews, setAllReviews] = useState(false);
  const reviewList = allReviews ? requests.filter(request => request.status !== 'approved' || olderReviews || recentApproval(request, historyNow)) : requests.filter(request => request.status === 'pending');
  const pending = requests.filter(r => r.status === 'pending');
  const customerName = customers.find(c => c.id === profile.customerId)?.name ?? profile.name;
  async function review(id: string, decision: 'approve' | 'return') {
    if (busy) return;
    setBusy(id); setMessage('');
    try { await reviewCloudRequest(id, decision, notes[id] ?? '', profile); setMessage(decision === 'approve' ? 'Item approved. It is now in the customer’s catalog.' : 'Request returned with your note.'); }
    catch (error) { setMessage(cloudMessage(error)); }
    finally { setBusy(''); }
  }
  return <View style={s.card}>
    <Text style={s.heading}>{profile.role === 'customer' ? `${customerName} · My catalog` : 'Customer catalogs'}</Text>
    <Text style={s.body}>Browse approved linen items{profile.role === 'admin' ? ' and review new requests below.' : '.'}</Text>
    {!!error && <>
      <Text accessibilityRole="alert" style={s.error}>{error}</Text>
      <Pressable accessibilityRole="button" style={s.secondary} onPress={reload}><Text style={s.body}>Retry connection</Text></Pressable>
    </>}
    {!loaded && !error && <ActivityIndicator accessibilityLabel="Loading online catalog" color="#B52F70" />}
    {loaded && <>
      <Text style={s.body}>{approved.length} approved items{profile.role !== 'customer' ? ` · ${pending.length} pending requests` : ''}</Text>
      <TextInput accessibilityLabel="Search online catalog" style={s.input} placeholder="Search approved items" value={search} onChangeText={setSearch} />
      {approved.length === 0 && <Text style={s.body}>{profile.role === 'customer' ? 'Your catalog starts empty. Request an item below for administrator approval.' : 'No approved catalog items yet.'}</Text>}
      {approved.filter(item => `${item.name} ${item.type} ${item.fabric} ${item.color} ${item.size}`.toLowerCase().includes(search.trim().toLowerCase())).map(item => <View key={item.id} style={s.line}>
        {profile.role !== 'customer' && <Text style={s.label}>{customers.find(c => c.id === item.customerId)?.name ?? item.customerId}</Text>}
        <Text style={s.label}>{item.name}</Text>
        <Text style={s.body}>{item.type} · {item.fabric} · {item.color} · {item.size}</Text>
      </View>)}
      {approved.length > 0 && !approved.some(item => `${item.name} ${item.type} ${item.fabric} ${item.color} ${item.size}`.toLowerCase().includes(search.trim().toLowerCase())) && <Text style={s.body}>No items match your search.</Text>}
      {profile.role === 'customer' && <CatalogRequestForm online catalog={approved} customerId={profile.customerId as CustomerId} customerName={customerName} requests={requests} onSubmit={async request => {
        try { await submitCloudRequest(request); } catch (error) { throw new Error(cloudMessage(error)); }
      }} />}
      {profile.role === 'admin' && <>
        <Text style={s.heading}>Review catalog requests</Text>
        <Pressable accessibilityRole="button" style={s.secondary} onPress={() => setAllReviews(!allReviews)}><Text style={s.body}>{allReviews ? 'Show pending only' : 'View request history'}</Text></Pressable>
        {allReviews && <>
          <Text style={s.body}>Pending requests and requests needing changes stay visible. Approval history shows the past 7 days.</Text>
          <Pressable accessibilityRole="button" style={s.secondary} onPress={() => setOlderReviews(!olderReviews)}><Text style={s.body}>{olderReviews ? 'Show recent approvals only' : 'Include older approvals'}</Text></Pressable>
        </>}
        {!!message && <Text accessibilityRole="alert" style={s.body}>{message}</Text>}
        {reviewList.length === 0 && <Text style={s.body}>No {allReviews ? '' : 'pending '}requests.</Text>}
        {reviewList.map(request => <View style={s.line} key={request.id}>
          <Text style={s.label}>{customers.find(c => c.id === request.customerId)?.name ?? request.customerId}</Text>
          <Text style={s.heading}>{request.name}</Text>
          <Text style={s.body}>{request.type} · {request.fabric} · {request.color} · {request.size}</Text>
          <Text style={s.body}>{request.status === 'pending' ? 'Pending approval' : request.status === 'approved' ? 'Approved' : 'Changes requested'}</Text>
          {request.status === 'pending' ? <>
            <TextInput accessibilityLabel={`Online review note for ${request.name}`} style={s.input} multiline maxLength={500} placeholder="Review note (required to return)" value={notes[request.id] ?? ''} editable={!busy} onChangeText={note => setNotes(current => ({ ...current, [request.id]: note }))} />
            <Pressable disabled={!!busy} accessibilityRole="button" style={s.button} onPress={() => review(request.id, 'approve')}><Text style={s.white}>{busy === request.id ? 'Saving…' : 'Approve item'}</Text></Pressable>
            <Pressable disabled={!!busy} accessibilityRole="button" style={s.secondary} onPress={() => review(request.id, 'return')}><Text style={s.body}>Return for changes</Text></Pressable>
          </> : <>
            <Text style={s.body}>Reviewed by {request.reviewedBy}</Text>
            {!!request.reviewNote && <Text style={s.body}>Note: {request.reviewNote}</Text>}
          </>}
        </View>)}
      </>}
    </>}
  </View>;
}
const s = StyleSheet.create({
  card: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 20, gap: 14, borderWidth: 1, borderColor: '#F3D7E4' },
  heading: { fontSize: 21, color: '#541B38', fontWeight: '700' },
  body: { color: '#744259', lineHeight: 22 },
  label: { color: '#541B38', fontWeight: '700' },
  error: { color: '#A61F49', lineHeight: 22 },
  line: { padding: 14, gap: 10, borderWidth: 1, borderColor: '#F3D7E4', borderRadius: 12 },
  input: { borderWidth: 1, borderColor: '#DCA5BF', padding: 14, borderRadius: 10, fontSize: 16, color: '#541B38' },
  button: { backgroundColor: '#B52F70', padding: 16, borderRadius: 12 },
  secondary: { backgroundColor: '#FCE4EF', padding: 16, borderRadius: 12 },
  white: { color: '#FFFFFF', fontWeight: '600', textAlign: 'center' },
});
