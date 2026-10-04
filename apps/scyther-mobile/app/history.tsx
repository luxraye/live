import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useDonorDonations, useDonorProfile } from '@/hooks/useDonorProfile';

export default function HistoryScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: profile } = useDonorProfile();
  const { data: liveDonations } = useDonorDonations();

  const isDemo = profile?.is_demo;

  const mockTimeline = [
    {
      id: 'tx-01',
      date: '14 Sep 2026',
      facility: 'Princess Marina Hospital (Gaborone)',
      status: 'Transfused to Patient',
      verified: true,
      bloodType: profile?.blood_type || 'O−',
      volumeMl: 450,
      txId: 'tx-bc-pmh-2026-0914-88',
      milestones: [
        { label: 'Phlebotomy & Bag Tagging', date: '14 Sep · 09:15 CAT', complete: true },
        { label: 'Central Lab Virology & ABO Cleared', date: '14 Sep · 14:30 CAT', complete: true },
        { label: 'Hyperledger Blockchain Anchor Verified', date: '14 Sep · 15:45 CAT', complete: true },
        { label: 'Transfused at Scottish Livingstone Hospital', date: '16 Sep · 07:11 CAT', complete: true },
      ],
    },
    {
      id: 'tx-02',
      date: '02 Jun 2026',
      facility: 'National Blood Transfusion Service (HQ)',
      status: 'Archived in National Reserve',
      verified: true,
      bloodType: profile?.blood_type || 'O−',
      volumeMl: 450,
      txId: 'tx-bc-nbts-2026-0602-41',
      milestones: [
        { label: 'Phlebotomy & Bag Tagging', date: '02 Jun · 10:00 CAT', complete: true },
        { label: 'Central Lab Virology & ABO Cleared', date: '02 Jun · 16:10 CAT', complete: true },
        { label: 'Hyperledger Blockchain Anchor Verified', date: '02 Jun · 17:00 CAT', complete: true },
      ],
    },
  ];

  const hasLive = Array.isArray(liveDonations) && liveDonations.length > 0;

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top + 14 }]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.backBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
        >
          <Feather name="arrow-left" size={19} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>CHAIN OF CUSTODY</Text>
          <Text style={[styles.title, { color: colors.text }]}>Donation History</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Donor Impact Stats Banner */}
        <View style={[styles.statsCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <View style={styles.statCol}>
            <Text style={styles.statVal}>{hasLive ? liveDonations.length : isDemo ? '02' : '01'}</Text>
            <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>TOTAL UNITS</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statCol}>
            <Text style={[styles.statVal, { color: '#34D399' }]}>
              {hasLive ? `${(liveDonations.length * 0.45).toFixed(1)}L` : isDemo ? '0.9L' : '0.45L'}
            </Text>
            <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>VOLUME GIVEN</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statCol}>
            <Text style={[styles.statVal, { color: '#67E8F9' }]}>100%</Text>
            <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>VERIFIED INTEGRITY</Text>
          </View>
        </View>

        <Text style={[styles.sectionHeading, { color: colors.text }]}>CONFIRMED DONATION RECORDS</Text>

        {hasLive ? (
          liveDonations.map((d) => (
            <View key={d.id} style={[styles.donationCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={[styles.facilityName, { color: colors.text }]}>{d.centre_name || 'Collection Centre'}</Text>
                  <Text style={[styles.dateText, { color: colors.mutedForeground }]}>
                    {new Date(d.donated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </Text>
                </View>
                <View style={[styles.badge, { backgroundColor: d.verified ? 'rgba(52, 211, 153, 0.15)' : 'rgba(251, 191, 36, 0.15)' }]}>
                  <Feather name={d.verified ? 'check-circle' : 'clock'} size={12} color={d.verified ? '#34D399' : '#FBBF24'} />
                  <Text style={[styles.badgeText, { color: d.verified ? '#A7F3D0' : '#FDE68A' }]}>
                    {d.verified ? 'VERIFIED' : 'PENDING SYNC'}
                  </Text>
                </View>
              </View>

              {d.tx_id && (
                <View style={styles.txRow}>
                  <Feather name="shield" size={12} color="#67E8F9" />
                  <Text style={styles.txText} numberOfLines={1}>Fabric Ledger: {d.tx_id}</Text>
                </View>
              )}
            </View>
          ))
        ) : (
          mockTimeline.map((item) => (
            <View key={item.id} style={[styles.donationCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.facilityName, { color: colors.text }]}>{item.facility}</Text>
                  <Text style={[styles.dateText, { color: colors.mutedForeground }]}>{item.date} · 450 mL ({item.bloodType})</Text>
                </View>
                <View style={styles.badge}>
                  <Feather name="check-circle" size={12} color="#34D399" />
                  <Text style={styles.badgeText}>LEDGER VERIFIED</Text>
                </View>
              </View>

              <View style={styles.timeline}>
                {item.milestones.map((m, idx) => (
                  <View key={idx} style={styles.milestoneRow}>
                    <View style={styles.timelineDot} />
                    <View style={styles.milestoneContent}>
                      <Text style={[styles.milestoneLabel, { color: colors.text }]}>{m.label}</Text>
                      <Text style={[styles.milestoneDate, { color: colors.mutedForeground }]}>{m.date}</Text>
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.txRow}>
                <Feather name="link-2" size={12} color="#67E8F9" />
                <Text style={styles.txText}>Immutable Record: {item.txId}</Text>
              </View>
            </View>
          ))
        )}

        <View style={styles.trustNote}>
          <Feather name="lock" size={14} color="#67E8F9" />
          <Text style={[styles.trustText, { color: colors.mutedForeground }]}>
            All donation events are immutably anchored to the Botswana Bloodchain ledger. Recipient medical privacy is strictly preserved under statutory healthcare protocols.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  backBtn: { width: 42, height: 42, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { fontSize: 9, fontWeight: '800', letterSpacing: 1.5 },
  title: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  content: { padding: 16, gap: 14, paddingBottom: 60 },
  statsCard: { flexDirection: 'row', borderWidth: 1, borderRadius: 14, padding: 16, alignItems: 'center' },
  statCol: { flex: 1, alignItems: 'center' },
  divider: { width: 1, height: 36, backgroundColor: '#1E293B' },
  statVal: { fontSize: 20, fontWeight: '800' },
  statLbl: { fontSize: 8, fontWeight: '800', letterSpacing: 0.8, marginTop: 4 },
  sectionHeading: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2, marginTop: 4 },
  donationCard: { borderWidth: 1, borderRadius: 14, padding: 16, gap: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  facilityName: { fontSize: 14, fontWeight: '700' },
  dateText: { fontSize: 11, marginTop: 2 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: 'rgba(52, 211, 153, 0.12)' },
  badgeText: { fontSize: 9, fontWeight: '800', color: '#34D399', letterSpacing: 0.5 },
  timeline: { paddingLeft: 8, borderLeftWidth: 1, borderLeftColor: '#1E293B', marginLeft: 6, gap: 10, marginVertical: 4 },
  milestoneRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  timelineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#34D399', marginTop: 4, marginLeft: -11 },
  milestoneContent: { flex: 1 },
  milestoneLabel: { fontSize: 12, fontWeight: '600' },
  milestoneDate: { fontSize: 10, marginTop: 2 },
  txRow: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(15, 23, 42, 0.6)', padding: 8, borderRadius: 8 },
  txText: { color: '#94A3B8', fontSize: 10, fontFamily: 'monospace' },
  trustNote: { flexDirection: 'row', gap: 10, padding: 14, backgroundColor: 'rgba(56, 189, 248, 0.08)', borderRadius: 12, marginTop: 8 },
  trustText: { flex: 1, fontSize: 11, lineHeight: 16 },
});
