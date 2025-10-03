import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Sparkles, CheckCircle2, Heart } from "lucide-react";
import { Link } from "wouter";

interface Topic {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface Question {
  id: string;
  topicId: string;
  question: string;
  order: number;
  userResponse?: {
    id: string;
    response: string;
    isShared: number;
  } | null;
}

interface Summary {
  id: string;
  topicId: string;
  summary: string;
  insights: string[];
  recommendations: string[];
  createdAt: string;
}

export default function ConnectionQuestions() {
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [currentResponse, setCurrentResponse] = useState("");
  const { toast } = useToast();

  // Fetch topics
  const { data: topics = [], isLoading: topicsLoading } = useQuery<Topic[]>({
    queryKey: ["/api/connection/topics"],
  });

  // Fetch questions for selected topic
  const { data: questions = [], isLoading: questionsLoading } = useQuery<Question[]>({
    queryKey: ["/api/connection/topics", selectedTopicId, "questions"],
    enabled: !!selectedTopicId,
  });

  // Fetch summaries for selected topic
  const { data: summaries = [] } = useQuery<Summary[]>({
    queryKey: ["/api/connection/summaries"],
    queryFn: async () => {
      const url = selectedTopicId 
        ? `/api/connection/summaries?topicId=${selectedTopicId}`
        : "/api/connection/summaries";
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch summaries");
      return response.json();
    },
    enabled: !!selectedTopicId,
  });

  // Save response mutation
  const saveResponseMutation = useMutation({
    mutationFn: async ({ questionId, response }: { questionId: string; response: string }) => {
      return apiRequest("POST", "/api/connection/responses", { questionId, response });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/connection/topics", selectedTopicId, "questions"] });
    },
  });

  // AI analysis mutation
  const analysisMutation = useMutation({
    mutationFn: async (topicId: string) => {
      return apiRequest("POST", `/api/connection/analyze/${topicId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/connection/summaries"] });
      toast({
        title: "Analysis Complete",
        description: "AI has analyzed your responses. Check the Insights tab to view recommendations.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze responses",
        variant: "destructive",
      });
    },
  });

  const selectedTopic = topics.find(t => t.id === selectedTopicId);
  const currentQuestion = questions[currentQuestionIndex];
  
  const answeredCount = questions.filter(q => q.userResponse?.response).length;
  const progressPercentage = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;
  const allAnswered = answeredCount === questions.length && questions.length > 0;
  const hasSummary = summaries.some(s => s.topicId === selectedTopicId);

  // Update current response when question changes
  useEffect(() => {
    if (currentQuestion) {
      setCurrentResponse(currentQuestion.userResponse?.response || responses[currentQuestion.id] || "");
    }
  }, [currentQuestionIndex, currentQuestion, responses]);

  const handleSaveResponse = async (questionId: string, response: string) => {
    if (!response.trim()) return;
    
    setResponses(prev => ({ ...prev, [questionId]: response }));
    await saveResponseMutation.mutateAsync({ questionId, response });
  };

  const handleNextQuestion = async () => {
    if (!currentQuestion) return;
    
    // Log the answer
    console.log(`Answer to "${currentQuestion.question}":`, currentResponse);
    
    // Save the response if there's text (ensure it's saved before moving)
    if (currentResponse.trim() && currentResponse !== currentQuestion.userResponse?.response) {
      await handleSaveResponse(currentQuestion.id, currentResponse);
    }
    
    // Move to next question
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      // Clear will happen in useEffect when question changes
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleRequestAnalysis = async () => {
    if (!selectedTopicId) return;
    await analysisMutation.mutateAsync(selectedTopicId);
  };

  // Topic selection view
  if (!selectedTopicId) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="mb-8">
            <Link href="/">
              <Button variant="ghost" size="sm" className="mb-4" data-testid="button-back-home">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            <div className="flex items-center gap-3 mb-2">
              <Heart className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-bold" data-testid="text-page-title">Strengthen Your Connection</h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Explore thoughtful questions designed to deepen understanding and foster meaningful conversations with your partner.
            </p>
          </div>

          {topicsLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map(i => (
                <Card key={i} className="hover-elevate">
                  <CardHeader>
                    <div className="h-6 w-32 bg-muted animate-pulse rounded" />
                  </CardHeader>
                  <CardContent>
                    <div className="h-4 w-full bg-muted animate-pulse rounded mb-2" />
                    <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {topics.map((topic) => (
                <Card
                  key={topic.id}
                  className="hover-elevate active-elevate-2 cursor-pointer"
                  onClick={() => {
                    setSelectedTopicId(topic.id);
                    setCurrentQuestionIndex(0);
                  }}
                  data-testid={`card-topic-${topic.id}`}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-2xl">{topic.icon}</span>
                      <span>{topic.name}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">{topic.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Questions view
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          size="sm"
          className="mb-4"
          onClick={() => {
            setSelectedTopicId(null);
            setCurrentQuestionIndex(0);
          }}
          data-testid="button-back-topics"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Topics
        </Button>

        {questionsLoading ? (
          <Card>
            <CardHeader>
              <div className="h-8 w-48 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="h-4 w-full bg-muted animate-pulse rounded" />
                <div className="h-32 w-full bg-muted animate-pulse rounded" />
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{selectedTopic?.icon}</span>
                  <div>
                    <h1 className="text-3xl font-bold" data-testid="text-topic-name">{selectedTopic?.name}</h1>
                    <p className="text-muted-foreground">{selectedTopic?.description}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Progress: {answeredCount} of {questions.length} answered</span>
                  {allAnswered && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                </div>
                <Progress value={progressPercentage} className="h-2" data-testid="progress-questions" />
              </div>
            </div>

            {currentQuestion && (
              <Card className="mb-6">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">
                      Question {currentQuestionIndex + 1} of {questions.length}
                    </CardTitle>
                  </div>
                  <CardDescription className="text-lg mt-2" data-testid="text-current-question">
                    {currentQuestion.question}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Share your thoughts..."
                    className="min-h-[150px] text-base"
                    value={currentResponse}
                    onChange={(e) => setCurrentResponse(e.target.value)}
                    onBlur={() => {
                      // Auto-save on blur to preserve answers
                      if (currentResponse.trim() && currentResponse !== currentQuestion.userResponse?.response) {
                        handleSaveResponse(currentQuestion.id, currentResponse);
                      }
                    }}
                    data-testid="textarea-response"
                  />
                  
                  <div className="flex items-center justify-between mt-4">
                    <Button
                      variant="outline"
                      onClick={handlePreviousQuestion}
                      disabled={currentQuestionIndex === 0}
                      data-testid="button-previous"
                    >
                      Previous
                    </Button>
                    
                    <Button
                      onClick={handleNextQuestion}
                      disabled={currentQuestionIndex === questions.length - 1}
                      data-testid="button-next"
                    >
                      Next Question
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {allAnswered && (
              <Card className="border-primary">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Get AI Analysis
                  </CardTitle>
                  <CardDescription>
                    {hasSummary 
                      ? "You've already received AI analysis for this topic. You can request a new analysis to update insights based on any changes."
                      : "You've answered all questions! Get personalized insights and recommendations from our AI relationship coach."}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={handleRequestAnalysis}
                    disabled={analysisMutation.isPending}
                    className="w-full"
                    data-testid="button-analyze"
                  >
                    {analysisMutation.isPending ? "Analyzing..." : hasSummary ? "Update Analysis" : "Analyze My Responses"}
                  </Button>
                  
                  {hasSummary && (
                    <Link href="/connection/insights">
                      <Button variant="outline" className="w-full mt-3" data-testid="button-view-insights">
                        View Previous Insights
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
