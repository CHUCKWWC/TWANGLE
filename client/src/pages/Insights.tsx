import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, TrendingUp, Calendar, Sparkles, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AnalyticsSnapshot {
  id: string;
  userId: string;
  period: string;
  periodType: string;
  metrics: {
    chatSessions?: number;
    assessments?: number;
    retreats?: number;
    dateNights?: number;
    journalEntries?: number;
    healthScore?: number | null;
  };
  insights: string[] | null;
  benchmarks: any | null;
  createdAt: Date;
}

export default function Insights() {
  const { toast } = useToast();
  const [periodType, setPeriodType] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  const { data: snapshot, isLoading } = useQuery<AnalyticsSnapshot | null>({
    queryKey: ['/api/analytics/snapshot', periodType],
  });

  const { data: history } = useQuery<AnalyticsSnapshot[]>({
    queryKey: ['/api/analytics/history', periodType],
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/analytics/snapshot', 'POST', { periodType });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/snapshot', periodType] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/history', periodType] });
      toast({
        title: "Analytics Updated",
        description: "Your progress snapshot has been generated.",
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

  const getPeriodLabel = () => {
    switch (periodType) {
      case 'daily':
        return 'Today';
      case 'weekly':
        return 'This Week';
      case 'monthly':
        return 'This Month';
    }
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
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Progress Insights</h1>
          <p className="text-muted-foreground mt-1">
            Track your relationship growth and engagement patterns
          </p>
        </div>
        <Button
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending}
          data-testid="button-generate-snapshot"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${generateMutation.isPending ? 'animate-spin' : ''}`} />
          {generateMutation.isPending ? "Generating..." : "Update Insights"}
        </Button>
      </div>

      <Tabs value={periodType} onValueChange={(value) => setPeriodType(value as any)}>
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="daily" data-testid="tab-daily">Daily</TabsTrigger>
          <TabsTrigger value="weekly" data-testid="tab-weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly" data-testid="tab-monthly">Monthly</TabsTrigger>
        </TabsList>

        <TabsContent value={periodType} className="space-y-6 mt-6">
          {snapshot ? (
            <>
              <Card data-testid="card-current-metrics">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    {getPeriodLabel()} Metrics
                  </CardTitle>
                  <CardDescription>
                    Generated {new Date(snapshot.createdAt).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {snapshot.metrics.chatSessions !== undefined && (
                      <div className="p-4 rounded-lg bg-muted/50" data-testid="metric-chat-sessions">
                        <div className="text-sm text-muted-foreground mb-1">Coaching Sessions</div>
                        <div className="text-3xl font-bold">{snapshot.metrics.chatSessions}</div>
                      </div>
                    )}
                    
                    {snapshot.metrics.assessments !== undefined && (
                      <div className="p-4 rounded-lg bg-muted/50" data-testid="metric-assessments">
                        <div className="text-sm text-muted-foreground mb-1">Assessments</div>
                        <div className="text-3xl font-bold">{snapshot.metrics.assessments}</div>
                      </div>
                    )}
                    
                    {snapshot.metrics.retreats !== undefined && (
                      <div className="p-4 rounded-lg bg-muted/50" data-testid="metric-retreats">
                        <div className="text-sm text-muted-foreground mb-1">Retreats Planned</div>
                        <div className="text-3xl font-bold">{snapshot.metrics.retreats}</div>
                      </div>
                    )}
                    
                    {snapshot.metrics.dateNights !== undefined && (
                      <div className="p-4 rounded-lg bg-muted/50" data-testid="metric-date-nights">
                        <div className="text-sm text-muted-foreground mb-1">Date Nights</div>
                        <div className="text-3xl font-bold">{snapshot.metrics.dateNights}</div>
                      </div>
                    )}
                    
                    {snapshot.metrics.journalEntries !== undefined && (
                      <div className="p-4 rounded-lg bg-muted/50" data-testid="metric-journal-entries">
                        <div className="text-sm text-muted-foreground mb-1">Journal Entries</div>
                        <div className="text-3xl font-bold">{snapshot.metrics.journalEntries}</div>
                      </div>
                    )}
                    
                    {snapshot.metrics.healthScore && (
                      <div className="p-4 rounded-lg bg-muted/50" data-testid="metric-health-score">
                        <div className="text-sm text-muted-foreground mb-1">Health Score</div>
                        <div className="text-3xl font-bold">{snapshot.metrics.healthScore}</div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {snapshot.insights && snapshot.insights.length > 0 && (
                <Card data-testid="card-insights">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      Insights & Observations
                    </CardTitle>
                    <CardDescription>
                      Based on your recent activity and progress
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {snapshot.insights.map((insight, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-3 p-4 rounded-lg bg-primary/5 border border-primary/10"
                          data-testid={`insight-${index}`}
                        >
                          <TrendingUp className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                          <p className="text-sm">{insight}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {history && history.length > 1 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Historical Snapshots
                    </CardTitle>
                    <CardDescription>
                      View your progress over time
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {history.slice(0, 5).map((snapshot, index) => (
                        <div
                          key={snapshot.id}
                          className="p-4 rounded-lg border hover-elevate"
                          data-testid={`history-item-${index}`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="font-medium mb-2">
                                {new Date(snapshot.period).toLocaleDateString()}
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                                {snapshot.metrics.chatSessions !== undefined && (
                                  <div>
                                    <span className="text-muted-foreground">Sessions: </span>
                                    <span className="font-medium">{snapshot.metrics.chatSessions}</span>
                                  </div>
                                )}
                                {snapshot.metrics.assessments !== undefined && (
                                  <div>
                                    <span className="text-muted-foreground">Assessments: </span>
                                    <span className="font-medium">{snapshot.metrics.assessments}</span>
                                  </div>
                                )}
                                {snapshot.metrics.journalEntries !== undefined && (
                                  <div>
                                    <span className="text-muted-foreground">Journal: </span>
                                    <span className="font-medium">{snapshot.metrics.journalEntries}</span>
                                  </div>
                                )}
                                {snapshot.metrics.healthScore && (
                                  <div>
                                    <span className="text-muted-foreground">Score: </span>
                                    <span className="font-medium">{snapshot.metrics.healthScore}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            {snapshot.insights && snapshot.insights.length > 0 && (
                              <Badge variant="secondary">
                                {snapshot.insights.length} insight{snapshot.insights.length !== 1 ? 's' : ''}
                              </Badge>
                            )}
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
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BarChart3 className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No insights yet</h3>
                <p className="text-center text-muted-foreground mb-6 max-w-md">
                  Generate your first analytics snapshot to track your relationship
                  progress and engagement patterns.
                </p>
                <Button
                  onClick={() => generateMutation.mutate()}
                  disabled={generateMutation.isPending}
                  size="lg"
                  data-testid="button-generate-first"
                >
                  <BarChart3 className="mr-2 h-5 w-5" />
                  {generateMutation.isPending ? "Generating..." : "Generate Insights"}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
