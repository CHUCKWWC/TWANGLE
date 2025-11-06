import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Heart, Calendar, CheckCircle2, Lock, Sparkles } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface Challenge {
  id: string;
  dayNumber: number;
  title: string;
  scripture: string;
  summary: string;
  actionPrompt: string;
  journalQuestion: string;
}

interface UserProgress {
  id: string;
  userId: string;
  currentDay: number;
  lastCompletedDay: number;
  startedAt: string;
  isActive: boolean;
}

interface ChallengeReflection {
  id: string;
  userId: string;
  challengeId: string;
  dayNumber: number;
  reflectionText: string;
  aiSummary: string | null;
  completedAt: string;
}

export default function FortyDayTwangle() {
  const { toast } = useToast();
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [reflectionText, setReflectionText] = useState("");
  const [activeTab, setActiveTab] = useState<"today" | "all">("today");

  // Fetch user progress
  const { data: progress, isLoading: progressLoading } = useQuery<UserProgress | null>({
    queryKey: ["/api/challenges/progress"],
  });

  // Fetch all challenges
  const { data: challenges = [], isLoading: challengesLoading } = useQuery<Challenge[]>({
    queryKey: ["/api/challenges"],
  });

  // Fetch user reflections
  const { data: reflections = [] } = useQuery<ChallengeReflection[]>({
    queryKey: ["/api/challenges/reflections"],
  });

  // Start challenge mutation
  const startChallengeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/challenges/start", {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/challenges/progress"] });
      toast({
        title: "Challenge Started!",
        description: "Welcome to your 40-day journey! Let's begin with Day 1.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to start challenge. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Complete day mutation
  const completeDayMutation = useMutation({
    mutationFn: async ({ day, reflection }: { day: number; reflection: string }) => {
      const response = await apiRequest("POST", `/api/challenges/${day}/complete`, {
        reflectionText: reflection,
      });
      return response.json();
    },
    onSuccess: async (data: any) => {
      // Invalidate and wait for queries to refetch
      await queryClient.invalidateQueries({ queryKey: ["/api/challenges/progress"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/challenges/reflections"] });
      setReflectionText("");
      
      // Get the updated progress to find the new current day
      const updatedProgress = await queryClient.fetchQuery({
        queryKey: ["/api/challenges/progress"],
      }) as UserProgress | null;
      
      // Handle completion of final day (Day 40)
      if (!updatedProgress || (selectedDay === 40)) {
        toast({
          title: "Journey Complete! 🎉",
          description: "Congratulations! You've completed the entire 40-day journey!",
        });
        // Keep showing Day 40 for the completed view
        setSelectedDay(40);
        setActiveTab("today");
        return;
      }
      
      const nextDay = updatedProgress.currentDay;
      
      // Advance to the next day
      setSelectedDay(nextDay);
      setActiveTab("today");
      
      toast({
        title: "Day Complete! 🎉",
        description: `Excellent work! Moving to Day ${nextDay}...`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save reflection. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Auto-select current day when progress loads (but not when user manually selects a day)
  useEffect(() => {
    if (progress && !selectedDay) {
      setSelectedDay(progress.currentDay);
    }
  }, [progress, selectedDay]);

  const currentChallenge = challenges.find(c => c.dayNumber === (selectedDay || progress?.currentDay || 1));
  const currentDayReflection = reflections.find(r => r.dayNumber === (selectedDay || progress?.currentDay || 1));

  const isLoading = progressLoading || challengesLoading;

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your journey...</p>
        </div>
      </div>
    );
  }

  // Welcome screen for new users
  if (!progress) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="min-h-screen flex items-center justify-center">
          <Card className="w-full">
            <CardHeader className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="bg-primary/10 p-6 rounded-full">
                  <Heart className="w-16 h-16 text-primary" />
                </div>
              </div>
              <div>
                <CardTitle className="text-3xl font-display mb-2">40dayTwangle</CardTitle>
                <CardDescription className="text-lg">
                  A faith-based journey to strengthen your relationship
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="prose prose-sm max-w-none">
                <p className="text-center text-muted-foreground">
                  Join us on a transformative 40-day journey grounded in scripture and designed to
                  deepen your connection as a couple. Each day brings:
                </p>
                <ul className="space-y-2 my-6">
                  <li className="flex items-start gap-2">
                    <BookOpen className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span><strong>Scripture Reading:</strong> Daily verses to reflect on together</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span><strong>Action Prompt:</strong> Practical steps to apply the teaching</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Heart className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span><strong>Journal Question:</strong> Guided reflection to deepen understanding</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Sparkles className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span><strong>AI Insights:</strong> Personalized encouragement based on your reflections</span>
                  </li>
                </ul>
                <p className="text-center text-sm text-muted-foreground">
                  Both partners must complete each day before advancing to the next,
                  ensuring you journey together in unity.
                </p>
              </div>

              <Button
                size="lg"
                className="w-full"
                onClick={() => startChallengeMutation.mutate()}
                disabled={startChallengeMutation.isPending}
                data-testid="button-start-challenge"
              >
                {startChallengeMutation.isPending ? "Starting..." : "Begin Your 40-Day Journey"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const progressPercentage = (progress.lastCompletedDay / 40) * 100;

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-display font-bold">40dayTwangle</h1>
            <p className="text-muted-foreground">Day {progress.currentDay} of 40</p>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2">
            <Calendar className="w-4 h-4 mr-2" />
            {progress.lastCompletedDay} / 40 Complete
          </Badge>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={progressPercentage} className="h-3" />
          <p className="text-sm text-muted-foreground text-right">
            {progressPercentage.toFixed(0)}% Complete
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "today" | "all")}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="today" data-testid="tab-today">Today's Challenge</TabsTrigger>
          <TabsTrigger value="all" data-testid="tab-all-days">All Days</TabsTrigger>
        </TabsList>

        {/* Today's Challenge Tab */}
        <TabsContent value="today" className="space-y-6">
          {currentChallenge && (
            <>
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-2xl font-display">
                        Day {currentChallenge.dayNumber}: {currentChallenge.title}
                      </CardTitle>
                      <CardDescription className="mt-2 text-base italic">
                        {currentChallenge.scripture}
                      </CardDescription>
                    </div>
                    {currentDayReflection && (
                      <Badge variant="default" className="ml-4">
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Completed
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-primary" />
                      Today's Reflection
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {currentChallenge.summary}
                    </p>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                      Action Prompt
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {currentChallenge.actionPrompt}
                    </p>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                      <Heart className="w-5 h-5 text-primary" />
                      Journal Question
                    </h3>
                    <p className="text-muted-foreground leading-relaxed mb-4">
                      {currentChallenge.journalQuestion}
                    </p>

                    {currentDayReflection ? (
                      <div className="space-y-4">
                        <Card className="bg-muted/50">
                          <CardContent className="pt-6">
                            <p className="text-sm italic">{currentDayReflection.reflectionText}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                              Completed on {new Date(currentDayReflection.completedAt).toLocaleDateString()}
                            </p>
                          </CardContent>
                        </Card>

                        {currentDayReflection.aiSummary && (
                          <Card className="border-primary/20 bg-primary/5">
                            <CardHeader>
                              <CardTitle className="text-sm flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-primary" />
                                AI Insight
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm">{currentDayReflection.aiSummary}</p>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <Textarea
                          placeholder="Write your reflection here..."
                          value={reflectionText}
                          onChange={(e) => setReflectionText(e.target.value)}
                          rows={6}
                          className="resize-none"
                          data-testid="input-reflection"
                        />
                        <Button
                          onClick={() =>
                            completeDayMutation.mutate({
                              day: currentChallenge.dayNumber,
                              reflection: reflectionText,
                            })
                          }
                          disabled={!reflectionText.trim() || completeDayMutation.isPending}
                          className="w-full"
                          data-testid="button-complete-day"
                        >
                          {completeDayMutation.isPending ? "Saving..." : "Complete Day " + currentChallenge.dayNumber}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* All Days Tab */}
        <TabsContent value="all">
          <ScrollArea className="h-[600px] pr-4">
            <div className="grid gap-3">
              {challenges.map((challenge) => {
                const isCompleted = reflections.some(r => r.dayNumber === challenge.dayNumber);
                const isCurrent = challenge.dayNumber === progress.currentDay;
                const isLocked = challenge.dayNumber > progress.currentDay;

                return (
                  <Card
                    key={challenge.id}
                    className={cn(
                      "cursor-pointer transition-colors",
                      isCurrent && "border-primary",
                      isLocked && "opacity-60"
                    )}
                    onClick={() => {
                      if (!isLocked) {
                        setSelectedDay(challenge.dayNumber);
                        setActiveTab("today");
                      }
                    }}
                    data-testid={`card-day-${challenge.dayNumber}`}
                  >
                    <CardHeader className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "flex items-center justify-center w-10 h-10 rounded-full",
                            isCompleted ? "bg-primary text-primary-foreground" : "bg-muted"
                          )}>
                            {isCompleted ? (
                              <CheckCircle2 className="w-5 h-5" />
                            ) : isLocked ? (
                              <Lock className="w-5 h-5" />
                            ) : (
                              <span className="font-semibold">{challenge.dayNumber}</span>
                            )}
                          </div>
                          <div>
                            <CardTitle className="text-base">
                              Day {challenge.dayNumber}: {challenge.title}
                            </CardTitle>
                            <CardDescription className="text-sm">{challenge.scripture}</CardDescription>
                          </div>
                        </div>
                        {isCurrent && (
                          <Badge>Current</Badge>
                        )}
                      </div>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
