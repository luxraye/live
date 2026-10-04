import { useSignUp } from '@clerk/expo';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

export default function SignUpScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signUp, errors, fetchStatus } = useSignUp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const isSubmitting = fetchStatus === 'fetching';
  const needsEmailVerification =
    signUp.status === 'missing_requirements' &&
    signUp.unverifiedFields.includes('email_address') &&
    signUp.missingFields.length === 0;

  const submit = async () => {
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    if (!password || password.length < 8) {
      setErrorMessage('Password must be at least 8 characters.');
      return;
    }

    setErrorMessage('');
    try {
      const result = await signUp.password({ emailAddress: cleanEmail, password });
      if (result.error) {
        setErrorMessage(result.error.message || 'Unable to register. Please check your details.');
        return;
      }
      await signUp.verifications.sendEmailCode();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Registration error. Please try again.');
    }
  };

  const verify = async () => {
    const cleanCode = code.trim();
    if (!cleanCode) {
      setErrorMessage('Please enter the 6-digit verification code.');
      return;
    }

    setErrorMessage('');
    try {
      const result = await signUp.verifications.verifyEmailCode({ code: cleanCode });
      if (result.error) {
        setErrorMessage(result.error.message || 'Verification code invalid.');
        return;
      }
      if (signUp.status === 'complete') {
        await signUp.finalize({
          navigate: ({ session }) => {
            if (session?.currentTask) return;
            router.replace('/onboarding' as never);
          },
        });
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Verification error. Please try again.');
    }
  };

  const resendCode = async () => {
    setErrorMessage('');
    try {
      await signUp.verifications.sendEmailCode();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to resend code.');
    }
  };

  const resetSignUp = () => {
    signUp.reset();
    setCode('');
    setErrorMessage('');
  };

  return (
    <View style={styles.root}>
      <Image
        source={require('../../assets/images/auth-hero-signup.jpg')}
        style={styles.hero}
        contentFit="cover"
        transition={400}
        pointerEvents="none"
      />
      <LinearGradient
        colors={['rgba(6,9,18,0.7)', 'rgba(6,9,18,0.92)', '#060912']}
        style={styles.gradient}
        locations={[0, 0.45, 0.95]}
        pointerEvents="none"
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        enabled={Platform.OS === 'ios'}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 32 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <View style={styles.brand}>
              <View style={styles.markDrop} />
              <View style={{ flex: 1 }}>
                <Text style={styles.wordmark}>SCYTHER</Text>
                <Text style={styles.subBrand}>BLOODCHAIN NETWORK</Text>
              </View>
              <View style={styles.ecoBadge}>
                <Text style={styles.ecoBadgeText}>bloodchain.life</Text>
              </View>
            </View>

            <View style={styles.formHeader}>
              <Text style={styles.eyebrow}>NEW DONOR PROFILE</Text>
              <Text style={styles.title}>
                {needsEmailVerification ? 'Verify your email.' : 'Own your donor record.'}
              </Text>
              <Text style={styles.sub}>
                {needsEmailVerification
                  ? `Enter the code we sent to ${email}.`
                  : "Create a secure account. You'll complete your donor details next."}
              </Text>
            </View>

            {needsEmailVerification ? (
              <>
                <Text style={styles.label}>VERIFICATION CODE</Text>
                <TextInput
                  value={code}
                  onChangeText={setCode}
                  onChange={(e: any) => {
                    const text = e.nativeEvent?.text ?? e.target?.value;
                    if (typeof text === 'string') setCode(text);
                  }}
                  keyboardType="number-pad"
                  placeholder="6-digit verification code"
                  placeholderTextColor="#64748B"
                  style={styles.input}
                />
                {(errorMessage || errors.fields.code?.message) ? (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>
                      {errorMessage || errors.fields.code?.message}
                    </Text>
                  </View>
                ) : null}
                <Pressable
                  disabled={isSubmitting}
                  onPress={verify}
                  style={({ pressed }) => [
                    styles.button,
                    isSubmitting && styles.buttonDisabled,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <Text style={styles.buttonText}>{isSubmitting ? 'Verifying…' : 'Verify email'}</Text>
                </Pressable>
                <Pressable disabled={isSubmitting} onPress={resendCode} style={{ marginTop: 14 }}>
                  <Text style={[styles.footerText, { color: '#38BDF8', textAlign: 'center' }]}>Send me a new code</Text>
                </Pressable>
                <Pressable disabled={isSubmitting} onPress={resetSignUp} style={{ marginTop: 10 }}>
                  <Text style={[styles.footerText, { textAlign: 'center' }]}>Use a different email</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={styles.label}>EMAIL ADDRESS</Text>
                <TextInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                  onChange={(e: any) => {
                    const text = e.nativeEvent?.text ?? e.target?.value;
                    if (typeof text === 'string') setEmail(text);
                  }}
                  placeholder="you@example.com"
                  placeholderTextColor="#64748B"
                  style={styles.input}
                />

                <Text style={styles.label}>PASSWORD</Text>
                <TextInput
                  secureTextEntry
                  autoCapitalize="none"
                  value={password}
                  onChangeText={setPassword}
                  onChange={(e: any) => {
                    const text = e.nativeEvent?.text ?? e.target?.value;
                    if (typeof text === 'string') setPassword(text);
                  }}
                  placeholder="At least 8 characters"
                  placeholderTextColor="#64748B"
                  style={styles.input}
                />

                {(errorMessage || errors.fields.emailAddress?.message || errors.fields.password?.message) ? (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>
                      {errorMessage || errors.fields.emailAddress?.message || errors.fields.password?.message}
                    </Text>
                  </View>
                ) : null}

                <Pressable
                  disabled={isSubmitting}
                  onPress={submit}
                  style={({ pressed }) => [
                    styles.button,
                    isSubmitting && styles.buttonDisabled,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <Text style={styles.buttonText}>{isSubmitting ? 'Creating account…' : 'Create account'}</Text>
                </Pressable>

                {isSubmitting && (
                  <Text style={[styles.footerText, { textAlign: 'center', marginTop: 14 }]}>
                    Contacting security server…
                  </Text>
                )}
              </>
            )}

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Already registered? </Text>
              <Link href={'/sign-in' as never} style={styles.footerLink}>
                Sign in
              </Link>
            </View>
            {!needsEmailVerification && <View nativeID="clerk-captcha" style={styles.captcha} />}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#060912' },
  flex: { flex: 1 },
  hero: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  gradient: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 8,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 24 },
  markDrop: { width: 20, height: 26, backgroundColor: '#DC2626', borderRadius: 10, transform: [{ rotate: '38deg' }] },
  wordmark: { color: '#F0F6FF', fontWeight: '800', letterSpacing: 3, fontSize: 13, lineHeight: 15 },
  subBrand: { color: '#8B9DB5', fontSize: 8, fontWeight: '700', letterSpacing: 2, marginTop: 2 },
  ecoBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: 'rgba(56, 189, 248, 0.1)', borderWidth: 1, borderColor: 'rgba(56, 189, 248, 0.3)' },
  ecoBadgeText: { color: '#38BDF8', fontSize: 10, fontWeight: '700' },
  formHeader: { marginBottom: 20 },
  eyebrow: { color: '#94A3B8', fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 6 },
  title: { color: '#F8FAFC', fontSize: 26, lineHeight: 30, fontWeight: '800', letterSpacing: -0.5 },
  sub: { color: '#94A3B8', fontSize: 13, lineHeight: 18, marginTop: 8 },
  label: { color: '#CBD5E1', fontSize: 10, letterSpacing: 1, fontWeight: '800', marginBottom: 6, marginTop: 14 },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#F8FAFC',
    backgroundColor: 'rgba(2, 6, 23, 0.8)',
  },
  errorBox: {
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(220, 38, 38, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.3)',
  },
  errorText: { color: '#FCA5A5', fontSize: 12, lineHeight: 16 },
  button: {
    height: 48,
    borderRadius: 10,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonPressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  buttonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: { color: '#94A3B8', fontSize: 12 },
  footerLink: { color: '#38BDF8', fontSize: 12, fontWeight: '700' },
  captcha: { height: 0, opacity: 0 },
});