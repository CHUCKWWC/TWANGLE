import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrialValueDashboard } from "@/components/TrialValueDashboard";
import { TrialChecklist } from "@/components/TrialChecklist";
import { 
  Brain, 
  MessageCircle, 
  Map, 
  Heart,
  TrendingUp,
  Calendar,
  CheckCircle2,
  Utensils,
  BookOpen,
  Flame,
  Users,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Clock,
  Target
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface DashboardStats {
  assessmentCount: number;
  chatSessionCount: number;
  retreatCount: number;
  journalCount: number;
  conversationCount: number;
  userStatus: string;
  userTier: string;
  healthScore: {
    overallScore: number;
    breakdown: any;
    calculatedAt: string;
  } | null;
  hasPartner: boolean;
  partnerInfo: {
    firstName: string;
    displayName: string;
    profileImageUrl: string | null;
    answeredToday: boolean;
  } | null;
  conversationStreak: number;
  answeredTodayConversation: boolean;
  thisWeek: {
    conversations: number;
    journals: number;
    chatSessions: number;
  };
  lastWeek: {
    conversations: number;
    chatSessions: number;
  };
  recentChatSession: {
    id: string;
    lastMessageAt: string;
    messageCount: number;
  } | null;
  firstName: string;
}

export default function Dashboard() {
  const [, navigate] = useLocation();

  const { data: stats, isLoading, isError, error, refetch } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-destructive">Unable to Load Dashboard</CardTitle>
            <CardDescription>
              We couldn't fetch your stats. Please try again.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {error instanceof Error ? error.message : "An error occurred while loading your data"}
            </p>
            <Button onClick={() => refetch()} data-testid="button-retry">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasCompletedAssessment = (stats?.assessmentCount ?? 0) > 0;
  const hasUsedCoach = (stats?.chatSessionCount ?? 0) > 0;
  const hasPlannedRetreat = (stats?.retreatCount ?? 0) > 0;
  
  const conversationChange = (stats?.thisWeek.conversations ?? 0) - (stats?.lastWeek.conversations ?? 0);
  const chatChange = (stats?.thisWeek.chatSessions ?? 0) - (stats?.lastWeek.chatSessions ?? 0);
  
  const totalThisWeek = (stats?.thisWeek.conversations ?? 0) + (stats?.thisWeek.journals ?? 0) + (stats?.thisWeek.chatSessions ?? 0);
  const showCelebration = totalThisWeek >= 5 || (stats?.conversationStreak ?? 0) >= 3;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 pt-20">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section: Personalized Greeting + Health Score */}
        <div className="mb-8">
          <div className="flex flex-col gap-6">
            {/* Personalized Greeting */}
            <div>
              <h1 className="text-3xl md:text-4xl font-display font-bold mb-2" data-testid="text-greeting">
                Welcome back, {stats?.firstName}!
              </h1>
              <p className="text-muted-foreground">
                {totalThisWeek > 0 
                  ? `You've taken ${totalThisWeek} step${totalThisWeek === 1 ? '' : 's'} toward a healthier relationship this week` 
                  : "Start your journey to a healthier relationship today"
                }
              </p>
            </div>

            {/* Health Score + Celebration */}
            {stats?.healthScore && (
              <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent" data-testid="card-health-score">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-semibold">Relationship Health Score</h3>
                        {showCelebration && (
                          <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                        )}
                      </div>
                      <div className="flex items-baseline gap-3 mb-3">
                        <span className="text-4xl font-bold text-primary" data-testid="text-health-score">
                          {stats.healthScore.overallScore}
                        </span>
                        <span className="text-muted-foreground text-sm">out of 100</span>
                      </div>
                      <Progress value={stats.healthScore.overallScore} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-2">
                        Last calculated {formatDistanceToNow(new Date(stats.healthScore.calculatedAt), { addSuffix: true })}
                      </p>
                    </div>
                    
                    {showCelebration && (
                      <div className="bg-primary/10 rounded-lg p-4 text-center">
                        <Sparkles className="w-8 h-8 text-primary mx-auto mb-2" />
                        <p className="text-sm font-semibold text-primary">Great momentum!</p>
                        <p className="text-xs text-muted-foreground mt-1">Keep it up</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Daily Conversation Widget */}
        <Card className="mb-8 border-primary/30" data-testid="card-daily-conversation">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-4 flex-1">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold">Today's Conversation</h3>
                    {stats?.conversationStreak ? (
                      <Badge variant="secondary" className="gap-1">
                        <Flame className="w-3 h-3" />
                        {stats.conversationStreak} day streak
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {stats?.answeredTodayConversation
                      ? stats?.hasPartner
                        ? stats?.partnerInfo?.answeredToday
                          ? "Both of you have answered! View your responses."
                          : `Waiting for ${stats?.partnerInfo?.firstName || 'your partner'} to respond...`
                        : "You've answered today's question"
                      : stats?.hasPartner
                        ? "A new question is waiting for you both"
                        : "Answer today's question"
                    }
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => navigate("/conversations")}
                data-testid="button-daily-conversation"
                disabled={stats?.answeredTodayConversation && stats?.hasPartner && !stats?.partnerInfo?.answeredToday}
              >
                {stats?.answeredTodayConversation 
                  ? stats?.hasPartner && stats?.partnerInfo?.answeredToday
                    ? "View Responses"
                    : "Waiting"
                  : "Answer Now"
                }
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Partner Status Widget */}
        {stats?.hasPartner && stats?.partnerInfo && (
          <Card className="mb-8" data-testid="card-partner-status">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">
                    Connected with {stats.partnerInfo.firstName || stats.partnerInfo.displayName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {stats.partnerInfo.answeredToday 
                      ? "Answered today's conversation" 
                      : "Haven't answered today yet"
                    }
                  </p>
                </div>
                {stats.conversationStreak > 0 && (
                  <div className="flex items-center gap-2 bg-primary/10 rounded-lg px-4 py-2">
                    <Flame className="w-5 h-5 text-primary" />
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">{stats.conversationStreak}</p>
                      <p className="text-xs text-muted-foreground">Day Streak</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Continue Chat Action */}
        {stats?.recentChatSession && (
          <Card className="mb-8 bg-primary/5 border-primary" data-testid="card-continue-chat">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <MessageCircle className="w-5 h-5 text-primary flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold">Continue your conversation</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Last message {formatDistanceToNow(new Date(stats.recentChatSession.lastMessageAt), { addSuffix: true })}
                  </p>
                </div>
                <Button size="sm" onClick={() => navigate("/coach")} data-testid="button-continue-chat">
                  Resume
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Trial Value Dashboard */}
        <div className="mb-8">
          <TrialValueDashboard />
        </div>

        {/* Trial Onboarding Checklist */}
        <div className="mb-8">
          <TrialChecklist />
        </div>

        {/* This Week Summary */}
        <Card className="mb-8" data-testid="card-week-summary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              This Week's Activity
            </CardTitle>
            <CardDescription>Your progress over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-muted-foreground">Conversations</p>
                  {conversationChange !== 0 && (
                    <Badge variant={conversationChange > 0 ? "default" : "secondary"} className="gap-1">
                      {conversationChange > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                      {Math.abs(conversationChange)}
                    </Badge>
                  )}
                </div>
                <p className="text-3xl font-bold">{stats?.thisWeek.conversations ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {conversationChange > 0 
                    ? `${conversationChange} more than last week` 
                    : conversationChange < 0
                      ? `${Math.abs(conversationChange)} less than last week`
                      : "Same as last week"
                  }
                </p>
              </div>

              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-muted-foreground">Journal Entries</p>
                </div>
                <p className="text-3xl font-bold">{stats?.thisWeek.journals ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Track your relationship insights
                </p>
              </div>

              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-muted-foreground">Coach Sessions</p>
                  {chatChange !== 0 && (
                    <Badge variant={chatChange > 0 ? "default" : "secondary"} className="gap-1">
                      {chatChange > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                      {Math.abs(chatChange)}
                    </Badge>
                  )}
                </div>
                <p className="text-3xl font-bold">{stats?.thisWeek.chatSessions ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {chatChange > 0 
                    ? `${chatChange} more than last week` 
                    : chatChange < 0
                      ? `${Math.abs(chatChange)} less than last week`
                      : "Same as last week"
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Overview with Context */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card data-testid="card-assessments">
            <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assessments</CardTitle>
              <Brain className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.assessmentCount ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {hasCompletedAssessment 
                  ? "Understanding your attachment style"
                  : "Discover your attachment style"
                }
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-coach-sessions">
            <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Coach Sessions</CardTitle>
              <MessageCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.chatSessionCount ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                24/7 relationship guidance
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-total-conversations">
            <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.conversationCount ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Daily questions answered
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="hover-elevate cursor-pointer transition-all" onClick={() => navigate("/assessment")} data-testid="action-assessment">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Brain className="w-6 h-6 text-primary" />
                  </div>
                  <Badge variant="secondary" className="text-xs">FREE</Badge>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">
                      {hasCompletedAssessment ? "Retake Assessment" : "Start Assessment"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {hasCompletedAssessment 
                        ? "Track how your attachment style evolves"
                        : "Discover your attachment style in 20 questions"
                      }
                    </p>
                  </div>
                  {hasCompletedAssessment && (
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="hover-elevate cursor-pointer transition-all" onClick={() => navigate("/coach")} data-testid="action-coach">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-6 h-6 text-primary" />
                  </div>
                  <Badge variant="secondary" className="text-xs">FREE</Badge>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">Talk to Coach Charles</h3>
                    <p className="text-sm text-muted-foreground">
                      Get personalized relationship guidance 24/7
                    </p>
                  </div>
                  {hasUsedCoach && (
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="hover-elevate cursor-pointer transition-all" onClick={() => navigate("/retreat")} data-testid="action-retreat">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Map className="w-6 h-6 text-primary" />
                  </div>
                  <Badge variant="secondary" className="text-xs">FREE</Badge>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">Plan a Retreat</h3>
                    <p className="text-sm text-muted-foreground">
                      Create a personalized couples getaway
                    </p>
                  </div>
                  {hasPlannedRetreat && (
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="hover-elevate cursor-pointer transition-all" onClick={() => navigate("/40day")} data-testid="action-40day">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-6 h-6 text-primary" />
                  </div>
                  <Badge variant="secondary" className="text-xs">FREE</Badge>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">40dayTwangle</h3>
                    <p className="text-sm text-muted-foreground">
                      Faith-based 40-day relationship journey
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Progress Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card data-testid="card-next-steps">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Your Next Steps
              </CardTitle>
              <CardDescription>Continue your journey</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {!hasCompletedAssessment && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Brain className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Take your first assessment</p>
                    <p className="text-xs text-muted-foreground">Learn about your attachment style</p>
                  </div>
                </div>
              )}
              {!hasUsedCoach && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Chat with Coach Charles</p>
                    <p className="text-xs text-muted-foreground">Get personalized advice</p>
                  </div>
                </div>
              )}
              {!hasPlannedRetreat && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Map className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Plan your first retreat</p>
                    <p className="text-xs text-muted-foreground">Create a meaningful getaway</p>
                  </div>
                </div>
              )}
              {hasCompletedAssessment && hasUsedCoach && hasPlannedRetreat && (
                <div className="text-center py-4">
                  <Heart className="w-12 h-12 mx-auto mb-3 text-primary" />
                  <p className="font-medium">Great progress!</p>
                  <p className="text-sm text-muted-foreground">You're using all the tools to strengthen your relationship</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-features">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Explore Features
              </CardTitle>
              <CardDescription>Tools to help you grow together</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2" 
                onClick={() => navigate("/exercises")}
                data-testid="button-exercises"
              >
                <Heart className="w-4 h-4" />
                <span className="flex-1 text-left">Browse Relationship Exercises</span>
                <Badge variant="secondary" className="text-xs">FREE</Badge>
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2" 
                onClick={() => navigate("/datenight")}
                data-testid="button-datenight"
              >
                <Utensils className="w-4 h-4" />
                <span className="flex-1 text-left">Plan Date Night</span>
                <Badge variant="secondary" className="text-xs">FREE</Badge>
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2" 
                onClick={() => navigate("/summaries")}
                data-testid="button-summaries"
              >
                <TrendingUp className="w-4 h-4" />
                <span className="flex-1 text-left">View Weekly Summaries</span>
                <Badge variant="secondary" className="text-xs">FREE</Badge>
              </Button>
              {hasCompletedAssessment && (
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2" 
                  onClick={() => navigate("/results")}
                  data-testid="button-view-results"
                >
                  <Brain className="w-4 h-4" />
                  <span className="flex-1 text-left">View Assessment Results</span>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
