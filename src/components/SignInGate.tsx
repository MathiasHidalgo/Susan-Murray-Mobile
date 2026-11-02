import { Link, Redirect } from 'expo-router';
import { useSession } from '../context/SessionContext';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { sendPasswordResetEmail, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirebaseAuth, authMessage } from '../services/auth';

export function SignInGate() {
  const { user, profile, initializing, profileStatus } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function login() {
    if (busy) return;
    if (!email.trim() || !password) { setMessage('Enter your email and password.'); return; }
    setBusy(true); setMessage('');
    try { await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password); setPassword(''); }
    catch (error) { setMessage(authMessage(error)); setPassword(''); }
    finally { setBusy(false); }
  }
  async function resetPassword() {
    if (busy) return;
    if (!email.trim()) { setMessage('Enter your email address first.'); return; }
    setBusy(true); setMessage('');
    try {
      await sendPasswordResetEmail(getFirebaseAuth(), email.trim());
      setMessage('If an account exists for this email, you will receive password reset instructions.');
    } catch (error) { setMessage(authMessage(error)); }
    finally { setBusy(false); }
  }
  async function logout() {
    if (busy) return;
    setBusy(true); setMessage('');
    try { await signOut(getFirebaseAuth()); }
    catch (error) { setMessage(authMessage(error)); }
    finally { setBusy(false); }
  }
  if (user && profile) return <Redirect href={profile.role === 'customer' ? '/catalog' : '/orders'} />;
  return <KeyboardAvoidingView style={s.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <Text style={s.title}>Susan Murray</Text>
      <Text style={s.body}>linen, tools and services</Text>
      <View style={s.card}>
        <Text style={s.heading}>{user ? 'Account signed in' : 'Welcome back'}</Text>
        {initializing ? <ActivityIndicator accessibilityLabel="Checking sign-in" color="#B52F70" /> : user ? <>
          <Text selectable style={s.body}>{user.email}</Text>
          {profile && <Text style={s.heading}>{profile.name} · {profile.role === 'staff' ? 'Staff' : profile.role === 'admin' ? 'Administrator' : 'Customer'}</Text>}
          <Text accessibilityLiveRegion="polite" style={s.body}>{profileStatus}</Text>
          <Text style={s.body}>Account ID (for setup)</Text>
          <Text selectable style={s.identifier}>{user.uid}</Text>
          <Pressable disabled={busy} accessibilityRole="button" style={s.button} onPress={logout}><Text style={s.white}>Sign out</Text></Pressable>
        </> : <>
          <Text style={s.body}>Sign in with the account created for you.</Text>
          <Text style={s.body}>Email</Text>
          <TextInput accessibilityLabel="Sign-in email" style={s.input} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" autoComplete="email" textContentType="emailAddress" value={email} onChangeText={setEmail} editable={!busy} />
          <Text style={s.body}>Password</Text>
          <TextInput accessibilityLabel="Sign-in password" style={s.input} secureTextEntry autoCapitalize="none" autoCorrect={false} autoComplete="current-password" textContentType="password" value={password} onChangeText={setPassword} editable={!busy} onSubmitEditing={login} />
          <Pressable disabled={busy} accessibilityRole="button" accessibilityState={{ disabled: busy }} style={[s.button, busy && s.dim]} onPress={login}><Text style={s.white}>{busy ? 'Please wait…' : 'Sign in'}</Text></Pressable>
          <Pressable disabled={busy} accessibilityRole="button" style={s.secondary} onPress={resetPassword}><Text style={s.body}>Forgot password?</Text></Pressable>
        </>}
        {!!message && <Text accessibilityRole="alert" style={s.body}>{message}</Text>}
      </View>
      <Link href="/demo" asChild><Pressable disabled={busy} accessibilityRole="button" style={s.secondary} onPress={() => setPassword('')}><Text style={s.body}>Open demo preview</Text></Pressable></Link>
      <Text style={s.body}>Demo preview uses temporary data. Real accounts do not grant access to another customer’s data or admin permissions.</Text>
    </ScrollView>
  </KeyboardAvoidingView>;
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFF7FA' },
  content: { padding: 24, paddingTop: 64, paddingBottom: 48, gap: 18, maxWidth: 640, width: '100%', alignSelf: 'center' },
  title: { fontSize: 40, fontWeight: '800', color: '#541B38' },
  heading: { fontSize: 22, color: '#541B38', fontWeight: '700' },
  body: { color: '#744259', lineHeight: 22 },
  card: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 20, gap: 12, borderWidth: 1, borderColor: '#F3D7E4' },
  input: { borderWidth: 1, borderColor: '#DCA5BF', padding: 14, borderRadius: 10, fontSize: 16, color: '#541B38' },
  button: { backgroundColor: '#B52F70', padding: 16, borderRadius: 12 },
  secondary: { backgroundColor: '#FCE4EF', padding: 16, borderRadius: 12 },
  white: { color: '#FFFFFF', fontWeight: '600', textAlign: 'center' },
  identifier: { color: '#541B38', fontSize: 13 },
  dim: { opacity: 0.6 },
  demoBar: { paddingHorizontal: 24, paddingTop: 54, paddingBottom: 12, backgroundColor: '#FCE4EF' },
});
