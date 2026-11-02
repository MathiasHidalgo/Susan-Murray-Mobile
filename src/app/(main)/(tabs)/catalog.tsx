import { Redirect } from 'expo-router';
import { Screen } from '../../../components/Screen';
import { LiveCatalog } from '../../../components/LiveCatalog';
import { useSession } from '../../../context/SessionContext';
export default function CatalogScreen() {
  const { profile } = useSession();
  if (!profile) return <Redirect href="/" />;
  return <Screen><LiveCatalog profile={profile} /></Screen>;
}
