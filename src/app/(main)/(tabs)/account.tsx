import { useState } from 'react';
import { Link, Redirect } from 'expo-router';
import { signOut } from 'firebase/auth';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../../components/Screen';
import { useSession } from '../../../context/SessionContext';
import { authMessage, getFirebaseAuth } from '../../../services/auth';
import { customers } from '../../../data/catalog';
export default function AccountScreen() {
  const { user, profile } = useSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [details, setDetails] = useState(false);
  async function logout() {
    if (busy) return;
    setBusy(true); setError('');
    try { await signOut(getFirebaseAuth()); }
    catch (failure) { setError(authMessage(failure)); }
    finally { setBusy(false); }
  }
  if (!user || !profile) return <Redirect href="/" />;
  return <Screen>
    <View style={s.card}>
      <Text style={s.heading}>My account</Text>
      <Text style={s.name}>{profile.name}</Text>
      <Text style={s.body}>{profile.role === 'admin' ? 'Administrator' : profile.role === 'staff' ? 'Staff' : 'Customer'}</Text>
      {profile.customerId && <Text style={s.body}>{customers.find(customer => customer.id === profile.customerId)?.name ?? profile.customerId}</Text>}
      <Text selectable style={s.body}>{user.email}</Text>
      {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
      <Pressable disabled={busy} accessibilityRole="button" style={s.button} onPress={logout}><Text style={s.white}>{busy ? 'Signing out…' : 'Sign out'}</Text></Pressable>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: details }} style={s.secondary} onPress={() => setDetails(!details)}><Text style={s.body}>{details ? 'Hide' : 'Show'} account details</Text></Pressable>
      {details && <><Text style={s.body}>Account ID</Text><Text selectable style={s.body}>{user.uid}</Text></>}
    </View>
    <View style={s.card}>
      <Text style={s.name}>Demo preview</Text>
      <Text style={s.body}>Try the sample workflow with temporary data, separately from your saved business records.</Text>
      <Link href="/demo" asChild><Pressable accessibilityRole="button" style={s.secondary}><Text style={s.body}>Open demo preview</Text></Pressable></Link>
    </View>
  </Screen>;
}
const s = StyleSheet.create({
  card: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 20, gap: 14, borderWidth: 1, borderColor: '#F3D7E4' },
  heading: { color: '#541B38', fontSize: 23, fontWeight: '700' },
  name: { color: '#541B38', fontSize: 18, fontWeight: '700' },
  body: { color: '#744259', lineHeight: 22 },
  error: { color: '#A61F49' },
  button: { backgroundColor: '#B52F70', padding: 16, borderRadius: 12 },
  secondary: { backgroundColor: '#FCE4EF', padding: 16, borderRadius: 12 },
  white: { color: '#FFFFFF', fontWeight: '600', textAlign: 'center' },
});
