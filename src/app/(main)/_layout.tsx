import { Redirect, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useSession } from '../../context/SessionContext';
import { CatalogProvider } from '../../context/CatalogContext';

export default function SignedInLayout() {
  const { user, profile } = useSession();
  if (!user || !profile) return <Redirect href="/" />;
  return <CatalogProvider key={`${user.uid}-${profile.role}-${profile.customerId ?? ''}`} profile={profile}>
    <Stack screenOptions={{ headerStyle: { backgroundColor: '#FFFFFF' }, headerTintColor: '#B52F70', headerBackButtonDisplayMode: 'minimal', headerTitle: () => <View><Text style={s.name}>Susan Murray</Text><Text style={s.tagline}>linen, tools and services</Text></View> }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Protected guard={profile.role === 'customer'} redirectTo="/orders">
        <Stack.Screen name="new-order" />
      </Stack.Protected>
    </Stack>
  </CatalogProvider>;
}
const s = StyleSheet.create({ name: { color: '#541B38', fontSize: 19, fontWeight: '800' }, tagline: { color: '#744259', fontSize: 11 } });
