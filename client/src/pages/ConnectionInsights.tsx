import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Lightbulb, Target, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";

interface Topic {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface Summary {
  id: string;
  topicId: string;
  summary: string;
  insights: string[];
  recommendations: string[];
  createdAt: string;
}

export default function ConnectionInsights() {
  const { data: topics = [], isLoading: topicsLoading } = useQuery<Topic[]>({
    queryKey: ["/api/connection/topics"],
  });

  const { data: summaries = [], isLoading: summariesLoading } = useQuery<Summary[]>({
    queryKey: ["/api/connection/summaries"],
  });

  const topicMap = new Map(topics.map(t => [t.id, t]));

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Link href="/connection">
          <Button variant="ghost" size="sm" className="mb-4" data-testid="button-back-questions">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Questions
          </Button>
        </Link>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold" data-testid="text-page-title">Your Relationship Insights</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            AI-powered analysis of your responses with personalized recommendations to strengthen your relationship.
          </p>
        </div>

        {summariesLoading || topicsLoading ? (
          <div className="space-y-6">
            {[1, 2].map(i => (
              <Card key={i}>
                <CardHeader>
                  <div className="h-6 w-48 bg-muted animate-pulse rounded" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 w-full bg-muted animate-pulse rounded" />
                    <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : summaries.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <Sparkles className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-semibold mb-2">No Insights Yet</h2>
              <p className="text-muted-foreground mb-6">
                Answer questions on any topic and request AI analysis to see personalized insights here.
              </p>
              <Link href="/connection">
                <Button data-testid="button-start-questions">Start Answering Questions</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {summaries.map((summary) => {
              const topic = topicMap.get(summary.topicId);
              if (!topic) return null;

              return (
                <Card key={summary.id} data-testid={`card-summary-${summary.id}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{topic.icon}</span>
                        <div>
                          <CardTitle className="text-2xl" data-testid={`text-topic-${summary.topicId}`}>
                            {topic.name}
                          </CardTitle>
                          <CardDescription>
                            Analyzed {format(new Date(summary.createdAt), "MMMM d, yyyy 'at' h:mm a")}
                          </CardDescription>
                        </div>
                      </div>
                      <Link href="/connection">
                        <Button variant="outline" size="sm" data-testid={`button-update-${summary.topicId}`}>
                          Update Responses
                        </Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Summary */}
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Summary</h3>
                      <p className="text-muted-foreground leading-relaxed" data-testid={`text-summary-${summary.id}`}>
                        {summary.summary}
                      </p>
                    </div>

                    {/* Insights */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Lightbulb className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold text-lg">Key Insights</h3>
                      </div>
                      <div className="space-y-2">
                        {summary.insights.map((insight, index) => (
                          <div
                            key={index}
                            className="flex gap-3 p-3 rounded-md bg-muted/50"
                            data-testid={`insight-${summary.id}-${index}`}
                          >
                            <Badge variant="secondary" className="h-6 w-6 rounded-full p-0 flex items-center justify-center shrink-0">
                              {index + 1}
                            </Badge>
                            <p className="text-sm leading-relaxed">{insight}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recommendations */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Target className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold text-lg">Recommendations</h3>
                      </div>
                      <div className="space-y-2">
                        {summary.recommendations.map((rec, index) => (
                          <div
                            key={index}
                            className="flex gap-3 p-3 rounded-md bg-primary/5 border border-primary/20"
                            data-testid={`recommendation-${summary.id}-${index}`}
                          >
                            <Badge variant="default" className="h-6 w-6 rounded-full p-0 flex items-center justify-center shrink-0">
                              {index + 1}
                            </Badge>
                            <p className="text-sm leading-relaxed">{rec}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
