import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { AlertTriangle, MessageSquare, ClipboardList, Calendar, Heart, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface TrialProgress {
  onTrial: boolean;
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  daysRemaining: number;
  totalTrialDays: number;
  metrics: {
    chatSessions: number;
    assessments: number;
    retreats: number;
    dateNights: number;
  };
}

export function TrialExpiringModal() {
  const [showModal, setShowModal] = useState(false);
  const [hasShownOnce, setHasShownOnce] = useState(false);

  const { data: progress } = useQuery<TrialProgress>({
    queryKey: ["/api/trial/progress"],
    staleTime: 0, // Always refetch to show updated metrics
    refetchOnMount: true, // Refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when user returns to tab
  });

  useEffect(() => {
    if (progress?.onTrial && progress.daysRemaining <= 2 && !hasShownOnce) {
      setShowModal(true);
      setHasShownOnce(true);
    }
  }, [progress, hasShownOnce]);

  if (!progress?.onTrial || progress.daysRemaining > 2) {
    return null;
  }

  const { metrics, daysRemaining } = progress;
  const totalValue = metrics.chatSessions + metrics.assessments + metrics.retreats + metrics.dateNights;

  const valueItems = [
    {
      icon: MessageSquare,
      label: `${metrics.chatSessions} AI coaching conversation${metrics.chatSessions !== 1 ? "s" : ""}`,
      show: metrics.chatSessions > 0,
    },
    {
      icon: ClipboardList,
      label: `${metrics.assessments} assessment${metrics.assessments !== 1 ? "s" : ""} completed`,
      show: metrics.assessments > 0,
    },
    {
      icon: Calendar,
      label: `${metrics.retreats} retreat plan${metrics.retreats !== 1 ? "s" : ""} saved`,
      show: metrics.retreats > 0,
    },
    {
      icon: Heart,
      label: `${metrics.dateNights} date night${metrics.dateNights !== 1 ? "s" : ""} planned`,
      show: metrics.dateNights > 0,
    },
  ].filter((item) => item.show);

  return (
    <Dialog open={showModal} onOpenChange={setShowModal}>
      <DialogContent className="sm:max-w-md" data-testid="modal-trial-expiring">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-rose-500/10 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-rose-500" />
            </div>
            <DialogTitle className="text-xl">Your Trial Is Ending Soon!</DialogTitle>
          </div>
          <DialogDescription>
            Your free trial ends in <span className="font-bold text-foreground">{daysRemaining} {daysRemaining === 1 ? "day" : "days"}</span>.
            {totalValue > 0 ? " Don't lose everything you've created!" : " Subscribe now to continue building your relationship."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {totalValue > 0 && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <p className="text-sm font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                You'll lose access to:
              </p>
              <ul className="space-y-2">
                {valueItems.map((item, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    <item.icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span>{item.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="bg-primary/5 rounded-lg p-4 space-y-2 border border-primary/20">
            <p className="text-sm font-semibold">✨ Keep Everything for Just $12/month</p>
            <p className="text-xs text-muted-foreground">
              Continue with unlimited AI coaching, assessments, and relationship tools.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Link href="/paywall">
              <Button 
                className="w-full" 
                size="lg"
                onClick={() => setShowModal(false)}
                data-testid="button-subscribe-from-modal"
              >
                Subscribe Now & Keep My Progress
              </Button>
            </Link>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowModal(false)}
              data-testid="button-close-modal"
            >
              I'll decide later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
