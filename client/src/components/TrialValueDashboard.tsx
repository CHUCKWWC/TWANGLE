import { useQuery } from "@tanstack/react-query";
import { MessageSquare, ClipboardList, Calendar, Heart } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

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

export function TrialValueDashboard() {
  const { data: progress, isLoading } = useQuery<TrialProgress>({
    queryKey: ["/api/trial/progress"],
    staleTime: 0, // Always refetch to show updated metrics
    refetchOnMount: true, // Refetch when component mounts
  });

  if (isLoading || !progress?.onTrial) {
    return null;
  }

  const { metrics, daysRemaining } = progress;
  const totalValue = metrics.chatSessions + metrics.assessments + metrics.retreats + metrics.dateNights;
  const isUrgent = daysRemaining <= 2;

  const valueItems = [
    {
      icon: MessageSquare,
      label: "AI Coaching Conversations",
      count: metrics.chatSessions,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      icon: ClipboardList,
      label: "Assessments Completed",
      count: metrics.assessments,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      icon: Calendar,
      label: "Retreat Plans Saved",
      count: metrics.retreats,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      icon: Heart,
      label: "Date Nights Planned",
      count: metrics.dateNights,
      color: "text-rose-500",
      bgColor: "bg-rose-500/10",
    },
  ];

  return (
    <Card data-testid="card-trial-value">
      <CardHeader>
        <CardTitle>
          {isUrgent ? "🔥 Don't Lose Your Progress!" : "Your Trial Progress"}
        </CardTitle>
        <CardDescription>
          {isUrgent 
            ? `Your trial ends in ${daysRemaining} ${daysRemaining === 1 ? "day" : "days"}. Subscribe now to keep everything you've created.`
            : `You've created ${totalValue} items during your trial. Keep building!`
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {valueItems.map((item) => (
            <div
              key={item.label}
              className={`flex items-center gap-3 p-4 rounded-lg ${item.bgColor}`}
              data-testid={`metric-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <div className={`p-2 rounded-md bg-background/50`}>
                <item.icon className={`h-5 w-5 ${item.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-2xl font-bold" data-testid={`count-${item.label.toLowerCase().replace(/\s+/g, "-")}`}>
                  {item.count}
                </div>
                <div className="text-sm text-muted-foreground truncate">
                  {item.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        {totalValue > 0 && (
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <p className="text-sm text-center">
              {isUrgent ? (
                <span className="font-semibold text-rose-500">
                  All of this will be lost when your trial ends!
                </span>
              ) : (
                <span>
                  Keep creating and exploring. Your trial includes full access to everything.
                </span>
              )}
            </p>
            
            <Link href="/paywall">
              <Button 
                className="w-full" 
                size="lg"
                variant={isUrgent ? "default" : "outline"}
                data-testid="button-subscribe-from-dashboard"
              >
                {isUrgent ? "Subscribe to Keep Your Progress" : "View Subscription Plans"}
              </Button>
            </Link>
          </div>
        )}

        {totalValue === 0 && (
          <div className="text-center py-6 space-y-3">
            <p className="text-muted-foreground">
              Start exploring Twangle's features to see your progress here!
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Link href="/coach">
                <Button variant="outline" size="sm" data-testid="button-try-coach">
                  Try AI Coach
                </Button>
              </Link>
              <Link href="/assessment">
                <Button variant="outline" size="sm" data-testid="button-try-assessment">
                  Take Assessment
                </Button>
              </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
