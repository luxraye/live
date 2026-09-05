import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import App from './App';
import { ErrorBoundary } from '@/components/error-boundary';

import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10_000,
      retry: 1,
    },
  },
});

import { isValidClerkKey, sanitizeClerkKey } from '@/lib/clerk-utils';

const rawClerkPk = (
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ||
  (typeof process !== 'undefined' && process.env?.CLERK_PUBLISHABLE_KEY) ||
  ''
) as string;

const clerkPk = sanitizeClerkKey(rawClerkPk);
const hasValidClerk = Boolean(clerkPk);

if (!hasValidClerk) {
  if (!rawClerkPk) {
    console.info(
      '[Rubric] VITE_CLERK_PUBLISHABLE_KEY is not defined in the current build. (On Render static sites, environment variables are baked in during build, so make sure to trigger "Manual Deploy -> Clear build cache & deploy" after saving env variables in the Render dashboard). Running in zero-friction sovereign pilot mode.',
    );
  } else {
    console.warn(
      `[Rubric] VITE_CLERK_PUBLISHABLE_KEY was found (${rawClerkPk.slice(0, 8)}... length ${rawClerkPk.length}) but did not pass key format validation. Running in zero-friction sovereign pilot mode.`,
    );
  }
} else {
  console.info(
    `[Rubric] Valid Clerk key detected (${clerkPk!.slice(0, 12)}...). Mounting ClerkProvider.`,
  );
}

const content = (
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);

createRoot(document.getElementById('root')!, {
  onCaughtError: (error, errorInfo) => {
    console.error(error, errorInfo.componentStack);
  },
}).render(
  <ErrorBoundary>
    {hasValidClerk ? (
      <ClerkProvider publishableKey={clerkPk!}>
        {content}
      </ClerkProvider>
    ) : (
      content
    )}
  </ErrorBoundary>,
);
