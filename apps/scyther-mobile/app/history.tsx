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

  const totalDonations = liveDonations?.length ?? 0;
  const totalVolumeLiters = ((totalDonations * 450) / 1000).toFixed(1);
  const verifiedPct = liveDonations && totalDonations > 0 ? Math.round((liveDonations.filter((d: any) => d.verified).length / totalDonations) * 100) : 100;
  const hasLive = Boolean(liveDonations && totalDonations > 0);

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
            <Text style={styles.statVal}>{totalDonations.toString().padStart(2, '0')}</Text>
            <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>TOTAL UNITS</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statCol}>
            <Text style={[styles.statVal, { color: '#34D399' }]}>
              {totalVolumeLiters}L
            </Text>
            <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>VOLUME GIVEN</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statCol}>
            <Text style={[styles.statVal, { color: '#67E8F9' }]}>{verifiedPct}%</Text>
            <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>VERIFIED INTEGRITY</Text>
          </View>
        </View>

        <Text style={[styles.sectionHeading, { color: colors.text }]}>CONFIRMED DONATION RECORDS</Text>

        {hasLive && liveDonations ? (
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
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="shield" size={28} color="#67E8F9" style={{ alignSelf: 'center', marginBottom: 10 }} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Donation Records Yet</Text>
            <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
              Once you complete your first blood donation at an accredited centre, your full chain-of-custody journey and cryptographic proof will show up here.
            </Text>
          </View>
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
  txRow: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(15, 23, 42, 0.6)', padding: 8, borderRadius: 8 },
  txText: { color: '#94A3B8', fontSize: 10, fontFamily: 'monospace' },
  trustNote: { flexDirection: 'row', gap: 10, padding: 14, backgroundColor: 'rgba(56, 189, 248, 0.08)', borderRadius: 12, marginTop: 8 },
  trustText: { flex: 1, fontSize: 11, lineHeight: 16 },
  emptyCard: { marginTop: 12, padding: 24, borderRadius: 14, borderWidth: 1, alignItems: 'center', textAlign: 'center' },
  emptyTitle: { fontSize: 15, fontWeight: '700', marginBottom: 6 },
  emptyDesc: { fontSize: 12, lineHeight: 18, textAlign: 'center' },
});
