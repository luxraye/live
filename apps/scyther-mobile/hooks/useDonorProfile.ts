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

export const DEMO_DONOR_PROFILE: DonorProfile = {
  id: 1,
  clerk_user_id: 'user_donor_001',
  first_name: 'Kabo',
  last_name: 'Tau',
  blood_type: 'O-',
  district: 'Gaborone Central',
  phone: '+267 72 100 240',
  location_enabled: true,
  verification_level: 2,
  created_at: new Date(Date.now() - 90 * 86400000).toISOString(),
  updated_at: new Date().toISOString(),
};

export function useDonorProfile() {
  const { apiFetch } = useApi();
  return useQuery<DonorProfile | null>({
    queryKey: ['donor-profile'],
    queryFn: async () => {
      try {
        const res = await apiFetch<DonorProfile | null>('/donor/me');
        return res ?? DEMO_DONOR_PROFILE;
      } catch {
        return DEMO_DONOR_PROFILE;
      }
    },
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
