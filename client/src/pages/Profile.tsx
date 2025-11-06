import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { usePlan } from "@/hooks/usePlan";
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
import { User, Calendar, Activity, MessageSquare, MapPin, ClipboardList, Settings, Mail, CheckCircle2, Heart, Send, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";

interface UserStats {
  assessmentCount: number;
  chatSessionCount: number;
  retreatCount: number;
  subscriptionStatus: string;
  subscriptionTier: string;
}

interface CoupleResponse {
  couple: {
    id: string;
    primaryUserId: string;
    partnerUserId: string | null;
    status: string;
    partnerInviteEmail: string | null;
    partnerInviteToken: string | null;
    stripeSubscriptionId: string | null;
  } | null;
  primaryUser: { email: string } | null;
  partnerUser: { email: string } | null;
  isPrimaryUser: boolean;
  isPartnerUser: boolean;
}

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState((user as any)?.newsletterSubscribed === 1);
  const [partnerEmail, setPartnerEmail] = useState('');
  
  const { data: stats, isLoading: statsLoading } = useQuery<UserStats>({
    queryKey: ["/api/user/stats"],
  });

  const { tier, hasLifetimeAccess, onTrial, isActive, isLoading: planLoading } = usePlan();

  const { data: coupleResponse, isLoading: coupleLoading } = useQuery<CoupleResponse>({
    queryKey: ["/api/couples/me"],
  });

  const coupleData = coupleResponse?.couple;

  const updateProfileMutation = useMutation({
    mutationFn: async (displayName: string) => {
      return await apiRequest("PUT", "/api/user/profile", { displayName });
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
      return await apiRequest("POST", endpoint, {});
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

  const invitePartnerMutation = useMutation({
    mutationFn: async (email: string) => {
      return await apiRequest("POST", "/api/couples/invite", { partnerEmail: email });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/couples/me"] });
      setPartnerEmail('');
      toast({
        title: "Invitation Sent",
        description: "Your partner has been invited to join your couple subscription.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send invitation.",
        variant: "destructive",
      });
    },
  });

  const cancelInviteMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/couples/cancel-invite", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/couples/me"] });
      toast({
        title: "Invitation Cancelled",
        description: "You can now invite a different partner.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel invitation.",
        variant: "destructive",
      });
    },
  });

  const manageBillingMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/billing/customer-portal", {});
      return await res.json();
    },
    onSuccess: (data: { url: string }) => {
      window.location.href = data.url;
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to open billing portal.",
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

  const handleInvitePartner = (e: React.FormEvent) => {
    e.preventDefault();
    if (partnerEmail.trim()) {
      invitePartnerMutation.mutate(partnerEmail.trim());
    }
  };

  const displayName = user?.displayName || [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'User';

  const getSubscriptionBadge = () => {
    if (hasLifetimeAccess) {
      return <Badge variant="default">Lifetime Premium</Badge>;
    }
    if (onTrial) {
      return <Badge variant="default">Premium (Trial)</Badge>;
    }
    if (isActive && tier === 'premium') {
      return <Badge variant="default">Premium</Badge>;
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
                  {planLoading ? (
                    <Skeleton className="h-6 w-20" />
                  ) : (
                    <span data-testid="badge-subscription">
                      {getSubscriptionBadge()}
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
                        autoComplete="name"
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

            {coupleData && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-primary" />
                    <CardTitle>Couple Subscription</CardTitle>
                  </div>
                  <CardDescription>
                    Share premium access with your partner for one low price
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {coupleLoading ? (
                    <Skeleton className="h-20 w-full" />
                  ) : coupleData?.partnerUserId ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div>
                          <p className="text-sm font-medium">Partner</p>
                          <p className="text-sm text-muted-foreground" data-testid="text-partner-email">
                            {coupleResponse?.partnerUser?.email}
                          </p>
                        </div>
                        <Badge variant="default" data-testid="badge-couple-status">Connected</Badge>
                      </div>
                      {coupleResponse?.isPrimaryUser && (
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => manageBillingMutation.mutate()}
                          disabled={manageBillingMutation.isPending}
                          data-testid="button-manage-billing"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          {manageBillingMutation.isPending ? 'Opening...' : 'Manage Billing'}
                        </Button>
                      )}
                    </div>
                  ) : coupleData?.partnerInviteEmail ? (
                    <div className="space-y-3">
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-sm font-medium">Pending Invitation</p>
                        <p className="text-sm text-muted-foreground" data-testid="text-invite-email">
                          {coupleData.partnerInviteEmail}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Waiting for your partner to accept
                        </p>
                      </div>
                      {coupleResponse?.isPrimaryUser && (
                        <div className="space-y-2">
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => cancelInviteMutation.mutate()}
                            disabled={cancelInviteMutation.isPending}
                            data-testid="button-cancel-invite"
                          >
                            {cancelInviteMutation.isPending ? 'Resetting...' : 'Reset Email Address'}
                          </Button>
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => manageBillingMutation.mutate()}
                            disabled={manageBillingMutation.isPending}
                            data-testid="button-manage-billing"
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            {manageBillingMutation.isPending ? 'Opening...' : 'Manage Billing'}
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <form onSubmit={handleInvitePartner} className="space-y-3">
                      <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                        <p className="text-sm font-medium">Invite Your Partner</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Share your premium subscription with your partner at no extra cost
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Input
                          type="email"
                          placeholder="partner@example.com"
                          value={partnerEmail}
                          onChange={(e) => setPartnerEmail(e.target.value)}
                          disabled={invitePartnerMutation.isPending}
                          autoComplete="email"
                          data-testid="input-partner-email"
                        />
                        <Button
                          type="submit"
                          disabled={!partnerEmail.trim() || invitePartnerMutation.isPending}
                          data-testid="button-send-invite"
                        >
                          <Send className="w-4 h-4 mr-2" />
                          {invitePartnerMutation.isPending ? 'Sending...' : 'Invite'}
                        </Button>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => manageBillingMutation.mutate()}
                        disabled={manageBillingMutation.isPending}
                        data-testid="button-manage-billing"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        {manageBillingMutation.isPending ? 'Opening...' : 'Manage Billing'}
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            )}

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
