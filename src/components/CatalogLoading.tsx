import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useCatalog } from '../context/CatalogContext';
export function CatalogLoading() {
  const { error, reload } = useCatalog();
  return <View style={{ padding: 20, gap: 16 }}>
    {error ? <><Text accessibilityRole="alert" style={{ color: '#A61F49' }}>{error}</Text><Pressable accessibilityRole="button" onPress={reload} style={{ backgroundColor: '#FCE4EF', padding: 16, borderRadius: 12 }}><Text style={{ color: '#744259' }}>Retry connection</Text></Pressable></> : <ActivityIndicator accessibilityLabel="Loading catalog" color="#B52F70" />}
  </View>;
}
