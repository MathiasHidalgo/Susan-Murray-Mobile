import { Tabs } from 'expo-router/js-tabs';
import { useSession } from '../../../context/SessionContext';

export default function MainTabs() {
  const { profile } = useSession();
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: '#B52F70', tabBarInactiveTintColor: '#744259', tabBarIcon: () => null, tabBarIconStyle: { display: 'none' }, tabBarStyle: { backgroundColor: '#FFFFFF', borderTopColor: '#F3D7E4' }, tabBarLabelStyle: { fontSize: 12, fontWeight: '600' }, tabBarItemStyle: { paddingVertical: 12 } }}>
    <Tabs.Screen name="catalog" options={{ title: profile?.role === 'customer' ? 'Catalog' : 'Catalogs' }} />
    <Tabs.Screen name="orders" options={{ title: 'Orders' }} />
    <Tabs.Protected guard={profile?.role === 'customer'} redirectTo="/orders">
      <Tabs.Screen name="notifications" options={{ title: 'Notifications' }} />
    </Tabs.Protected>
    <Tabs.Screen name="account" options={{ title: 'Account' }} />
  </Tabs>;
}
