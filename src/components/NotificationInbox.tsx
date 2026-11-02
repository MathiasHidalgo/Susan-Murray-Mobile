import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { type InboxNotice, markNoticeRead, watchNotifications } from '../services/cloudNotifications';
import { cloudMessage } from '../services/cloudCatalog';

export function NotificationInbox({ customerId }: { customerId: string }) {
  const [notices, setNotices] = useState<InboxNotice[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState('');
  const [showRead, setShowRead] = useState(false);
  const [retry, setRetry] = useState(0);
  const inFlight = useRef(false);
  const unread = notices.filter(notice => !notice.read);
  const visible = showRead ? notices : unread;
  useEffect(() => watchNotifications(customerId, data => { setNotices(data); setLoaded(true); setError(''); }, failure => {
    setNotices([]); setLoaded(false); setError(cloudMessage(failure));
  }), [customerId, retry]);
  async function markRead(id: string) {
    if (inFlight.current) return;
    inFlight.current = true; setBusy(id); setActionError('');
    try { await markNoticeRead(id); }
    catch (failure) { setActionError(cloudMessage(failure)); }
    finally { inFlight.current = false; setBusy(''); }
  }
  return <View style={s.card}>
    <Text style={s.heading}>Notifications · {unread.length} unread</Text>
    <Text style={s.body}>Ready and pickup-completion notices are saved here. This inbox does not send phone alerts yet.</Text>
    <Pressable accessibilityRole="button" style={s.secondary} onPress={() => setShowRead(!showRead)}><Text style={s.body}>{showRead ? 'Show unread only' : 'Include read notices'}</Text></Pressable>
    {!!error && <>
      <Text accessibilityRole="alert" style={s.error}>{error}</Text>
      <Pressable accessibilityRole="button" style={s.secondary} onPress={() => { setError(''); setRetry(value => value + 1); }}><Text style={s.body}>Retry inbox</Text></Pressable>
    </>}
    {!loaded && !error && <ActivityIndicator accessibilityLabel="Loading notifications" color="#B52F70" />}
    {loaded && !visible.length && <Text style={s.body}>{showRead ? 'No order notices yet.' : 'You’re all caught up. No unread notices.'}</Text>}
    {!!actionError && <Text accessibilityRole="alert" style={s.error}>{actionError}</Text>}
    {visible.map(notice => <View key={notice.id} style={s.line}>
      <Text style={s.label}>{notice.type === 'order_picked_up' ? 'Your order was picked up' : 'Your order was marked ready for pickup'}</Text>
      <Text selectable style={s.body}>Order #{notice.orderId.split('__').at(-1)}</Text>
      {notice.type === 'order_picked_up' && <Text style={s.body}>Collected · Order complete</Text>}
      <Text style={s.body}>{notice.type === 'order_picked_up' ? 'Pickup confirmed' : 'Ready notice'} · {notice.createdAt ? new Date(notice.createdAt).toLocaleString() : ''}</Text>
      {notice.read ? <Text style={s.body}>Read</Text> : <Pressable disabled={!!busy} accessibilityRole="button" style={s.button} onPress={() => markRead(notice.id)}><Text style={s.white}>{busy === notice.id ? 'Saving…' : 'Mark as read'}</Text></Pressable>}
    </View>)}
  </View>;
}
const s = StyleSheet.create({
  card: { backgroundColor: '#FFFFFF', padding: 18, borderRadius: 18, gap: 12, borderWidth: 1, borderColor: '#F3D7E4' },
  heading: { color: '#541B38', fontSize: 21, fontWeight: '700' },
  body: { color: '#744259', lineHeight: 22 },
  label: { color: '#541B38', fontWeight: '700', fontSize: 16 },
  error: { color: '#A61F49', lineHeight: 22 },
  line: { padding: 14, gap: 10, borderRadius: 12, borderWidth: 1, borderColor: '#F3D7E4' },
  button: { backgroundColor: '#B52F70', padding: 14, borderRadius: 12 },
  secondary: { backgroundColor: '#FCE4EF', padding: 14, borderRadius: 12 },
  white: { color: '#FFFFFF', fontWeight: '600', textAlign: 'center' },
});
