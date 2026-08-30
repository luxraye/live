import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActionButton, Header, IconButton, Screen, SectionLabel } from '@/components/TransitUI';
import { useTransit } from '@/lib/TransitContext';
import { useColors } from '@/hooks/useColors';

export default function HandoffScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { waypoints, captureWaypoint, updateManifestStatus, manifests } = useTransit();
  const [signed, setSigned] = useState(false);
  const [captured, setCaptured] = useState(false);

  const waypoint = async () => {
    const hasGps = await captureWaypoint('Receiving ward · Molepolole Hospital');
    setCaptured(true);
    if (!hasGps) Alert.alert('Waypoint saved locally', 'Location permission was not available. The custody event is saved and can be reconciled later.');
  };

  const deliver = () => {
    if (!signed || !captured) return;
    updateManifestStatus(manifests[0].id, 'Delivered');
    Alert.alert('Handoff complete', 'The dispatch is now marked delivered.');
  };

  return (
    <Screen style={{ paddingTop: insets.top }}>
      <Header eyebrow="CUSTODY / RECEIVING WARD" title="Handoff" right={<IconButton icon="map-pin" label="GPS status" active={captured} onPress={waypoint} />} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.destination, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.destinationLabel, { color: colors.mutedForeground }]}>DELIVER TO</Text>
          <Text style={[styles.destinationTitle, { color: colors.foreground }]}>Molepolole Hospital</Text>
          <Text style={[styles.destinationMeta, { color: colors.mutedForeground }]}>Receiving ward · Dispatch TT-2408-01</Text>
          <View style={styles.destinationLine}><Feather name="navigation" size={15} color={colors.primary} /><Text style={[styles.destinationGps, { color: colors.primary }]}>Waypoint required at handover</Text></View>
        </View>

        <SectionLabel>TRANSFER CHECKLIST</SectionLabel>
        <ChecklistRow label="Cooler crate scanned" detail="BWB-00481" complete />
        <ChecklistRow label="Temperature recorded" detail="4.2°C · Within range" complete />
        <ChecklistRow label="Unit bags scanned" detail="2 of 2 units verified" complete />
        <ChecklistRow label="Recipient sign-off" detail={signed ? 'Signed by receiving staff' : 'Tap to capture digital sign-off'} complete={signed} onPress={() => setSigned(true)} />

        <SectionLabel>PHYSICAL CUSTODY</SectionLabel>
        <View style={[styles.gpsCard, { borderColor: captured ? colors.accent : colors.border, backgroundColor: captured ? `${colors.accent}12` : colors.secondary }]}>
          <View style={[styles.gpsIcon, { backgroundColor: captured ? colors.accent : colors.muted }]}><Feather name={captured ? 'check' : 'map-pin'} size={20} color={captured ? colors.accentForeground : colors.mutedForeground} /></View>
          <View style={styles.gpsCopy}><Text style={[styles.gpsTitle, { color: colors.foreground }]}>{captured ? 'Waypoint captured' : 'Capture GPS waypoint'}</Text><Text style={[styles.gpsBody, { color: colors.mutedForeground }]}>{captured ? `${waypoints[0]?.time ?? 'Now'} · location attached to handoff record` : 'Uses the device location to verify physical transfer.'}</Text></View>
          {!captured ? <Pressable testID="button-capture-gps" onPress={waypoint} style={[styles.smallButton, { backgroundColor: colors.primary }]}><Text style={[styles.smallButtonText, { color: colors.primaryForeground }]}>CAPTURE</Text></Pressable> : null}
        </View>

        <ActionButton title="COMPLETE CUSTODY HANDOFF" icon="check-circle" onPress={deliver} disabled={!signed || !captured} />
        <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>Delivery stays locked until recipient sign-off and a GPS waypoint are both recorded.</Text>

        <SectionLabel>WAYPOINT LOG</SectionLabel>
        {waypoints.length === 0 ? <View style={[styles.empty, { borderColor: colors.border }]}><Feather name="map" size={20} color={colors.mutedForeground} /><Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No waypoints recorded on this run.</Text></View> : waypoints.map((item) => <View key={item.id} style={[styles.waypointRow, { borderColor: colors.border, backgroundColor: colors.card }]}><Feather name="map-pin" size={17} color={colors.accent} /><View style={styles.waypointCopy}><Text style={[styles.waypointLabel, { color: colors.foreground }]}>{item.label}</Text><Text style={[styles.waypointMeta, { color: colors.mutedForeground }]}>{item.time} · {item.latitude ? `${item.latitude.toFixed(4)}, ${item.longitude?.toFixed(4)}` : 'local timestamp only'}</Text></View></View>)}
      </ScrollView>
    </Screen>
  );
}

