import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, MapPin, Target, Heart, DollarSign, Clock, Download } from "lucide-react";

export default function RetreatItinerary() {
  const { id } = useParams();
  const [, navigate] = useLocation();

  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/retreat/itinerary", id],
    queryFn: async () => {
      const res = await fetch(`/api/retreat/itinerary/${id}`, {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      return res.json();
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your retreat itinerary...</p>
        </div>
      </div>
    );
  }

  if (error || !data?.itinerary) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-8 max-w-md text-center">
          <h2 className="font-display text-2xl font-semibold mb-2">Itinerary Not Found</h2>
          <p className="text-muted-foreground mb-6">
            We couldn't find this retreat itinerary. It may have been deleted or you may not have access to it.
          </p>
          <Button onClick={() => navigate("/")} data-testid="button-back-to-home">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Card>
      </div>
    );
  }

  const itinerary = data.itinerary;
  const startDateFormatted = itinerary.startDate 
    ? new Date(itinerary.startDate).toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      })
    : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="max-w-4xl mx-auto p-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button
            variant="outline"
            onClick={() => window.print()}
            data-testid="button-print"
          >
            <Download className="w-4 h-4 mr-2" />
            Save/Print
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl text-foreground mb-2" data-testid="text-itinerary-title">
            Your Personalized Retreat Itinerary
          </h1>
          <p className="text-muted-foreground">
            A curated experience designed just for you
          </p>
        </div>

        <Card className="p-6 mb-6">
          <h2 className="font-display text-xl font-semibold mb-4">Retreat Details</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {itinerary.retreatDestination && (
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Destination</p>
                  <p className="font-medium" data-testid="text-destination">{itinerary.retreatDestination}</p>
                </div>
              </div>
            )}
            {startDateFormatted && (
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Start Date</p>
                  <p className="font-medium" data-testid="text-start-date">{startDateFormatted}</p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Duration</p>
                <p className="font-medium" data-testid="text-duration">{itinerary.duration} {itinerary.duration === 1 ? 'Day' : 'Days'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <DollarSign className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Budget</p>
                <p className="font-medium capitalize" data-testid="text-budget">{itinerary.budget}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Heart className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Vibe</p>
                <p className="font-medium capitalize" data-testid="text-vibe">{itinerary.vibe}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Target className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Goal</p>
                <p className="font-medium capitalize" data-testid="text-goal">{itinerary.goal}</p>
              </div>
            </div>
          </div>
          {itinerary.focuses && itinerary.focuses.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm font-medium text-muted-foreground mb-2">Focus Areas</p>
              <div className="flex flex-wrap gap-2">
                {itinerary.focuses.map((focus: string) => (
                  <Badge key={focus} variant="secondary" className="capitalize" data-testid={`badge-focus-${focus}`}>
                    {focus}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </Card>

        <Card className="p-6">
          <div 
            className="prose prose-sm md:prose-base max-w-none whitespace-pre-wrap
              prose-headings:font-display prose-headings:text-foreground
              prose-p:text-foreground prose-strong:text-foreground
              prose-ul:text-foreground prose-ol:text-foreground
              prose-li:text-foreground
              dark:prose-invert"
            data-testid="content-generated-itinerary"
          >
            {itinerary.generatedItinerary}
          </div>
        </Card>

        <div className="mt-8 text-center">
          <Button
            size="lg"
            onClick={() => navigate("/")}
            data-testid="button-back-home"
          >
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
