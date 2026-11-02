import { Redirect } from 'expo-router';
import { Screen } from '../../../components/Screen';
import { NotificationInbox } from '../../../components/NotificationInbox';
import { useSession } from '../../../context/SessionContext';
export default function NotificationsScreen() {
  const { profile } = useSession();
  if (!profile) return <Redirect href="/" />;
  if (profile.role !== 'customer' || !profile.customerId) return <Redirect href="/orders" />;
  return <Screen><NotificationInbox customerId={profile.customerId} /></Screen>;
}
