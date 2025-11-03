import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CheckCircle2, XCircle, AlertCircle, ExternalLink } from "lucide-react";

/**
 * MERCHANT ONBOARDING PAGE
 * 
 * This page allows users to:
 * 1. Create a Stripe connected account
 * 2. Complete onboarding to accept payments
 * 3. View current onboarding status
 * 
 * The account status is fetched directly from Stripe API
 * (not stored in database except for caching)
 */
export default function MerchantOnboard() {
  const { toast } = useToast();
  const [isOnboarding, setIsOnboarding] = useState(false);

  // Fetch account status from Stripe
  const { data: accountStatus, isLoading } = useQuery({
    queryKey: ['/api/stripe-connect/account-status'],
    refetchInterval: 5000, // Refresh every 5 seconds while onboarding
  });

  // Mutation to create connected account
  const createAccountMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/stripe-connect/account');
    },
    onSuccess: () => {
      toast({
        title: "Account Created",
        description: "Your merchant account has been created successfully. Please complete onboarding.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/stripe-connect/account-status'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    },
  });

  // Mutation to get onboarding link
  const getOnboardingLinkMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/stripe-connect/account-link');
    },
    onSuccess: (data: any) => {
      setIsOnboarding(true);
      // Redirect to Stripe onboarding
      window.location.href = data.url;
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to get onboarding link",
        variant: "destructive",
      });
      setIsOnboarding(false);
    },
  });

  const handleCreateAccount = () => {
    createAccountMutation.mutate();
  };

  const handleStartOnboarding = () => {
    getOnboardingLinkMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading account status...</p>
        </div>
      </div>
    );
  }

  const hasAccount = accountStatus?.hasAccount;
  const isFullyOnboarded = accountStatus?.chargesEnabled && accountStatus?.detailsSubmitted;

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">Merchant Onboarding</h1>
        <p className="text-muted-foreground">
          Set up your account to sell products and accept payments through our marketplace.
        </p>
      </div>

      {!hasAccount && (
        <Card data-testid="card-create-account">
          <CardHeader>
            <CardTitle>Step 1: Create Merchant Account</CardTitle>
            <CardDescription>
              Create a Stripe connected account to start selling products on our platform.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You need a merchant account to create and sell products. The platform will handle payments
                and collect a 10% fee on each sale.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button
              type="button"
              onClick={handleCreateAccount}
              disabled={createAccountMutation.isPending}
              data-testid="button-create-account"
            >
              {createAccountMutation.isPending ? "Creating..." : "Create Merchant Account"}
            </Button>
          </CardFooter>
        </Card>
      )}

      {hasAccount && !isFullyOnboarded && (
        <Card data-testid="card-onboard">
          <CardHeader>
            <CardTitle>Step 2: Complete Onboarding</CardTitle>
            <CardDescription>
              Provide required information to Stripe to start accepting payments.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {accountStatus.detailsSubmitted ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-muted-foreground" />
                )}
                <span>Business details submitted</span>
                <Badge variant={accountStatus.detailsSubmitted ? "default" : "secondary"}>
                  {accountStatus.detailsSubmitted ? "Complete" : "Pending"}
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                {accountStatus.chargesEnabled ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-muted-foreground" />
                )}
                <span>Charges enabled</span>
                <Badge variant={accountStatus.chargesEnabled ? "default" : "secondary"}>
                  {accountStatus.chargesEnabled ? "Active" : "Not Ready"}
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                {accountStatus.payoutsEnabled ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-muted-foreground" />
                )}
                <span>Payouts enabled</span>
                <Badge variant={accountStatus.payoutsEnabled ? "default" : "secondary"}>
                  {accountStatus.payoutsEnabled ? "Active" : "Not Ready"}
                </Badge>
              </div>
            </div>

            {accountStatus.requirementsCurrentlyDue?.length > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Action Required:</strong> You need to complete {accountStatus.requirementsCurrentlyDue.length} requirement(s)
                  to finish onboarding.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter>
            <Button
              type="button"
              onClick={handleStartOnboarding}
              disabled={isOnboarding || getOnboardingLinkMutation.isPending}
              data-testid="button-start-onboarding"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              {isOnboarding ? "Redirecting..." : "Complete Onboarding with Stripe"}
            </Button>
          </CardFooter>
        </Card>
      )}

      {isFullyOnboarded && (
        <Card data-testid="card-onboarding-complete">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <CardTitle>Onboarding Complete!</CardTitle>
            </div>
            <CardDescription>
              Your merchant account is fully set up and ready to accept payments.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <p className="text-sm font-medium text-green-900 dark:text-green-100">
                Account ID: <code className="text-xs">{accountStatus.accountId}</code>
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">What you can do now:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Create products for sale in the marketplace</li>
                <li>Receive payments directly to your account</li>
                <li>View earnings and payouts in your Stripe dashboard</li>
              </ul>
            </div>
          </CardContent>
          <CardFooter className="gap-2">
            <Button
              asChild
              data-testid="button-create-products"
            >
              <a href="/merchant/products">Create Products</a>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleStartOnboarding}
              data-testid="button-manage-account"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Manage Account
            </Button>
          </CardFooter>
        </Card>
      )}

      {hasAccount && (
        <div className="mt-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Platform Fee:</strong> We charge a 10% application fee on each sale. You'll receive 90% of the sale price.
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
}
