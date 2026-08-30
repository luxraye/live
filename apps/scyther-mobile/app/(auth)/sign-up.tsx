import { useSignUp } from '@clerk/expo';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
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
  const isSubmitting = fetchStatus === 'fetching';
  const needsEmailVerification =
    signUp.status === 'missing_requirements' &&
    signUp.unverifiedFields.includes('email_address') &&
    signUp.missingFields.length === 0;

  const submit = async () => {
    const result = await signUp.password({ emailAddress: email, password });
    if (result.error) return;
    await signUp.verifications.sendEmailCode();
  };

  const verify = async () => {
    const result = await signUp.verifications.verifyEmailCode({ code });
    if (result.error || signUp.status !== 'complete') return;
    await signUp.finalize({
      navigate: ({ session }) => {
        if (session?.currentTask) return;
        router.replace('/(onboarding)' as never);
      },
    });
  };

  const resendCode = async () => { await signUp.verifications.sendEmailCode(); };
  const resetSignUp = () => { signUp.reset(); setCode(''); };

  return (
    <View style={styles.root}>
      <Image
        source={require('../../assets/images/auth-hero-signup.jpg')}
        style={styles.hero}
        contentFit="cover"
        transition={400}
      />
      <LinearGradient
        colors={['transparent', 'rgba(6,9,18,0.82)', '#060912']}
        style={styles.gradient}
        locations={[0, 0.5, 1]}
      />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={[styles.formContainer, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 28 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.brand}>
            <View style={styles.markDrop} />
            <View>
              <Text style={styles.wordmark}>SCYTHER</Text>
              <Text style={styles.subBrand}>BLOODCHAIN NETWORK</Text>
            </View>
          </View>

          <View style={styles.spacer} />

          <View style={styles.form}>
            <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>NEW DONOR PROFILE</Text>
            <Text style={[styles.title, { color: colors.text }]}>
              {needsEmailVerification ? 'Verify your email.' : 'Own your donor record.'}
            </Text>
            <Text style={[styles.sub, { color: colors.mutedForeground }]}>
              {needsEmailVerification
                ? `Enter the code we sent to ${email}.`
                : "Create a secure account. You'll complete your donor details next."}
            </Text>

            {needsEmailVerification ? (
              <>
                <TextInput
                  value={code}
                  onChangeText={setCode}
                  keyboardType="number-pad"
                  placeholder="6-digit verification code"
                  placeholderTextColor={colors.mutedForeground}
                  style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: 'rgba(17,24,39,0.9)' }]}
                />
                {errors.fields.code && <Text style={styles.error}>{errors.fields.code.message}</Text>}
                <Pressable disabled={!code || isSubmitting} onPress={verify} style={[styles.button, (!code || isSubmitting) && styles.disabled]}>
                  <Text style={styles.buttonText}>{isSubmitting ? 'Verifying…' : 'Verify email'}</Text>
                </Pressable>
                <Pressable disabled={isSubmitting} onPress={resendCode}>
                  <Text style={[styles.footer, { color: colors.tint }]}>Send me a new code</Text>
                </Pressable>
                <Pressable disabled={isSubmitting} onPress={resetSignUp}>
                  <Text style={[styles.footer, { color: colors.mutedForeground, marginTop: 12 }]}>Use a different email</Text>
                </Pressable>
              </>
            ) : (
              <>
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
                {errors.fields.emailAddress && <Text style={styles.error}>{errors.fields.emailAddress.message}</Text>}
                <Text style={[styles.label, { color: colors.text }]}>PASSWORD</Text>
                <TextInput
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  placeholder="At least 8 characters"
                  placeholderTextColor={colors.mutedForeground}
                  style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: 'rgba(17,24,39,0.9)' }]}
                />
                {errors.fields.password && <Text style={styles.error}>{errors.fields.password.message}</Text>}
                <Pressable disabled={!email || !password || isSubmitting} onPress={submit} style={[styles.button, (!email || !password || isSubmitting) && styles.disabled]}>
                  <Text style={styles.buttonText}>{isSubmitting ? 'Creating account…' : 'Create account'}</Text>
                </Pressable>
                {isSubmitting && (
                  <>
                    <Text style={[styles.securityNotice, { color: colors.mutedForeground }]}>Complete the security check below to continue.</Text>
                    <Pressable onPress={resetSignUp}>
                      <Text style={[styles.footer, { color: colors.tint, marginTop: 12 }]}>Cancel and try again</Text>
                    </Pressable>
                  </>
                )}
              </>
            )}

            <Text style={[styles.footer, { color: colors.mutedForeground }]}>
              Already registered?{' '}
              <Link href={'/sign-in' as never} style={{ color: colors.tint }}>Sign in</Link>
            </Text>
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
  title: { fontSize: 31, lineHeight: 35, fontWeight: '800', letterSpacing: -1 },
  sub: { fontSize: 13, lineHeight: 19, marginTop: 12, marginBottom: 24 },
  label: { fontSize: 10, letterSpacing: 1.1, fontWeight: '800', marginBottom: 8, marginTop: 16 },
  input: { height: 51, borderWidth: 1, borderRadius: 11, paddingHorizontal: 14, fontSize: 14 },
  button: { height: 52, borderRadius: 11, backgroundColor: '#DC2626', alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  disabled: { opacity: 0.45 },
  buttonText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  footer: { textAlign: 'center', fontSize: 12, marginTop: 24 },
  error: { color: '#FCA5A5', fontSize: 11, marginTop: 8 },
  securityNotice: { textAlign: 'center', fontSize: 12, lineHeight: 18, marginTop: 18 },
  captcha: { minHeight: 1 },
});