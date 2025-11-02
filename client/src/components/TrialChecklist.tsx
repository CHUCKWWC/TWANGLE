import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Check, ChevronDown, ChevronUp, Sparkles, MessageSquare, ClipboardList, Calendar, Heart, BookOpen } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  icon: any;
  linkTo: string;
  isComplete: boolean;
  color: string;
  bgColor: string;
}

export function TrialChecklist() {
  const [isExpanded, setIsExpanded] = useState(true);

  const { data: progress, isLoading } = useQuery<TrialProgress>({
    queryKey: ["/api/trial/progress"],
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  if (isLoading || !progress?.onTrial) {
    return null;
  }

  const { metrics } = progress;

  const checklistItems: ChecklistItem[] = [
    {
      id: "coach",
      title: "Try AI Coach Charles",
      description: "Get personalized relationship guidance",
      icon: MessageSquare,
      linkTo: "/coach",
      isComplete: metrics.chatSessions > 0,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      id: "assessment",
      title: "Complete Attachment Assessment",
      description: "Discover your attachment style",
      icon: ClipboardList,
      linkTo: "/assessment",
      isComplete: metrics.assessments > 0,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      id: "retreat",
      title: "Plan a Couples Retreat",
      description: "Create your personalized getaway",
      icon: Calendar,
      linkTo: "/retreat",
      isComplete: metrics.retreats > 0,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      id: "datenight",
      title: "Save a Date Night Idea",
      description: "Get AI-powered date suggestions",
      icon: Heart,
      linkTo: "/datenight",
      isComplete: metrics.dateNights > 0,
      color: "text-rose-500",
      bgColor: "bg-rose-500/10",
    },
  ];

  const completedCount = checklistItems.filter(item => item.isComplete).length;
  const totalCount = checklistItems.length;
  const percentComplete = (completedCount / totalCount) * 100;
  const isFullyComplete = completedCount === totalCount;

  return (
    <Card className="border-primary/20" data-testid="card-trial-checklist">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className={`rounded-full p-2 ${isFullyComplete ? 'bg-green-500/10' : 'bg-primary/10'}`}>
              {isFullyComplete ? (
                <Sparkles className="h-5 w-5 text-green-500" />
              ) : (
                <Sparkles className="h-5 w-5 text-primary" />
              )}
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg font-display">
                {isFullyComplete ? "🎉 Trial Unlocked!" : "Getting Started Checklist"}
              </CardTitle>
              <CardDescription>
                {isFullyComplete 
                  ? "You've tried everything! Ready to continue?" 
                  : `${completedCount} of ${totalCount} features explored`
                }
              </CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExpanded(!isExpanded)}
            data-testid="button-toggle-checklist"
          >
            {isExpanded ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </Button>
        </div>
        
        {!isFullyComplete && (
          <Progress 
            value={percentComplete} 
            className="h-2 mt-3"
            data-testid="progress-checklist"
          />
        )}
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-2">
          {checklistItems.map((item) => (
            <Link key={item.id} href={item.linkTo}>
              <div
                className={`flex items-center gap-3 p-3 rounded-lg transition-all hover-elevate active-elevate-2 ${
                  item.isComplete ? 'bg-muted/50' : item.bgColor
                }`}
                data-testid={`checklist-item-${item.id}`}
              >
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  item.isComplete ? 'bg-green-500/20' : 'bg-background'
                }`}>
                  {item.isComplete ? (
                    <Check className="h-5 w-5 text-green-500" data-testid={`check-${item.id}`} />
                  ) : (
                    <item.icon className={`h-5 w-5 ${item.color}`} />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-sm ${item.isComplete ? 'text-muted-foreground line-through' : ''}`}>
                    {item.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.description}
                  </p>
                </div>

                {!item.isComplete && (
                  <Button size="sm" variant="ghost" data-testid={`button-start-${item.id}`}>
                    Start
                  </Button>
                )}
              </div>
            </Link>
          ))}

          {isFullyComplete && (
            <div className="mt-4 p-4 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-sm mb-1">
                    🌟 Amazing! You've explored everything
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Continue your relationship journey with full access
                  </p>
                </div>
                <Button asChild variant="default" size="sm" data-testid="button-view-plans">
                  <Link href="/pricing">
                    View Plans
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
