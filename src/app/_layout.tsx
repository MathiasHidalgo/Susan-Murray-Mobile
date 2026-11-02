import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SessionProvider, useSession } from '../context/SessionContext';

function Navigation() {
  const { user, profile } = useSession();
  return <>
    <StatusBar style="dark" />
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Protected guard={Boolean(user && profile)} redirectTo="/">
        <Stack.Screen name="(main)" />
      </Stack.Protected>
      <Stack.Screen name="demo" />
    </Stack>
  </>;
}
export default function RootLayout() {
  return <SessionProvider><Navigation /></SessionProvider>;
}
