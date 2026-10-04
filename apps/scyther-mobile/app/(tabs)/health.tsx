import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useArticles } from '@/hooks/useArticles';

export default function HealthScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [selectedTopic, setSelectedTopic] = useState<string | undefined>(undefined);
  const [activeArticle, setActiveArticle] = useState<any | null>(null);

  const { data: liveArticles } = useArticles(selectedTopic);
  const articlesList = liveArticles ?? [];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 14, paddingBottom: 100 }}>
        <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>KNOW YOUR IMPACT</Text>
        <Text style={[styles.title, { color: colors.text }]}>Health hub</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Clear, practical guidance to help you donate safely and confidently.
        </Text>

        <Pressable
          style={styles.feature}
          onPress={() => setActiveArticle({
            id: 99,
            title: 'What universal & rare donors should know',
            read_time_minutes: 6,
            body_markdown: 'Universal red blood cell donors (O-negative) and universal plasma donors (AB-positive) play a pivotal role in trauma emergencies and newborn care. In Botswana, maintaining a minimum 5-day national reserve buffer guarantees hospital readiness during sudden surgical surges or road traffic trauma cases.',
          })}
        >
          <LinearGradient colors={['#3B111C', '#1F1532']} style={StyleSheet.absoluteFill} />
          <View style={styles.featureArt}>
            <Feather name="heart" size={33} color="#FCA5A5" />
          </View>
          <Text style={styles.featureTag}>FEATURED · BLOOD TYPE</Text>
          <Text style={styles.featureTitle}>What universal & rare donors should know</Text>
          <Text style={styles.featureMeta}>6 min read · Updated this week</Text>
        </Pressable>

        <Text style={[styles.section, { color: colors.text }]}>EXPLORE TOPICS</Text>
        <View style={styles.topicRow}>
          {[
            { icon: 'heart', label: 'Blood type', topic: 'blood_type' },
            { icon: 'activity', label: 'Donation prep', topic: 'preparation' },
            { icon: 'shield', label: 'Safety & recovery', topic: 'safety' },
          ].map(({ icon, label, topic }) => {
            const isSelected = selectedTopic === topic;
            return (
              <Pressable
                key={label}
                onPress={() => setSelectedTopic(isSelected ? undefined : topic)}
                style={[
                  styles.topic,
                  { backgroundColor: isSelected ? '#0A2B35' : colors.card, borderColor: isSelected ? '#06B6D4' : colors.border },
                ]}
              >
                <Feather name={icon as 'heart'} size={18} color="#06B6D4" />
                <Text style={[styles.topicText, { color: colors.text }]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.section, { color: colors.text }]}>
          {selectedTopic ? `FILTERED GUIDES (${selectedTopic.toUpperCase()})` : 'LATEST GUIDES'}
        </Text>
        {articlesList.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="book-open" size={26} color="#06B6D4" style={{ alignSelf: 'center', marginBottom: 10 }} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Health Articles Published</Text>
            <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
              Once clinical bulletins and donor education articles are published by health authorities, they will show up here.
            </Text>
          </View>
        ) : (
          articlesList.map((article) => (
            <Pressable
              key={article.id}
              onPress={() => setActiveArticle(article)}
              style={[styles.article, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={styles.articleIcon}>
                <Feather name={(article.icon_name || 'heart') as 'heart'} size={18} color="#EF4444" />
              </View>
              <View style={styles.articleCopy}>
                <Text style={[styles.articleTitle, { color: colors.text }]}>{article.title}</Text>
                <Text style={[styles.articleMeta, { color: colors.mutedForeground }]}>
                  {article.read_time_minutes} MIN READ · HEALTH HUB
                </Text>
              </View>
              <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
            </Pressable>
          ))
        )}
      </ScrollView>

      {/* Article Detail Reader Modal */}
      {activeArticle && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end', zIndex: 999 }]}>
          <View style={[styles.modalSheet, { backgroundColor: colors.card, borderColor: colors.border, paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalEyebrow, { color: '#06B6D4' }]}>{activeArticle.read_time_minutes || 5} MIN GUIDE</Text>
              <Pressable onPress={() => setActiveArticle(null)} style={styles.modalClose}>
                <Feather name="x" size={20} color={colors.text} />
              </Pressable>
            </View>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{activeArticle.title}</Text>
            <ScrollView style={{ maxHeight: 320, marginTop: 14 }}>
              <Text style={[styles.modalBody, { color: colors.text }]}>
                {activeArticle.body_markdown ||
                  'Staying hydrated by drinking 500ml of water before donation, eating an iron-rich meal, and getting a good night of rest helps ensure a comfortable and energizing donation session. Following donation, taking 10-15 minutes to enjoy fruit juice and light snacks promotes rapid blood volume replenishment.'}
              </Text>
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  eyebrow: { marginHorizontal: 16, fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 7 },
  title: { marginHorizontal: 16, fontSize: 28, fontWeight: '800', letterSpacing: -1 },
  subtitle: { marginHorizontal: 16, marginTop: 12, fontSize: 13, lineHeight: 19 },
  feature: { height: 218, margin: 16, borderRadius: 16, overflow: 'hidden', padding: 18, justifyContent: 'flex-end', borderWidth: 1, borderColor: '#55213A' },
  featureArt: { position: 'absolute', right: 24, top: 30, width: 78, height: 78, borderRadius: 50, backgroundColor: '#61243A', alignItems: 'center', justifyContent: 'center' },
  featureTag: { color: '#FCA5A5', fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  featureTitle: { color: '#F0F6FF', fontSize: 22, lineHeight: 27, fontWeight: '800', letterSpacing: -0.6, maxWidth: 260, marginTop: 8 },
  featureMeta: { color: '#C0AABD', fontSize: 11, marginTop: 9 },
  section: { marginHorizontal: 16, fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 10, marginTop: 7 },
  topicRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 20 },
  topic: { flex: 1, minHeight: 83, padding: 11, borderRadius: 11, borderWidth: 1, justifyContent: 'space-between' },
  topicText: { fontSize: 11, fontWeight: '600', lineHeight: 14 },
  article: { marginHorizontal: 16, marginBottom: 9, padding: 12, borderRadius: 12, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 11 },
  articleIcon: { width: 37, height: 37, borderRadius: 10, backgroundColor: '#2D0808', alignItems: 'center', justifyContent: 'center' },
  articleCopy: { flex: 1 },
  articleTitle: { fontSize: 13, fontWeight: '700' },
  articleMeta: { fontSize: 9, letterSpacing: 0.5, marginTop: 6 },
  modalSheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: 1, paddingHorizontal: 20, paddingTop: 18 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalEyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  modalClose: { padding: 4 },
  modalTitle: { fontSize: 18, fontWeight: '800', marginTop: 10, letterSpacing: -0.4 },
  modalBody: { fontSize: 13, lineHeight: 21, opacity: 0.9 },
  emptyCard: { marginHorizontal: 16, marginTop: 14, padding: 24, borderRadius: 14, borderWidth: 1, alignItems: 'center', textAlign: 'center' },
  emptyTitle: { fontSize: 15, fontWeight: '700', marginBottom: 6 },
  emptyDesc: { fontSize: 12, lineHeight: 18, textAlign: 'center' },
});