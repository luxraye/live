import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type TransitStatus = 'Assigned' | 'Picked Up' | 'In Transit' | 'Delivered';
export type ProductType = 'Red Blood Cells' | 'Frozen Plasma' | 'Platelets';

export type Manifest = {
  id: string;
  route: string;
  from: string;
  to: string;
  eta: string;
  dispatch: string;
  status: TransitStatus;
  units: { label: string; count: number; type: ProductType }[];
  cooler: string;
};

export type ScanRecord = {
  id: string;
  value: string;
  label: string;
  time: string;
  mode: 'PICKUP' | 'HANDOVER';
};

export type Waypoint = {
  id: string;
  label: string;
  time: string;
  latitude?: number;
  longitude?: number;
};

type FeedbackDraft = {
  roadRating: number;
  scanRating: number;
  note: string;
};

type TransitContextValue = {
  manifests: Manifest[];
  scans: ScanRecord[];
  waypoints: Waypoint[];
  temperature: number;
  agitationOn: boolean;
  pendingFeedback: number;
  updateManifestStatus: (id: string, status: TransitStatus) => void;
  addScan: (value: string, mode: ScanRecord['mode']) => void;
  setTemperature: (value: number) => void;
  toggleAgitation: () => void;
  captureWaypoint: (label: string) => Promise<boolean>;
  submitFeedback: (draft: FeedbackDraft) => Promise<'sent' | 'queued'>;
};

const STORAGE_KEY = 'torrent-transit-state-v1';

const seedManifests: Manifest[] = [
  {
    id: 'TT-2408-01',
    route: 'Gaborone Central Blood Bank ➔ Molepolole Hospital',
    from: 'Princess Marina dispatch dock',
    to: 'Molepolole Hospital · Receiving ward',
    eta: '12:40',
    dispatch: 'DISPATCH 01 / TODAY',
    status: 'In Transit',
    cooler: 'CRATE BWB-00481',
    units: [
      { label: 'O− RBC', count: 4, type: 'Red Blood Cells' },
      { label: 'AB+ Plasma', count: 2, type: 'Frozen Plasma' },
    ],
  },
  {
    id: 'TT-2408-02',
    route: 'Gaborone Central Blood Bank ➔ Kanye Primary Hospital',
    from: 'Gaborone Central Blood Bank',
    to: 'Kanye Primary Hospital · Blood bank',
    eta: '15:10',
    dispatch: 'DISPATCH 02 / TODAY',
    status: 'Assigned',
    cooler: 'CRATE BWB-00493',
    units: [
      { label: 'A+ RBC', count: 3, type: 'Red Blood Cells' },
      { label: 'Platelets', count: 1, type: 'Platelets' },
    ],
  },
];

const defaultValue: TransitContextValue = {
  manifests: seedManifests,
  scans: [],
  waypoints: [],
  temperature: 4.2,
  agitationOn: false,
  pendingFeedback: 0,
  updateManifestStatus: () => undefined,
  addScan: () => undefined,
  setTemperature: () => undefined,
  toggleAgitation: () => undefined,
  captureWaypoint: async () => false,
  submitFeedback: async () => 'queued',
};

const TransitContext = createContext<TransitContextValue>(defaultValue);

export function TransitProvider({ children }: { children: React.ReactNode }) {
  const [manifests, setManifests] = useState<Manifest[]>(seedManifests);
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [temperature, setTemperatureState] = useState(4.2);
  const [agitationOn, setAgitationOn] = useState(false);
  const [pendingFeedback, setPendingFeedback] = useState(0);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (!raw) return;
      try {
        const saved = JSON.parse(raw) as Partial<TransitContextValue>;
        if (saved.manifests) setManifests(saved.manifests);
        if (saved.scans) setScans(saved.scans);
        if (saved.waypoints) setWaypoints(saved.waypoints);
        if (typeof saved.temperature === 'number') setTemperatureState(saved.temperature);
        if (typeof saved.agitationOn === 'boolean') setAgitationOn(saved.agitationOn);
        if (typeof saved.pendingFeedback === 'number') setPendingFeedback(saved.pendingFeedback);
      } catch {
        // A corrupt local cache should not block a driver from operating.
      }
    });
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ manifests, scans, waypoints, temperature, agitationOn, pendingFeedback }),
    );
  }, [manifests, scans, waypoints, temperature, agitationOn, pendingFeedback]);

  const updateManifestStatus = (id: string, status: TransitStatus) => {
    setManifests((current) => current.map((manifest) => (manifest.id === id ? { ...manifest, status } : manifest)));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const addScan = (value: string, mode: ScanRecord['mode']) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const record: ScanRecord = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      value: trimmed,
      label: mode === 'PICKUP' ? 'Cooler crate verified' : 'Unit bag verified',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      mode,
    };
    setScans((current) => [record, ...current].slice(0, 12));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const captureWaypoint = async (label: string) => {
    let coords: Location.LocationObjectCoords | undefined;
    if (Location.requestForegroundPermissionsAsync) {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status === 'granted') {
        const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        coords = current.coords;
      }
    }
    setWaypoints((current) => [
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        label,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        latitude: coords?.latitude,
        longitude: coords?.longitude,
      },
      ...current,
    ]);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    return Boolean(coords);
  };

  const submitFeedback = async (draft: FeedbackDraft) => {
    const payload = {
      platform: 'torrent-transit',
      responses: {
        roadRating: draft.roadRating,
        scanRating: draft.scanRating,
        note: draft.note,
      },
      appVersion: '1.0.0-torrent',
    };
    try {
      const baseUrl = (process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:5000/api').replace(/\/$/, '');
      const response = await fetch(`${baseUrl}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Feedback endpoint unavailable');
      return 'sent' as const;
    } catch {
      setPendingFeedback((count) => count + 1);
      await AsyncStorage.setItem(
        'torrent-transit-feedback-queue',
        JSON.stringify({ payload, queuedAt: new Date().toISOString() }),
      );
      return 'queued' as const;
    }
  };

  const value = useMemo(
    () => ({
      manifests,
      scans,
      waypoints,
      temperature,
      agitationOn,
      pendingFeedback,
      updateManifestStatus,
      addScan,
      setTemperature: setTemperatureState,
      toggleAgitation: () => setAgitationOn((current) => !current),
      captureWaypoint,
      submitFeedback,
    }),
    [manifests, scans, waypoints, temperature, agitationOn, pendingFeedback],
  );

  return <TransitContext.Provider value={value}>{children}</TransitContext.Provider>;
}

export function useTransit() {
  return useContext(TransitContext);
}