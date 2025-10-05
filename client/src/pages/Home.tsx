import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import WelcomeHero from "@/components/WelcomeHero";
import { AppHeader } from "@/components/AppHeader";
import { RelationshipProgressDialog } from "@/components/RelationshipProgressDialog";

export default function Home() {
  const [showProgressDialog, setShowProgressDialog] = useState(false);
  const [, navigate] = useLocation();

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

  const handleStartAssessment = () => {
    navigate("/assessment");
  };

  const handleJumpToCoach = () => {
    navigate("/coach");
  };

  const handlePlanRetreat = () => {
    navigate("/retreat");
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <WelcomeHero
        onStartAssessment={handleStartAssessment}
        onJumpToCoach={handleJumpToCoach}
        onPlanRetreat={handlePlanRetreat}
      />
      <RelationshipProgressDialog 
        open={showProgressDialog} 
        onOpenChange={setShowProgressDialog}
      />
    </div>
  );
}
