import { Feather } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header, IconButton, Screen, SectionLabel } from '@/components/TransitUI';
import { useTransit } from '@/lib/TransitContext';
import { useColors } from '@/hooks/useColors';

export default function MonitorScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { temperature, setTemperature, agitationOn, toggleAgitation } = useTransit();
  useEffect(() => {
    const timer = setInterval(() => setTemperature(Number((4 + Math.sin(Date.now() / 4200) * 0.5).toFixed(1))), 5000);
    return () => clearInterval(timer);
  }, [setTemperature]);
  const tempGood = temperature >= 2 && temperature <= 6;

  return (
    <Screen style={{ paddingTop: insets.top }}>
      <Header eyebrow="TELEMETRY / COOLER BWB-00481" title="Cold-chain" right={<IconButton icon="bluetooth" label="Bluetooth connected" onPress={() => undefined} active />} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.tempCard, { backgroundColor: colors.card, borderColor: tempGood ? colors.accent : colors.destructive }]}>
          <View style={styles.tempHeader}><View><Text style={[styles.sensorLabel, { color: colors.mutedForeground }]}>INTERNAL TEMPERATURE</Text><Text style={[styles.sensorState, { color: tempGood ? colors.accent : colors.destructive }]}>{tempGood ? 'WITHIN RANGE' : 'ACTION REQUIRED'}</Text></View><Feather name="radio" size={21} color={tempGood ? colors.accent : colors.destructive} /></View>
          <Text style={[styles.temperature, { color: colors.foreground }]}>{temperature.toFixed(1)}<Text style={styles.degree}>°C</Text></Text>
          <View style={[styles.rangeTrack, { backgroundColor: colors.secondary }]}><View style={[styles.rangeFill, { backgroundColor: tempGood ? colors.accent : colors.destructive, width: `${Math.min(Math.max(((temperature - 0) / 12) * 100, 4), 96)}%` }]} /><View style={[styles.rangeMarker, { backgroundColor: colors.primary, left: '17%' }]} /><View style={[styles.rangeMarker, { backgroundColor: colors.primary, left: '50%' }]} /></View>
          <View style={styles.rangeLabels}><Text style={[styles.rangeLabel, { color: colors.mutedForeground }]}>0°C</Text><Text style={[styles.rangeLabel, { color: colors.primary }]}>RBC SAFE 2—6°C</Text><Text style={[styles.rangeLabel, { color: colors.mutedForeground }]}>12°C</Text></View>
          <Text style={[styles.lastRead, { color: colors.mutedForeground }]}>LAST READING  ·  JUST NOW  ·  SENSOR LINK STABLE</Text>
        </View>

        <SectionLabel>PRODUCT VALIDATION</SectionLabel>
        <ProductRow name="Red blood cells" range="+2°C to +6°C" active />
        <ProductRow name="Frozen plasma" range="≤ −18°C" />
        <ProductRow name="Platelets" range="+20°C to +24°C" />

        <SectionLabel>PLATELET HANDLING</SectionLabel>
        <Pressable onPress={toggleAgitation} style={[styles.agitation, { backgroundColor: agitationOn ? `${colors.primary}14` : colors.secondary, borderColor: agitationOn ? colors.primary : colors.border }]}>
          <View style={[styles.agitationIcon, { backgroundColor: agitationOn ? colors.primary : colors.muted }]}><Feather name="refresh-cw" size={19} color={agitationOn ? colors.primaryForeground : colors.mutedForeground} /></View>
          <View style={styles.agitationCopy}><Text style={[styles.agitationTitle, { color: colors.foreground }]}>{agitationOn ? 'Gentle agitation active' : 'Gentle agitation off'}</Text><Text style={[styles.agitationBody, { color: colors.mutedForeground }]}>Tap to log platelet rocker status</Text></View>
          <Feather name={agitationOn ? 'check-circle' : 'circle'} size={21} color={agitationOn ? colors.primary : colors.mutedForeground} />
        </Pressable>
        <View style={[styles.alertCard, { backgroundColor: `${colors.warning}12`, borderColor: `${colors.warning}40` }]}><Feather name="alert-triangle" size={18} color={colors.warning} /><Text style={[styles.alertText, { color: colors.warning }]}>Alert threshold: RBC above +10°C. Record a corrective action if this threshold is crossed.</Text></View>
      </ScrollView>
    </Screen>
  );
}

function ProductRow({ name, range, active = false }: { name: string; range: string; active?: boolean }) {
  const colors = useColors();
  return <View style={[styles.productRow, { backgroundColor: colors.card, borderColor: colors.border }]}><View style={[styles.productDot, { backgroundColor: active ? colors.accent : colors.mutedForeground }]} /><View style={styles.productCopy}><Text style={[styles.productName, { color: colors.foreground }]}>{name}</Text><Text style={[styles.productRange, { color: colors.mutedForeground }]}>{range}</Text></View><Text style={[styles.productState, { color: active ? colors.accent : colors.mutedForeground }]}>{active ? 'VALID' : 'STANDBY'}</Text></View>;
}

const styles = StyleSheet.create({
  content: { paddingBottom: 28, gap: 14 },
  tempCard: { borderWidth: 1, borderRadius: 10, padding: 18, gap: 14 },
  tempHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  sensorLabel: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1 },
  sensorState: { fontFamily: 'Inter_700Bold', fontSize: 12, letterSpacing: 0.6, marginTop: 4 },
  temperature: { fontFamily: 'Inter_700Bold', fontSize: 58, letterSpacing: -2 },
  degree: { fontFamily: 'Inter_500Medium', fontSize: 25, letterSpacing: 0 },
  rangeTrack: { height: 8, borderRadius: 4, position: 'relative', overflow: 'visible' },
  rangeFill: { height: 8, borderRadius: 4 },
  rangeMarker: { position: 'absolute', top: -4, width: 2, height: 16 },
  rangeLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  rangeLabel: { fontFamily: 'Inter_700Bold', fontSize: 9, letterSpacing: 0.3 },
  lastRead: { fontFamily: 'Inter_600SemiBold', fontSize: 9, letterSpacing: 0.4 },
  productRow: { minHeight: 62, borderWidth: 1, borderRadius: 8, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 10 },
  productDot: { width: 8, height: 8, borderRadius: 4 },
  productCopy: { flex: 1, gap: 4 },
  productName: { fontFamily: 'Inter_700Bold', fontSize: 13 },
  productRange: { fontFamily: 'Inter_500Medium', fontSize: 11 },
  productState: { fontFamily: 'Inter_700Bold', fontSize: 9, letterSpacing: 0.7 },
  agitation: { minHeight: 76, borderWidth: 1, borderRadius: 8, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 11 },
  agitationIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  agitationCopy: { flex: 1, gap: 5 },
  agitationTitle: { fontFamily: 'Inter_700Bold', fontSize: 13 },
  agitationBody: { fontFamily: 'Inter_500Medium', fontSize: 11 },
  alertCard: { borderWidth: 1, borderRadius: 8, padding: 13, flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  alertText: { flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 11, lineHeight: 16 },
});