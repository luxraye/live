import { useCallback } from 'react';
import { useAuth } from '@clerk/expo';

const POSTHOG_KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://app.posthog.com';

let _posthog: { capture: (event: string, properties?: Record<string, unknown>) => void; identify: (id: string, properties?: Record<string, unknown>) => void } | null = null;

if (POSTHOG_KEY) {
  try {
    const { PostHog } = require('posthog-react-native');
    _posthog = new PostHog(POSTHOG_KEY, { host: POSTHOG_HOST });
  } catch {
    // PostHog optional fallback
  }
}

export type AnalyticsEvent =
  | 'screen_view'
  | 'sign_up_started'
  | 'sign_up_completed'
  | 'sign_in_completed'
  | 'onboarding_completed'
  | 'donation_request_responded'
  | 'centre_directions_opened'
  | 'verification_submitted'
  | 'article_opened'
  | 'feedback_submitted'
  | 'profile_updated'
  | 'location_enabled';

export function useAnalytics() {
  const { userId } = useAuth();

  const capture = useCallback(
    (event: AnalyticsEvent, properties?: Record<string, unknown>) => {
      if (!_posthog) return;
      try {
        _posthog.capture(event, { userId, ...properties });
      } catch {
        // Silently ignore
      }
    },
    [userId]
  );

  const identify = useCallback(
    (properties?: Record<string, unknown>) => {
      if (!_posthog || !userId) return;
      try {
        _posthog.identify(userId, properties);
      } catch {}
    },
    [userId]
  );

  return { capture, identify };
}
