import { useHistoryClock } from '../hooks/useHistoryClock';
import { recentApproval } from '../data/requestHistory';
import { administrator } from '../data/people';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { CatalogItem, CustomerId } from '../data/catalog';
import { CatalogRequest, sameCatalogItem } from '../data/catalogRequests';

type Props = {
  catalog: CatalogItem[];
  customerId: CustomerId;
  customerName: string;
  requests: CatalogRequest[];
  onSubmit: (request: CatalogRequest) => void | Promise<void>;
  online?: boolean;
};

export function CatalogRequestForm({ catalog, customerId, customerName, requests, onSubmit, online = false }: Props) {
  const historyNow = useHistoryClock();
  const [showHistory, setShowHistory] = useState(false);
  const [showOlder, setShowOlder] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<CatalogItem['type']>('Tablecloth');
  const [fabric, setFabric] = useState('');
  const [color, setColor] = useState('');
  const [size, setSize] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const ownRequests = requests.filter(r => r.customerId === customerId);

  const activeRequests = ownRequests.filter(request => request.status !== 'approved');
  const completed = ownRequests.filter(request => request.status === 'approved');
  const history = completed.filter(request => showOlder || recentApproval(request, historyNow));

  async function submit() {
    if (submitting) return;
    setSuccess('');
    if (![name, fabric, color, size].every(value => value.trim().length > 0)) {
      setError('Please complete the item name, fabric / design, color, and size.');
      return;
    }
    const request: CatalogRequest = {
      // Generated only in the Submit button event, never during rendering.
      // eslint-disable-next-line react-hooks/purity
      id: editingId ?? `request-${customerId}-${Date.now()}`, customerId,
      name: name.trim(), type, fabric: fabric.trim(), color: color.trim(), size: size.trim(),
      status: 'pending', submittedAt: new Date().toISOString(),
    };
    const existing = catalog.find(i => sameCatalogItem(i, request));
    if (existing) {
      setError(`This combination is already in your catalog as “${existing.name}”. Select it from your catalog instead.`);
      return;
    }
    const pending = ownRequests.find(r => r.id !== editingId && r.status === 'pending' && sameCatalogItem(r, request));
    if (pending) {
      setError(`You already requested this combination as “${pending.name}”. It is pending approval.`);
      return;
    }
    setSubmitting(true);
    try { await onSubmit(request); }
    catch (error) { setError(error instanceof Error ? error.message : 'Could not save the request. Please try again.'); return; }
    finally { setSubmitting(false); }
    setName(''); setFabric(''); setColor(''); setSize(''); setType('Tablecloth');
    setError(''); setOpen(false); setEditingId(null);
    setSuccess(`“${request.name}” was submitted for admin review.`);
  }

  function editRequest(request: CatalogRequest) {
    setEditingId(request.id); setName(request.name); setType(request.type); setFabric(request.fabric); setColor(request.color); setSize(request.size); setError(''); setSuccess(''); setOpen(true);
  }

  return <View style={s.section}>
    <Text style={s.heading}>Need a new catalog item?</Text>
    <Pressable accessibilityRole="button" disabled={submitting} accessibilityState={{ expanded: open }} style={s.button} onPress={() => { setOpen(!open); setError(''); setSuccess(''); setEditingId(null); setName(''); setFabric(''); setColor(''); setSize(''); setType('Tablecloth'); }}>
      <Text style={s.white}>{open ? 'Cancel request' : 'Request a new item'}</Text>
    </Pressable>
    {open && <View style={s.section}>
      <Text style={s.body}>Request for {customerName}. {online ? 'Your administrator' : administrator.name} must approve new items before they can be ordered.</Text>
      <Text style={s.body}>Item name</Text>
      <TextInput accessibilityLabel="Requested item name" style={s.input} editable={!submitting} maxLength={80} placeholder="e.g. Ivory Satin Tablecloth" value={name} onChangeText={setName} />
      <Text style={s.body}>Type</Text>
      <View style={s.row}>{(['Tablecloth', 'Napkin'] as const).map(value => <Pressable key={value} accessibilityRole="button" disabled={submitting} accessibilityState={{ selected: type === value }} onPress={() => setType(value)} style={[s.chip, type === value && s.selected]}><Text style={type === value ? s.white : s.body}>{value}</Text></Pressable>)}</View>
      <Text style={s.body}>Fabric / design</Text>
      <TextInput accessibilityLabel="Requested fabric or design" style={s.input} editable={!submitting} maxLength={80} placeholder="e.g. Satin" value={fabric} onChangeText={setFabric} />
      <Text style={s.body}>Color</Text>
      <TextInput accessibilityLabel="Requested color" style={s.input} editable={!submitting} maxLength={40} placeholder="e.g. Ivory" value={color} onChangeText={setColor} />
      <Text style={s.body}>Size</Text>
      <TextInput accessibilityLabel="Requested size" style={s.input} editable={!submitting} maxLength={60} placeholder="e.g. 90 × 90 inches" value={size} onChangeText={setSize} />
      {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
      <Pressable accessibilityRole="button" disabled={submitting} style={s.button} onPress={() => { void submit(); }}><Text style={s.white}>{submitting ? 'Saving…' : 'Submit for approval'}</Text></Pressable>
    </View>}
    {!!success && <Text accessibilityLiveRegion="polite" style={s.body}>{success}</Text>}
    <Text style={s.heading}>Active catalog requests · {activeRequests.length}</Text>
    {activeRequests.length === 0 && <Text style={s.body}>No requests waiting for approval or changes.</Text>}
    {activeRequests.map(request => <RequestCard key={request.id} request={request} online={online} submitting={submitting} onEdit={() => editRequest(request)} />)}
    <Pressable accessibilityRole="button" accessibilityState={{ expanded: showHistory }} style={s.chip} onPress={() => setShowHistory(!showHistory)}><Text style={s.body}>{showHistory ? 'Hide' : 'View'} approval history · {completed.length}</Text></Pressable>
    {showHistory && <View style={s.section}>
      <Text style={s.heading}>{showOlder ? 'All approvals' : 'Approvals from the past 7 days'}</Text>
      <Text style={s.body}>Older approval cards are tucked away. Approved items stay in your catalog.</Text>
      <Pressable accessibilityRole="button" style={s.chip} onPress={() => setShowOlder(!showOlder)}><Text style={s.body}>{showOlder ? 'Show past 7 days only' : 'Include older approvals'}</Text></Pressable>
      {history.length === 0 && <Text style={s.body}>No approvals in this period.</Text>}
      {history.map(request => <RequestCard key={request.id} request={request} online={online} submitting={submitting} onEdit={() => editRequest(request)} />)}
    </View>}

  </View>;
}

function RequestCard({ request, online, submitting, onEdit }: { request: CatalogRequest; online: boolean; submitting: boolean; onEdit: () => void }) {
    return <View key={request.id} style={s.request}>
      <Text style={s.itemName}>{request.name}</Text>
      <Text style={s.body}>{request.type} · {request.fabric} · {request.color} · {request.size}</Text>
      <Text style={s.badge}>{request.status === 'pending' ? 'Pending approval' : request.status === 'approved' ? 'Approved' : 'Changes requested'}</Text>
      <Text style={s.body}>{request.status === 'approved' ? 'Available in your catalog for orders.' : 'Not available for orders until approved.'}</Text>
      {!!request.reviewNote && <Text style={s.body}>{online ? 'Administrator' : administrator.name}’s note: {request.reviewNote}</Text>}
      {request.status === 'returned' && <Pressable accessibilityRole="button" disabled={submitting} style={s.button} onPress={onEdit}><Text style={s.white}>Edit and resubmit</Text></Pressable>}
    </View>;
  }


const s = StyleSheet.create({
  section: { gap: 12 },
  heading: { fontSize: 20, color: '#541B38', fontWeight: '700' },
  body: { color: '#744259', lineHeight: 22 },
  input: { borderWidth: 1, borderColor: '#DCA5BF', padding: 14, borderRadius: 10, fontSize: 16, color: '#541B38' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { padding: 12, borderRadius: 12, backgroundColor: '#FCE4EF' },
  selected: { backgroundColor: '#B52F70' },
  button: { backgroundColor: '#B52F70', padding: 16, borderRadius: 12 },
  white: { color: '#FFFFFF', fontWeight: '600', textAlign: 'center' },
  error: { color: '#A61F49' },
  request: { padding: 14, gap: 8, borderRadius: 12, borderWidth: 1, borderColor: '#F3D7E4' },
  itemName: { fontSize: 16, fontWeight: '700', color: '#541B38' },
  badge: { color: '#8F2658', backgroundColor: '#FCE4EF', padding: 8, borderRadius: 8, alignSelf: 'flex-start', fontWeight: '600' },
});
