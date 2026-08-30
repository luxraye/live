import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/expo';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useDonorProfile } from '@/hooks/useDonorProfile';

const recordItems = [
  ['clock', 'Donation history', 'Your confirmed donations'],
  ['check-circle', 'Verification centre', 'Identity and eligibility'],
  ['share-2', 'Share donor card', 'Let people verify your record'],
  ['settings', 'Account settings', 'Privacy and notifications'],
] as const;

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signOut } = useAuth();
  const { data: profile } = useDonorProfile();

  const name = profile?.first_name ? `${profile.first_name} ${profile.last_name || ''}`.trim() : 'Your donor profile';
  const bloodType = profile?.blood_type || '—';
  const level = profile?.verification_level ?? 1;
  const isVerified = level >= 3;
  const initials = profile?.first_name ? (profile.first_name[0] + (profile.last_name?.[0] || '')).toUpperCase() : 'YOU';
  const district = profile?.district ? `${profile.district.toUpperCase()} · BOTSWANA` : 'BOTSWANA';

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 14, paddingBottom: 100 }}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>YOUR IDENTITY</Text>
            <Text style={[styles.title, { color: colors.text }]}>Donor profile</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        </View>

        <LinearGradient colors={['#080A14', '#1A1129']} style={styles.card}>
          <View style={styles.cardTop}>
            <View style={styles.logoMark} />
            <Text style={styles.wordmark}>SCYTHER</Text>
            <Text style={[styles.level, { color: isVerified ? '#A7F3D0' : '#FCD34D' }]}>
              LEVEL {level} · {isVerified ? 'VERIFIED' : 'PENDING'}
            </Text>
          </View>
          <View style={styles.profileRow}>
            <View>
              <Text style={styles.name}>{name}</Text>
              <Text style={styles.id}>{profile ? `SCT-${profile.id?.toString().padStart(4, '0')}` : 'SECURE RECORD · SCYTHER'}</Text>
            </View>
            <Text style={[styles.blood, { color: isVerified ? '#34D399' : '#FCD34D' }]}>{bloodType}</Text>
          </View>
          <View style={styles.cardBottom}>
            <Text style={styles.place}>{district}</Text>
            <Feather name="shield" size={24} color={isVerified ? '#34D399' : '#F0F6FF'} />
          </View>
          <View style={styles.strip} />
        </LinearGradient>

        <View style={[styles.levelPanel, isVerified && { borderColor: '#075F4E', backgroundColor: '#06251F' }]}>
          <Feather name={isVerified ? 'check-circle' : 'shield'} size={21} color={isVerified ? '#34D399' : '#FBBF24'} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.levelTitle, isVerified && { color: '#A7F3D0' }]}>
              {isVerified ? 'Identity Verified' : 'Verification pending'}
            </Text>
            <Text style={[styles.levelCopy, isVerified && { color: '#6EE7B7' }]}>
              {isVerified ? 'Your credentials are authenticated on Bloodchain.' : 'Upload an ID or donor card to start review.'}
            </Text>
          </View>
        </View>

        {!isVerified && (
          <Pressable onPress={() => router.push('/verification' as never)} style={styles.verifyAction}>
            <Feather name="upload-cloud" size={17} color="#67E8F9" />
            <Text style={styles.verifyActionText}>Submit verification document</Text>
            <Feather name="chevron-right" size={16} color="#67E8F9" />
          </Pressable>
        )}

        <Text style={[styles.section, { color: colors.text }]}>YOUR RECORD</Text>
        {recordItems.map(([icon, title, sub]) => (
          <Pressable
            key={title}
            onPress={title === 'Verification centre' ? () => router.push('/verification' as never) : undefined}
            style={[styles.row, { borderBottomColor: colors.border }]}
          >
            <View style={styles.rowIcon}>
              <Feather name={icon} size={17} color={icon === 'settings' ? colors.mutedForeground : '#06B6D4'} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowTitle, { color: colors.text }]}>{title}</Text>
              <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>{sub}</Text>
            </View>
            <Feather name="chevron-right" size={17} color={colors.mutedForeground} />
          </Pressable>
        ))}

        <Pressable onPress={() => signOut()} style={styles.signOut}>
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 7 },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -1 },
  avatar: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#2D0808' },
  avatarText: { color: '#FCA5A5', fontSize: 11, fontWeight: '800' },
  card: { margin: 16, height: 197, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: '#2A2944', justifyContent: 'space-between', overflow: 'hidden' },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoMark: { width: 17, height: 20, backgroundColor: '#EF4444', borderRadius: 10, transform: [{ rotate: '35deg' }] },
  wordmark: { color: '#F0F6FF', fontWeight: '800', letterSpacing: 2, fontSize: 11 },
  level: { marginLeft: 'auto', color: '#FCD34D', fontSize: 8, fontWeight: '700', letterSpacing: 0.8 },
  profileRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  name: { color: '#F0F6FF', fontSize: 20, fontWeight: '800' },
  id: { color: '#8B9DB5', fontSize: 10, letterSpacing: 1, marginTop: 5 },
  blood: { color: '#FCD34D', fontSize: 40, fontWeight: '800' },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  place: { color: '#8B9DB5', fontSize: 9, letterSpacing: 1 },
  strip: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, backgroundColor: '#DC2626' },
  levelPanel: { marginHorizontal: 16, minHeight: 65, borderRadius: 12, borderWidth: 1, borderColor: '#725A15', backgroundColor: '#2A2107', padding: 13, flexDirection: 'row', alignItems: 'center', gap: 11 },
  levelTitle: { color: '#FDE68A', fontWeight: '700', fontSize: 13 },
  levelCopy: { color: '#FCD34D', fontSize: 11, marginTop: 4 },
  verifyAction: { marginHorizontal: 16, marginTop: 10, height: 48, borderRadius: 12, backgroundColor: '#0A2B35', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 9 },
  verifyActionText: { color: '#67E8F9', fontSize: 12, fontWeight: '700', flex: 1 },
  section: { marginHorizontal: 16, fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginTop: 27, marginBottom: 9 },
  row: { marginHorizontal: 16, minHeight: 67, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 11 },
  rowIcon: { width: 35, height: 35, backgroundColor: '#0A2B35', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: 13, fontWeight: '700' },
  rowSub: { fontSize: 11, marginTop: 4 },
  signOut: { marginTop: 30, marginHorizontal: 16, paddingVertical: 15, alignItems: 'center', borderRadius: 11, backgroundColor: '#2D0808' },
  signOutText: { color: '#FCA5A5', fontWeight: '700' },
});