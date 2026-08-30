import { useQuery } from '@tanstack/react-query';
import { useApi } from './useApi';

export interface HealthArticle {
  id: number;
  title: string;
  slug: string;
  topic: string;
  read_time_minutes: number;
  icon_name: string;
  published_at: string;
}

export function useArticles(topic?: string) {
  const { apiFetch } = useApi();
  return useQuery<HealthArticle[]>({
    queryKey: ['articles', topic],
    queryFn: () => apiFetch<HealthArticle[]>(`/articles${topic ? `?topic=${topic}` : ''}`),
    staleTime: 10 * 60 * 1000,
  });
}
