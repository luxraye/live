import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppShell } from '@/components/app-shell';
import { AuditPage, DashboardPage, IntakePage, VaultPage } from '@/pages/pages';
import NotFound from '@/pages/not-found';
import Landing from '@/components/Landing';
import { Route, Router as WouterRouter, Switch } from 'wouter';

const queryClient = new QueryClient();

export default function App() {
  const [operatorRole, setOperatorRole] = useState<string | null>(null);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {!operatorRole ? (
          <Landing onLogin={(role) => setOperatorRole(role)} />
        ) : (
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <ErrorBoundary>
              <AppShell operatorRole={operatorRole} onExit={() => setOperatorRole(null)}>
                <Switch>
                  <Route path="/" component={DashboardPage} />
                  <Route path="/intake" component={IntakePage} />
                  <Route path="/vault" component={VaultPage} />
                  <Route path="/audit" component={AuditPage} />
                  <Route component={NotFound} />
                </Switch>
              </AppShell>
            </ErrorBoundary>
          </WouterRouter>
        )}
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
