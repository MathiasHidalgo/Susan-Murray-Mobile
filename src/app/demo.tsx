import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import DemoApp from '../screens/DemoApp';
import { useSession } from '../context/SessionContext';
export default function DemoScreen() {
  const { user, profile } = useSession();
  return <View style={s.screen}>
    <Pressable accessibilityRole="button" style={s.bar} onPress={() => router.replace(user && profile ? '/account' : '/')}><Text style={s.body}>Demo preview · Back to {user && profile ? 'account' : 'sign-in'}</Text></Pressable>
    <DemoApp />
  </View>;
}
const s = StyleSheet.create({ screen: { flex: 1, backgroundColor: '#FFF7FA' }, bar: { paddingTop: 56, paddingBottom: 14, paddingHorizontal: 24, backgroundColor: '#FCE4EF' }, body: { color: '#744259' } });
