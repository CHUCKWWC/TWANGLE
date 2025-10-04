import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertCircle, RefreshCw } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface DebugInfo {
  openaiConfigured: boolean;
  topicCount: number;
  totalQuestions: number;
  questionsByTopic: Record<string, number>;
  topics: Array<{ id: string; name: string }>;
}

export default function DebugPage() {
  const [migrating, setMigrating] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const { toast } = useToast();

  const { data: debugInfo, isLoading, refetch } = useQuery<DebugInfo>({
    queryKey: ["/api/connection/debug"],
  });

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await apiRequest("POST", "/api/connection/seed", {});
      toast({
        title: "Topics Seeded",
        description: "Connection topics have been initialized successfully.",
      });
      refetch();
    } catch (error: any) {
      toast({
        title: "Seed Failed",
        description: error.message || "Failed to seed topics",
        variant: "destructive",
      });
    } finally {
      setSeeding(false);
    }
  };

  const handleMigrate = async () => {
    setMigrating(true);
    try {
      await apiRequest("POST", "/api/connection/migrate-to-ai", {});
      toast({
        title: "Migration Complete",
        description: "Old questions cleared. AI will generate new questions on demand.",
      });
      refetch();
    } catch (error: any) {
      toast({
        title: "Migration Failed",
        description: error.message || "Failed to migrate",
        variant: "destructive",
      });
    } finally {
      setMigrating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading diagnostics...</p>
        </div>
      </div>
    );
  }

  const hasIssues = 
    !debugInfo?.openaiConfigured || 
    debugInfo?.topicCount === 0 || 
    debugInfo?.totalQuestions > 10;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Connection Questions Debug</h1>
          <p className="text-muted-foreground">
            Diagnostic information for the Strengthen Your Connection feature
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {hasIssues ? (
                  <AlertCircle className="h-5 w-5 text-destructive" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                )}
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">OpenAI API Configured</span>
                {debugInfo?.openaiConfigured ? (
                  <Badge variant="default" className="bg-green-500">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Yes
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <XCircle className="w-3 h-3 mr-1" />
                    No
                  </Badge>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Topics in Database</span>
                <Badge variant={debugInfo?.topicCount === 8 ? "default" : "destructive"}>
                  {debugInfo?.topicCount || 0} / 8
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Questions</span>
                <Badge variant={debugInfo?.totalQuestions === 0 ? "default" : "secondary"}>
                  {debugInfo?.totalQuestions || 0}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {!debugInfo?.openaiConfigured && (
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">Missing OpenAI API Key</CardTitle>
                <CardDescription>
                  The OPENAI_API_KEY environment variable is not configured. AI question generation will not work.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Add OPENAI_API_KEY to your production environment secrets and redeploy.
                </p>
              </CardContent>
            </Card>
          )}

          {debugInfo?.topicCount === 0 && (
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">No Topics Found</CardTitle>
                <CardDescription>
                  The connection topics have not been seeded in the database.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleSeed} disabled={seeding} data-testid="button-seed">
                  {seeding ? "Seeding..." : "Seed Topics Now"}
                </Button>
              </CardContent>
            </Card>
          )}

          {debugInfo && debugInfo.totalQuestions > 10 && (
            <Card className="border-yellow-500">
              <CardHeader>
                <CardTitle className="text-yellow-600">Old Static Questions Detected</CardTitle>
                <CardDescription>
                  Your database contains {debugInfo.totalQuestions} old static questions. These must be cleared to enable AI generation.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleMigrate} disabled={migrating} variant="destructive" data-testid="button-migrate">
                  {migrating ? "Migrating..." : "Clear Old Questions"}
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  This will delete all existing questions and responses. New questions will be AI-generated on demand.
                </p>
              </CardContent>
            </Card>
          )}

          {debugInfo && debugInfo.topicCount > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Topics & Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {debugInfo.topics.map((topic) => (
                    <div key={topic.id} className="flex items-center justify-between text-sm">
                      <span className="font-medium">{topic.name}</span>
                      <Badge variant="secondary">
                        {debugInfo.questionsByTopic[topic.name] || 0} questions
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-3">
            <Button onClick={() => refetch()} variant="outline" data-testid="button-refresh">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Diagnostics
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
