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
        title: "Topics & Questions Seeded",
        description: "Connection topics and curated questions have been initialized successfully.",
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

  const handleClearQuestions = async () => {
    setMigrating(true);
    try {
      await apiRequest("POST", "/api/connection/migrate-to-ai", {});
      toast({
        title: "Questions Cleared",
        description: "All questions and responses have been cleared. Run seed to add curated questions.",
      });
      refetch();
    } catch (error: any) {
      toast({
        title: "Clear Failed",
        description: error.message || "Failed to clear questions",
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
    debugInfo?.topicCount === 0 || 
    debugInfo?.totalQuestions === 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Connection Questions Debug</h1>
          <p className="text-muted-foreground">
            Diagnostic information for the Conversation Starters feature
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
                <span className="text-sm font-medium">OpenAI API (for optional analysis)</span>
                {debugInfo?.openaiConfigured ? (
                  <Badge variant="default" className="bg-green-500">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Configured
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <XCircle className="w-3 h-3 mr-1" />
                    Not Configured
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
                <span className="text-sm font-medium">Curated Questions</span>
                <Badge variant={debugInfo?.totalQuestions === 64 ? "default" : debugInfo?.totalQuestions === 0 ? "destructive" : "secondary"}>
                  {debugInfo?.totalQuestions || 0} / 64 expected
                </Badge>
              </div>
            </CardContent>
          </Card>

          {!debugInfo?.openaiConfigured && (
            <Card className="border-yellow-500">
              <CardHeader>
                <CardTitle className="text-yellow-600">Missing OpenAI API Key</CardTitle>
                <CardDescription>
                  The OPENAI_API_KEY environment variable is not configured. AI analysis will not work (questions will still work).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Questions use curated content and work without API key. Add OPENAI_API_KEY only if you want optional AI analysis.
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
                  {seeding ? "Seeding..." : "Seed Topics & Questions Now"}
                </Button>
              </CardContent>
            </Card>
          )}

          {debugInfo && debugInfo.totalQuestions === 0 && debugInfo.topicCount > 0 && (
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">No Questions Found</CardTitle>
                <CardDescription>
                  Topics exist but no curated questions have been seeded. Expected: 64 questions (8 per topic).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleSeed} disabled={seeding} data-testid="button-seed-questions">
                  {seeding ? "Seeding..." : "Seed Curated Questions"}
                </Button>
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
