import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@clerk/expo';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

export default function VerificationScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getToken } = useAuth();
  const [status, setStatus] = useState<'idle' | 'uploading' | 'submitted'>('idle');

  const chooseDocument = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo access in Settings to choose a verification document.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (result.canceled) return;
    const asset = result.assets[0];
    setStatus('uploading');
    try {
      const token = await getToken();
      const base = `${process.env.EXPO_PUBLIC_API_BASE_URL ?? ''}/api`;
      const urlResponse = await fetch(`${base}/storage/uploads/request-url`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: asset.fileName ?? 'verification-document.jpg', size: asset.fileSize ?? 1, contentType: asset.mimeType ?? 'image/jpeg' }),
      });
      if (!urlResponse.ok) throw new Error('Unable to prepare upload');
      const { uploadURL, objectPath } = await urlResponse.json();
      const upload = await fetch(uploadURL, { method: 'PUT', headers: { 'Content-Type': asset.mimeType ?? 'image/jpeg' }, body: await (await fetch(asset.uri)).blob() });
      if (!upload.ok) throw new Error('Upload did not complete');
      const record = await fetch(`${base}/documents`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ objectPath, documentType: 'identity_document' }),
      });
      if (!record.ok) throw new Error('Unable to submit document');
      setStatus('submitted');
    } catch {
      setStatus('idle');
      Alert.alert('Upload could not finish', 'Check your connection and try again. Your document was not submitted.');
    }
  };

  return <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top + 14 }]}>
    <Pressable onPress={() => router.back()} style={[styles.back, { borderColor: colors.border, backgroundColor: colors.card }]}><Feather name="arrow-left" size={19} color={colors.text} /></Pressable>
    <View style={styles.content}>
      <View style={styles.icon}><Feather name="shield" size={29} color="#67E8F9" /></View>
      <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>DONOR VERIFICATION</Text>
      <Text style={[styles.title, { color: colors.text }]}>{status === 'submitted' ? 'Document received.' : 'Verify your donor record.'}</Text>
      <Text style={[styles.copy, { color: colors.mutedForeground }]}>{status === 'submitted' ? 'Your document is held privately and is awaiting review by an authorised verification centre.' : 'Choose a clear photo of your national ID, passport, or donor card. It will remain private and can only be reviewed by authorised verification staff.'}</Text>
      {status === 'submitted' ? <View style={styles.success}><Feather name="check-circle" size={19} color="#6EE7B7" /><Text style={styles.successText}>Submitted for review</Text></View> : <Pressable onPress={chooseDocument} disabled={status === 'uploading'} style={[styles.button, status === 'uploading' && styles.disabled]}><Feather name="upload" size={18} color="#fff" /><Text style={styles.buttonText}>{status === 'uploading' ? 'Encrypting & uploading…' : 'Choose document'}</Text></Pressable>}
      <Text style={[styles.note, { color: colors.mutedForeground }]}>Scyther never makes verification documents public.</Text>
    </View>
  </View>;
}
const styles = StyleSheet.create({ root: { flex: 1, paddingHorizontal: 20 }, back: { width: 42, height: 42, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, content: { flex: 1, justifyContent: 'center', paddingBottom: 80 }, icon: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0A2B35', marginBottom: 25 }, eyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 9 }, title: { fontSize: 31, lineHeight: 35, fontWeight: '800', letterSpacing: -1 }, copy: { fontSize: 14, lineHeight: 21, marginTop: 14 }, button: { backgroundColor: '#DC2626', height: 54, borderRadius: 12, marginTop: 30, flexDirection: 'row', gap: 9, alignItems: 'center', justifyContent: 'center' }, disabled: { opacity: 0.55 }, buttonText: { color: '#fff', fontWeight: '800', fontSize: 14 }, note: { fontSize: 11, textAlign: 'center', marginTop: 17, lineHeight: 16 }, success: { backgroundColor: '#06251F', borderWidth: 1, borderColor: '#075F4E', borderRadius: 12, padding: 17, marginTop: 30, flexDirection: 'row', gap: 10, alignItems: 'center' }, successText: { color: '#A7F3D0', fontWeight: '700', fontSize: 13 } });