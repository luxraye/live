import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/expo';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useDonorProfile } from '@/hooks/useDonorProfile';
import { DonorQrCode } from '@/components/DonorQrCode';

const recordItems = [
  ['clock', 'Donation history', 'Your confirmed donations and ledger proofs'],
  ['check-circle', 'Verification centre', 'Identity and eligibility clearance'],
  ['share-2', 'Share donor card', 'Let clinicians scan your record'],
  ['settings', 'Account settings', 'Privacy and notifications'],
] as const;

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signOut } = useAuth();
  const { data: profile } = useDonorProfile();
  const [showQrModal, setShowQrModal] = useState(false);

  const name = profile?.first_name ? `${profile.first_name} ${profile.last_name || ''}`.trim() : 'Your donor profile';
  const bloodType = profile?.blood_type || '—';
  const level = profile?.verification_level ?? 1;
  const isVerified = level >= 3;
  const initials = profile?.first_name ? (profile.first_name[0] + (profile.last_name?.[0] || '')).toUpperCase() : 'YOU';
  const district = profile?.district ? `${profile.district.toUpperCase()} · BOTSWANA` : 'BOTSWANA';
  const donorId = profile ? `SCT-${profile.id?.toString().padStart(4, '0')}` : 'SCT-2748-09B';
  const qrData = `BLOODCHAIN:SCT:${profile?.id || 'DEMO'}:${bloodType}:${profile?.clerk_user_id || 'DEMO'}`;

  const handleItemPress = (title: string) => {
    if (title === 'Donation history') {
      router.push('/history' as never);
    } else if (title === 'Verification centre') {
      router.push('/verification' as never);
    } else if (title === 'Share donor card') {
      setShowQrModal(true);
    }
  };

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

        <Pressable onPress={() => setShowQrModal(true)}>
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
                <Text style={styles.id}>{donorId}</Text>
              </View>
              <Text style={[styles.blood, { color: isVerified ? '#34D399' : '#FCD34D' }]}>{bloodType}</Text>
            </View>
            <View style={styles.cardBottom}>
              <Text style={styles.place}>{district}</Text>
              <Feather name="shield" size={24} color={isVerified ? '#34D399' : '#F0F6FF'} />
            </View>
            <View style={styles.strip} />
          </LinearGradient>
        </Pressable>

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
            onPress={() => handleItemPress(title)}
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

      {/* Share / Clinician Scan QR Modal */}
      {showQrModal && (
        <Modal
          visible={showQrModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowQrModal(false)}
        >
          <View style={styles.qrModalBackdrop}>
            <View style={[styles.qrModalCard, { backgroundColor: '#0B1220', borderColor: '#1E293B' }]}>
              <View style={styles.qrModalHeader}>
                <View>
                  <Text style={styles.qrModalTitle}>Clinician Verification Pass</Text>
                  <Text style={styles.qrModalSub}>Present at any certified collection dock</Text>
                </View>
                <Pressable onPress={() => setShowQrModal(false)} style={styles.qrModalClose}>
                  <Feather name="x" size={19} color="#94A3B8" />
                </Pressable>
              </View>

              <View style={styles.qrContainer}>
                <View style={styles.qrBox}>
                  <DonorQrCode value={qrData} size={180} color="#0B1220" bgColor="#FFFFFF" />
                </View>
              </View>

              <View style={styles.qrDetails}>
                <View style={styles.qrDetailCol}>
                  <Text style={styles.qrDetailLbl}>DONOR ID</Text>
                  <Text style={styles.qrDetailVal}>{donorId}</Text>
                </View>
                <View style={styles.qrDetailCol}>
                  <Text style={styles.qrDetailLbl}>BLOOD GROUP</Text>
                  <Text style={[styles.qrDetailVal, { color: '#34D399', fontWeight: '800' }]}>{bloodType}</Text>
                </View>
                <View style={styles.qrDetailCol}>
                  <Text style={styles.qrDetailLbl}>CLEARANCE</Text>
                  <Text style={[styles.qrDetailVal, { color: isVerified ? '#34D399' : '#FCD34D' }]}>
                    LEVEL {level}
                  </Text>
                </View>
              </View>

              <Text style={styles.qrInstruction}>
                When scanned by a clinical operator on Rubric or Crucible, your donation will be recorded, screened, and anchored to the sovereign ledger without exposing private personal identity data.
              </Text>

              <Pressable style={styles.qrDoneBtn} onPress={() => setShowQrModal(false)}>
                <Text style={styles.qrDoneText}>Done</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}
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
  qrModalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  qrModalCard: { width: '100%', maxWidth: 380, borderRadius: 20, borderWidth: 1, padding: 22, alignItems: 'center', gap: 16 },
  qrModalHeader: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  qrModalTitle: { color: '#F0F6FF', fontSize: 16, fontWeight: '800' },
  qrModalSub: { color: '#94A3B8', fontSize: 11, marginTop: 2 },
  qrModalClose: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  qrContainer: { padding: 14, backgroundColor: '#FFFFFF', borderRadius: 16, marginVertical: 6 },
  qrBox: { alignItems: 'center', justifyContent: 'center' },
  qrDetails: { width: '100%', flexDirection: 'row', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#1E293B', paddingVertical: 12 },
  qrDetailCol: { flex: 1, alignItems: 'center' },
  qrDetailLbl: { color: '#64748B', fontSize: 8, fontWeight: '800', letterSpacing: 0.8 },
  qrDetailVal: { color: '#F8FAFC', fontSize: 13, fontWeight: '700', marginTop: 3 },
  qrInstruction: { color: '#94A3B8', fontSize: 11, lineHeight: 16, textAlign: 'center' },
  qrDoneBtn: { width: '100%', height: 46, borderRadius: 10, backgroundColor: '#DC2626', alignItems: 'center', justifyContent: 'center' },
  qrDoneText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
});