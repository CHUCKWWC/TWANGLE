import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { X, Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

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

export function TrialCountdownBanner() {
  const [dismissed, setDismissed] = useState(false);

  const { data: progress } = useQuery<TrialProgress>({
    queryKey: ["/api/trial/progress"],
  });

  if (!progress?.onTrial || dismissed) {
    return null;
  }

  const { daysRemaining, totalTrialDays } = progress;
  const percentComplete = ((totalTrialDays - daysRemaining) / totalTrialDays) * 100;

  const isUrgent = daysRemaining <= 2;

  return (
    <div
      className={`relative ${
        isUrgent
          ? "bg-gradient-to-r from-rose-500/10 via-rose-500/5 to-transparent dark:from-rose-500/20 dark:via-rose-500/10"
          : "bg-gradient-to-r from-primary/10 via-primary/5 to-transparent dark:from-primary/20 dark:via-primary/10"
      } border-b`}
      data-testid="banner-trial-countdown"
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Sparkles className={`h-5 w-5 flex-shrink-0 ${isUrgent ? "text-rose-500" : "text-primary"}`} />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-sm">
                  {isUrgent ? "⚠️ Trial Ending Soon!" : "🎁 Free Trial Active"}
                </span>
                <span className="text-sm text-muted-foreground">
                  {daysRemaining} {daysRemaining === 1 ? "day" : "days"} remaining
                </span>
              </div>
              
              <Progress 
                value={percentComplete} 
                className="h-1.5 w-full max-w-xs"
                data-testid="progress-trial"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Link href="/paywall">
              <Button
                size="sm"
                variant={isUrgent ? "default" : "outline"}
                data-testid="button-view-plans"
              >
                {isUrgent ? "Keep Your Progress" : "View Plans"}
              </Button>
            </Link>

            <Button
              size="icon"
              variant="ghost"
              onClick={() => setDismissed(true)}
              className="h-8 w-8"
              data-testid="button-dismiss-banner"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
