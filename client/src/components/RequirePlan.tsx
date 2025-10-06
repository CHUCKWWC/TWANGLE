import { usePlan, type PlanTier } from "@/hooks/usePlan";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Gift } from "lucide-react";

interface RequirePlanProps {
  children: React.ReactNode;
  minTier?: PlanTier;
  message?: string;
}

export function RequirePlan({ 
  children, 
  minTier = "premium",
  message = "This feature requires a premium subscription"
}: RequirePlanProps) {
  const { hasAccess, isLoading, tier } = usePlan();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }

  if (minTier === "premium" && !hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="bg-primary/10 p-4 rounded-full">
                <Lock className="w-12 h-12 text-primary" />
              </div>
            </div>
            <div>
              <CardTitle className="font-display text-2xl">
                Premium Feature
              </CardTitle>
              <CardDescription className="text-base mt-2">
                {message}
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
              <div className="flex items-start gap-3">
                <Gift className="w-5 h-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    Start your 7-day free trial
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Cancel anytime before day 7 to avoid charges.
                  </p>
                </div>
              </div>
            </div>

            <p className="text-sm text-muted-foreground text-center">
              Get full access to all premium features:
            </p>
            <ul className="text-sm space-y-2">
              <li>✓ Unlimited AI coaching sessions</li>
              <li>✓ Advanced attachment assessments</li>
              <li>✓ DIY retreat planning with AI</li>
              <li>✓ Weekly coaching summaries</li>
              <li>✓ Relationship progress tracking</li>
            </ul>

            <div className="flex flex-col gap-3 pt-4">
              <Button 
                onClick={() => setLocation("/paywall")} 
                className="w-full" 
                size="lg"
                data-testid="button-upgrade-now"
              >
                Start Free Trial
              </Button>
              <Button 
                onClick={() => setLocation("/")} 
                variant="ghost" 
                className="w-full" 
                size="lg"
                data-testid="button-back-home"
              >
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
