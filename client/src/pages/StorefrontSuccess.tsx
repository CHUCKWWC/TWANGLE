import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { useLocation } from "wouter";

/**
 * CHECKOUT SUCCESS PAGE
 * 
 * This page is displayed after a successful payment
 * Shows payment confirmation and session details
 */

export default function StorefrontSuccess() {
  const [, setLocation] = useLocation();
  
  // Get session_id from URL query params
  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get('session_id');

  // Fetch checkout session details
  const { data: session, isLoading } = useQuery({
    queryKey: ['/api/stripe-connect/checkout-session', sessionId],
    enabled: !!sessionId,
  });

  useEffect(() => {
    if (!sessionId) {
      setLocation('/storefront');
    }
  }, [sessionId, setLocation]);

  const formatPrice = (cents: number | null | undefined) => {
    if (!cents) return "0.00";
    return (cents / 100).toFixed(2);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Confirming your payment...</p>
        </div>
      </div>
    );
  }

  if (!session || session.status !== 'complete') {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-lg font-medium mb-4">Payment could not be confirmed</p>
            <Button asChild>
              <a href="/storefront">Return to Marketplace</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card data-testid="card-success">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-green-100 dark:bg-green-900 p-3">
              <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <CardTitle className="text-2xl">Payment Successful!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Amount Paid</span>
              <span className="font-bold text-lg">
                ${formatPrice(session.amountTotal)} {session.currency?.toUpperCase()}
              </span>
            </div>
            {session.customerEmail && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Confirmation Email</span>
                <span>{session.customerEmail}</span>
              </div>
            )}
          </div>

          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              Thank you for your purchase! You should receive a confirmation email shortly.
            </p>
            <p>
              If you have any questions about your order, please contact the merchant.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button asChild className="flex-1">
            <a href="/storefront">Continue Shopping</a>
          </Button>
          <Button asChild variant="outline" className="flex-1">
            <a href="/">Go Home</a>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
