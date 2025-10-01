import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Heart, Sparkles, BookOpen, Save, DollarSign, Calendar as CalendarIcon } from "lucide-react";

export interface RetreatActivity {
  id: string;
  day: number;
  time: string;
  title: string;
  description: string;
  category: 'spiritual' | 'emotional' | 'fun';
}

interface RetreatBuilderProps {
  onSaveRetreat: (retreat: {
    duration: number;
    location: string;
    budget: string;
    focuses: string[];
    activities: RetreatActivity[];
  }) => void;
}

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

const FOCUS_OPTIONS = [
  { 
    value: 'spiritual', 
    label: 'Spiritual Focus', 
    icon: BookOpen,
    description: 'Prayer, scripture, reflection' 
  },
  { 
    value: 'emotional', 
    label: 'Emotional Focus', 
    icon: Heart,
    description: 'Trust-building exercises' 
  },
  { 
    value: 'fun', 
    label: 'Fun Focus', 
    icon: Sparkles,
    description: 'Games and adventures' 
  },
];

const SAMPLE_ACTIVITIES: RetreatActivity[] = [
  {
    id: '1',
    day: 1,
    time: 'Morning',
    title: 'Gratitude Journaling',
    description: 'Write three things you appreciate about your partner',
    category: 'spiritual',
  },
  {
    id: '2',
    day: 1,
    time: 'Afternoon',
    title: 'Trust Walk',
    description: 'Blindfolded walk with partner guidance',
    category: 'emotional',
  },
  {
    id: '3',
    day: 1,
    time: 'Evening',
    title: 'Cooking Together',
    description: 'Prepare a special meal as a team',
    category: 'fun',
  },
  {
    id: '4',
    day: 2,
    time: 'Morning',
    title: 'Prayer & Reflection',
    description: 'Share prayers for your relationship',
    category: 'spiritual',
  },
  {
    id: '5',
    day: 2,
    time: 'Afternoon',
    title: 'Love Letter Exchange',
    description: 'Write and share heartfelt letters',
    category: 'emotional',
  },
  {
    id: '6',
    day: 3,
    time: 'Morning',
    title: 'Nature Walk & Meditation',
    description: 'Connect with nature and each other',
    category: 'spiritual',
  },
  {
    id: '7',
    day: 3,
    time: 'Evening',
    title: 'Board Games & Laughter',
    description: 'Play favorite games together',
    category: 'fun',
  },
  {
    id: '8',
    day: 4,
    time: 'Morning',
    title: 'Vision Board Creation',
    description: 'Design your shared future together',
    category: 'emotional',
  },
];

export default function RetreatBuilder({ onSaveRetreat }: RetreatBuilderProps) {
  const [duration, setDuration] = useState(2);
  const [location, setLocation] = useState('home');
  const [budget, setBudget] = useState('medium');
  const [focuses, setFocuses] = useState<string[]>(['spiritual']);

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

  const filteredActivities = SAMPLE_ACTIVITIES.filter(activity => activity.day <= duration);

  const handleSave = () => {
    onSaveRetreat({
      duration,
      location,
      budget,
      focuses,
      activities: filteredActivities,
    });
  };

  return (
    <div className="min-h-screen bg-background p-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl text-foreground mb-2">
            DIY Couples Retreat Builder
          </h1>
          <p className="text-muted-foreground">
            Create a meaningful retreat to deepen your connection
          </p>
        </div>

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

        <Card className="p-8 mb-6">
          <h2 className="font-display text-xl font-semibold mb-6">Your Retreat Itinerary</h2>
          {[...Array(duration)].map((_, dayIndex) => {
            const dayNum = dayIndex + 1;
            const dayActivities = filteredActivities.filter(a => a.day === dayNum);
            
            return (
              <div key={dayNum} className="mb-6 last:mb-0">
                <h3 className="font-display font-semibold text-lg mb-3">Day {dayNum}</h3>
                <div className="space-y-3">
                  {dayActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex gap-4 p-4 rounded-lg border border-border bg-card"
                    >
                      <div className="flex-shrink-0">
                        <Badge variant="outline" className="font-accent">
                          {activity.time}
                        </Badge>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1">{activity.title}</h4>
                        <p className="text-sm text-muted-foreground">{activity.description}</p>
                      </div>
                      <Badge className="flex-shrink-0">
                        {activity.category}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </Card>

        <div className="flex gap-4">
          <Button
            size="lg"
            className="flex-1 text-lg py-6"
            onClick={handleSave}
            disabled={focuses.length === 0}
            data-testid="button-save-retreat"
          >
            <Save className="w-5 h-5 mr-2" />
            Save Retreat Plan
          </Button>
        </div>
      </div>
    </div>
  );
}
