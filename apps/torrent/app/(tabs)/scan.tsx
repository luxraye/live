import { Feather } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActionButton, Header, IconButton, Screen, SectionLabel, TextField } from '@/components/TransitUI';
import { useTransit } from '@/lib/TransitContext';
import { useColors } from '@/hooks/useColors';

export default function ScanScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { scans, addScan } = useTransit();
  const [mode, setMode] = useState<'PICKUP' | 'HANDOVER'>('PICKUP');
  const [code, setCode] = useState('');
  const [cameraReady, setCameraReady] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  const record = () => {
    if (!code.trim()) {
      Alert.alert('Code required', 'Enter the crate or unit barcode to record custody.');
      return;
    }
    addScan(code, mode);
    setCode('');
    setCameraReady(false);
  };

  const activateScanner = async () => {
    if (!permission?.granted) {
      const nextPermission = await requestPermission();
      if (!nextPermission.granted) {
        Alert.alert('Camera permission needed', 'Allow camera access to scan custody barcodes, or use manual entry below.');
        return;
      }
    }
    setCameraReady(true);
  };

  return (
    <Screen style={{ paddingTop: insets.top }}>
      <Header eyebrow="CUSTODY / EVENT LOG" title="Scan" right={<IconButton icon="wifi-off" label="Offline mode" onPress={() => undefined} active />} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.modeRow}>
          <ModeButton title="PICKUP" detail="Cooler crate" active={mode === 'PICKUP'} onPress={() => setMode('PICKUP')} />
          <ModeButton title="HANDOVER" detail="Unit bags" active={mode === 'HANDOVER'} onPress={() => setMode('HANDOVER')} />
        </View>
        <View style={[styles.scanner, { backgroundColor: colors.card, borderColor: cameraReady ? colors.primary : colors.border }]}>
          <View style={styles.cameraTop}>
            <View style={[styles.cameraStatus, { backgroundColor: cameraReady ? `${colors.accent}20` : colors.secondary }]}>
              <View style={[styles.liveDot, { backgroundColor: cameraReady ? colors.accent : colors.mutedForeground }]} />
              <Text style={[styles.cameraStatusText, { color: cameraReady ? colors.accent : colors.mutedForeground }]}>{cameraReady ? 'READY TO SCAN' : 'CAMERA STANDBY'}</Text>
            </View>
            <Text style={[styles.cameraHint, { color: colors.mutedForeground }]}>1-TAP MODE</Text>
          </View>
          <View style={styles.scanFrame}>
            {cameraReady ? (
              <CameraView
                style={StyleSheet.absoluteFill}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ['qr', 'code128', 'code39', 'ean13', 'upc_e'] }}
                onBarcodeScanned={({ data }) => {
                  addScan(data, mode);
                  setCameraReady(false);
                }}
              />
            ) : null}
            <View style={[styles.corner, styles.tl, { borderColor: colors.primary }]} />
            <View style={[styles.corner, styles.tr, { borderColor: colors.primary }]} />
            <View style={[styles.corner, styles.bl, { borderColor: colors.primary }]} />
            <View style={[styles.corner, styles.br, { borderColor: colors.primary }]} />
            {!cameraReady ? <><Feather name="maximize" size={40} color={colors.mutedForeground} /><Text style={[styles.scanFrameText, { color: colors.mutedForeground }]}>Tap below to activate scanner</Text></> : <View style={styles.liveScanHint}><Feather name="camera" size={18} color={colors.primary} /><Text style={[styles.scanFrameText, { color: colors.primary }]}>Align barcode inside frame</Text></View>}
          </View>
          <ActionButton title={cameraReady ? 'SCANNER ACTIVE' : 'ACTIVATE SCANNER'} icon="camera" onPress={activateScanner} kind={cameraReady ? 'secondary' : 'primary'} />
        </View>

        <View style={[styles.manualCard, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <SectionLabel>OFFLINE MANUAL ENTRY</SectionLabel>
          <Text style={[styles.manualBody, { color: colors.mutedForeground }]}>Use this when dust, glare, or poor signal makes a camera scan unreliable. The custody event is stored on-device.</Text>
          <TextField value={code} onChangeText={setCode} placeholder={mode === 'PICKUP' ? 'e.g. BWB-00481' : 'e.g. RBC-O-77214'} />
          <ActionButton title={`RECORD ${mode === 'PICKUP' ? 'CRATE' : 'UNIT'} EVENT`} icon="check" onPress={record} />
        </View>

        <SectionLabel>RECENT SCANS</SectionLabel>
        {scans.length === 0 ? (
          <View style={[styles.empty, { borderColor: colors.border }]}>
            <Feather name="inbox" size={22} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No custody events yet</Text>
            <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>Your pickup and handover scans will appear here.</Text>
          </View>
        ) : scans.map((scan) => (
          <View key={scan.id} style={[styles.scanRow, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <View style={[styles.checkIcon, { backgroundColor: `${colors.accent}20` }]}><Feather name="check" size={16} color={colors.accent} /></View>
            <View style={styles.scanCopy}><Text style={[styles.scanLabel, { color: colors.foreground }]}>{scan.label}</Text><Text style={[styles.scanMeta, { color: colors.mutedForeground }]}>{scan.value} · {scan.time}</Text></View>
            <Text style={[styles.scanMode, { color: colors.primary }]}>{scan.mode}</Text>
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}

function ModeButton({ title, detail, active, onPress }: { title: string; detail: string; active: boolean; onPress: () => void }) {
  const colors = useColors();
  return <Pressable onPress={onPress} style={[styles.modeButton, { borderColor: active ? colors.primary : colors.border, backgroundColor: active ? `${colors.primary}16` : colors.secondary }]}><Text style={[styles.modeTitle, { color: active ? colors.primary : colors.foreground }]}>{title}</Text><Text style={[styles.modeDetail, { color: colors.mutedForeground }]}>{detail}</Text></Pressable>;
}

const styles = StyleSheet.create({
  content: { paddingBottom: 28, gap: 14 },
  modeRow: { flexDirection: 'row', gap: 10 },
  modeButton: { flex: 1, minHeight: 68, borderWidth: 1, borderRadius: 8, padding: 12, justifyContent: 'center', gap: 4 },
  modeTitle: { fontFamily: 'Inter_700Bold', fontSize: 12, letterSpacing: 0.9 },
  modeDetail: { fontFamily: 'Inter_500Medium', fontSize: 11 },
  scanner: { borderWidth: 1, borderRadius: 10, padding: 16, gap: 18 },
  cameraTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cameraStatus: { borderRadius: 4, paddingHorizontal: 9, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 6 },
  cameraStatusText: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 0.8 },
  cameraHint: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 0.8 },
  liveDot: { width: 7, height: 7, borderRadius: 4 },
  scanFrame: { minHeight: 220, borderRadius: 6, backgroundColor: '#0B1012', alignItems: 'center', justifyContent: 'center', gap: 13, overflow: 'hidden' },
  corner: { position: 'absolute', width: 35, height: 35, borderWidth: 3 },
  tl: { top: 16, left: 16, borderRightWidth: 0, borderBottomWidth: 0 },
  tr: { top: 16, right: 16, borderLeftWidth: 0, borderBottomWidth: 0 },
  bl: { bottom: 16, left: 16, borderRightWidth: 0, borderTopWidth: 0 },
  br: { bottom: 16, right: 16, borderLeftWidth: 0, borderTopWidth: 0 },
  scanFrameText: { fontFamily: 'Inter_500Medium', fontSize: 12 },
  liveScanHint: { position: 'absolute', bottom: 18, flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#0B1012CC', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 5 },
  manualCard: { borderWidth: 1, borderRadius: 10, padding: 16, gap: 12 },
  manualBody: { fontFamily: 'Inter_500Medium', fontSize: 12, lineHeight: 17, marginTop: -3 },
  empty: { minHeight: 122, borderWidth: 1, borderStyle: 'dashed', borderRadius: 8, alignItems: 'center', justifyContent: 'center', gap: 7, padding: 16 },
  emptyTitle: { fontFamily: 'Inter_700Bold', fontSize: 14 },
  emptyBody: { fontFamily: 'Inter_500Medium', fontSize: 12, textAlign: 'center' },
  scanRow: { minHeight: 65, borderWidth: 1, borderRadius: 8, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  scanCopy: { flex: 1, gap: 4 },
  scanLabel: { fontFamily: 'Inter_700Bold', fontSize: 13 },
  scanMeta: { fontFamily: 'Inter_500Medium', fontSize: 10 },
  scanMode: { fontFamily: 'Inter_700Bold', fontSize: 9, letterSpacing: 0.7 },
});