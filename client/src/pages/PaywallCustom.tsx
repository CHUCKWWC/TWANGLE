import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { SubscriptionCheckout } from "@/components/SubscriptionCheckout";
import { useAuth } from "@/hooks/useAuth";

interface Price {
  id: string;
  priceId: string;
  name: string;
  price: number;
  interval: string;
  trialDays: number;
  savings?: string;
}

interface ConfigResponse {
  publishableKey: string;
}

interface PricesResponse {
  prices: Price[];
}

export default function PaywallCustom() {
  const { user } = useAuth();

  const { data: config } = useQuery<ConfigResponse>({
    queryKey: ["/api/billing/config"],
  });

  const { data: pricesData, isLoading: pricesLoading } = useQuery<PricesResponse>({
    queryKey: ["/api/billing/prices"],
  });

  const stripePromise = config?.publishableKey 
    ? loadStripe(config.publishableKey)
    : null;

  if (pricesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full space-y-6">
        <Card className="max-w-3xl mx-auto">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="bg-primary/10 p-4 rounded-full">
                <Heart className="w-12 h-12 text-primary" />
              </div>
            </div>
            <div>
              <CardTitle className="font-display text-3xl">
                Start Your 7-Day Free Trial
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Full access to all premium features. Cancel anytime.
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {stripePromise && pricesData?.prices && (
              <Elements stripe={stripePromise}>
                <SubscriptionCheckout prices={pricesData.prices} />
              </Elements>
            )}

            {!stripePromise && (
              <div className="text-center text-muted-foreground">
                Loading payment options...
              </div>
            )}

            <div className="bg-secondary/50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Your Investment:</strong> Professional relationship coaching typically costs $150-300 per session. 
                Twangle gives you unlimited access for less than the price of dinner out.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
