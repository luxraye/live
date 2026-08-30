import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActionButton, Header, IconButton, Screen, SectionLabel, StatusPill, TextField } from '@/components/TransitUI';
import { Manifest, TransitStatus, useTransit } from '@/lib/TransitContext';
import { useColors } from '@/hooks/useColors';

const statusSteps: TransitStatus[] = ['Assigned', 'Picked Up', 'In Transit', 'Delivered'];

export default function ManifestScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { manifests, updateManifestStatus, pendingFeedback } = useTransit();
  const [surveyOpen, setSurveyOpen] = useState(false);
  const active = manifests[0];

  return (
    <Screen style={{ paddingTop: insets.top }}>
      <Header
        eyebrow="TORRENT / TRANSIT CONTROL"
        title="Active manifest"
        right={<IconButton icon="message-square" label="Open pilot survey" onPress={() => setSurveyOpen(true)} active={pendingFeedback > 0} />}
      />
      <View style={{ paddingHorizontal: 16, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 10, fontFamily: 'monospace', color: colors.primary, fontWeight: '700' }}>
          COURIER: AMANTLE K. (TR-104)
        </Text>
        <Text style={{ fontSize: 10, fontFamily: 'monospace', color: colors.mutedForeground }}>
          bloodchain.life
        </Text>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.signalRow, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <View style={styles.signalLeft}>
            <View style={[styles.liveDot, { backgroundColor: colors.accent }]} />
            <Text style={[styles.signalText, { color: colors.foreground }]}>DEVICE ONLINE</Text>
          </View>
          <Text style={[styles.signalMeta, { color: colors.mutedForeground }]}>{pendingFeedback ? `${pendingFeedback} FEEDBACK QUEUED` : 'LOCAL CACHE SYNCED'}</Text>
        </View>

        <SectionLabel>PRIMARY DISPATCH</SectionLabel>
        <ManifestCard manifest={active} onAdvance={(status) => updateManifestStatus(active.id, status)} />

        <SectionLabel>UPCOMING RUNS</SectionLabel>
        {manifests.slice(1).map((manifest) => (
          <ManifestRow key={manifest.id} manifest={manifest} onPress={() => updateManifestStatus(manifest.id, 'Picked Up')} />
        ))}

        <View style={[styles.protocolCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="shield" size={18} color={colors.primary} />
          <View style={styles.protocolCopy}>
            <Text style={[styles.protocolTitle, { color: colors.foreground }]}>Cold-chain protocol</Text>
            <Text style={[styles.protocolBody, { color: colors.mutedForeground }]}>Keep cooler closed. Scan every custody event. Log temperature before handover.</Text>
          </View>
        </View>
      </ScrollView>
      <SurveyModal visible={surveyOpen} onClose={() => setSurveyOpen(false)} />
    </Screen>
  );
}

function ManifestCard({ manifest, onAdvance }: { manifest: Manifest; onAdvance: (status: TransitStatus) => void }) {
  const colors = useColors();
  const next = statusSteps[Math.min(statusSteps.indexOf(manifest.status) + 1, statusSteps.length - 1)];
  return (
    <View style={[styles.manifestCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.cardTop}>
        <Text style={[styles.dispatch, { color: colors.mutedForeground }]}>{manifest.dispatch}</Text>
        <StatusPill status={manifest.status} />
      </View>
      <Text style={[styles.route, { color: colors.foreground }]}>{manifest.route}</Text>
      <View style={[styles.routeLine, { backgroundColor: colors.border }]}>
        <View style={[styles.routePoint, { backgroundColor: colors.primary }]} />
        <View style={[styles.routeDash, { borderColor: colors.mutedForeground }]} />
        <View style={[styles.routePoint, { backgroundColor: colors.accent }]} />
      </View>
      <View style={styles.routeLabels}>
        <Text style={[styles.routeLabel, { color: colors.mutedForeground }]}>{manifest.from}</Text>
        <Text style={[styles.routeLabel, { color: colors.mutedForeground, textAlign: 'right' }]}>{manifest.to}</Text>
      </View>
      <View style={[styles.units, { borderTopColor: colors.border, borderBottomColor: colors.border }]}>
        {manifest.units.map((unit) => (
          <View key={unit.label} style={styles.unit}>
            <Text style={[styles.unitCount, { color: colors.primary }]}>{unit.count}×</Text>
            <View>
              <Text style={[styles.unitLabel, { color: colors.foreground }]}>{unit.label}</Text>
              <Text style={[styles.unitType, { color: colors.mutedForeground }]}>{unit.type}</Text>
            </View>
          </View>
        ))}
      </View>
      <View style={styles.cardBottom}>
        <View>
          <Text style={[styles.etaLabel, { color: colors.mutedForeground }]}>TARGET ARRIVAL</Text>
          <Text style={[styles.eta, { color: colors.foreground }]}>{manifest.eta} <Text style={styles.etaZone}>CAT</Text></Text>
        </View>
        <ActionButton title={manifest.status === 'Delivered' ? 'COMPLETE' : `MARK ${next.toUpperCase()}`} icon={manifest.status === 'Delivered' ? 'check' : 'arrow-right'} onPress={() => onAdvance(next)} disabled={manifest.status === 'Delivered'} />
      </View>
    </View>
  );
}

function ManifestRow({ manifest, onPress }: { manifest: Manifest; onPress: () => void }) {
  const colors = useColors();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.manifestRow, { backgroundColor: colors.card, borderColor: colors.border }, pressed && { opacity: 0.7 }]}>
      <View style={styles.rowIcon}><Feather name="truck" size={18} color={colors.primary} /></View>
      <View style={styles.rowCopy}>
        <Text numberOfLines={1} style={[styles.rowRoute, { color: colors.foreground }]}>{manifest.route}</Text>
        <Text style={[styles.rowMeta, { color: colors.mutedForeground }]}>{manifest.cooler} · ETA {manifest.eta}</Text>
      </View>
      <StatusPill status={manifest.status} />
    </Pressable>
  );
}

function SurveyModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const colors = useColors();
  const { submitFeedback } = useTransit();
  const [roadRating, setRoadRating] = useState(0);
  const [scanRating, setScanRating] = useState(0);
  const [note, setNote] = useState('');
  const [result, setResult] = useState<'sent' | 'queued' | null>(null);

  const save = async () => {
    if (!roadRating || !scanRating) return;
    setResult(await submitFeedback({ roadRating, scanRating, note }));
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.modal, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <View>
              <Text style={[styles.modalEyebrow, { color: colors.primary }]}>PILOT CHECK-IN</Text>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>How was that run?</Text>
            </View>
            <IconButton icon="x" label="Close survey" onPress={onClose} />
          </View>
          {result ? (
            <View style={styles.result}>
              <View style={[styles.resultIcon, { backgroundColor: `${colors.accent}20` }]}><Feather name={result === 'sent' ? 'check' : 'wifi-off'} size={28} color={colors.accent} /></View>
              <Text style={[styles.resultTitle, { color: colors.foreground }]}>{result === 'sent' ? 'Feedback sent' : 'Saved for signal'}</Text>
              <Text style={[styles.resultBody, { color: colors.mutedForeground }]}>{result === 'sent' ? 'Thanks. Your pilot response reached the operations team.' : 'No signal right now. We will send this automatically when the device reconnects.'}</Text>
              <ActionButton title="DONE" onPress={onClose} />
            </View>
          ) : (
            <>
              <Text style={[styles.question, { color: colors.foreground }]}>Road conditions</Text>
              <Rating value={roadRating} onChange={setRoadRating} />
              <Text style={[styles.question, { color: colors.foreground }]}>QR scan speed</Text>
              <Rating value={scanRating} onChange={setScanRating} />
              <Text style={[styles.question, { color: colors.foreground }]}>Driver note <Text style={{ color: colors.mutedForeground }}>(optional)</Text></Text>
              <TextField value={note} onChangeText={setNote} placeholder="Anything the next driver should know?" multiline />
              <ActionButton title="SEND PILOT FEEDBACK" icon="send" onPress={save} disabled={!roadRating || !scanRating} />
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

function Rating({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const colors = useColors();
  return (
    <View style={styles.ratingRow}>
      {[1, 2, 3, 4, 5].map((rating) => (
        <Pressable key={rating} testID={`rating-${rating}`} onPress={() => onChange(rating)} style={[styles.star, { borderColor: rating <= value ? colors.primary : colors.border, backgroundColor: rating <= value ? `${colors.primary}16` : colors.secondary }]}>
          <Feather name="star" size={23} color={rating <= value ? colors.primary : colors.mutedForeground} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 30, gap: 14 },
  signalRow: { minHeight: 42, borderWidth: 1, borderRadius: 6, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  signalLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  liveDot: { width: 8, height: 8, borderRadius: 4 },
  signalText: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1 },
  signalMeta: { fontFamily: 'Inter_600SemiBold', fontSize: 9, letterSpacing: 0.4 },
  manifestCard: { borderWidth: 1, borderRadius: 10, padding: 16, gap: 14 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dispatch: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1 },
  route: { fontFamily: 'Inter_700Bold', fontSize: 21, lineHeight: 27 },
  routeLine: { height: 2, flex: 1, flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  routePoint: { width: 11, height: 11, borderRadius: 6, marginLeft: -1 },
  routeDash: { flex: 1, marginHorizontal: 8, borderTopWidth: 1, borderStyle: 'dashed' },
  routeLabels: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  routeLabel: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 11, lineHeight: 16 },
  units: { flexDirection: 'row', gap: 20, paddingVertical: 12 },
  unit: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  unitCount: { fontFamily: 'Inter_700Bold', fontSize: 21 },
  unitLabel: { fontFamily: 'Inter_700Bold', fontSize: 13 },
  unitType: { fontFamily: 'Inter_500Medium', fontSize: 10, marginTop: 2 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  etaLabel: { fontFamily: 'Inter_700Bold', fontSize: 9, letterSpacing: 0.8 },
  eta: { fontFamily: 'Inter_700Bold', fontSize: 22, marginTop: 3 },
  etaZone: { fontFamily: 'Inter_500Medium', fontSize: 11 },
  manifestRow: { minHeight: 74, borderWidth: 1, borderRadius: 8, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowIcon: { width: 36, height: 36, borderRadius: 6, backgroundColor: '#D9FF4812', alignItems: 'center', justifyContent: 'center' },
  rowCopy: { flex: 1, gap: 4 },
  rowRoute: { fontFamily: 'Inter_700Bold', fontSize: 13 },
  rowMeta: { fontFamily: 'Inter_500Medium', fontSize: 10 },
  protocolCard: { borderWidth: 1, borderRadius: 8, padding: 14, flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  protocolCopy: { flex: 1, gap: 5 },
  protocolTitle: { fontFamily: 'Inter_700Bold', fontSize: 13 },
  protocolBody: { fontFamily: 'Inter_500Medium', fontSize: 12, lineHeight: 17 },
  modalBackdrop: { flex: 1, backgroundColor: '#000000B8', justifyContent: 'flex-end' },
  modal: { borderTopLeftRadius: 18, borderTopRightRadius: 18, borderWidth: 1, padding: 20, paddingBottom: 28, gap: 13 },
  modalHandle: { width: 40, height: 4, backgroundColor: '#8B9A9E66', borderRadius: 2, alignSelf: 'center', marginBottom: 4 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalEyebrow: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.2, marginBottom: 5 },
  modalTitle: { fontFamily: 'Inter_700Bold', fontSize: 23 },
  question: { fontFamily: 'Inter_700Bold', fontSize: 14, marginTop: 4 },
  ratingRow: { flexDirection: 'row', gap: 8 },
  star: { flex: 1, height: 48, borderWidth: 1, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  result: { alignItems: 'center', gap: 12, paddingVertical: 25 },
  resultIcon: { width: 62, height: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center' },
  resultTitle: { fontFamily: 'Inter_700Bold', fontSize: 21 },
  resultBody: { fontFamily: 'Inter_500Medium', fontSize: 13, lineHeight: 18, textAlign: 'center', maxWidth: 280, marginBottom: 8 },
});