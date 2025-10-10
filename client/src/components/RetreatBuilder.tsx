import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Heart, Sparkles, DollarSign, Calendar as CalendarIcon, Target, Smile, MapPin, BookOpen, Loader2, Briefcase, Users } from "lucide-react";
import { format, startOfDay } from "date-fns";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import VisionPlanning from "@/components/VisionPlanning";
import { VisionPlanning as VisionPlanningType } from "@shared/schema";

interface RetreatBuilderProps {}

const DURATION_OPTIONS = [
  { value: 1, label: '1 Day', description: 'Quick reset' },
  { value: 2, label: '2 Days', description: 'Weekend getaway' },
  { value: 3, label: '3 Days', description: 'Extended retreat' },
  { value: 4, label: '4 Days', description: 'Deep immersion' },
];

const LOCATION_OPTIONS = [
  { value: 'home', label: 'Home', description: 'Cozy and familiar' },
  { value: 'park', label: 'Park/Nature', description: 'Fresh air and peace' },
  { value: 'weekend', label: 'Weekend Away', description: 'Full immersion' },
];

const BUDGET_OPTIONS = [
  { value: 'low', label: 'Low Budget', description: '$0-50 - Home-based activities' },
  { value: 'medium', label: 'Medium Budget', description: '$50-200 - Local getaway' },
  { value: 'high', label: 'High Budget', description: '$200+ - Premium experience' },
];

const VIBE_OPTIONS = [
  { value: 'cozy', label: 'Cozy & Intimate', description: 'Gentle reconnection at your own pace' },
  { value: 'adventurous', label: 'Adventurous', description: 'New experiences and excitement' },
  { value: 'reflective', label: 'Deep & Reflective', description: 'Meaningful conversation and growth' },
];

const GOAL_OPTIONS = [
  { value: 'reconnect', label: 'Reconnect', description: 'Rebuild closeness and intimacy' },
  { value: 'communicate', label: 'Communicate Better', description: 'Improve how you talk and listen' },
  { value: 'heal', label: 'Heal & Repair', description: 'Address hurts and rebuild trust' },
  { value: 'celebrate', label: 'Celebrate Us', description: 'Honor your relationship journey' },
  { value: 'future', label: 'Plan for the Future', description: 'Align on goals and dreams together' },
];

const START_TIME_OPTIONS = [
  { value: '8:00', label: 'Early Morning (8:00 AM)', description: 'Get the most out of your day' },
  { value: '9:00', label: 'Morning (9:00 AM)', description: 'Gentle start with time to sleep in' },
  { value: '10:00', label: 'Late Morning (10:00 AM)', description: 'Relaxed, leisurely pace' },
];

const FOCUS_OPTIONS = [
  { 
    value: 'growth', 
    label: 'Growth & Connection', 
    icon: Target,
    description: 'Deepen understanding and trust' 
  },
  { 
    value: 'play', 
    label: 'Play & Joy', 
    icon: Smile,
    description: 'Laughter, games, and fun together' 
  },
  { 
    value: 'rest', 
    label: 'Rest & Reflection', 
    icon: BookOpen,
    description: 'Quiet connection and renewal' 
  },
  { 
    value: 'work', 
    label: 'Work & Life Balance', 
    icon: Briefcase,
    description: 'Navigate careers and shared responsibilities' 
  },
  { 
    value: 'partnership', 
    label: 'Partnership & Team', 
    icon: Users,
    description: 'Build your relationship as a team' 
  },
];


