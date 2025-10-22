import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import Dashboard from "@/components/Dashboard";
import { AppHeader } from "@/components/AppHeader";
import { EmailVerificationBanner } from "@/components/EmailVerificationBanner";
import { RelationshipProgressDialog } from "@/components/RelationshipProgressDialog";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [showProgressDialog, setShowProgressDialog] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const verified = params.get('verified');
    const reason = params.get('reason');

    if (verified === 'true') {
      toast({
        title: "Email Verified!",
        description: "Your email has been successfully verified. Welcome to Twangle!",
      });
      window.history.replaceState({}, '', '/');
    } else if (verified === 'false') {
      let description = "Unable to verify your email.";
      if (reason === 'expired') {
        description = "Your verification link has expired. Please request a new one from your profile.";
      } else if (reason === 'invalid') {
        description = "Invalid verification link. Please request a new one from your profile.";
      } else if (reason === 'error') {
        description = "An error occurred during verification. Please try again later.";
      }
      toast({
        title: "Verification Failed",
        description,
        variant: "destructive",
      });
      window.history.replaceState({}, '', '/');
    }
  }, [toast]);

  useEffect(() => {
    const lastProgressCheck = localStorage.getItem('lastProgressCheck');
    const now = new Date();
    
    if (!lastProgressCheck) {
      const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      localStorage.setItem('lastProgressCheck', oneWeekFromNow.toISOString());
      return;
    }

    const lastCheck = new Date(lastProgressCheck);
    if (now > lastCheck) {
      setTimeout(() => setShowProgressDialog(true), 3000);
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      localStorage.setItem('lastProgressCheck', nextWeek.toISOString());
    }
  }, []);

  const emailVerified = (user as any)?.emailVerified === 1;
  const isAnonymous = (user as any)?.isAnonymous;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="pt-16 px-4 max-w-7xl mx-auto">
        {!isAnonymous && <EmailVerificationBanner emailVerified={emailVerified} />}
      </div>
      <Dashboard />
      <RelationshipProgressDialog 
        open={showProgressDialog} 
        onOpenChange={setShowProgressDialog}
      />
    </div>
  );
}
