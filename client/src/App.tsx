// Reference: blueprint:javascript_log_in_with_replit
import { Switch, Route, Router as WouterRouter } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/Landing";
import Home from "@/pages/Home";
import TermsOfService from "@/pages/TermsOfService";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/terms" component={TermsOfService} />
          <Route path="/privacy" component={PrivacyPolicy} />
        </>
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/terms" component={TermsOfService} />
          <Route path="/privacy" component={PrivacyPolicy} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter>
          <Router />
          <Toaster />
        </WouterRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
