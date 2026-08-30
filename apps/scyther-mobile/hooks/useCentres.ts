import { useQuery } from '@tanstack/react-query';
import { useApi } from './useApi';

export interface DonationCentre {
  id: number;
  name: string;
  kind: string;
  address: string | null;
  district: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  is_open: boolean;
  opens_at: string | null;
  closes_at: string | null;
  accepts_walk_ins: boolean;
  distance_km?: number | null;
}

export function useCentres(params?: { q?: string; type?: string; lat?: number; lng?: number }) {
  const { apiFetch } = useApi();
  const searchParams = new URLSearchParams();
  if (params?.q) searchParams.set('q', params.q);
  if (params?.type) searchParams.set('type', params.type);
  if (params?.lat != null) searchParams.set('lat', String(params.lat));
  if (params?.lng != null) searchParams.set('lng', String(params.lng));
  const queryString = searchParams.toString();
  return useQuery<DonationCentre[]>({
    queryKey: ['centres', params],
    queryFn: () => apiFetch<DonationCentre[]>(`/centres${queryString ? `?${queryString}` : ''}`),
    staleTime: 5 * 60 * 1000,
  });
}
