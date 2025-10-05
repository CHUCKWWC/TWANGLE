import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart } from "lucide-react";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

// Stripe Pricing Table Configuration
const STRIPE_PRICING_TABLE_ID = "prctbl_1SEr1uFHAup9QfDRlc63t1OH";
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY;

if (!STRIPE_PUBLISHABLE_KEY) {
  throw new Error("VITE_STRIPE_PUBLIC_KEY environment variable is required");
}

// TypeScript declaration for Stripe pricing table custom element
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'stripe-pricing-table': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        'pricing-table-id': string;
        'publishable-key': string;
        'customer-email'?: string;
        'client-reference-id'?: string;
      };
    }
  }
}

export default function Paywall() {
  const { user } = useAuth();

  useEffect(() => {
    // Load Stripe pricing table script
    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/pricing-table.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Cleanup script on unmount
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full space-y-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="bg-primary/10 p-4 rounded-full">
                <Heart className="w-12 h-12 text-primary" />
              </div>
            </div>
            <div>
              <CardTitle className="font-display text-3xl">
                Strengthen Your Relationship
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Get unlimited access to AI coaching, assessments, and relationship-building tools
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                Choose the plan that works best for you
              </p>
              
              {/* Stripe Hosted Pricing Table */}
              <div data-testid="stripe-pricing-table">
                <stripe-pricing-table
                  pricing-table-id={STRIPE_PRICING_TABLE_ID}
                  publishable-key={STRIPE_PUBLISHABLE_KEY}
                  customer-email={user?.email || undefined}
                  client-reference-id={user?.id || undefined}
                />
              </div>
            </div>

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
