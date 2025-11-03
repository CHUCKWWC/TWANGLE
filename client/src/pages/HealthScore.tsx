import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, TrendingUp, MessageCircle, Users, Sparkles, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface HealthScore {
  id: string;
  userId: string;
  overallScore: number;
  breakdown: {
    communication: number;
    intimacy: number;
    conflict: number;
    growth: number;
  };
  metrics: {
    chatSessions: number;
    assessments: number;
    retreats?: number;
    dateNights?: number;
    avgSessionRating?: number;
  };
  calculatedAt: Date;
}

export default function HealthScore() {
  const { toast } = useToast();

  const { data: latestScore, isLoading } = useQuery<HealthScore | null>({
    queryKey: ['/api/health-score'],
  });

  const { data: history } = useQuery<HealthScore[]>({
    queryKey: ['/api/health-score/history'],
  });

  const calculateMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/health-score/calculate', {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/health-score'] });
      queryClient.invalidateQueries({ queryKey: ['/api/health-score/history'] });
      toast({
        title: "Health Score Updated",
        description: "Your relationship health score has been recalculated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreGrade = (score: number) => {
    if (score >= 90) return "Excellent";
    if (score >= 80) return "Very Good";
    if (score >= 70) return "Good";
    if (score >= 60) return "Fair";
    return "Needs Attention";
  };

  if (isLoading) {
    return (
      <div className="container max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Relationship Health Score</h1>
          <p className="text-muted-foreground mt-1">
            Track the strength and growth of your relationship
          </p>
        </div>
        <Button
          onClick={() => calculateMutation.mutate()}
          disabled={calculateMutation.isPending}
          data-testid="button-calculate-score"
        >
          <Activity className="mr-2 h-4 w-4" />
          {calculateMutation.isPending ? "Calculating..." : "Update Score"}
        </Button>
      </div>

      {latestScore ? (
        <>
          <Card data-testid="card-overall-score">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary" />
                Overall Health Score
              </CardTitle>
              <CardDescription>
                Last updated: {new Date(latestScore.calculatedAt).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div className="flex-1">
                  <div className={`text-6xl font-bold ${getScoreColor(latestScore.overallScore)}`} data-testid="text-overall-score">
                    {latestScore.overallScore}
                  </div>
                  <div className="text-lg text-muted-foreground mt-1">
                    {getScoreGrade(latestScore.overallScore)}
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  <div className="text-sm text-muted-foreground">Progress Bar</div>
                  <div className="w-full bg-muted rounded-full h-3">
                    <div
                      className="bg-primary h-3 rounded-full transition-all"
                      style={{ width: `${latestScore.overallScore}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card data-testid="card-communication">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Communication
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${getScoreColor(latestScore.breakdown.communication)}`}>
                  {latestScore.breakdown.communication}
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-intimacy">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  Intimacy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${getScoreColor(latestScore.breakdown.intimacy)}`}>
                  {latestScore.breakdown.intimacy}
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-conflict">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Conflict Resolution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${getScoreColor(latestScore.breakdown.conflict)}`}>
                  {latestScore.breakdown.conflict}
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-growth">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Growth
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${getScoreColor(latestScore.breakdown.growth)}`}>
                  {latestScore.breakdown.growth}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Activity Metrics</CardTitle>
              <CardDescription>Your engagement contributes to your health score</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Coaching Sessions</div>
                  <div className="text-2xl font-bold" data-testid="text-chat-sessions">{latestScore.metrics.chatSessions}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Assessments</div>
                  <div className="text-2xl font-bold" data-testid="text-assessments">{latestScore.metrics.assessments}</div>
                </div>
                {latestScore.metrics.retreats !== undefined && (
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Retreats Planned</div>
                    <div className="text-2xl font-bold" data-testid="text-retreats">{latestScore.metrics.retreats}</div>
                  </div>
                )}
                {latestScore.metrics.dateNights !== undefined && (
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Date Nights</div>
                    <div className="text-2xl font-bold" data-testid="text-date-nights">{latestScore.metrics.dateNights}</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {history && history.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Score History</CardTitle>
                <CardDescription>Track your progress over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {history.slice(0, 5).map((score, index) => (
                    <div
                      key={score.id}
                      className="flex items-center justify-between p-3 rounded-md bg-muted/50"
                      data-testid={`history-item-${index}`}
                    >
                      <div className="text-sm text-muted-foreground">
                        {new Date(score.calculatedAt).toLocaleDateString()}
                      </div>
                      <div className={`text-lg font-semibold ${getScoreColor(score.overallScore)}`}>
                        {score.overallScore}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No Health Score Yet</CardTitle>
            <CardDescription>
              Calculate your first relationship health score to see how you're doing
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Sparkles className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-center text-muted-foreground mb-6">
              Your health score is calculated based on your activity, engagement,
              and progress in building a stronger relationship.
            </p>
            <Button
              onClick={() => calculateMutation.mutate()}
              disabled={calculateMutation.isPending}
              size="lg"
              data-testid="button-calculate-first-score"
            >
              <Activity className="mr-2 h-5 w-5" />
              {calculateMutation.isPending ? "Calculating..." : "Calculate Health Score"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
