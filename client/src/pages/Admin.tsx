import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usePlan } from "@/hooks/usePlan";
import { useLocation } from "wouter";
import { AppHeader } from "@/components/AppHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Shield, Database, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { isAdminUser } from "@shared/adminAccess";

export default function Admin() {
  const { user } = useAuth();
  const { hasLifetimeAccess, isLoading: planLoading } = usePlan();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [seedingChallenges, setSeedingChallenges] = useState(false);
  const [seedingConversations, setSeedingConversations] = useState(false);
  const [challengeResult, setChallengeResult] = useState<{ success: boolean; message: string } | null>(null);
  const [conversationResult, setConversationResult] = useState<{ success: boolean; message: string } | null>(null);

  // Check if user has admin access
  const hasAdminAccess = isAdminUser(user?.email) || hasLifetimeAccess;

  useEffect(() => {
    // Redirect if not authorized
    if (!planLoading && !hasAdminAccess) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the admin panel.",
        variant: "destructive",
      });
      setLocation("/");
    }
  }, [hasAdminAccess, planLoading, setLocation, toast]);

  const handleSeedChallenges = async () => {
    setSeedingChallenges(true);
    setChallengeResult(null);
    
    try {
      const response = await apiRequest("POST", "/api/admin/seed-challenges", {});
      
      setChallengeResult({
        success: true,
        message: response.message || "40dayTwangle content seeded successfully!"
      });
      
      toast({
        title: "Success",
        description: response.message || "40dayTwangle content has been seeded successfully.",
      });
    } catch (error: any) {
      const errorMessage = error.message || "Failed to seed 40dayTwangle content.";
      
      setChallengeResult({
        success: false,
        message: errorMessage
      });
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSeedingChallenges(false);
    }
  };

  const handleSeedConversations = async () => {
    setSeedingConversations(true);
    setConversationResult(null);
    
    try {
      const response = await apiRequest("POST", "/api/admin/seed-conversations", {});
      
      setConversationResult({
        success: true,
        message: response.message || "Conversation questions seeded successfully!"
      });
      
      toast({
        title: "Success",
        description: response.message || "Conversation questions have been seeded successfully.",
      });
    } catch (error: any) {
      const errorMessage = error.message || "Failed to seed conversation questions.";
      
      setConversationResult({
        success: false,
        message: errorMessage
      });
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSeedingConversations(false);
    }
  };

  if (planLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }

  if (!hasAdminAccess) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      <main className="container mx-auto px-4 py-8 pt-20 max-w-4xl">
        {/* Admin Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Admin Panel</h1>
          </div>
          <p className="text-muted-foreground">Database management and seeding tools</p>
          <div className="flex items-center justify-center gap-2 mt-3">
            {isAdminUser(user?.email) && (
              <Badge variant="default" className="gap-1">
                <Shield className="h-3 w-3" />
                Admin User
              </Badge>
            )}
            {hasLifetimeAccess && (
              <Badge variant="secondary" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Lifetime Access
              </Badge>
            )}
          </div>
        </div>

        {/* Seed Database Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Seeding
            </CardTitle>
            <CardDescription>
              Initialize database with default content for 40dayTwangle challenges and conversation questions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 40dayTwangle Seeding */}
            <div className="space-y-2">
              <Button
                onClick={handleSeedChallenges}
                disabled={seedingChallenges || seedingConversations}
                className="w-full h-14 text-lg"
                size="lg"
                data-testid="button-seed-challenges"
              >
                {seedingChallenges ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Seeding 40dayTwangle Content...
                  </>
                ) : (
                  <>
                    <Database className="mr-2 h-5 w-5" />
                    Seed 40dayTwangle Content
                  </>
                )}
              </Button>
              
              {challengeResult && (
                <div
                  className={`p-3 rounded-md flex items-start gap-2 ${
                    challengeResult.success 
                      ? "bg-green-50 dark:bg-green-950 text-green-800 dark:text-green-200" 
                      : "bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-200"
                  }`}
                  data-testid="status-challenges-result"
                >
                  {challengeResult.success ? (
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  )}
                  <span className="text-sm">{challengeResult.message}</span>
                </div>
              )}
            </div>

            {/* Conversation Questions Seeding */}
            <div className="space-y-2">
              <Button
                onClick={handleSeedConversations}
                disabled={seedingChallenges || seedingConversations}
                className="w-full h-14 text-lg"
                size="lg"
                variant="secondary"
                data-testid="button-seed-conversations"
              >
                {seedingConversations ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Seeding Conversation Questions...
                  </>
                ) : (
                  <>
                    <Database className="mr-2 h-5 w-5" />
                    Seed Conversation Questions
                  </>
                )}
              </Button>
              
              {conversationResult && (
                <div
                  className={`p-3 rounded-md flex items-start gap-2 ${
                    conversationResult.success 
                      ? "bg-green-50 dark:bg-green-950 text-green-800 dark:text-green-200" 
                      : "bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-200"
                  }`}
                  data-testid="status-conversations-result"
                >
                  {conversationResult.success ? (
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  )}
                  <span className="text-sm">{conversationResult.message}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Instructions Card */}
        <Card>
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <div>
              <h3 className="font-semibold text-foreground mb-1">40dayTwangle Content</h3>
              <p>Seeds the database with 40 days of relationship-building challenges including daily tasks, reflections, and activities for couples.</p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">Conversation Questions</h3>
              <p>Seeds the database with therapeutic conversation starters designed to help couples improve communication and deepen their connection.</p>
            </div>
            <div className="pt-2 border-t">
              <p className="text-xs">
                <strong>Note:</strong> These operations will add new content to the database. Existing data will not be affected. You can run these multiple times if needed.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}