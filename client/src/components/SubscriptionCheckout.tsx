import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Check, AlertCircle } from "lucide-react";
import { CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface Price {
  id: string;
  priceId: string;
  name: string;
  price: number;
  interval: string;
  trialDays: number;
  savings?: string;
}

interface SubscriptionCheckoutProps {
  prices: Price[];
  onSuccess?: () => void;
}

export function SubscriptionCheckout({ prices, onSuccess }: SubscriptionCheckoutProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [selectedPrice, setSelectedPrice] = useState<Price>(prices[0]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const cardNumberElement = elements.getElement(CardNumberElement);
      if (!cardNumberElement) {
        throw new Error("Card element not found");
      }

      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
        type: "card",
        card: cardNumberElement,
      });

      if (pmError) {
        throw new Error(pmError.message);
      }

      const res = await apiRequest(
        "POST",
        "/api/billing/create-subscription",
        {
          paymentMethodId: paymentMethod.id,
          priceId: selectedPrice.priceId,
        }
      );

      const response: {
        subscriptionId: string;
        clientSecret?: string;
        status: string;
      } = await res.json();

      const statusStr = String(response.status);
      if (statusStr === "trialing" || statusStr === "active") {
        await queryClient.invalidateQueries({ queryKey: ["/api/billing/status"] });
        
        toast({
          title: "Trial Started!",
          description: "Your 7-day free trial has begun. Enjoy premium features!",
        });

        if (onSuccess) {
          onSuccess();
        } else {
          setLocation("/");
        }
      } else {
        throw new Error("Unexpected subscription status: " + statusStr);
      }
    } catch (err: any) {
      setError(err.message || "Failed to create subscription");
      toast({
        title: "Error",
        description: err.message || "Failed to create subscription",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const CARD_ELEMENT_OPTIONS = {
    style: {
      base: {
        fontSize: "16px",
        color: "hsl(var(--foreground))",
        fontFamily: "system-ui, -apple-system, sans-serif",
        "::placeholder": {
          color: "hsl(var(--muted-foreground))",
        },
      },
      invalid: {
        color: "hsl(var(--destructive))",
      },
    },
  };

  const cardElementClasses = "p-3 border rounded-md bg-background transition-colors focus-within:ring-2 focus-within:ring-primary focus-within:border-primary";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        {prices.map((price) => (
          <Card
            key={price.id}
            className={`cursor-pointer transition-all ${
              selectedPrice.id === price.id
                ? "border-primary ring-2 ring-primary"
                : "hover-elevate"
            }`}
            onClick={() => setSelectedPrice(price)}
            data-testid={`price-option-${price.id}`}
          >
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{price.name}</span>
                {selectedPrice.id === price.id && (
                  <Check className="w-5 h-5 text-primary" />
                )}
              </CardTitle>
              <CardDescription>
                <span className="text-2xl font-bold text-foreground">
                  ${price.price}
                </span>
                <span className="text-muted-foreground">/{price.interval}</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              {price.savings && (
                <p className="text-sm text-primary font-medium mb-2">
                  {price.savings}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {price.trialDays}-day free trial included
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-primary mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              Try free for 7 days, then continue or cancel
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Add a payment method to start your trial. Cancel anytime before day 7 to avoid charges.
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Payment Information</CardTitle>
          <CardDescription>
            Your card will be charged after the 7-day trial
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="cardNumber" className="text-sm font-medium">
              Card Number
            </label>
            <div className={cardElementClasses} id="cardNumber" data-testid="input-card-number">
              <CardNumberElement options={CARD_ELEMENT_OPTIONS} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="cardExpiry" className="text-sm font-medium">
                Expiration Date
              </label>
              <div className={cardElementClasses} id="cardExpiry" data-testid="input-card-expiry">
                <CardExpiryElement options={CARD_ELEMENT_OPTIONS} />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="cardCvc" className="text-sm font-medium">
                CVC
              </label>
              <div className={cardElementClasses} id="cardCvc" data-testid="input-card-cvc">
                <CardCvcElement options={CARD_ELEMENT_OPTIONS} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={!stripe || isProcessing}
          data-testid="button-start-trial"
        >
          {isProcessing ? "Processing..." : "Start 7-Day Free Trial"}
        </Button>
        
        <div className="text-center space-y-2">
          <p className="text-xs text-muted-foreground">
            By starting your trial, you agree to our Terms of Service
          </p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Full access to all premium features during trial</li>
            <li>• Cancel anytime before day 7 - no charges</li>
            <li>• Auto-renews at ${selectedPrice.price}/{selectedPrice.interval} after trial</li>
          </ul>
        </div>
      </div>
    </form>
  );
}
