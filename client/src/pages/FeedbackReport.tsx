import { useQuery } from "@tanstack/react-query";
import { AppHeader } from "@/components/AppHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Star, TrendingUp, Lock, BarChart3 } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { isAdminUser } from "@shared/adminAccess";

interface FeedbackSummary {
  totalGeneral: number;
  totalSessions: number;
  avgSessionRating: number;
  feedbackByType: Record<string, number>;
  feedbackByCategory: Record<string, number>;
}

interface GeneralFeedback {
  id: string;
  userId: string | null;
  userEmail: string | null;
  userName: string | null;
  feedbackType: string;
  category: string;
  description: string;
  rating: number | null;
  createdAt: string;
}

interface SessionFeedback {
  id: string;
  sessionId: string | null;
  userId: string | null;
  userEmail: string | null;
  userName: string | null;
  rating: number;
  feedbackText: string | null;
  createdAt: string;
}

export default function FeedbackReport() {
  const { user } = useAuth();
  const hasAccess = isAdminUser(user?.email);

  const { data: summary } = useQuery<FeedbackSummary>({
    queryKey: ['/api/reports/feedback-summary'],
    enabled: hasAccess,
  });

  const { data: generalFeedbackData } = useQuery<{ feedback: GeneralFeedback[] }>({
    queryKey: ['/api/reports/general-feedback'],
    enabled: hasAccess,
  });

  const { data: sessionFeedbackData } = useQuery<{ feedback: SessionFeedback[] }>({
    queryKey: ['/api/reports/session-feedback'],
    enabled: hasAccess,
  });

  const generalFeedback = generalFeedbackData?.feedback || [];
  const sessionFeedback = sessionFeedbackData?.feedback || [];

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="container mx-auto p-6">
          <Card className="max-w-md mx-auto mt-20">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-destructive/10 p-3">
                  <Lock className="w-8 h-8 text-destructive" />
                </div>
              </div>
              <CardTitle data-testid="text-access-denied">Access Denied</CardTitle>
              <CardDescription data-testid="text-access-denied-message">
                You don't have permission to view this page. Feedback reports are only available to authorized administrators.
              </CardDescription>
            </CardHeader>
          </Card>
        </main>
      </div>
    );
  }

  const feedbackTypeColors: Record<string, string> = {
    general: 'default',
    bug: 'destructive',
    feature: 'secondary',
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2" data-testid="text-feedback-title">Feedback Reports</h1>
          <p className="text-muted-foreground" data-testid="text-feedback-description">
            Comprehensive view of user feedback and ratings
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">General Feedback</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-general">{summary?.totalGeneral ?? 0}</div>
              <p className="text-xs text-muted-foreground">Total submissions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Session Ratings</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-sessions">{summary?.totalSessions ?? 0}</div>
              <p className="text-xs text-muted-foreground">Total coach session ratings</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-avg-rating">
                {summary?.avgSessionRating ? `${summary.avgSessionRating} / 5` : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">AI Coach session quality</p>
            </CardContent>
          </Card>
        </div>

        {summary && (
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Feedback by Type</CardTitle>
                <CardDescription>Distribution of general feedback types</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(summary.feedbackByType).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <Badge variant={feedbackTypeColors[type] as any || 'default'}>
                        {type}
                      </Badge>
                      <span className="text-sm font-medium">{count}</span>
                    </div>
                  ))}
                  {Object.keys(summary.feedbackByType).length === 0 && (
                    <p className="text-sm text-muted-foreground">No feedback yet</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Feedback by Category</CardTitle>
                <CardDescription>Topics users are providing feedback on</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(summary.feedbackByCategory).map(([category, count]) => (
                    <div key={category} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{category}</span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                  {Object.keys(summary.feedbackByCategory).length === 0 && (
                    <p className="text-sm text-muted-foreground">No feedback yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList>
            <TabsTrigger value="general" data-testid="tab-general">
              General Feedback ({generalFeedback.length})
            </TabsTrigger>
            <TabsTrigger value="sessions" data-testid="tab-sessions">
              Session Ratings ({sessionFeedback.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  General Feedback Submissions
                </CardTitle>
                <CardDescription>
                  User feedback about features, bugs, and suggestions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {generalFeedback.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground" data-testid="text-no-general-feedback">
                    No general feedback submitted yet
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Rating</TableHead>
                          <TableHead>Description</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {generalFeedback.map((feedback) => (
                          <TableRow key={feedback.id}>
                            <TableCell className="whitespace-nowrap">
                              {format(new Date(feedback.createdAt), 'MMM d, yyyy')}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {feedback.userName || 'Anonymous'}
                                {feedback.userEmail && (
                                  <div className="text-xs text-muted-foreground">{feedback.userEmail}</div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={feedbackTypeColors[feedback.feedbackType] as any || 'default'}>
                                {feedback.feedbackType}
                              </Badge>
                            </TableCell>
                            <TableCell className="capitalize">{feedback.category}</TableCell>
                            <TableCell>
                              {feedback.rating ? (
                                <div className="flex items-center gap-1">
                                  <Star className="w-3 h-3 fill-primary text-primary" />
                                  <span className="text-sm">{feedback.rating}/5</span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-sm">-</span>
                              )}
                            </TableCell>
                            <TableCell className="max-w-md">
                              <p className="text-sm line-clamp-2">{feedback.description}</p>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sessions">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  AI Coach Session Ratings
                </CardTitle>
                <CardDescription>
                  User satisfaction ratings after coaching sessions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {sessionFeedback.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground" data-testid="text-no-session-feedback">
                    No session ratings submitted yet
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>Rating</TableHead>
                          <TableHead>Comments</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sessionFeedback.map((feedback) => (
                          <TableRow key={feedback.id}>
                            <TableCell className="whitespace-nowrap">
                              {format(new Date(feedback.createdAt), 'MMM d, yyyy')}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {feedback.userName || 'Anonymous'}
                                {feedback.userEmail && (
                                  <div className="text-xs text-muted-foreground">{feedback.userEmail}</div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-4 h-4 ${
                                      i < feedback.rating
                                        ? 'fill-primary text-primary'
                                        : 'text-muted-foreground'
                                    }`}
                                  />
                                ))}
                                <span className="ml-2 text-sm font-medium">{feedback.rating}/5</span>
                              </div>
                            </TableCell>
                            <TableCell className="max-w-md">
                              {feedback.feedbackText ? (
                                <p className="text-sm line-clamp-2">{feedback.feedbackText}</p>
                              ) : (
                                <span className="text-muted-foreground text-sm">No comments</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
