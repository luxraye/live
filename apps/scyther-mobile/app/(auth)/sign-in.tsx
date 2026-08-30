import { useSignIn } from '@clerk/expo';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

export default function SignInScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signIn, errors, fetchStatus } = useSignIn();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const submit = async () => {
    const result = await signIn.password({ emailAddress: email, password });
    if (result.error) return;
    if (signIn.status === 'complete') {
      await signIn.finalize({ navigate: () => router.replace('/(tabs)') });
    }
  };

  return (
    <View style={styles.root}>
      {/* Hero background image */}
      <Image
        source={require('../../assets/images/auth-hero-signin.jpg')}
        style={styles.hero}
        contentFit="cover"
        transition={400}
      />
      {/* Dark gradient overlay */}
      <LinearGradient
        colors={['transparent', 'rgba(6,9,18,0.85)', '#060912']}
        style={styles.gradient}
        locations={[0, 0.55, 1]}
      />

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={[styles.formContainer, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 28 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header branding */}
          <View style={styles.brand}>
            <View style={styles.markDrop} />
            <View>
              <Text style={styles.wordmark}>SCYTHER</Text>
              <Text style={styles.subBrand}>BLOODCHAIN NETWORK</Text>
            </View>
          </View>

          <View style={styles.spacer} />

          {/* Form */}
          <View style={styles.form}>
            <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>WELCOME BACK</Text>
            <Text style={[styles.title, { color: colors.text }]}>Sign in to your{"\n"}donor record.</Text>
            <Text style={[styles.sub, { color: colors.mutedForeground }]}>Your identity, history, and community network in one place.</Text>

            <Text style={[styles.label, { color: colors.text }]}>EMAIL ADDRESS</Text>
            <TextInput
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: 'rgba(17,24,39,0.9)' }]}
            />
            <Text style={[styles.label, { color: colors.text }]}>PASSWORD</Text>
            <TextInput
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              placeholder="Your password"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: 'rgba(17,24,39,0.9)' }]}
            />
            {errors.fields.identifier && <Text style={styles.error}>{errors.fields.identifier.message}</Text>}

            <Pressable
              disabled={!email || !password || fetchStatus === 'fetching'}
              onPress={submit}
              style={[styles.button, (!email || !password) && styles.disabled]}
            >
              <Text style={styles.buttonText}>{fetchStatus === 'fetching' ? 'Signing in…' : 'Sign in'}</Text>
            </Pressable>

            <Text style={[styles.footer, { color: colors.mutedForeground }]}>
              New to Scyther?{' '}
              <Link href={'/sign-up' as never} style={{ color: colors.tint }}>Create a donor profile</Link>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#060912' },
  flex: { flex: 1 },
  hero: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 },
  gradient: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1 },
  formContainer: { flexGrow: 1, zIndex: 2, paddingHorizontal: 24 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  markDrop: { width: 22, height: 28, backgroundColor: '#DC2626', borderRadius: 12, transform: [{ rotate: '38deg' }] },
  wordmark: { color: '#F0F6FF', fontWeight: '800', letterSpacing: 3, fontSize: 14, lineHeight: 16 },
  subBrand: { color: '#8B9DB5', fontSize: 8, fontWeight: '700', letterSpacing: 2, marginTop: 3 },
  spacer: { flex: 1, minHeight: 120 },
  form: { gap: 0 },
  eyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.7, marginBottom: 9 },
  title: { fontSize: 31, lineHeight: 34, fontWeight: '800', letterSpacing: -1 },
  sub: { fontSize: 13, lineHeight: 19, marginTop: 12, marginBottom: 24 },
  label: { fontSize: 10, letterSpacing: 1.1, fontWeight: '800', marginBottom: 8, marginTop: 16 },
  input: { height: 51, borderWidth: 1, borderRadius: 11, paddingHorizontal: 14, fontSize: 14 },
  button: { height: 52, borderRadius: 11, backgroundColor: '#DC2626', alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  disabled: { opacity: 0.45 },
  buttonText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  footer: { textAlign: 'center', fontSize: 12, marginTop: 24 },
  error: { color: '#FCA5A5', fontSize: 11, marginTop: 8 },
});