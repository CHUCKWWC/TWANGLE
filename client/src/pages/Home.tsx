import { useState, useEffect } from "react";
import Dashboard from "@/components/Dashboard";
import { AppHeader } from "@/components/AppHeader";
import { RelationshipProgressDialog } from "@/components/RelationshipProgressDialog";

export default function Home() {
  const [showProgressDialog, setShowProgressDialog] = useState(false);

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

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <Dashboard />
      <RelationshipProgressDialog 
        open={showProgressDialog} 
        onOpenChange={setShowProgressDialog}
      />
    </div>
  );
}
