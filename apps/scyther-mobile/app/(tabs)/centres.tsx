import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useCentres, DonationCentre } from '@/hooks/useCentres';

const fallbackPlaces = [
  { id: 1, name: 'Princess Marina Hospital', kind: 'National Hospital', distance_km: 2.4, is_open: true, accepts_walk_ins: true, latitude: -24.6478, longitude: 25.9073 },
  { id: 2, name: 'Gaborone Private Hospital', kind: 'Regional Clinic', distance_km: 5.8, is_open: true, accepts_walk_ins: true, latitude: -24.6366, longitude: 25.8960 },
  { id: 3, name: 'Block 8 Clinic', kind: 'Regional Clinic', distance_km: 8.1, is_open: false, accepts_walk_ins: false, latitude: -24.6240, longitude: 25.8861 },
  { id: 4, name: 'Broadhurst Mobile Drive', kind: 'Mobile Drive', distance_km: 9.6, is_open: true, accepts_walk_ins: true, latitude: -24.6350, longitude: 25.8780 },
];

export default function CentresScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All centres');
  const [locationState, setLocationState] = useState<'idle' | 'finding' | 'ready'>('idle');
  const [coords, setCoords] = useState<{ lat?: number; lng?: number }>({});

  const { data: liveCentres, isLoading } = useCentres({
    q: searchQuery || undefined,
    lat: coords.lat,
    lng: coords.lng,
  });

  const findCentres = async () => {
    setLocationState('finding');
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setLocationState('idle');
        Alert.alert('Location not enabled', 'You can still browse all donation centres.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      setLocationState('ready');
    } catch {
      setLocationState('idle');
    }
  };

  const openGoogleMapsRoute = (centre: { latitude?: number | null; longitude?: number | null; name: string }) => {
    if (centre.latitude && centre.longitude) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${centre.latitude},${centre.longitude}&travelmode=driving`;
      Linking.openURL(url);
    } else {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(centre.name + ' Botswana')}`;
      Linking.openURL(url);
    }
  };

  const places = (liveCentres && liveCentres.length > 0 ? liveCentres : fallbackPlaces).filter((p) => {
    if (activeFilter === 'Open now') return p.is_open;
    if (activeFilter === 'Walk-ins') return p.accepts_walk_ins;
    if (activeFilter === '< 5 km') return (p.distance_km ?? 99) <= 5;
    return true;
  });

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 14, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>DISCOVER & NAVIGATE</Text>
            <Text style={[styles.title, { color: colors.text }]}>Donation centres</Text>
          </View>
          <Pressable onPress={findCentres} style={[styles.filter, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <Feather name={locationState === 'ready' ? 'crosshair' : 'navigation'} size={18} color={locationState === 'ready' ? '#67E8F9' : colors.text} />
          </Pressable>
        </View>

        <View style={[styles.search, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <Feather name="search" size={17} color={colors.mutedForeground} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by area or centre"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, { color: colors.text }]}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {['All centres', 'Open now', 'Walk-ins', '< 5 km'].map((chip) => {
            const isActive = activeFilter === chip;
            return (
              <Pressable
                key={chip}
                onPress={() => setActiveFilter(chip)}
                style={[styles.chip, isActive ? styles.activeChip : { borderColor: colors.border }]}
              >
                <Text style={[styles.chipText, isActive ? styles.activeChipText : { color: colors.mutedForeground }]}>
                  {chip}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.map}>
          <LinearGradient colors={['#091925', '#0B2430', '#07131F']} style={StyleSheet.absoluteFill} />
          <View style={styles.contourOne} />
          <View style={styles.contourTwo} />
          {places.slice(0, 3).map((p, index) => (
            <Pressable
              key={p.name}
              onPress={() => openGoogleMapsRoute(p)}
              style={[styles.bigPin, { left: `${27 + index * 21}%`, top: `${32 + index * 12}%` }]}
            >
              <Feather name="droplet" size={14} color="#fff" />
            </Pressable>
          ))}
          <Pressable onPress={findCentres} style={styles.location}>
            <Feather name="navigation" size={13} color="#67E8F9" />
            <Text style={styles.locationText}>
              {locationState === 'finding' ? 'LOCATING…' : locationState === 'ready' ? 'GPS READY · DIRECT ROUTING' : `${places.length} CENTRES IN VIEW`}
            </Text>
          </Pressable>
        </View>

        <View style={styles.listHeader}>
          <Text style={[styles.listTitle, { color: colors.text }]}>TAP CENTRE FOR GOOGLE MAPS ROUTE</Text>
          <Text style={[styles.listMeta, { color: colors.mutedForeground }]}>
            {locationState === 'ready' ? 'Sorted by distance' : 'Tap GPS to sort'}
          </Text>
        </View>

        {places.map((place) => (
          <Pressable
            key={place.name}
            style={[styles.place, { borderBottomColor: colors.border }]}
            onPress={() => openGoogleMapsRoute(place)}
          >
            <View style={styles.placeIcon}>
              <Feather name="heart" size={17} color="#EF4444" />
            </View>
            <View style={styles.placeCopy}>
              <Text style={[styles.placeName, { color: colors.text }]}>{place.name}</Text>
              <Text style={[styles.placeKind, { color: colors.mutedForeground }]}>
                {place.kind} {place.distance_km ? <Text style={{ color: '#06B6D4' }}>· {place.distance_km.toFixed(1)} km</Text> : ''}
              </Text>
              <View style={styles.openLine}>
                <View style={[styles.statusDot, { backgroundColor: place.is_open ? '#34D399' : '#667085' }]} />
                <Text style={[styles.status, { color: place.is_open ? '#34D399' : colors.mutedForeground }]}>
                  {place.is_open ? 'Open now' : 'Closed'}
                </Text>
              </View>
            </View>
            <View style={styles.routeAction}>
              <Text style={styles.routeText}>Route</Text>
              <Feather name="navigation-2" size={15} color="#67E8F9" />
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  eyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 7 },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -1 },
  filter: { width: 42, height: 42, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  search: { margin: 16, height: 49, borderRadius: 12, borderWidth: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 10 },
  input: { flex: 1, fontSize: 13 },
  chips: { paddingHorizontal: 16, gap: 8, paddingBottom: 16 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 11 },
  activeChip: { backgroundColor: '#B91C1C', borderColor: '#EF4444' },
  activeChipText: { color: '#fff', fontWeight: '700' },
  map: { height: 212, marginHorizontal: 16, borderRadius: 16, overflow: 'hidden', position: 'relative', borderWidth: 1, borderColor: '#1E4856' },
  contourOne: { position: 'absolute', width: 320, height: 130, borderWidth: 1, borderColor: '#1A4651', borderRadius: 200, transform: [{ rotate: '-18deg' }], left: -30, top: 34 },
  contourTwo: { position: 'absolute', width: 410, height: 170, borderWidth: 1, borderColor: '#153744', borderRadius: 220, transform: [{ rotate: '18deg' }], left: 40, top: -20 },
  bigPin: { position: 'absolute', width: 30, height: 30, borderRadius: 18, backgroundColor: '#B91C1C', borderWidth: 3, borderColor: '#FCA5A5', alignItems: 'center', justifyContent: 'center' },
  location: { position: 'absolute', bottom: 13, left: 13, flexDirection: 'row', alignItems: 'center', gap: 6 },
  locationText: { color: '#67E8F9', fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  listHeader: { paddingHorizontal: 16, paddingTop: 25, paddingBottom: 9, flexDirection: 'row', justifyContent: 'space-between' },
  listTitle: { fontSize: 10, fontWeight: '800', letterSpacing: 1.4 },
  listMeta: { fontSize: 10 },
  place: { marginHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 11 },
  placeIcon: { width: 37, height: 37, borderRadius: 11, backgroundColor: '#2D0808', alignItems: 'center', justifyContent: 'center' },
  placeCopy: { flex: 1 },
  placeName: { fontSize: 13, fontWeight: '700' },
  placeKind: { fontSize: 11, marginTop: 4 },
  openLine: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5 },
  statusDot: { width: 6, height: 6, borderRadius: 4 },
  status: { fontSize: 10, fontWeight: '600' },
  routeAction: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#0A2B35', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  routeText: { color: '#67E8F9', fontSize: 11, fontWeight: '700' },
});