import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from './useApi';

export interface DonorProfile {
  id: number;
  clerk_user_id: string;
  first_name: string;
  last_name: string;
  blood_type: string | null;
  district: string | null;
  phone: string | null;
  location_enabled: boolean;
  verification_level: number;
  created_at: string;
  updated_at: string;
}

export function useDonorProfile() {
  const { apiFetch } = useApi();
  return useQuery<DonorProfile | null>({
    queryKey: ['donor-profile'],
    queryFn: () => apiFetch<DonorProfile | null>('/donor/me'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateDonorProfile() {
  const { apiFetch } = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Omit<DonorProfile, 'id' | 'clerk_user_id' | 'created_at' | 'updated_at'>>) =>
      apiFetch<DonorProfile>('/donor/me', { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: (updated) => {
      queryClient.setQueryData(['donor-profile'], updated);
    },
  });
}
