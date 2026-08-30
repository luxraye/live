import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useDonationRequests, useRespondToRequest } from '@/hooks/useNetwork';
import { useDonorProfile } from '@/hooks/useDonorProfile';

const fallbackFeed = [
  { id: 1, type: 'O−', facility: 'Princess Marina Hospital · ICU Ward 3', text: 'A patient in trauma requires an urgent O-negative transfusion. Level 3+ donors requested.', distance: '2.4 km', responses: 3, time: '2h ago', critical: true },
  { id: 2, type: 'A+', facility: 'Nyangabwe Referral Hospital', text: 'Planned surgical support needed for this Friday. Your donation can help the team prepare.', distance: '289 km', responses: 6, time: '4h ago', critical: false },
  { id: 3, type: 'O−', facility: 'Mahalapye District Hospital', text: 'Stock replenishment request for the regional blood bank.', distance: '42 km', responses: 1, time: '5h ago', critical: false },
];

export default function NetworkScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState('All requests');

  const { data: profile } = useDonorProfile();
  const priorityFilter = activeFilter === 'Critical' ? 'critical' : activeFilter === 'Planned' ? 'planned' : undefined;
  const bloodTypeFilter = activeFilter === 'My type' && profile?.blood_type ? profile.blood_type : undefined;

  const { data: liveRequests, isLoading } = useDonationRequests({
    priority: priorityFilter,
    bloodType: bloodTypeFilter,
  });

  const { mutate: respond } = useRespondToRequest();

  const items = liveRequests && liveRequests.length > 0 ? liveRequests.map((r) => ({
    id: r.id,
    type: r.blood_type,
    facility: r.facility_name,
    text: r.description,
    distance: r.district || 'Local',
    responses: r.response_count,
    time: r.created_at ? new Date(r.created_at).toLocaleDateString() : 'Active',
    critical: r.priority === 'critical',
  })) : fallbackFeed;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 14, paddingBottom: 110 }}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>THE COMMUNITY GRID</Text>
            <Text style={[styles.title, { color: colors.text }]}>Donation requests</Text>
          </View>
        </View>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Open requests from hospitals, caregivers, and community members seeking specific blood types.
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {['All requests', 'My type', 'Critical', 'Planned'].map((chip) => {
            const isActive = activeFilter === chip;
            return (
              <Pressable
                key={chip}
                onPress={() => setActiveFilter(chip)}
                style={[styles.chip, isActive ? styles.active : { borderColor: colors.border }]}
              >
                <Text style={[styles.chipText, isActive ? styles.activeText : { color: colors.mutedForeground }]}>
                  {chip}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
        <View style={styles.sortRow}>
          <Text style={[styles.sortLabel, { color: colors.mutedForeground }]}>
            {items.length} OPEN REQUESTS
          </Text>
        </View>
        {isLoading && items.length === 0 ? (
          <Text style={{ color: colors.mutedForeground, textAlign: 'center', marginTop: 24 }}>Loading live requests…</Text>
        ) : (
          items.map((item) => (
            <View
              key={item.id}
              style={[styles.card, { backgroundColor: colors.card, borderColor: item.critical ? '#7F1D1D' : colors.border }]}
            >
              <View style={styles.cardTop}>
                <View style={[styles.dot, { backgroundColor: item.critical ? '#EF4444' : '#F59E0B' }]} />
                <Text style={[styles.critical, { color: item.critical ? '#FCA5A5' : '#FCD34D' }]}>
                  {item.critical ? 'CRITICAL' : 'PLANNED'}
                </Text>
                <Text style={[styles.time, { color: colors.mutedForeground }]}>{item.time}</Text>
              </View>
              <Text style={[styles.typeLabel, { color: colors.mutedForeground }]}>BLOOD TYPE NEEDED</Text>
              <Text style={[styles.blood, { color: '#34D399' }]}>{item.type}</Text>
              <Text style={[styles.facility, { color: colors.text }]}>{item.facility}</Text>
              <Text style={[styles.body, { color: colors.mutedForeground }]}>{item.text}</Text>
              <View style={[styles.footer, { borderTopColor: colors.border }]}>
                <Text style={[styles.meta, { color: colors.mutedForeground }]}>
                  <Feather name="map-pin" size={12} /> {item.distance} · {item.responses} responded
                </Text>
                <Pressable onPress={() => respond(item.id)}>
                  <Text style={[styles.respond, { color: colors.tint }]}>
                    RESPOND NOW <Feather name="arrow-up-right" size={12} />
                  </Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  eyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 7 },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -1 },
  subtitle: { marginHorizontal: 16, marginTop: 13, lineHeight: 19, fontSize: 13 },
  chips: { padding: 16, gap: 8 },
  chip: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 9 },
  chipText: { fontSize: 11 },
  active: { backgroundColor: '#B91C1C', borderColor: '#EF4444' },
  activeText: { color: '#fff', fontWeight: '700' },
  sortRow: { marginHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sortLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  card: { marginHorizontal: 16, marginBottom: 12, borderWidth: 1, borderRadius: 14, padding: 15 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 4 },
  critical: { fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  time: { marginLeft: 'auto', fontSize: 10 },
  typeLabel: { fontSize: 8, letterSpacing: 1, marginTop: 18 },
  blood: { fontSize: 29, fontWeight: '800', marginTop: 2 },
  facility: { fontSize: 14, fontWeight: '700', marginTop: 10 },
  body: { fontSize: 12, lineHeight: 18, marginTop: 6 },
  footer: { marginTop: 14, paddingTop: 11, borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  meta: { fontSize: 10 },
  respond: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
});