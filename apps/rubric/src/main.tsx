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

const clerkPk = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;

if (!clerkPk) {
  console.warn(
    '[Rubric] VITE_CLERK_PUBLISHABLE_KEY is not set. ' +
    'Copy .env.example to .env and add your Clerk publishable key.',
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
    {clerkPk ? (
      <ClerkProvider publishableKey={clerkPk}>
        {content}
      </ClerkProvider>
    ) : (
      content
    )}
  </ErrorBoundary>,
);
