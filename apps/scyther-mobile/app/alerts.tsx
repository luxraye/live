import React from 'react';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useDonationRequests } from '@/hooks/useNetwork';

export default function AlertsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: requests, isLoading } = useDonationRequests();

  const alerts = requests && requests.length > 0 ? requests : [];

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top + 16 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.text} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>Alerts & Notifications</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Text style={[styles.label, { color: colors.mutedForeground }]}>ACTIVE CRITICAL SHORTAGES</Text>

        {alerts.length > 0 ? (
          alerts.map((req) => (
            <Pressable
              key={req.id}
              style={[styles.alert, { backgroundColor: '#35121E', borderColor: '#7F1D1D' }]}
              onPress={() => router.push('/network')}
            >
              <View style={styles.icon}>
                <Feather name="alert-triangle" size={18} color="#FCA5A5" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#FCA5A5', fontWeight: '800', fontSize: 13 }}>
                  {req.blood_type} Needed · {req.facility_name}
                </Text>
                <Text style={{ color: '#D9AAB8', fontSize: 12, lineHeight: 18, marginTop: 6 }}>
                  {req.description}
                </Text>
                <Text style={{ color: '#B891A1', fontSize: 10, marginTop: 9 }}>
                  Priority: {req.priority.toUpperCase()} · Tap to respond
                </Text>
              </View>
            </Pressable>
          ))
        ) : (
          <View style={[styles.alert, { backgroundColor: '#13231F', borderColor: '#065F46' }]}>
            <View style={[styles.icon, { backgroundColor: '#064E3B' }]}>
              <Feather name="check" size={18} color="#34D399" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#A7F3D0', fontWeight: '800', fontSize: 13 }}>
                National Blood Supply Stable
              </Text>
              <Text style={{ color: '#6EE7B7', fontSize: 12, lineHeight: 18, marginTop: 4 }}>
                No emergency shortages currently declared in your operational corridor.
              </Text>
            </View>
          </View>
        )}

        <Text style={[styles.label, { color: colors.mutedForeground }]}>NETWORK STATUS</Text>
        <View style={[styles.clear, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <Feather name="check-circle" size={18} color="#34D399" />
          <Text style={[styles.clearText, { color: colors.text }]}>
            {isLoading ? 'Checking national network…' : 'National dispatch relay connected'}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  backBtn: { width: 32, height: 32, justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '800' },
  alert: { borderWidth: 1, borderRadius: 14, padding: 14, flexDirection: 'row', gap: 11, marginBottom: 12 },
  icon: { width: 35, height: 35, borderRadius: 10, backgroundColor: '#7F1D1D', alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 10, letterSpacing: 1.3, fontWeight: '800', marginTop: 16, marginBottom: 10 },
  clear: { minHeight: 54, borderWidth: 1, borderRadius: 12, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, gap: 10 },
  clearText: { fontSize: 13, fontWeight: '600' },
});