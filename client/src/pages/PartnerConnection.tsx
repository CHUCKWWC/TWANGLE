import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Users, Mail, Check, X, Clock, Link as LinkIcon, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

interface Partnership {
  id: string;
  user1Id: string;
  user2Id: string | null;
  user2Email: string | null;
  status: string;
  inviteToken: string | null;
  inviteExpiresAt: Date | null;
  sharedAssessments: number;
  sharedProgress: number;
  sharedJournal: number;
  connectedAt: Date | null;
  createdAt: Date;
}

const inviteSchema = z.object({
  user2Email: z.string().email("Please enter a valid email address"),
  sharedAssessments: z.number().default(1),
  sharedProgress: z.number().default(1),
  sharedJournal: z.number().default(0),
});

export default function PartnerConnection() {
  const { toast } = useToast();
  const [showSettings, setShowSettings] = useState(false);

  const { data: partnership, isLoading } = useQuery<Partnership | null>({
    queryKey: ['/api/partnerships'],
  });

  const { data: pendingInvites } = useQuery<Partnership[]>({
    queryKey: ['/api/partnerships/pending'],
  });

  const form = useForm<z.infer<typeof inviteSchema>>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      user2Email: "",
      sharedAssessments: 1,
      sharedProgress: 1,
      sharedJournal: 0,
    },
  });

  const createInviteMutation = useMutation({
    mutationFn: async (data: z.infer<typeof inviteSchema>) => {
      return await apiRequest('POST', '/api/partnerships', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/partnerships'] });
      toast({
        title: "Invitation Sent",
        description: "Your partner will receive an email invitation to connect.",
      });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const acceptInviteMutation = useMutation({
    mutationFn: async (token: string) => {
      return await apiRequest('POST', `/api/partnerships/${token}/accept`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/partnerships'] });
      queryClient.invalidateQueries({ queryKey: ['/api/partnerships/pending'] });
      toast({
        title: "Partnership Accepted",
        description: "You're now connected with your partner!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Partnership> }) => {
      return await apiRequest('PATCH', `/api/partnerships/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/partnerships'] });
      toast({
        title: "Settings Updated",
        description: "Partnership sharing preferences have been updated.",
      });
      setShowSettings(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof inviteSchema>) => {
    createInviteMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-page-title">Partner Connection</h1>
        <p className="text-muted-foreground mt-1">
          Connect with your partner to share progress and grow together
        </p>
      </div>

      {partnership?.status === 'active' ? (
        <>
          <Card data-testid="card-active-partnership">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-600" />
                Connected Partnership
              </CardTitle>
              <CardDescription>
                You're connected and sharing your relationship journey
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">Partnership Active</div>
                  <div className="text-sm text-muted-foreground">
                    Connected on {partnership.connectedAt ? new Date(partnership.connectedAt).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
                <Badge variant="default" className="bg-green-600">
                  <Check className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label>Sharing Settings</Label>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSettings(!showSettings)}
                    data-testid="button-toggle-settings"
                  >
                    <Settings className="h-4 w-4 mr-1" />
                    {showSettings ? 'Hide' : 'Configure'}
                  </Button>
                </div>

                {!showSettings ? (
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between p-2 rounded-md bg-muted/30">
                      <span className="text-sm">Assessment Results</span>
                      <Badge variant={partnership.sharedAssessments ? "default" : "secondary"}>
                        {partnership.sharedAssessments ? 'Shared' : 'Private'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-md bg-muted/30">
                      <span className="text-sm">Progress Tracking</span>
                      <Badge variant={partnership.sharedProgress ? "default" : "secondary"}>
                        {partnership.sharedProgress ? 'Shared' : 'Private'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-md bg-muted/30">
                      <span className="text-sm">Journal Entries</span>
                      <Badge variant={partnership.sharedJournal ? "default" : "secondary"}>
                        {partnership.sharedJournal ? 'Shared' : 'Private'}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 p-4 border rounded-md">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="share-assessments">Share Assessment Results</Label>
                        <p className="text-sm text-muted-foreground">
                          Let your partner see your attachment style and assessment results
                        </p>
                      </div>
                      <Switch
                        id="share-assessments"
                        checked={!!partnership.sharedAssessments}
                        onCheckedChange={(checked) => {
                          updateSettingsMutation.mutate({
                            id: partnership.id,
                            updates: { sharedAssessments: checked ? 1 : 0 },
                          });
                        }}
                        data-testid="switch-share-assessments"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="share-progress">Share Progress Tracking</Label>
                        <p className="text-sm text-muted-foreground">
                          Share your coaching sessions, exercises, and milestones
                        </p>
                      </div>
                      <Switch
                        id="share-progress"
                        checked={!!partnership.sharedProgress}
                        onCheckedChange={(checked) => {
                          updateSettingsMutation.mutate({
                            id: partnership.id,
                            updates: { sharedProgress: checked ? 1 : 0 },
                          });
                        }}
                        data-testid="switch-share-progress"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="share-journal">Share Journal Entries</Label>
                        <p className="text-sm text-muted-foreground">
                          Allow your partner to read your relationship journal
                        </p>
                      </div>
                      <Switch
                        id="share-journal"
                        checked={!!partnership.sharedJournal}
                        onCheckedChange={(checked) => {
                          updateSettingsMutation.mutate({
                            id: partnership.id,
                            updates: { sharedJournal: checked ? 1 : 0 },
                          });
                        }}
                        data-testid="switch-share-journal"
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      ) : partnership?.status === 'pending' ? (
        <Card data-testid="card-pending-invite">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              Invitation Sent
            </CardTitle>
            <CardDescription>
              Waiting for your partner to accept the invitation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
              <Mail className="h-8 w-8 text-muted-foreground" />
              <div className="flex-1">
                <div className="font-medium">Invitation to: {partnership.user2Email}</div>
                <div className="text-sm text-muted-foreground">
                  Sent on {new Date(partnership.createdAt).toLocaleDateString()}
                </div>
                {partnership.inviteExpiresAt && (
                  <div className="text-sm text-muted-foreground">
                    Expires: {new Date(partnership.inviteExpiresAt).toLocaleDateString()}
                  </div>
                )}
              </div>
              <Badge variant="secondary">
                <Clock className="h-3 w-3 mr-1" />
                Pending
              </Badge>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="h-5 w-5" />
              Invite Your Partner
            </CardTitle>
            <CardDescription>
              Connect with your partner to share your relationship journey
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="user2Email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Partner's Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="partner@example.com"
                          data-testid="input-partner-email"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        They'll receive an invitation to connect their account
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <Label>Initial Sharing Preferences</Label>
                  
                  <FormField
                    control={form.control}
                    name="sharedAssessments"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <FormLabel>Share Assessments</FormLabel>
                          <FormDescription>
                            Share your attachment style and assessment results
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={!!field.value}
                            onCheckedChange={(checked) => field.onChange(checked ? 1 : 0)}
                            data-testid="switch-invite-assessments"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sharedProgress"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <FormLabel>Share Progress</FormLabel>
                          <FormDescription>
                            Share your coaching sessions and milestones
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={!!field.value}
                            onCheckedChange={(checked) => field.onChange(checked ? 1 : 0)}
                            data-testid="switch-invite-progress"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sharedJournal"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <FormLabel>Share Journal</FormLabel>
                          <FormDescription>
                            Share your relationship journal entries
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={!!field.value}
                            onCheckedChange={(checked) => field.onChange(checked ? 1 : 0)}
                            data-testid="switch-invite-journal"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={createInviteMutation.isPending}
                  data-testid="button-send-invite"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  {createInviteMutation.isPending ? "Sending..." : "Send Invitation"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {pendingInvites && pendingInvites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Invitations</CardTitle>
            <CardDescription>
              You have {pendingInvites.length} pending invitation{pendingInvites.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingInvites.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center gap-4 p-4 border rounded-lg"
                data-testid={`invite-${invite.id}`}
              >
                <Mail className="h-8 w-8 text-muted-foreground" />
                <div className="flex-1">
                  <div className="font-medium">Partnership Invitation</div>
                  <div className="text-sm text-muted-foreground">
                    Received {new Date(invite.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <Button
                  onClick={() => invite.inviteToken && acceptInviteMutation.mutate(invite.inviteToken)}
                  disabled={acceptInviteMutation.isPending}
                  data-testid={`button-accept-${invite.id}`}
                >
                  <Check className="mr-2 h-4 w-4" />
                  Accept
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
