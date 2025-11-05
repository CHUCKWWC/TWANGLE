import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Map, Lock, Sparkles, Calendar, DollarSign, Heart, Sunrise, Waves, Star, Coffee } from "lucide-react";

// Sample retreat data to show what users can create
const SAMPLE_RETREAT = {
  title: "Weekend Reconnection Retreat",
  location: "Cozy Mountain Cabin",
  duration: "2 Days, 1 Night",
  budget: "$500 - $800",
  vibe: "Relaxing & Intimate",
  activities: [
    {
      time: "Saturday Morning",
      title: "Sunrise Hike & Breakfast",
      description: "Start the day with a gentle hike to a scenic viewpoint, followed by a picnic breakfast together.",
      icon: Sunrise
    },
    {
      time: "Saturday Afternoon",
      title: "Couples Massage & Spa Time",
      description: "Book a couples massage at a local spa, then enjoy the hot tub and sauna together.",
      icon: Waves
    },
    {
      time: "Saturday Evening",
      title: "Cook Together & Stargazing",
      description: "Prepare a romantic dinner together, then head outside for stargazing with blankets and hot cocoa.",
      icon: Star
    },
    {
      time: "Sunday Morning",
      title: "Relationship Exercise & Brunch",
      description: "Complete the 'Love Map' exercise from Gottman Method, then enjoy brunch at a local café.",
      icon: Coffee
    }
  ],
  tips: [
    "Pack comfortable hiking shoes and warm layers",
    "Bring ingredients for your favorite meal to cook together",
    "Download offline music playlists ahead of time",
    "Leave work phones and laptops at home"
  ]
};

export function RetreatPreview() {
  const [showPreview, setShowPreview] = useState(false);

  if (!showPreview) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Map className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl">DIY Couples Retreat Builder</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                AI-powered personalized retreat planning
              </p>
            </div>
            <Badge variant="secondary" className="gap-1">
              <Lock className="w-3 h-3" />
              Preview
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="text-center py-8">
            <Sparkles className="w-16 h-16 text-primary mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Create Your Perfect Getaway</h3>
            <p className="text-muted-foreground mb-6">
              Answer a few questions about your preferences, and our AI will create a customized retreat itinerary 
              tailored to your relationship goals, budget, and vibe.
            </p>
            
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted">
                <Calendar className="w-6 h-6 text-primary" />
                <p className="text-sm font-medium">Custom Timeline</p>
                <p className="text-xs text-muted-foreground text-center">
                  Weekend, week, or custom duration
                </p>
              </div>
              <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted">
                <DollarSign className="w-6 h-6 text-primary" />
                <p className="text-sm font-medium">Budget-Friendly</p>
                <p className="text-xs text-muted-foreground text-center">
                  Options for any budget level
                </p>
              </div>
              <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted">
                <Heart className="w-6 h-6 text-primary" />
                <p className="text-sm font-medium">Goal-Oriented</p>
                <p className="text-xs text-muted-foreground text-center">
                  Reconnect, adventure, or relax
                </p>
              </div>
            </div>

            <Button 
              onClick={() => setShowPreview(true)}
              size="lg"
              data-testid="button-view-sample"
            >
              View Sample Retreat
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Map className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">{SAMPLE_RETREAT.title}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Sample AI-generated retreat itinerary
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="gap-1">
            <Lock className="w-3 h-3" />
            Preview
          </Badge>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="gap-1">
            <Map className="w-3 h-3" />
            {SAMPLE_RETREAT.location}
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Calendar className="w-3 h-3" />
            {SAMPLE_RETREAT.duration}
          </Badge>
          <Badge variant="outline" className="gap-1">
            <DollarSign className="w-3 h-3" />
            {SAMPLE_RETREAT.budget}
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Sparkles className="w-3 h-3" />
            {SAMPLE_RETREAT.vibe}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Itinerary</h3>
          <div className="space-y-4">
            {SAMPLE_RETREAT.activities.map((activity, index) => {
              const ActivityIcon = activity.icon;
              return (
                <div key={index} className="flex gap-4 p-4 rounded-lg border border-border hover-elevate">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <ActivityIcon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="font-semibold">{activity.title}</h4>
                      <Badge variant="secondary" className="text-xs flex-shrink-0">
                        {activity.time}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {activity.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Planning Tips
          </h4>
          <ul className="space-y-1">
            {SAMPLE_RETREAT.tips.map((tip, index) => (
              <li key={index} className="text-sm text-muted-foreground flex gap-2">
                <span className="text-primary">•</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => setShowPreview(false)}
            className="flex-1"
            data-testid="button-back"
          >
            Back
          </Button>
          <Button
            asChild
            className="flex-1"
            data-testid="button-create-retreat"
          >
            <a href="/api/signup">
              Sign Up to Create Your Retreat
            </a>
          </Button>
        </div>

        <div className="bg-muted rounded-lg p-4 text-center">
          <p className="text-sm text-muted-foreground mb-1">
            This is a sample retreat itinerary
          </p>
          <p className="text-sm font-medium">
            Sign up to create unlimited personalized retreats with AI guidance tailored to your relationship
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
