import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Heart } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Paywall() {
  const { toast } = useToast();

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/billing/checkout");
      return response.json();
    },
    onSuccess: (data: { url: string }) => {
      window.location.href = data.url;
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to start checkout",
        variant: "destructive",
      });
    },
  });

  const features = [
    "Unlimited AI relationship coaching with Coach Charles",
    "Personalized attachment style assessment",
    "Science-based exercises and activities",
    "DIY Couples retreat planning tools",
    "Weekly progress summaries with actionable steps",
    "Relationship progress tracking",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="bg-primary/10 p-4 rounded-full">
              <Heart className="w-12 h-12 text-primary" />
            </div>
          </div>
          <div>
            <CardTitle className="font-display text-3xl">
              Start Your Relationship Journey
            </CardTitle>
            <CardDescription className="text-base mt-2">
              Get access to evidence-based coaching and tools to strengthen your bond
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-primary">
              $19.99<span className="text-xl text-muted-foreground">/month</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Cancel anytime, no questions asked
            </p>
          </div>

          <div className="space-y-3">
            <p className="font-semibold text-sm text-muted-foreground">Everything included:</p>
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>

          <div className="bg-secondary/50 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Your Investment:</strong> Professional relationship coaching typically costs $150-300 per session. 
              Twangle gives you unlimited access for the price of a nice dinner out.
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          <Button
            size="lg"
            className="w-full"
            onClick={() => checkoutMutation.mutate()}
            disabled={checkoutMutation.isPending}
            data-testid="button-subscribe"
          >
            {checkoutMutation.isPending ? "Loading..." : "Start Subscription"}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Secure checkout powered by Stripe
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
