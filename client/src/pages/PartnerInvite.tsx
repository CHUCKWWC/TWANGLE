import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Users, Sparkles, CheckCircle2, XCircle, Clock, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";

interface InviteDetails {
  inviterName: string;
  inviterEmail: string;
  invitedEmail: string;
  expiresAt: string;
  token: string;
}

export default function PartnerInvite() {
  const [, params] = useRoute("/invite/:token");
  const [, navigate] = useLocation();
  const token = params?.token;
  const { user, isLoading: authLoading } = useAuth();
  const [isAccepting, setIsAccepting] = useState(false);

  const { data: inviteDetails, isLoading, error } = useQuery<InviteDetails>({
    queryKey: ['/api/partnerships', token, 'details'],
    queryFn: async () => {
      const res = await fetch(`/api/partnerships/${token}/details`, {
        credentials: 'include'
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to load invitation');
      }
      return res.json();
    },
    enabled: !!token,
    retry: false,
  });

  // Auto-accept partnership if user is already authenticated
  const acceptMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', `/api/partnerships/${token}/accept`, {});
    },
    onSuccess: () => {
      // Redirect to partner connection page after acceptance
      navigate('/partner-connection');
    },
    onError: (error: Error) => {
      console.error('Failed to accept partnership:', error);
      setIsAccepting(false);
      // Show error but don't redirect - let user see the page and try manual accept
    }
  });

  useEffect(() => {
    // If user is authenticated and we have invite details, auto-accept
    if (user && inviteDetails && !isAccepting && !acceptMutation.isPending && !acceptMutation.isError) {
      setIsAccepting(true);
      acceptMutation.mutate();
    }
  }, [user, inviteDetails, isAccepting, acceptMutation.isPending, acceptMutation.isError]);

  // Show loading while auto-accepting for authenticated users
  if (user && (isAccepting || acceptMutation.isPending)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Accepting invitation...</p>
        </div>
      </div>
    );
  }

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error || !inviteDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-6 h-6 text-destructive" />
            </div>
            <CardTitle className="text-center">Invalid Invitation</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground mb-6">
              {error?.message || "This invitation link is invalid or has expired."}
            </p>
            <Button asChild className="w-full" data-testid="button-go-home">
              <a href="/">Go to Homepage</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const expiresIn = formatDistanceToNow(new Date(inviteDetails.expiresAt), { addSuffix: true });

  // Handle manual accept for authenticated users when auto-accept fails
  const handleManualAccept = async () => {
    setIsAccepting(true);
    acceptMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      <div className="container mx-auto px-6 py-16">
        <div className="max-w-3xl mx-auto">
          {/* Error banner when auto-accept fails */}
          {acceptMutation.isError && user && (
            <Card className="mb-6 border-destructive/50 bg-destructive/5">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-destructive mb-1">Failed to accept invitation</p>
                    <p className="text-sm text-muted-foreground mb-3">
                      We couldn't automatically accept the invitation. Please try again.
                    </p>
                    <Button 
                      onClick={handleManualAccept}
                      disabled={acceptMutation.isPending}
                      size="sm"
                      data-testid="button-retry-accept"
                    >
                      {acceptMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Accepting...
                        </>
                      ) : (
                        'Try Again'
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="text-center mb-12">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
              <Heart className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 font-[Poppins]" data-testid="text-invite-title">
              {inviteDetails.inviterName} invited you to join Twangle!
            </h1>
            <p className="text-xl text-muted-foreground">
              Start your relationship wellness journey together
            </p>
          </div>

          <Card className="mb-8">
            <CardContent className="p-8">
              <div className="space-y-6">
                <div className="text-center pb-6 border-b border-border">
                  <p className="text-lg mb-2">
                    <span className="font-semibold">{inviteDetails.inviterName}</span> wants to strengthen your relationship using Twangle
                  </p>
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>Invitation expires {expiresIn}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">What you'll get together:</h3>
                  
                  <div className="flex gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">AI Relationship Coach</p>
                      <p className="text-sm text-muted-foreground">
                        Chat 24/7 with Coach Charles trained in Gottman Method and Attachment Theory
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Shared Progress Tracking</p>
                      <p className="text-sm text-muted-foreground">
                        View each other's assessments and relationship health score
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Personalized Exercises</p>
                      <p className="text-sm text-muted-foreground">
                        Access research-based activities designed for couples
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Private Journaling</p>
                      <p className="text-sm text-muted-foreground">
                        Track your relationship journey with optional AI insights
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-primary/10 rounded-lg p-4 mt-6">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-primary mb-1">7-Day Free Trial</p>
                      <p className="text-sm text-muted-foreground">
                        Start immediately with full access to all features. No credit card required.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="text-center space-y-4">
            <Button
              asChild
              size="lg"
              className="w-full sm:w-auto px-12 py-6 text-lg"
              data-testid="button-accept-invite"
            >
              <a href={`/api/signup?inviteToken=${inviteDetails.token}`}>
                Accept Invitation & Sign Up Free
              </a>
            </Button>
            <p className="text-sm text-muted-foreground">
              Already have an account? <a href="/api/login" className="text-primary hover:underline">Sign in to accept</a>
            </p>
          </div>

          <div className="mt-16 text-center">
            <h3 className="text-2xl font-bold mb-8 font-[Poppins]">Why couples choose Twangle</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <h4 className="font-semibold mb-2">Evidence-Based</h4>
                  <p className="text-sm text-muted-foreground">
                    Built on proven therapeutic frameworks like Gottman Method and EFT
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>
                  <h4 className="font-semibold mb-2">Always Available</h4>
                  <p className="text-sm text-muted-foreground">
                    Get support 24/7 whenever you need it, not just during therapy hours
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                    <Heart className="w-6 h-6 text-primary" />
                  </div>
                  <h4 className="font-semibold mb-2">Affordable</h4>
                  <p className="text-sm text-muted-foreground">
                    Professional guidance at a fraction of traditional therapy costs
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
