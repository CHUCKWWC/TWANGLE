import RetreatBuilder from "@/components/RetreatBuilder";
import { AppHeader } from "@/components/AppHeader";
import { SEO, SEO_CONTENT } from "@/components/SEO";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Gift } from "lucide-react";

export default function Retreat() {
  const { user } = useAuth();
  const isAnonymous = (user as any)?.isAnonymous;

  return (
    <>
      <SEO {...SEO_CONTENT.retreat} />
      <AppHeader />
      <div className="pt-16">
        {isAnonymous && (
          <div className="max-w-5xl mx-auto px-4 mb-6">
            <Card className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/10 p-2">
                    <Gift className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold mb-1" data-testid="text-retreat-preview-title">
                      Try Your First Retreat Free
                    </h3>
                    <p className="text-sm text-muted-foreground" data-testid="text-retreat-preview-description">
                      Create a personalized retreat itinerary. Sign in to save it and generate unlimited retreats.
                    </p>
                  </div>
                </div>
                <Button asChild size="sm" variant="outline" className="flex-shrink-0" data-testid="button-signin-retreat">
                  <a href="/api/login?returnTo=/retreat">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Sign In
                  </a>
                </Button>
              </div>
            </Card>
          </div>
        )}
        <RetreatBuilder />
      </div>
    </>
  );
}
