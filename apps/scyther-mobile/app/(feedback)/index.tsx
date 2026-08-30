import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useApi } from '@/hooks/useApi';
import { useAnalytics } from '@/hooks/useAnalytics';

const QUESTIONS = [
  {
    id: 'expectation',
    text: 'Is this what you would expect from a mobile app for blood donations?',
    type: 'rating' as const,
  },
  {
    id: 'usefulness',
    text: 'How useful is the donor identity card feature?',
    type: 'rating' as const,
  },
  {
    id: 'map_value',
    text: 'How valuable is the nearby centres map to you?',
    type: 'rating' as const,
  },
  {
    id: 'requests_clarity',
    text: 'Are the blood donation requests clear and easy to act on?',
    type: 'rating' as const,
  },
  {
    id: 'open_feedback',
    text: 'What would you change or add to this app?',
    type: 'text' as const,
  },
];

export default function FeedbackScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { apiFetch } = useApi();
  const { capture } = useAnalytics();
  const [responses, setResponses] = useState<Record<string, unknown>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const setRating = (qId: string, value: number) =>
    setResponses((prev) => ({ ...prev, [qId]: value }));

  const setTextResponse = (qId: string, value: string) =>
    setResponses((prev) => ({ ...prev, [qId]: value }));

  const submit = async () => {
    setSubmitting(true);
    try {
      await apiFetch('/feedback', {
        method: 'POST',
        body: JSON.stringify({ responses, platform: 'mobile', appVersion: '1.0.0' }),
      });
      capture('feedback_submitted', { questionCount: QUESTIONS.length });
      setSubmitted(true);
    } catch {
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top + 20, paddingBottom: insets.bottom + 24 }]}>
        <Pressable onPress={() => router.back()} style={[styles.back, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <Feather name="x" size={19} color={colors.text} />
        </Pressable>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}><Feather name="check-circle" size={32} color="#34D399" /></View>
          <Text style={[styles.successTitle, { color: colors.text }]}>Thank you.</Text>
          <Text style={[styles.successSub, { color: colors.mutedForeground }]}>Your feedback helps us build a better platform for every donor in the network.</Text>
          <Pressable onPress={() => router.back()} style={styles.button}>
            <Text style={styles.buttonText}>Back to app</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const answeredCount = Object.keys(responses).length;
  const canSubmit = answeredCount >= QUESTIONS.length - 1;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topRow}>
          <View>
            <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>USER TESTING · BLOODCHAIN</Text>
            <Text style={[styles.title, { color: colors.text }]}>Quick feedback.</Text>
          </View>
          <Pressable onPress={() => router.back()} style={[styles.back, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <Feather name="x" size={19} color={colors.text} />
          </Pressable>
        </View>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>5 questions · takes about a minute. No personal data collected.</Text>

        {QUESTIONS.map((q, i) => (
          <View key={q.id} style={[styles.qCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.qNum, { color: colors.mutedForeground }]}>Q{i + 1} OF {QUESTIONS.length}</Text>
            <Text style={[styles.qText, { color: colors.text }]}>{q.text}</Text>
            {q.type === 'rating' ? (
              <View style={styles.ratingRow}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <Pressable
                    key={n}
                    onPress={() => setRating(q.id, n)}
                    style={[styles.ratingBtn, responses[q.id] === n && styles.ratingActive, { borderColor: responses[q.id] === n ? colors.tint : colors.border }]}
                  >
                    <Text style={[styles.ratingText, { color: responses[q.id] === n ? '#fff' : colors.mutedForeground }]}>{n}</Text>
                  </Pressable>
                ))}
              </View>
            ) : (
              <TextInput
                multiline
                numberOfLines={3}
                value={(responses[q.id] as string) ?? ''}
                onChangeText={(v) => setTextResponse(q.id, v)}
                placeholder="Type your answer here (optional)"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.textArea, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
              />
            )}
          </View>
        ))}

        <Pressable
          onPress={submit}
          disabled={!canSubmit || submitting}
          style={[styles.button, (!canSubmit || submitting) && styles.disabled]}
        >
          <Text style={styles.buttonText}>{submitting ? 'Submitting…' : 'Submit feedback'}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 14 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  back: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { fontSize: 9, fontWeight: '800', letterSpacing: 1.5, marginBottom: 6 },
  title: { fontSize: 26, fontWeight: '800', letterSpacing: -0.8 },
  sub: { fontSize: 12, lineHeight: 18 },
  qCard: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 12 },
  qNum: { fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  qText: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
  ratingRow: { flexDirection: 'row', gap: 8 },
  ratingBtn: { flex: 1, height: 44, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  ratingActive: { backgroundColor: '#B91C1C' },
  ratingText: { fontSize: 15, fontWeight: '800' },
  textArea: { minHeight: 80, borderWidth: 1, borderRadius: 11, padding: 12, fontSize: 13, textAlignVertical: 'top' },
  button: { height: 54, borderRadius: 12, backgroundColor: '#DC2626', alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  disabled: { opacity: 0.45 },
  buttonText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  successContainer: { flex: 1, justifyContent: 'center', paddingHorizontal: 32, gap: 16 },
  successIcon: { width: 72, height: 72, borderRadius: 22, backgroundColor: '#06251F', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  successTitle: { fontSize: 36, fontWeight: '800', letterSpacing: -1.2 },
  successSub: { fontSize: 15, lineHeight: 22 },
});
