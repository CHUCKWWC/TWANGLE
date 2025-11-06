import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Check } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { toast } = useToast();

  const subscribeMutation = useMutation({
    mutationFn: async (email: string) => {
      return await apiRequest('POST', '/api/newsletter/subscribe', { email });
    },
    onSuccess: () => {
      setIsSubscribed(true);
      setEmail("");
      toast({
        title: "Success!",
        description: "You've been subscribed to our newsletter. Check your inbox for relationship tips.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to subscribe. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      subscribeMutation.mutate(email);
    }
  };

  return (
    <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20" data-testid="newsletter-signup">
      <CardContent className="p-8">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
            <Mail className="w-6 h-6 text-primary" />
          </div>
          
          <div>
            <h3 className="text-2xl font-bold mb-2 font-[Poppins]">
              Get Free Relationship Tips
            </h3>
            <p className="text-muted-foreground">
              Join our newsletter for weekly evidence-based advice on building stronger relationships
            </p>
          </div>

          {!isSubscribed ? (
            <form onSubmit={handleSubmit} className="w-full max-w-md space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex-1"
                  autoComplete="email"
                  data-testid="input-newsletter-email"
                  disabled={subscribeMutation.isPending}
                />
                <Button
                  type="submit"
                  disabled={subscribeMutation.isPending || !email}
                  data-testid="button-subscribe-newsletter"
                >
                  {subscribeMutation.isPending ? "Subscribing..." : "Subscribe"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                No spam, ever. Unsubscribe anytime.
              </p>
            </form>
          ) : (
            <div className="flex items-center gap-2 text-primary" data-testid="newsletter-success">
              <Check className="w-5 h-5" />
              <span className="font-medium">Successfully subscribed!</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
