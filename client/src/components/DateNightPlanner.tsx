import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Heart, Sparkles, DollarSign, Clock, MapPin, Loader2, Calendar } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface DateNightPlannerProps {}

const BUDGET_OPTIONS = [
  { value: 'low', label: 'Budget-Friendly', description: '$0-50 - Simple and sweet' },
  { value: 'medium', label: 'Moderate', description: '$50-150 - Special night out' },
  { value: 'high', label: 'Splurge-Worthy', description: '$150+ - Memorable experience' },
];

const VIBE_OPTIONS = [
  { value: 'romantic', label: 'Romantic', description: 'Intimate and heartfelt' },
  { value: 'fun', label: 'Fun & Playful', description: 'Laughter and adventure' },
  { value: 'relaxing', label: 'Relaxing', description: 'Calm and peaceful' },
  { value: 'adventurous', label: 'Adventurous', description: 'Something new and exciting' },
];

const DURATION_OPTIONS = [
  { value: '2-3 hours', label: '2-3 Hours', description: 'Quick evening date' },
  { value: '3-4 hours', label: '3-4 Hours', description: 'Classic dinner date' },
  { value: '4-6 hours', label: '4-6 Hours', description: 'Extended evening' },
  { value: 'full-day', label: 'Full Day', description: 'All-day adventure' },
];

const LOCATION_OPTIONS = [
  { value: 'stay-in', label: 'Stay In', description: 'Cozy at home' },
  { value: 'local', label: 'Local Spots', description: 'Around town' },
  { value: 'explore', label: 'Explore Nearby', description: 'New area to discover' },
];

const INTEREST_OPTIONS = [
  { value: 'food', label: 'Foodie Experience', icon: '🍽️' },
  { value: 'art', label: 'Art & Culture', icon: '🎨' },
  { value: 'nature', label: 'Nature & Outdoors', icon: '🌳' },
  { value: 'music', label: 'Music & Entertainment', icon: '🎵' },
  { value: 'games', label: 'Games & Activities', icon: '🎮' },
  { value: 'wellness', label: 'Wellness & Relaxation', icon: '🧘' },
];

