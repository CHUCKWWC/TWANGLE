import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { AppHeader } from "@/components/AppHeader";
import { EmailVerificationBanner } from "@/components/EmailVerificationBanner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { User, Calendar, Activity, MessageSquare, MapPin, ClipboardList, Settings, Mail, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";

interface UserStats {
  assessmentCount: number;
  chatSessionCount: number;
  retreatCount: number;
  subscriptionStatus: string;
  subscriptionTier: string;
}

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState((user as any)?.newsletterSubscribed === 1);
  
  const { data: stats, isLoading: statsLoading } = useQuery<UserStats>({
    queryKey: ["/api/user/stats"],
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (displayName: string) => {
      return await apiRequest("/api/user/profile", "PUT", { displayName });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setNewDisplayName('');
      toast({
        title: "Profile updated",
        description: "Your display name has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const newsletterMutation = useMutation({
    mutationFn: async (subscribe: boolean) => {
      const endpoint = subscribe ? "/api/newsletter/subscribe" : "/api/newsletter/unsubscribe";
      return await apiRequest(endpoint, "POST", {});
    },
    onSuccess: (_, subscribe) => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: subscribe ? "Subscribed" : "Unsubscribed",
        description: subscribe 
          ? "You'll receive our newsletter updates." 
          : "You won't receive newsletter updates.",
      });
    },
    onError: () => {
      setNewsletterSubscribed(!newsletterSubscribed);
      toast({
        title: "Error",
        description: "Failed to update newsletter preference.",
        variant: "destructive",
      });
    },
  });

  const handleUpdateDisplayName = (e: React.FormEvent) => {
    e.preventDefault();
    if (newDisplayName.trim()) {
      updateProfileMutation.mutate(newDisplayName.trim());
    }
  };

  const displayName = user?.displayName || [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'User';

  const getSubscriptionBadge = (tier: string, status: string) => {
    if (status === 'active' && tier) {
      return <Badge variant="default">{tier.charAt(0).toUpperCase() + tier.slice(1)}</Badge>;
    }
    return <Badge variant="secondary">Free</Badge>;
  };

  const emailVerified = (user as any)?.emailVerified === 1;

  return (
    <>
      <AppHeader />
      <div className="pt-16 min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-display font-bold" data-testid="text-profile-name">{displayName}</h1>
                <p className="text-muted-foreground" data-testid="text-profile-email">{user?.email}</p>
              </div>
            </div>

            <EmailVerificationBanner emailVerified={emailVerified} />

            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>Your profile details and subscription status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Member since</span>
                  </div>
                  <span className="text-sm font-medium" data-testid="text-member-since">
                    {user?.createdAt ? format(new Date(user.createdAt), 'MMMM d, yyyy') : 'N/A'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Subscription</span>
                  </div>
                  {statsLoading ? (
                    <Skeleton className="h-6 w-20" />
                  ) : (
                    <span data-testid="badge-subscription">
                      {getSubscriptionBadge(stats?.subscriptionTier || 'free', stats?.subscriptionStatus || 'none')}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Email Status</span>
                  </div>
                  {emailVerified ? (
                    <div className="flex items-center gap-1" data-testid="status-email-verified">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-600">Verified</span>
                    </div>
                  ) : (
                    <span className="text-sm font-medium text-muted-foreground" data-testid="status-email-unverified">
                      Not Verified
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  <CardTitle>Profile Settings</CardTitle>
                </div>
                <CardDescription>Customize how your name appears in the app</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateDisplayName} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name</Label>
                    <div className="flex gap-2">
                      <Input
                        id="displayName"
                        type="text"
                        placeholder={displayName}
                        value={newDisplayName}
                        onChange={(e) => setNewDisplayName(e.target.value)}
                        disabled={updateProfileMutation.isPending}
                        data-testid="input-display-name"
                      />
                      <Button 
                        type="submit" 
                        disabled={!newDisplayName.trim() || updateProfileMutation.isPending}
                        data-testid="button-save-display-name"
                      >
                        {updateProfileMutation.isPending ? 'Saving...' : 'Save'}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Current: {displayName}
                    </p>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Email Preferences</CardTitle>
                <CardDescription>Manage your email notification settings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="newsletter-toggle" className="cursor-pointer">
                      Newsletter Subscription
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receive relationship tips, exercises, and updates
                    </p>
                  </div>
                  <Switch
                    id="newsletter-toggle"
                    checked={newsletterSubscribed}
                    onCheckedChange={(checked) => {
                      setNewsletterSubscribed(checked);
                      newsletterMutation.mutate(checked);
                    }}
                    disabled={newsletterMutation.isPending}
                    data-testid="switch-newsletter"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Your Activity</CardTitle>
                <CardDescription>Overview of your relationship wellness journey</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {statsLoading ? (
                  <>
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <ClipboardList className="w-5 h-5 text-primary" />
                        <span className="font-medium">Assessments Completed</span>
                      </div>
                      <span className="text-2xl font-bold" data-testid="text-assessment-count">
                        {stats?.assessmentCount || 0}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <MessageSquare className="w-5 h-5 text-primary" />
                        <span className="font-medium">Coach Conversations</span>
                      </div>
                      <span className="text-2xl font-bold" data-testid="text-chat-count">
                        {stats?.chatSessionCount || 0}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-primary" />
                        <span className="font-medium">Retreats Planned</span>
                      </div>
                      <span className="text-2xl font-bold" data-testid="text-retreat-count">
                        {stats?.retreatCount || 0}
                      </span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
