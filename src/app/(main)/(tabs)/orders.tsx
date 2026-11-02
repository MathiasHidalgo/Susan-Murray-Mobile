import { Redirect } from 'expo-router';
import { Screen } from '../../../components/Screen';
import { OnlineOrders } from '../../../components/OnlineOrders';
import { CatalogLoading } from '../../../components/CatalogLoading';
import { useSession } from '../../../context/SessionContext';
import { useCatalog } from '../../../context/CatalogContext';
export default function OrdersScreen() {
  const { profile } = useSession();
  const { approved, loaded } = useCatalog();
  if (!profile) return <Redirect href="/" />;
  return <Screen>{loaded ? <OnlineOrders profile={profile} catalog={approved} mode="list" /> : <CatalogLoading />}</Screen>;
}