export default function DateNightPlanner({}: DateNightPlannerProps) {
  const [budget, setBudget] = useState('medium');
  const [vibe, setVibe] = useState('romantic');
  const [duration, setDuration] = useState('3-4 hours');
  const [location, setLocation] = useState('local');
  const [interests, setInterests] = useState<string[]>(['food']);
  const [dietaryRestrictions, setDietaryRestrictions] = useState('');
  const [transportation, setTransportation] = useState('');
  const [specialOccasion, setSpecialOccasion] = useState('');
  
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const { data: plansData } = useQuery<{ plans: any[] }>({
    queryKey: ['/api/datenight/plans'],
  });

  const generatePlanMutation = useMutation({
    mutationFn: async (data: {
      budget: string;
      vibe: string;
      duration: string;
      location: string;
      interests: string[];
      dietaryRestrictions?: string;
      transportation?: string;
      specialOccasion?: string;
    }) => {
      const response = await apiRequest("POST", "/api/datenight/generate", data);
      return await response.json();
    },
    onSuccess: (response: any) => {
      toast({
        title: "Date Night Plan Ready!",
        description: "Your personalized date night plan has been created.",
      });
      
      if (response?.plan?.generatedPlan) {
        setPlanResult(response.plan.generatedPlan);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate date night plan. Please try again.",
        variant: "destructive",
      });
    },
  });

  const [planResult, setPlanResult] = useState<string | null>(null);

  const toggleInterest = (value: string) => {
    setInterests(prev => {
      if (prev.includes(value)) {
        return prev.filter(i => i !== value);
      } else if (prev.length < 3) {
        return [...prev, value];
      }
      return prev;
    });
  };

  const handleGenerate = () => {
    if (interests.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please select at least one interest for your date night.",
        variant: "destructive",
      });
      return;
    }

    generatePlanMutation.mutate({
      budget,
      vibe,
      duration,
      location,
      interests,
      dietaryRestrictions: dietaryRestrictions || undefined,
      transportation: transportation || undefined,
      specialOccasion: specialOccasion || undefined,
    });
  };

  if (planResult) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
                Your Date Night Plan
              </h1>
              <p className="text-muted-foreground mt-2">
                A personalized evening designed just for you two
              </p>
            </div>
            <Button 
              onClick={() => setPlanResult(null)} 
              variant="outline"
              data-testid="button-plan-another"
            >
              Plan Another
            </Button>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <div className="whitespace-pre-wrap">{planResult}</div>
              </div>
            </CardContent>
          </Card>

          {plansData?.plans && plansData.plans.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Your Previous Date Night Plans</CardTitle>
                <CardDescription>
                  You've created {plansData.plans.length} date night {plansData.plans.length === 1 ? 'plan' : 'plans'}
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
            Date Night Planner
          </h1>
          <p className="text-muted-foreground">
            Let AI help you plan the perfect evening together
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              Budget
            </CardTitle>
            <CardDescription>How much would you like to spend?</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={budget} onValueChange={setBudget}>
              <div className="grid gap-3">
                {BUDGET_OPTIONS.map((option) => (
                  <div key={option.value} className="flex items-center space-x-3">
                    <RadioGroupItem value={option.value} id={`budget-${option.value}`} data-testid={`radio-budget-${option.value}`} />
                    <Label htmlFor={`budget-${option.value}`} className="flex-1 cursor-pointer">
                      <div className="font-medium">{option.label}</div>
                      <div className="text-sm text-muted-foreground">{option.description}</div>
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-primary" />
              Vibe
            </CardTitle>
            <CardDescription>What's the mood you're going for?</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={vibe} onValueChange={setVibe}>
              <div className="grid gap-3">
                {VIBE_OPTIONS.map((option) => (
                  <div key={option.value} className="flex items-center space-x-3">
                    <RadioGroupItem value={option.value} id={`vibe-${option.value}`} data-testid={`radio-vibe-${option.value}`} />
                    <Label htmlFor={`vibe-${option.value}`} className="flex-1 cursor-pointer">
                      <div className="font-medium">{option.label}</div>
                      <div className="text-sm text-muted-foreground">{option.description}</div>
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Duration
            </CardTitle>
            <CardDescription>How long do you have?</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={duration} onValueChange={setDuration}>
              <div className="grid gap-3">
                {DURATION_OPTIONS.map((option) => (
                  <div key={option.value} className="flex items-center space-x-3">
                    <RadioGroupItem value={option.value} id={`duration-${option.value}`} data-testid={`radio-duration-${option.value}`} />
                    <Label htmlFor={`duration-${option.value}`} className="flex-1 cursor-pointer">
                      <div className="font-medium">{option.label}</div>
                      <div className="text-sm text-muted-foreground">{option.description}</div>
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Location
            </CardTitle>
            <CardDescription>Where would you like to go?</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={location} onValueChange={setLocation}>
              <div className="grid gap-3">
                {LOCATION_OPTIONS.map((option) => (
                  <div key={option.value} className="flex items-center space-x-3">
                    <RadioGroupItem value={option.value} id={`location-${option.value}`} data-testid={`radio-location-${option.value}`} />
                    <Label htmlFor={`location-${option.value}`} className="flex-1 cursor-pointer">
                      <div className="font-medium">{option.label}</div>
                      <div className="text-sm text-muted-foreground">{option.description}</div>
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Interests
            </CardTitle>
            <CardDescription>Select 1-3 interests (click to toggle)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {INTEREST_OPTIONS.map((option) => (
                <Badge
                  key={option.value}
                  variant={interests.includes(option.value) ? "default" : "outline"}
                  className="cursor-pointer hover-elevate px-3 py-2"
                  onClick={() => toggleInterest(option.value)}
                  data-testid={`badge-interest-${option.value}`}
                >
                  <span className="mr-1.5">{option.icon}</span>
                  {option.label}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Additional Details (Optional)
            </CardTitle>
            <CardDescription>Help us personalize your date night even more</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dietary">Dietary Restrictions or Preferences</Label>
              <Input
                id="dietary"
                placeholder="e.g., vegetarian, gluten-free, loves spicy food"
                value={dietaryRestrictions}
                onChange={(e) => setDietaryRestrictions(e.target.value)}
                data-testid="input-dietary"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="transportation">Transportation</Label>
              <Input
                id="transportation"
                placeholder="e.g., walking, driving, public transit"
                value={transportation}
                onChange={(e) => setTransportation(e.target.value)}
                data-testid="input-transportation"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="occasion">Special Occasion</Label>
              <Input
                id="occasion"
                placeholder="e.g., anniversary, birthday, just because"
                value={specialOccasion}
                onChange={(e) => setSpecialOccasion(e.target.value)}
                data-testid="input-occasion"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center pb-8">
          <Button
            size="lg"
            onClick={handleGenerate}
            disabled={generatePlanMutation.isPending}
            className="min-w-[200px]"
            data-testid="button-generate-plan"
          >
            {generatePlanMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Date Night Plan
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
