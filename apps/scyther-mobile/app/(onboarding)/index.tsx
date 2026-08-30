import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useUpdateDonorProfile } from '@/hooks/useDonorProfile';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const STEPS = [
  { id: 'profile', title: 'Your donor details.', subtitle: 'This becomes your identity card in the Scyther network.' },
  { id: 'permissions', title: 'Stay connected.', subtitle: 'Enable location and alerts to find donation centres near you.' },
  { id: 'done', title: "You're in.", subtitle: 'Your donor record is live on the Bloodchain network.' },
] as const;

export default function OnboardingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { mutateAsync: updateProfile, isPending } = useUpdateDonorProfile();

  const [step, setStep] = useState(0);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [district, setDistrict] = useState('');

  const submitProfile = async () => {
    try {
      await updateProfile({ first_name: firstName, last_name: lastName, blood_type: bloodType || null, district: district || null });
      setStep(1);
    } catch {
      setStep(1);
    }
  };

  const requestPermissions = async () => {
    try {
      await Location.requestForegroundPermissionsAsync();
      await updateProfile({ location_enabled: true });
    } catch {}
    setStep(2);
  };

  const skipPermissions = () => setStep(2);

  const finish = () => router.replace('/(tabs)');

  const current = STEPS[step];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <LinearGradient colors={['#1A0408', '#060912']} style={StyleSheet.absoluteFill} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.progress}>
          {STEPS.map((_, i) => (
            <View key={i} style={[styles.progressDot, { backgroundColor: i <= step ? colors.tint : colors.border }]} />
          ))}
        </View>

        <View style={styles.mark}><View style={styles.markDrop} /></View>
        <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>BLOODCHAIN · SCYTHER</Text>
        <Text style={[styles.title, { color: colors.text }]}>{current.title}</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{current.subtitle}</Text>

        {step === 0 && (
          <>
            <Text style={[styles.label, { color: colors.text }]}>FIRST NAME</Text>
            <TextInput
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Your first name"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
            />
            <Text style={[styles.label, { color: colors.text }]}>LAST NAME</Text>
            <TextInput
              value={lastName}
              onChangeText={setLastName}
              placeholder="Your last name"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
            />
            <Text style={[styles.label, { color: colors.text }]}>BLOOD TYPE</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              {BLOOD_TYPES.map((bt) => (
                <Pressable
                  key={bt}
                  onPress={() => setBloodType(bt)}
                  style={[styles.chip, bloodType === bt && styles.chipActive, { borderColor: bloodType === bt ? colors.tint : colors.border }]}
                >
                  <Text style={[styles.chipText, { color: bloodType === bt ? '#fff' : colors.mutedForeground }]}>{bt}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <Text style={[styles.label, { color: colors.text }]}>DISTRICT <Text style={{ color: colors.mutedForeground }}>(optional)</Text></Text>
            <TextInput
              value={district}
              onChangeText={setDistrict}
              placeholder="e.g. Gaborone"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
            />
            <Pressable onPress={submitProfile} disabled={!firstName || isPending} style={[styles.button, (!firstName || isPending) && styles.disabled]}>
              <Text style={styles.buttonText}>{isPending ? 'Saving…' : 'Continue'}</Text>
              <Feather name="arrow-right" size={18} color="#fff" />
            </Pressable>
          </>
        )}

        {step === 1 && (
          <>
            <View style={styles.permCard}>
              <Feather name="navigation" size={22} color="#67E8F9" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.permTitle, { color: colors.text }]}>Location for centres</Text>
                <Text style={[styles.permSub, { color: colors.mutedForeground }]}>Find the nearest donation centre and track open hours and directions.</Text>
              </View>
            </View>
            <Pressable onPress={requestPermissions} style={styles.button}>
              <Text style={styles.buttonText}>Enable & continue</Text>
              <Feather name="arrow-right" size={18} color="#fff" />
            </Pressable>
            <Pressable onPress={skipPermissions} style={styles.skip}>
              <Text style={[styles.skipText, { color: colors.mutedForeground }]}>Skip for now</Text>
            </Pressable>
          </>
        )}

        {step === 2 && (
          <>
            <View style={styles.successCard}>
              <Feather name="check-circle" size={26} color="#34D399" />
              <Text style={styles.successText}>Donor record created</Text>
            </View>
            <View style={[styles.successCard, { marginTop: 10, borderColor: '#1E3A5F', backgroundColor: '#060F1E' }]}>
              <Feather name="shield" size={22} color="#67E8F9" />
              <Text style={[styles.successText, { color: '#67E8F9' }]}>Verification pending · Level 1</Text>
            </View>
            <Pressable onPress={finish} style={[styles.button, { marginTop: 32 }]}>
              <Text style={styles.buttonText}>Enter Scyther</Text>
              <Feather name="arrow-right" size={18} color="#fff" />
            </Pressable>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 24 },
  progress: { flexDirection: 'row', gap: 6, marginBottom: 36 },
  progressDot: { flex: 1, height: 3, borderRadius: 2 },
  mark: { width: 26, height: 30, marginBottom: 20 },
  markDrop: { width: 18, height: 24, backgroundColor: '#DC2626', borderRadius: 12, transform: [{ rotate: '38deg' }] },
  eyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.7, marginBottom: 12 },
  title: { fontSize: 34, lineHeight: 38, fontWeight: '800', letterSpacing: -1.2 },
  subtitle: { fontSize: 14, lineHeight: 21, marginTop: 12, marginBottom: 28 },
  label: { fontSize: 10, letterSpacing: 1.1, fontWeight: '800', marginBottom: 8, marginTop: 16 },
  input: { height: 51, borderWidth: 1, borderRadius: 11, paddingHorizontal: 14, fontSize: 14 },
  chips: { gap: 8, paddingBottom: 4 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
  chipActive: { backgroundColor: '#B91C1C' },
  chipText: { fontSize: 12, fontWeight: '700' },
  button: { height: 54, borderRadius: 12, backgroundColor: '#DC2626', alignItems: 'center', justifyContent: 'center', marginTop: 28, flexDirection: 'row', gap: 9 },
  disabled: { opacity: 0.45 },
  buttonText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  skip: { marginTop: 16, alignItems: 'center' },
  skipText: { fontSize: 12 },
  permCard: { borderWidth: 1, borderRadius: 13, borderColor: '#075F4E', backgroundColor: '#06251F', padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 13 },
  permTitle: { fontSize: 13, fontWeight: '700', marginBottom: 5 },
  permSub: { fontSize: 12, lineHeight: 17 },
  successCard: { borderWidth: 1, borderRadius: 13, borderColor: '#075F4E', backgroundColor: '#06251F', padding: 16, flexDirection: 'row', alignItems: 'center', gap: 13 },
  successText: { color: '#A7F3D0', fontWeight: '700', fontSize: 14 },
});
