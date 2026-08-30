import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useDonorProfile } from '@/hooks/useDonorProfile';
import { useDonationRequests } from '@/hooks/useNetwork';
import { useCentres } from '@/hooks/useCentres';

const fallbackCenters = [
  { name: 'Princess Marina Hospital', distance: '2.4 km', status: 'Open until 18:00', icon: 'heart' as const },
  { name: 'Gaborone Private Hospital', distance: '5.8 km', status: 'Open until 17:00', icon: 'plus' as const },
  { name: 'Block 8 Clinic', distance: '8.1 km', status: 'Closed · opens 08:00', icon: 'home' as const },
];

const fallbackRequests = [
  { type: 'O-', title: 'ICU Ward 3 · PMH Gaborone', detail: 'Trauma patient requires urgent transfusion', time: '2h ago', distance: '2.4 km', critical: true },
  { type: 'O-', title: 'Mahalapye District Hospital', detail: 'Surgical support needed this week', time: '5h ago', distance: '42 km', critical: false },
];

function SectionTitle({ children, action, onPress }: { children: string; action?: string; onPress?: () => void }) {
  const colors = useColors();
  return (
    <View style={styles.sectionTitle}>
      <Text style={[styles.sectionLabel, { color: colors.text }]}>{children}</Text>
      {action && <Pressable onPress={onPress}><Text style={[styles.seeAll, { color: colors.tint }]}>{action}</Text></Pressable>}
    </View>
  );
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [saved, setSaved] = useState(false);

  const { data: profile } = useDonorProfile();
  const { data: liveRequests } = useDonationRequests();
  const { data: liveCentres } = useCentres();

  const donorName = profile?.first_name ? `${profile.first_name} ${profile.last_name || ''}`.trim() : 'Donor';
  const bloodType = profile?.blood_type || 'O−';
  const verificationLevel = profile?.verification_level ?? 1;
  const district = profile?.district ? `${profile.district.toUpperCase()} · BOTSWANA` : 'GABORONE · BOTSWANA';

  // Format today's date
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).toUpperCase();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: 110 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>{today}</Text>
            <Text style={[styles.greeting, { color: colors.text }]}>Good morning,{"\n"}<Text style={{ color: colors.text }}>{donorName}.</Text></Text>
          </View>
          <Pressable style={[styles.bell, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => router.push('/alerts')}>
            <Feather name="bell" size={19} color={colors.text} />
            <View style={styles.notificationDot} />
          </Pressable>
        </View>

        <Pressable style={styles.identityCard} onPress={() => router.push('/profile')}>
          <LinearGradient colors={['#070A14', '#17152A', '#280E1F']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
          <View style={styles.gridLines} />
          <View style={styles.cardTop}>
            <View style={styles.mark}><View style={styles.markDrop} /></View>
            <Text style={styles.wordmark}>SCYTHER</Text>
            <View style={styles.cardLevel}>
              <View style={[styles.levelDot, { backgroundColor: verificationLevel >= 3 ? '#34D399' : '#F59E0B' }]} />
              <Text style={[styles.levelText, { color: verificationLevel >= 3 ? '#A7F3D0' : '#FCD34D' }]}>LEVEL {verificationLevel}</Text>
            </View>
          </View>
          <View style={styles.cardMiddle}>
            <View>
              <Text style={styles.cardName}>{donorName}</Text>
              <Text style={styles.cardId}>{profile ? `SCT-${profile.id?.toString().padStart(4, '0') || '2748'}` : 'SCT-2748-09B'}</Text>
            </View>
            <View style={styles.bloodBlock}>
              <Text style={styles.bloodType}>{bloodType}</Text>
              <Text style={styles.selfReported}>{verificationLevel >= 3 ? 'VERIFIED' : 'SELF-REPORTED'}</Text>
            </View>
          </View>
          <View style={styles.cardBottom}>
            <Text style={styles.district}>{district}</Text>
            <View style={styles.qr}><View style={styles.qrInner}><Feather name="maximize" size={24} color="#F0F6FF" /></View></View>
          </View>
          <View style={styles.redStrip} />
        </Pressable>

        <Pressable
          style={[styles.verifyStrip, { backgroundColor: verificationLevel >= 3 ? '#06251F' : '#2A1806', borderColor: verificationLevel >= 3 ? '#075F4E' : '#78350F' }]}
          onPress={() => router.push('/verification')}
        >
          <View style={[styles.verifyIcon, { backgroundColor: verificationLevel >= 3 ? '#075F4E' : '#78350F' }]}>
            <Feather name="shield" size={16} color={verificationLevel >= 3 ? '#34D399' : '#FCD34D'} />
          </View>
          <View style={styles.verifyCopy}>
            <Text style={[styles.verifyTitle, { color: verificationLevel >= 3 ? '#A7F3D0' : '#FDE68A' }]}>
              Verification Level {verificationLevel}
            </Text>
            <Text style={[styles.verifySub, { color: verificationLevel >= 3 ? '#6EE7B7' : '#FCD34D' }]}>
              {verificationLevel >= 3 ? 'Cleared donor · identity confirmed' : 'Tap to submit verification ID'}
            </Text>
          </View>
          <Feather name="chevron-right" size={18} color={verificationLevel >= 3 ? '#34D399' : '#FCD34D'} />
        </Pressable>

        <View style={styles.statsRow}>
          {[['04', 'DONATIONS', colors.text], ['14 MAR', 'LAST DONATION', colors.text], ['ELIGIBLE', 'NEXT DONATION', '#34D399']].map(([value, label, tint]) => (
            <View key={label} style={[styles.stat, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.statValue, { color: tint }]}>{value}</Text><Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text></View>
          ))}
        </View>

        <SectionTitle action="View map" onPress={() => router.push('/centres')}>NEARBY CENTRES</SectionTitle>
        <Pressable style={[styles.mapPreview, { borderColor: colors.border }]} onPress={() => router.push('/centres')}>
          <LinearGradient colors={['#091925', '#0B2430', '#07131F']} style={StyleSheet.absoluteFill} />
          <View style={styles.mapRoadOne} /><View style={styles.mapRoadTwo} /><View style={styles.mapRoadThree} />
          <View style={[styles.mapPin, { left: '24%', top: '34%' }]}><Feather name="droplet" size={12} color="#fff" /></View>
          <View style={[styles.mapPin, { left: '65%', top: '57%' }]}><Feather name="droplet" size={12} color="#fff" /></View>
          <View style={[styles.mapPin, { left: '76%', top: '20%', backgroundColor: '#06B6D4' }]}><Feather name="navigation" size={11} color="#fff" /></View>
          <View style={styles.mapLabel}><Feather name="navigation" size={12} color="#67E8F9" /><Text style={styles.mapLabelText}>{liveCentres?.length ? `${liveCentres.length} CENTRES IN NETWORK` : '3 CENTRES WITHIN 10 KM'}</Text></View>
        </Pressable>
        <View style={styles.centerList}>
          {(liveCentres && liveCentres.length > 0 ? liveCentres.slice(0, 2).map((c) => ({
            name: c.name,
            distance: c.distance_km ? `${c.distance_km.toFixed(1)} km` : (c.district || 'Nearby'),
            status: c.is_open ? 'Open' : 'Closed',
            icon: 'heart' as const,
          })) : fallbackCenters.slice(0, 2)).map((center) => (
            <Pressable key={center.name} style={styles.centerRow} onPress={() => router.push('/centres')}>
              <View style={[styles.centerIcon, { backgroundColor: '#2D0808' }]}><Feather name={center.icon} size={16} color="#EF4444" /></View>
              <View style={styles.centerInfo}><Text style={[styles.centerName, { color: colors.text }]}>{center.name}</Text><Text style={[styles.centerMeta, { color: colors.mutedForeground }]}>{center.distance} · <Text style={{ color: '#34D399' }}>{center.status}</Text></Text></View>
              <Feather name="arrow-up-right" size={16} color={colors.mutedForeground} />
            </Pressable>
          ))}
        </View>

        <SectionTitle action="See all" onPress={() => router.push('/network')}>ACTIVE IN YOUR AREA</SectionTitle>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.requestScroll}>
          {(liveRequests && liveRequests.length > 0 ? liveRequests.map((r) => ({
            type: r.blood_type,
            title: r.facility_name,
            detail: r.description,
            time: r.created_at ? new Date(r.created_at).toLocaleDateString() : 'Active',
            distance: r.district || 'Local',
            critical: r.priority === 'critical',
          })) : fallbackRequests).map((request, i) => (
            <Pressable key={i} style={[styles.requestCard, { backgroundColor: colors.card, borderColor: request.critical ? '#7F1D1D' : colors.border }]} onPress={() => router.push('/network')}>
              <View style={styles.requestTop}><View style={[styles.criticalDot, { backgroundColor: request.critical ? '#EF4444' : '#F59E0B' }]} /><Text style={[styles.requestStatus, { color: request.critical ? '#FCA5A5' : '#FCD34D' }]}>{request.critical ? 'CRITICAL' : 'PLANNED'}</Text><Text style={[styles.requestTime, { color: colors.mutedForeground }]}>{request.time}</Text></View>
              <View style={styles.requestType}><Text style={[styles.requestTypeLabel, { color: colors.mutedForeground }]}>BLOOD TYPE NEEDED</Text><Text style={[styles.requestBlood, { color: '#34D399' }]}>{request.type}</Text></View>
              <Text style={[styles.requestTitle, { color: colors.text }]}>{request.title}</Text><Text style={[styles.requestDetail, { color: colors.mutedForeground }]}>{request.detail}</Text>
              <View style={styles.requestBottom}><Text style={[styles.requestDistance, { color: colors.mutedForeground }]}><Feather name="map-pin" size={11} /> {request.distance}</Text><Text style={[styles.respondText, { color: colors.tint }]}>{request.critical ? 'Respond' : 'View'}</Text></View>
            </Pressable>
          ))}
        </ScrollView>

        <SectionTitle action="Explore" onPress={() => router.push('/health')}>FROM THE HEALTH HUB</SectionTitle>
        <Pressable style={[styles.article, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => router.push('/health')}>
          <View style={styles.articleArt}><View style={styles.articleCircle} /><Feather name="heart" size={27} color="#FCA5A5" /></View>
          <View style={styles.articleCopy}><Text style={[styles.articleTag, { color: colors.tint }]}>YOUR BLOOD TYPE</Text><Text style={[styles.articleTitle, { color: colors.text }]}>What {bloodType} donors should know</Text><Text style={[styles.articleMeta, { color: colors.mutedForeground }]}>6 min read · Health Hub</Text></View>
          <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
        </Pressable>

        <Pressable style={[styles.saveCard, { borderColor: saved ? '#075F4E' : colors.border, backgroundColor: saved ? '#06251F' : colors.card }]} onPress={() => setSaved((value) => !value)}>
          <Feather name={saved ? 'check-circle' : 'bookmark'} size={18} color={saved ? '#34D399' : colors.tint} />
          <Text style={[styles.saveText, { color: saved ? '#A7F3D0' : colors.text }]}>{saved ? 'Centre reminder saved for your next donation' : 'Save a reminder to donate again in 42 days'}</Text>
          <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
        </Pressable>

        {/* Investor validation & User feedback prompt */}
        <Pressable
          style={[styles.feedbackPrompt, { borderColor: colors.border, backgroundColor: colors.card }]}
          onPress={() => router.push('/(feedback)' as never)}
        >
          <Feather name="message-square" size={16} color="#67E8F9" />
          <Text style={[styles.feedbackText, { color: colors.text }]}>User Testing: Share your feedback on Scyther</Text>
          <Feather name="arrow-up-right" size={14} color="#67E8F9" />
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 2 },
  eyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8 },
  greeting: { fontSize: 27, lineHeight: 31, fontWeight: '800', letterSpacing: -0.8 },
  bell: { width: 44, height: 44, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  notificationDot: { position: 'absolute', right: 9, top: 8, width: 7, height: 7, borderRadius: 5, backgroundColor: '#EF4444', borderWidth: 1.5, borderColor: '#111827' },
  identityCard: { height: 208, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#2A2944', padding: 18, justifyContent: 'space-between' },
  gridLines: { ...StyleSheet.absoluteFill, opacity: 0.08, borderWidth: 1, borderColor: '#9CA3AF', margin: 13, borderRadius: 11 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  mark: { width: 20, height: 23, alignItems: 'center', justifyContent: 'center' },
  markDrop: { width: 14, height: 19, backgroundColor: '#EF4444', borderRadius: 9, transform: [{ rotate: '38deg' }] },
  wordmark: { color: '#F0F6FF', fontWeight: '800', letterSpacing: 2.5, fontSize: 12 },
  cardLevel: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 5 },
  levelDot: { width: 6, height: 6, borderRadius: 4, backgroundColor: '#34D399' },
  levelText: { color: '#A7F3D0', fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  cardMiddle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  cardName: { color: '#F0F6FF', fontSize: 21, fontWeight: '700', letterSpacing: -0.4 },
  cardId: { color: '#8B9DB5', fontSize: 11, fontFamily: 'Inter_500Medium', letterSpacing: 1.2, marginTop: 5 },
  bloodBlock: { alignItems: 'flex-end' },
  bloodType: { color: '#34D399', fontSize: 38, lineHeight: 40, fontWeight: '800', letterSpacing: -2 },
  selfReported: { color: '#FCD34D', fontSize: 8, letterSpacing: 0.8, fontWeight: '700' },
  cardBottom: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  district: { color: '#8B9DB5', fontSize: 9, letterSpacing: 1, fontWeight: '600' },
  qr: { width: 42, height: 42, borderRadius: 5, backgroundColor: '#F0F6FF', alignItems: 'center', justifyContent: 'center' },
  qrInner: { width: 30, height: 30, backgroundColor: '#0C1220', alignItems: 'center', justifyContent: 'center' },
  redStrip: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, backgroundColor: '#DC2626' },
  verifyStrip: { minHeight: 62, borderWidth: 1, borderRadius: 12, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, gap: 11 },
  verifyIcon: { width: 31, height: 31, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  verifyCopy: { flex: 1 }, verifyTitle: { fontSize: 13, fontWeight: '700' }, verifySub: { fontSize: 11, marginTop: 3 },
  statsRow: { flexDirection: 'row', gap: 8 }, stat: { flex: 1, padding: 12, borderWidth: 1, borderRadius: 11, minHeight: 70, justifyContent: 'space-between' },
  statValue: { fontSize: 16, fontWeight: '800', letterSpacing: -0.5 }, statLabel: { fontSize: 8, fontWeight: '700', letterSpacing: 0.7 },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 7 }, sectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1.6 }, seeAll: { fontSize: 12, fontWeight: '600' },
  mapPreview: { height: 142, borderRadius: 14, overflow: 'hidden', borderWidth: 1, position: 'relative' }, mapRoadOne: { position: 'absolute', width: '140%', height: 1, backgroundColor: '#1E4856', transform: [{ rotate: '-20deg' }], top: 70, left: -30 }, mapRoadTwo: { position: 'absolute', width: '120%', height: 1, backgroundColor: '#19404D', transform: [{ rotate: '34deg' }], top: 58, left: 0 }, mapRoadThree: { position: 'absolute', height: '150%', width: 1, backgroundColor: '#153745', transform: [{ rotate: '22deg' }], left: '49%', top: -10 }, mapPin: { position: 'absolute', width: 25, height: 25, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: '#B91C1C', borderWidth: 3, borderColor: '#FCA5A5' }, mapLabel: { position: 'absolute', left: 12, bottom: 11, flexDirection: 'row', gap: 6, alignItems: 'center' }, mapLabelText: { color: '#67E8F9', fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  centerList: { gap: 1 }, centerRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 9, gap: 10 }, centerIcon: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' }, centerInfo: { flex: 1 }, centerName: { fontSize: 13, fontWeight: '600' }, centerMeta: { fontSize: 11, marginTop: 3 },
  requestScroll: { gap: 10 }, requestCard: { width: 245, padding: 14, borderRadius: 13, borderWidth: 1, gap: 8 }, requestTop: { flexDirection: 'row', alignItems: 'center', gap: 5 }, criticalDot: { width: 6, height: 6, borderRadius: 4 }, requestStatus: { fontSize: 9, fontWeight: '800', letterSpacing: 1 }, requestTime: { marginLeft: 'auto', fontSize: 10 }, requestType: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 3 }, requestTypeLabel: { fontSize: 8, letterSpacing: 0.8 }, requestBlood: { fontSize: 23, fontWeight: '800' }, requestTitle: { fontSize: 13, fontWeight: '700' }, requestDetail: { fontSize: 11, lineHeight: 16, minHeight: 31 }, requestBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#1E2D45', paddingTop: 9 }, requestDistance: { fontSize: 10 }, respondText: { fontSize: 11, fontWeight: '700' },
  article: { borderRadius: 13, borderWidth: 1, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 12 }, articleArt: { width: 68, height: 68, borderRadius: 10, backgroundColor: '#35121E', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, articleCircle: { position: 'absolute', width: 100, height: 100, borderRadius: 60, borderWidth: 1, borderColor: '#7F1D1D' }, articleCopy: { flex: 1 }, articleTag: { fontSize: 8, fontWeight: '800', letterSpacing: 1.1, marginBottom: 5 }, articleTitle: { fontSize: 14, fontWeight: '700', lineHeight: 18 }, articleMeta: { fontSize: 10, marginTop: 5 },
  saveCard: { borderWidth: 1, borderRadius: 12, minHeight: 51, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, gap: 10 },
  saveText: { flex: 1, fontSize: 12, fontWeight: '600', lineHeight: 17 },
  feedbackPrompt: { borderWidth: 1, borderRadius: 12, minHeight: 48, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 10, marginTop: 4 },
  feedbackText: { flex: 1, fontSize: 12, fontWeight: '600', lineHeight: 16 },
});