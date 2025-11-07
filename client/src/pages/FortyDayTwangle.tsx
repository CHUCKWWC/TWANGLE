import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Heart, CheckCircle2, Sparkles, ChevronRight, Star, Trophy, PartyPopper } from "lucide-react";
import { cn } from "@/lib/utils";
import { AppHeader } from "@/components/AppHeader";

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
  const [reflectionText, setReflectionText] = useState("");
  const [showCelebration, setShowCelebration] = useState(false);

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
      // Show celebration animation
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3000);
      
      // Invalidate and wait for queries to refetch
      await queryClient.invalidateQueries({ queryKey: ["/api/challenges/progress"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/challenges/reflections"] });
      setReflectionText("");
      
      // Get the updated progress to find the new current day
      const updatedProgress = await queryClient.fetchQuery({
        queryKey: ["/api/challenges/progress"],
      }) as UserProgress | null;
      
      const currentDay = updatedProgress?.currentDay || 1;
      
      // Handle completion of final day (Day 40)
      if (currentDay > 40 || data.dayNumber === 40) {
        toast({
          title: "Journey Complete!",
          description: "Congratulations! You've completed the entire 40-day journey!",
        });
        return;
      }
      
      toast({
        title: `Day ${data.dayNumber} Complete!`,
        description: `Amazing work! Moving to Day ${currentDay}...`,
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

  const isLoading = progressLoading || challengesLoading;
  const currentDay = progress?.currentDay || 1;
  const lastCompletedDay = progress?.lastCompletedDay || 0;
  const progressPercentage = (lastCompletedDay / 40) * 100;

  // Get current and upcoming challenges
  const currentChallenge = challenges.find(c => c.dayNumber === currentDay);
  const upcomingChallenges = challenges
    .filter(c => c.dayNumber > currentDay && c.dayNumber <= currentDay + 3)
    .slice(0, 3);
  
  const currentDayReflection = reflections.find(r => r.dayNumber === currentDay);
  const isCurrentDayComplete = !!currentDayReflection;

  // Handle submission
  const handleComplete = () => {
    if (!reflectionText.trim() && !isCurrentDayComplete) {
      toast({
        title: "Reflection Required",
        description: "Please write your reflection before completing the day.",
        variant: "destructive",
      });
      return;
    }

    completeDayMutation.mutate({
      day: currentDay,
      reflection: reflectionText,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="container mx-auto p-6 pt-20 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your journey...</p>
          </div>
        </div>
      </div>
    );
  }

  // Welcome screen for new users
  if (!progress) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="container mx-auto p-6 pt-20 max-w-4xl">
          <div className="min-h-screen flex items-center justify-center">
            <Card className="w-full">
            <CardHeader className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="bg-primary/10 p-6 rounded-full">
                  <Heart className="w-16 h-16 text-primary" />
                </div>
              </div>
              <div>
                <CardTitle className="text-3xl mb-2">Welcome to 40dayTwangle</CardTitle>
                <CardDescription className="text-lg">
                  A transformative 40-day faith-based journey
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="prose prose-sm max-w-none">
                <p className="text-center text-muted-foreground">
                  Strengthen your relationship one day at a time with daily scripture teachings, 
                  action prompts, and reflection questions designed to deepen your connection 
                  with your partner and with God.
                </p>
              </div>

              <div className="bg-muted rounded-lg p-6 space-y-4">
                <h3 className="font-semibold text-center mb-4">What to Expect</h3>
                <ul className="space-y-3">
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
      </div>
    );
  }

  const isJourneyComplete = currentDay > 40;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      <AppHeader />
      
      {/* Celebration Overlay */}
      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm pointer-events-none">
          <div className="text-center animate-in zoom-in-50 duration-500">
            <div className="mb-4 flex justify-center">
              <PartyPopper className="w-24 h-24 text-primary animate-bounce" />
            </div>
            <h2 className="text-4xl font-bold text-white mb-2">Day Complete!</h2>
            <p className="text-xl text-white/80">Keep up the amazing work!</p>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-6 pt-20 max-w-6xl">
        {/* Header Section */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Heart className="w-10 h-10 text-primary" />
            <h1 className="text-4xl font-display font-bold">40dayTwangle</h1>
          </div>
          
          {!isJourneyComplete ? (
            <>
              <p className="text-lg text-muted-foreground mb-6">
                Day {currentDay} of 40 • {40 - lastCompletedDay} days remaining
              </p>
              
              {/* Progress Bar */}
              <div className="max-w-2xl mx-auto space-y-2">
                <Progress value={progressPercentage} className="h-3" />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{lastCompletedDay} days completed</span>
                  <span>{progressPercentage.toFixed(0)}%</span>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-center">
                <Trophy className="w-20 h-20 text-primary animate-bounce" />
              </div>
              <p className="text-2xl font-bold text-primary">Journey Complete!</p>
              <p className="text-muted-foreground">You've completed all 40 days! Congratulations!</p>
            </div>
          )}
        </div>

        {!isJourneyComplete && (
          <>
            {/* Current Day - Large Feature Card */}
            <div className="mb-8" data-testid="current-day-card">
              <Card className="border-2 border-primary/50 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
                  <div className="flex items-center justify-between">
                    <Badge className="text-lg px-4 py-1">Today</Badge>
                    <div className="flex items-center gap-2">
                      {isCurrentDayComplete && (
                        <Badge variant="outline" className="gap-1">
                          <CheckCircle2 className="w-4 h-4" />
                          Completed
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-baseline gap-3 mb-2">
                      <span className="text-5xl font-bold text-primary">Day {currentDay}</span>
                    </div>
                    <CardTitle className="text-2xl mb-2">{currentChallenge?.title}</CardTitle>
                    <CardDescription className="text-base flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      {currentChallenge?.scripture}
                    </CardDescription>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-6 space-y-6">
                  {/* Scripture Summary */}
                  <div className="bg-muted/50 rounded-lg p-6">
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-primary" />
                      Today's Teaching
                    </h3>
                    <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                      {currentChallenge?.summary}
                    </p>
                  </div>

                  {/* Action Prompt */}
                  <div className="bg-primary/5 border-l-4 border-primary rounded-r-lg p-6">
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                      Action Prompt
                    </h3>
                    <p className="text-foreground leading-relaxed">
                      {currentChallenge?.actionPrompt}
                    </p>
                  </div>

                  {/* Journal Question */}
                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Heart className="w-5 h-5 text-primary" />
                      Reflection Question
                    </h3>
                    <p className="text-muted-foreground mb-4 italic">
                      {currentChallenge?.journalQuestion}
                    </p>
                    
                    {isCurrentDayComplete ? (
                      <div className="bg-muted rounded-lg p-6">
                        <div className="flex items-center gap-2 mb-3">
                          <Sparkles className="w-5 h-5 text-primary" />
                          <h4 className="font-semibold">Your Reflection</h4>
                        </div>
                        <p className="text-foreground whitespace-pre-wrap">
                          {currentDayReflection?.reflectionText}
                        </p>
                        {currentDayReflection?.aiSummary && (
                          <div className="mt-4 pt-4 border-t border-border">
                            <p className="text-sm font-medium mb-2">AI Encouragement:</p>
                            <p className="text-sm text-muted-foreground">
                              {currentDayReflection.aiSummary}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <Textarea
                          value={reflectionText}
                          onChange={(e) => setReflectionText(e.target.value)}
                          placeholder="Take a moment to reflect on today's teaching... Write your thoughts, feelings, and how you plan to apply this to your relationship."
                          className="min-h-[150px] text-base"
                          data-testid="textarea-reflection"
                        />
                        
                        <Button
                          onClick={handleComplete}
                          disabled={completeDayMutation.isPending || !reflectionText.trim()}
                          size="lg"
                          className="w-full text-lg py-6"
                          data-testid="button-complete-day"
                        >
                          {completeDayMutation.isPending ? (
                            "Completing..."
                          ) : (
                            <>
                              <CheckCircle2 className="w-5 h-5 mr-2" />
                              Complete Day {currentDay}
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Upcoming Days Preview */}
            {upcomingChallenges.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  <h2 className="text-xl font-semibold">Coming Up Next</h2>
                </div>
                
                <div className="grid md:grid-cols-3 gap-4">
                  {upcomingChallenges.map((challenge, index) => (
                    <Card key={challenge.id} className="relative overflow-hidden hover-elevate">
                      <div className="absolute top-0 right-0 w-20 h-20 bg-primary/10 rounded-bl-full" />
                      <CardHeader className="relative">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline">Day {challenge.dayNumber}</Badge>
                          <Star className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <CardTitle className="text-lg line-clamp-2">{challenge.title}</CardTitle>
                        <CardDescription className="text-sm line-clamp-1">
                          {challenge.scripture}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {challenge.summary}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Encouragement Message */}
            <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-primary/20">
              <CardContent className="p-6 text-center">
                <Sparkles className="w-8 h-8 text-primary mx-auto mb-3" />
                <p className="text-lg font-medium mb-2">
                  You're doing great! 
                </p>
                <p className="text-muted-foreground">
                  Every day is a step towards a stronger, more connected relationship. Keep going!
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
