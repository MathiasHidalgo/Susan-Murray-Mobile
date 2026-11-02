import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
export function Screen({ children }: { children: ReactNode }) {
  return <KeyboardAvoidingView style={s.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView style={s.screen} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">{children}</ScrollView>
  </KeyboardAvoidingView>;
}
const s = StyleSheet.create({ screen: { flex: 1, backgroundColor: '#FFF7FA' }, content: { padding: 16, paddingBottom: 32, gap: 18, width: '100%', maxWidth: 680, alignSelf: 'center' } });
