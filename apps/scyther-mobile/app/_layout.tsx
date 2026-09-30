import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { ClerkProvider, ClerkLoaded, useAuth } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

  import { isValidClerkKey, sanitizeClerkKey } from '@/hooks/clerk-utils';

function RootLayoutNav({ hasClerk }: { hasClerk: boolean }) {
  return (
    <Stack screenOptions={{ headerBackTitle: 'Back', headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
      <Stack.Screen name="(feedback)" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="alerts" options={{ headerShown: false }} />
      <Stack.Screen name="verification" options={{ headerShown: false, presentation: 'modal' }} />
    </Stack>
  );
}

class SafeClerkWrapper extends React.Component<{ children: React.ReactNode; fallback: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err: any) {
    console.warn('[Scyther] Clerk initialization bypassed:', err?.message || err);
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  const rawKey =
    process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ||
    process.env.VITE_CLERK_PUBLISHABLE_KEY ||
    process.env.CLERK_PUBLISHABLE_KEY;
  const publishableKey = sanitizeClerkKey(rawKey);
  const hasClerkKey = Boolean(publishableKey);

  // Check if running on web with a production Clerk key on an unmapped domain (e.g. *.onrender.com)
  const isWeb = typeof window !== 'undefined';
  const isProductionKey = publishableKey?.startsWith('pk_live_');
  const isDomainAllowed =
    !isWeb ||
    !isProductionKey ||
    window.location.hostname === 'bloodchain.life' ||
    window.location.hostname.endsWith('.bloodchain.life');

  const enableClerk = hasClerkKey && isDomainAllowed;

  if (isWeb && isProductionKey && !isDomainAllowed) {
    console.info(
      `[Scyther] Clerk production keys require domain "bloodchain.life". Current host is "${window.location.hostname}". Running in sovereign demo mode without Clerk block.`,
    );
  }

  const inner = (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView>
            <KeyboardProvider>
              <RootLayoutNav hasClerk={enableClerk} />
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );

  if (enableClerk) {
    return (
      <SafeClerkWrapper fallback={inner}>
        <ClerkProvider publishableKey={publishableKey!} tokenCache={tokenCache}>
          <ClerkLoaded>
            {inner}
          </ClerkLoaded>
        </ClerkProvider>
      </SafeClerkWrapper>
    );
  }

  return inner;
}