function ChecklistRow({ label, detail, complete, onPress }: { label: string; detail: string; complete: boolean; onPress?: () => void }) {
  const colors = useColors();
  return <Pressable disabled={!onPress} onPress={onPress} style={[styles.checklistRow, { borderColor: colors.border, backgroundColor: colors.card }]}><View style={[styles.checkSquare, { borderColor: complete ? colors.accent : colors.border, backgroundColor: complete ? colors.accent : 'transparent' }]}>{complete ? <Feather name="check" size={14} color={colors.accentForeground} /> : null}</View><View style={styles.checkCopy}><Text style={[styles.checkLabel, { color: colors.foreground }]}>{label}</Text><Text style={[styles.checkDetail, { color: colors.mutedForeground }]}>{detail}</Text></View>{onPress ? <Feather name="chevron-right" size={18} color={colors.mutedForeground} /> : null}</Pressable>;
}

const styles = StyleSheet.create({
  content: { paddingBottom: 28, gap: 12 },
  destination: { borderWidth: 1, borderRadius: 10, padding: 16, gap: 6 },
  destinationLabel: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1 },
  destinationTitle: { fontFamily: 'Inter_700Bold', fontSize: 23, marginTop: 2 },
  destinationMeta: { fontFamily: 'Inter_500Medium', fontSize: 12 },
  destinationLine: { flexDirection: 'row', gap: 7, alignItems: 'center', marginTop: 10 },
  destinationGps: { fontFamily: 'Inter_700Bold', fontSize: 11 },
  checklistRow: { minHeight: 65, borderWidth: 1, borderRadius: 8, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 11 },
  checkSquare: { width: 26, height: 26, borderWidth: 2, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  checkCopy: { flex: 1, gap: 4 },
  checkLabel: { fontFamily: 'Inter_700Bold', fontSize: 13 },
  checkDetail: { fontFamily: 'Inter_500Medium', fontSize: 11 },
  gpsCard: { minHeight: 78, borderWidth: 1, borderRadius: 8, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  gpsIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  gpsCopy: { flex: 1, gap: 4 },
  gpsTitle: { fontFamily: 'Inter_700Bold', fontSize: 13 },
  gpsBody: { fontFamily: 'Inter_500Medium', fontSize: 11, lineHeight: 15 },
  smallButton: { paddingHorizontal: 11, paddingVertical: 10, borderRadius: 6 },
  smallButtonText: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 0.5 },
  disclaimer: { fontFamily: 'Inter_500Medium', fontSize: 11, lineHeight: 16, textAlign: 'center', paddingHorizontal: 15 },
  empty: { minHeight: 72, borderWidth: 1, borderStyle: 'dashed', borderRadius: 8, alignItems: 'center', justifyContent: 'center', gap: 7 },
  emptyText: { fontFamily: 'Inter_500Medium', fontSize: 12 },
  waypointRow: { minHeight: 62, borderWidth: 1, borderRadius: 8, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  waypointCopy: { flex: 1, gap: 4 },
  waypointLabel: { fontFamily: 'Inter_700Bold', fontSize: 12 },
  waypointMeta: { fontFamily: 'Inter_500Medium', fontSize: 10 },
});