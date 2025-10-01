import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Paywall from "@/pages/Paywall";
import PaySuccess from "@/pages/PaySuccess";
import PayCancel from "@/pages/PayCancel";
import TermsOfService from "@/pages/TermsOfService";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import NotFound from "@/pages/not-found";
import { useEffect } from "react";

function AppRoutes() {
  return (
    <Switch>
      <Route path="/" component={Home}/>
      <Route path="/paywall" component={Paywall}/>
      <Route path="/pay/success" component={PaySuccess}/>
      <Route path="/pay/cancel" component={PayCancel}/>
      <Route path="/terms" component={TermsOfService}/>
      <Route path="/privacy" component={PrivacyPolicy}/>
      <Route component={NotFound} />
    </Switch>
  );
}

function AuthenticatedApp() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const currentPath = window.location.pathname;
  
  const isPublicPage = 
    currentPath === "/terms" || 
    currentPath === "/privacy" || 
    currentPath === "/paywall" || 
    currentPath.startsWith("/pay/");

  const { data: subscriptionStatus, isLoading: isLoadingSubscription } = useQuery<{
    active: boolean;
    status: string | null;
    currentPeriodEnd: string | null;
  }>({
    queryKey: ['/api/billing/status'],
    enabled: !!user && !isPublicPage,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (user && !isPublicPage && subscriptionStatus && !subscriptionStatus.active) {
      if (currentPath !== "/paywall") {
        setLocation("/paywall");
      }
    }
  }, [user, isPublicPage, subscriptionStatus, currentPath, setLocation]);

  if (isPublicPage) {
    return <AppRoutes />;
  }

  if (isLoading || (user && isLoadingSubscription)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return <AppRoutes />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter>
          <AuthProvider>
            <Toaster />
            <AuthenticatedApp />
          </AuthProvider>
        </WouterRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
