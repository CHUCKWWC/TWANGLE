import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  BookOpen
} from "lucide-react";

interface UserStats {
  assessmentCount: number;
  chatSessionCount: number;
  retreatCount: number;
  subscriptionStatus: string;
  subscriptionTier: string;
}

export default function Dashboard() {
  const [, navigate] = useLocation();

  const { data: stats, isLoading, isError, error, refetch } = useQuery<UserStats>({
    queryKey: ["/api/user/stats"],
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

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 pt-20">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
            Your Relationship Journey
          </h1>
          <p className="text-muted-foreground">
            Track your progress and continue building a stronger connection
          </p>
        </div>

        {/* Trial Value Dashboard */}
        <div className="mb-8">
          <TrialValueDashboard />
        </div>

        {/* Trial Onboarding Checklist */}
        <div className="mb-8">
          <TrialChecklist />
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card data-testid="card-assessments">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assessments Completed</CardTitle>
              <Brain className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.assessmentCount ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Understanding your attachment style
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-coach-sessions">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Coach Conversations</CardTitle>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.chatSessionCount ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Sessions with Coach Charles
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-retreats">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Retreats Planned</CardTitle>
              <Map className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.retreatCount ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                DIY couple getaways
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
                  <Badge variant="default" className="text-xs">PREMIUM</Badge>
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
                  <Badge variant="default" className="text-xs">PREMIUM</Badge>
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
                  <Badge variant="default" className="text-xs">PREMIUM</Badge>
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
                <Badge variant="default" className="text-xs">PREMIUM</Badge>
              </Button>
              {hasCompletedAssessment && (
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={() => navigate("/results")}
                  data-testid="button-view-results"
                >
                  <Brain className="w-4 h-4 mr-2" />
                  View Assessment Results
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