export default function RetreatBuilder({}: RetreatBuilderProps) {
  const [duration, setDuration] = useState(2);
  const [location, setLocation] = useState('home');
  const [budget, setBudget] = useState('medium');
  const [vibe, setVibe] = useState('cozy');
  const [goal, setGoal] = useState('reconnect');
  const [startTime, setStartTime] = useState('9:00');
  const [focuses, setFocuses] = useState<string[]>(['growth']);
  const [retreatDestination, setRetreatDestination] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [travelDistance, setTravelDistance] = useState('');
  const [startDate, setStartDate] = useState<Date>();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [visionPlanning, setVisionPlanning] = useState<VisionPlanningType | undefined>({});
  
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const generateItineraryMutation = useMutation({
    mutationFn: async (data: {
      vibe: string;
      goal: string;
      startTime: string;
      duration: number;
      location: string;
      budget: string;
      focuses: string[];
      retreatDestination: string;
      streetAddress: string;
      travelDistance: string;
      startDate?: string;
      visionPlanning?: VisionPlanningType;
    }) => {
      const response = await apiRequest("POST", "/api/retreat/generate-itinerary", data);
      return await response.json();
    },
    onSuccess: (response: any) => {
      toast({
        title: "Itinerary Generated!",
        description: "Your personalized retreat itinerary is ready to view.",
      });
      
      const itineraryId = response?.itinerary?.id;
      if (itineraryId) {
        navigate(`/retreat/${itineraryId}`);
      } else {
        toast({
          title: "Navigation Error",
          description: "Itinerary created but could not navigate. Please check your itineraries list.",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate retreat itinerary. Please try again.",
        variant: "destructive",
      });
    },
  });

  const toggleFocus = (value: string) => {
    setFocuses(prev => {
      if (prev.includes(value)) {
        return prev.filter(f => f !== value);
      } else if (prev.length < 3) {
        return [...prev, value];
      }
      return prev;
    });
  };

  const handleSave = () => {
    if (!retreatDestination) {
      toast({
        title: "Missing Information",
        description: "Please enter your retreat destination to generate the itinerary.",
        variant: "destructive",
      });
      return;
    }

    // Check if visionPlanning has any actual data
    const hasVisionData = visionPlanning && (
      (visionPlanning.timelines && Object.values(visionPlanning.timelines).some(v => v)) ||
      (visionPlanning.lifeDimensions && Object.values(visionPlanning.lifeDimensions).some(v => v))
    );

    generateItineraryMutation.mutate({
      vibe,
      goal,
      startTime,
      duration,
      location,
      budget,
      focuses,
      retreatDestination,
      streetAddress: streetAddress || "",
      travelDistance: travelDistance || "",
      startDate: startDate ? startDate.toISOString() : undefined,
      visionPlanning: hasVisionData ? visionPlanning : undefined,
    });
  };

  return (
    <div className="min-h-screen bg-background p-4 py-8">
      {generateItineraryMutation.isPending && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center" data-testid="loading-overlay">
          <Card className="p-12 max-w-md mx-4 text-center">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <Loader2 className="w-16 h-16 text-primary animate-spin" />
                <Sparkles className="w-8 h-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
              </div>
            </div>
            <h3 className="font-display text-2xl font-semibold mb-3">Creating Your Retreat</h3>
            <p className="text-muted-foreground mb-2">
              Coach Charles is designing a personalized itinerary just for you...
            </p>
            <p className="text-sm text-muted-foreground">
              This may take a few moments
            </p>
          </Card>
        </div>
      )}
      
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl text-foreground mb-2">
            DIY Couples Retreat
          </h1>
          <p className="text-muted-foreground">
            Create a personalized retreat itinerary tailored just for you
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Heart className="w-5 h-5 text-primary" />
              <h2 className="font-display text-lg font-semibold">Retreat Vibe</h2>
            </div>
            <RadioGroup value={vibe} onValueChange={setVibe}>
              <div className="space-y-3">
                {VIBE_OPTIONS.map((option) => (
                  <div key={option.value} className="flex items-start space-x-3">
                    <RadioGroupItem value={option.value} id={`vibe-${option.value}`} className="mt-1" />
                    <Label htmlFor={`vibe-${option.value}`} className="flex-1 cursor-pointer">
                      <div className="font-medium">{option.label}</div>
                      <div className="text-sm text-muted-foreground">{option.description}</div>
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-primary" />
              <h2 className="font-display text-lg font-semibold">Primary Goal</h2>
            </div>
            <RadioGroup value={goal} onValueChange={setGoal}>
              <div className="space-y-3">
                {GOAL_OPTIONS.map((option) => (
                  <div key={option.value} className="flex items-start space-x-3">
                    <RadioGroupItem value={option.value} id={`goal-${option.value}`} className="mt-1" />
                    <Label htmlFor={`goal-${option.value}`} className="flex-1 cursor-pointer">
                      <div className="font-medium">{option.label}</div>
                      <div className="text-sm text-muted-foreground">{option.description}</div>
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </Card>
        </div>

        <Card className="p-8 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <CalendarIcon className="w-5 h-5 text-primary" />
            <h2 className="font-display text-lg font-semibold">Start Time</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            When would you like to begin your retreat each day?
          </p>
          <RadioGroup value={startTime} onValueChange={setStartTime}>
            <div className="grid md:grid-cols-3 gap-4">
              {START_TIME_OPTIONS.map((option) => (
                <div key={option.value} className="flex items-start space-x-3 p-4 rounded-lg border border-border hover-elevate">
                  <RadioGroupItem value={option.value} id={`start-${option.value}`} className="mt-1" />
                  <Label htmlFor={`start-${option.value}`} className="flex-1 cursor-pointer">
                    <div className="font-medium">{option.label}</div>
                    <div className="text-sm text-muted-foreground">{option.description}</div>
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </Card>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <CalendarIcon className="w-5 h-5 text-primary" />
              <h2 className="font-display text-lg font-semibold">Duration</h2>
            </div>
            <RadioGroup value={duration.toString()} onValueChange={(v) => setDuration(Number(v))}>
              <div className="space-y-3">
                {DURATION_OPTIONS.map((option) => (
                  <div key={option.value} className="flex items-start space-x-3">
                    <RadioGroupItem value={option.value.toString()} id={`duration-${option.value}`} className="mt-1" />
                    <Label htmlFor={`duration-${option.value}`} className="flex-1 cursor-pointer">
                      <div className="font-medium">{option.label}</div>
                      <div className="text-sm text-muted-foreground">{option.description}</div>
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="w-5 h-5 text-primary" />
              <h2 className="font-display text-lg font-semibold">Budget</h2>
            </div>
            <RadioGroup value={budget} onValueChange={setBudget}>
              <div className="space-y-3">
                {BUDGET_OPTIONS.map((option) => (
                  <div key={option.value} className="flex items-start space-x-3">
                    <RadioGroupItem value={option.value} id={`budget-${option.value}`} className="mt-1" />
                    <Label htmlFor={`budget-${option.value}`} className="flex-1 cursor-pointer">
                      <div className="font-medium">{option.label}</div>
                      <div className="text-sm text-muted-foreground">{option.description}</div>
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </Card>
        </div>

        <Card className="p-8 mb-6">
          <h2 className="font-display text-xl font-semibold mb-4">Location</h2>
          <RadioGroup value={location} onValueChange={setLocation}>
            <div className="grid md:grid-cols-3 gap-4">
              {LOCATION_OPTIONS.map((option) => (
                <div key={option.value} className="flex items-start space-x-3 p-4 rounded-lg border border-border hover-elevate">
                  <RadioGroupItem value={option.value} id={`location-${option.value}`} className="mt-1" />
                  <Label htmlFor={`location-${option.value}`} className="flex-1 cursor-pointer">
                    <div className="font-medium">{option.label}</div>
                    <div className="text-sm text-muted-foreground">{option.description}</div>
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </Card>

        <Card className="p-8 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-primary" />
            <h2 className="font-display text-xl font-semibold">Retreat Details</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            Tell us where you'll be so we can find local restaurants, events, and attractions for your itinerary
          </p>
          <div className="space-y-6 mb-6">
            <div>
              <Label htmlFor="retreat-destination" className="mb-2 block">
                Retreat Destination
              </Label>
              <Input
                id="retreat-destination"
                value={retreatDestination}
                onChange={(e) => setRetreatDestination(e.target.value)}
                placeholder="e.g., Surfside Beach, TX"
                data-testid="input-retreat-destination"
              />
              <p className="text-xs text-muted-foreground mt-1">Where your retreat will be</p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="street-address" className="mb-2 block">
                  Street Address
                </Label>
                <Input
                  id="street-address"
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  placeholder="e.g., 123 Beach Drive"
                  data-testid="input-street-address"
                />
                <p className="text-xs text-muted-foreground mt-1">Address of your retreat location</p>
              </div>
              <div>
                <Label htmlFor="travel-distance" className="mb-2 block">
                  Travel Distance for Dining/Excursions
                </Label>
                <Input
                  id="travel-distance"
                  value={travelDistance}
                  onChange={(e) => setTravelDistance(e.target.value)}
                  placeholder="e.g., 15 miles or 30 minutes"
                  data-testid="input-travel-distance"
                />
                <p className="text-xs text-muted-foreground mt-1">How far are you willing to travel?</p>
              </div>
            </div>
          </div>
          <div>
            <Label className="mb-2 block">Retreat Start Date</Label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full md:w-auto justify-start text-left font-normal"
                  data-testid="button-select-date"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => {
                    setStartDate(date);
                    setCalendarOpen(false);
                  }}
                  initialFocus
                  disabled={(date) => date < startOfDay(new Date())}
                />
              </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground mt-1">When does your retreat begin?</p>
          </div>
        </Card>

        <Card className="p-8 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-semibold">Focus Areas</h2>
            <p className="text-sm text-muted-foreground">Select 1-3 areas</p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {FOCUS_OPTIONS.map((option) => {
              const Icon = option.icon;
              const isSelected = focuses.includes(option.value);
              const canSelect = !isSelected && focuses.length >= 3;
              return (
                <button
                  key={option.value}
                  onClick={() => toggleFocus(option.value)}
                  disabled={canSelect}
                  className={`p-6 rounded-lg border-2 text-left transition-all ${
                    canSelect 
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'hover-elevate'
                  } ${
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-card'
                  }`}
                  data-testid={`focus-${option.value}`}
                >
                  <Icon className={`w-8 h-8 mb-3 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                  <h3 className="font-display font-semibold mb-1">{option.label}</h3>
                  <p className="text-sm text-muted-foreground">{option.description}</p>
                </button>
              );
            })}
          </div>
          {focuses.length === 0 && (
            <p className="text-sm text-destructive mt-3">Please select at least one focus area</p>
          )}
        </Card>

        <VisionPlanning value={visionPlanning} onChange={setVisionPlanning} />

        <div className="flex gap-4 mt-6">
          <Button
            size="lg"
            className="flex-1 text-lg py-6"
            onClick={handleSave}
            disabled={focuses.length === 0 || generateItineraryMutation.isPending}
            data-testid="button-generate-retreat"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            {generateItineraryMutation.isPending ? "Generating Your Itinerary..." : "Generate Personalized Itinerary"}
          </Button>
        </div>
      </div>
    </div>
  );
}
