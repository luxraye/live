import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi } from './useApi';

export interface DonationRequest {
  id: number;
  blood_type: string;
  priority: 'critical' | 'planned';
  facility_name: string;
  description: string;
  district: string | null;
  latitude: number | null;
  longitude: number | null;
  response_count: number;
  is_open: boolean;
  created_at: string;
  age?: string;
}

export function useDonationRequests(params?: { priority?: string; bloodType?: string }) {
  const { apiFetch } = useApi();
  const searchParams = new URLSearchParams();
  if (params?.priority) searchParams.set('priority', params.priority);
  if (params?.bloodType) searchParams.set('bloodType', params.bloodType);
  const qs = searchParams.toString();
  return useQuery<DonationRequest[]>({
    queryKey: ['network-requests', params],
    queryFn: () => apiFetch<DonationRequest[]>(`/network/requests${qs ? `?${qs}` : ''}`),
    staleTime: 2 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
}

export function useRespondToRequest() {
  const { apiFetch } = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (requestId: number) =>
      apiFetch<{ responded: boolean; responseCount: number }>(`/network/requests/${requestId}/respond`, { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['network-requests'] }),
  });
}
