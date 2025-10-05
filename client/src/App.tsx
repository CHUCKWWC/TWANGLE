// Reference: blueprint:javascript_log_in_with_replit
import { Switch, Route, Router as WouterRouter } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/Landing";
import Home from "@/pages/Home";
import Assessment from "@/pages/Assessment";
import Results from "@/pages/Results";
import Coach from "@/pages/Coach";
import Retreat from "@/pages/Retreat";
import Exercises from "@/pages/Exercises";
import Summaries from "@/pages/Summaries";
import RetreatItinerary from "@/pages/RetreatItinerary";
import SharedAssessment from "@/pages/SharedAssessment";
import TermsOfService from "@/pages/TermsOfService";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import Paywall from "@/pages/Paywall";
import PaySuccess from "@/pages/PaySuccess";
import PayCancel from "@/pages/PayCancel";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/shared/:token" component={SharedAssessment} />
      {!isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/terms" component={TermsOfService} />
          <Route path="/privacy" component={PrivacyPolicy} />
        </>
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/assessment" component={Assessment} />
          <Route path="/results" component={Results} />
          <Route path="/coach" component={Coach} />
          <Route path="/retreat" component={Retreat} />
          <Route path="/exercises" component={Exercises} />
          <Route path="/summaries" component={Summaries} />
          <Route path="/retreat/:id" component={RetreatItinerary} />
          <Route path="/paywall" component={Paywall} />
          <Route path="/pay/success" component={PaySuccess} />
          <Route path="/pay/cancel" component={PayCancel} />
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
