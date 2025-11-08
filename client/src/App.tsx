// Reference: blueprint:javascript_log_in_with_replit
import { Switch, Route, Router as WouterRouter } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { TrialCountdownBanner } from "@/components/TrialCountdownBanner";
import { TrialExpiringModal } from "@/components/TrialExpiringModal";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import ForgotPassword from "@/pages/ForgotPassword";
import Home from "@/pages/Home";
import Assessment from "@/pages/Assessment";
import Results from "@/pages/Results";
import Coach from "@/pages/Coach";
import Retreat from "@/pages/Retreat";
import DateNight from "@/pages/DateNight";
import Exercises from "@/pages/Exercises";
import NervousSystemRegulation from "@/pages/NervousSystemRegulation";
import Summaries from "@/pages/Summaries";
import Profile from "@/pages/Profile";
import RetreatItinerary from "@/pages/RetreatItinerary";
import SharedAssessment from "@/pages/SharedAssessment";
import TermsOfService from "@/pages/TermsOfService";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import PaywallCustom from "@/pages/PaywallCustom";
import PaySuccess from "@/pages/PaySuccess";
import PayCancel from "@/pages/PayCancel";
import Reports from "@/pages/Reports";
import Analytics from "@/pages/Analytics";
import EmailMonitoring from "@/pages/EmailMonitoring";
import FeedbackReport from "@/pages/FeedbackReport";
import FAQ from "@/pages/FAQ";
import HealthScore from "@/pages/HealthScore";
import PartnerConnection from "@/pages/PartnerConnection";
import Journal from "@/pages/Journal";
import Insights from "@/pages/Insights";
import PartnerInvite from "@/pages/PartnerInvite";
import Conversations from "@/pages/Conversations";
import MerchantOnboard from "@/pages/MerchantOnboard";
import MerchantProducts from "@/pages/MerchantProducts";
import Storefront from "@/pages/Storefront";
import StorefrontSuccess from "@/pages/StorefrontSuccess";
import FortyDayTwangle from "@/pages/FortyDayTwangle";
import Admin from "@/pages/Admin";
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
    <>
      {isAuthenticated && <TrialCountdownBanner />}
      {isAuthenticated && <TrialExpiringModal />}
      <Switch>
        <Route path="/shared/:token" component={SharedAssessment} />
        <Route path="/invite/:token" component={PartnerInvite} />
        <Route path="/login" component={Login} />
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route path="/" component={isAuthenticated ? Home : Landing} />
        <Route path="/assessment" component={Assessment} />
        <Route path="/results" component={Results} />
        <Route path="/coach" component={Coach} />
        <Route path="/retreat" component={Retreat} />
        <Route path="/datenight" component={DateNight} />
        <Route path="/exercises" component={Exercises} />
        <Route path="/exercises/nervous-system" component={NervousSystemRegulation} />
        <Route path="/summaries" component={Summaries} />
        <Route path="/health-score" component={HealthScore} />
        <Route path="/partner-connection" component={PartnerConnection} />
        <Route path="/journal" component={Journal} />
        <Route path="/conversations" component={Conversations} />
        <Route path="/insights" component={Insights} />
        <Route path="/40day" component={FortyDayTwangle} />
        <Route path="/profile" component={Profile} />
        <Route path="/retreat/:id" component={RetreatItinerary} />
        <Route path="/paywall" component={PaywallCustom} />
        <Route path="/pay/success" component={PaySuccess} />
        <Route path="/pay/cancel" component={PayCancel} />
        <Route path="/reports" component={Reports} />
        <Route path="/analytics" component={Analytics} />
        <Route path="/email-monitoring" component={EmailMonitoring} />
        <Route path="/feedback-report" component={FeedbackReport} />
        <Route path="/faq" component={FAQ} />
        <Route path="/terms" component={TermsOfService} />
        <Route path="/privacy" component={PrivacyPolicy} />
        <Route path="/merchant/onboard" component={MerchantOnboard} />
        <Route path="/merchant/products" component={MerchantProducts} />
        <Route path="/storefront" component={Storefront} />
        <Route path="/storefront/success" component={StorefrontSuccess} />
        <Route path="/admin" component={Admin} />
        <Route component={NotFound} />
      </Switch>
    </>
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
