import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Heart, Sparkles, BookOpen, Save } from "lucide-react";

export interface RetreatActivity {
  id: string;
  time: string;
  title: string;
  description: string;
  category: 'spiritual' | 'emotional' | 'fun';
}

interface RetreatBuilderProps {
  onSaveRetreat: (retreat: {
    location: string;
    focuses: string[];
    activities: RetreatActivity[];
  }) => void;
}

const LOCATION_OPTIONS = [
  { value: 'home', label: 'Home', description: 'Cozy and familiar' },
  { value: 'park', label: 'Park/Nature', description: 'Fresh air and peace' },
  { value: 'weekend', label: 'Weekend Away', description: 'Full immersion' },
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
    time: 'Saturday Morning',
    title: 'Gratitude Journaling',
    description: 'Write three things you appreciate about your partner',
    category: 'spiritual',
  },
  {
    id: '2',
    time: 'Saturday Afternoon',
    title: 'Trust Walk',
    description: 'Blindfolded walk with partner guidance',
    category: 'emotional',
  },
  {
    id: '3',
    time: 'Saturday Evening',
    title: 'Cooking Together',
    description: 'Prepare a special meal as a team',
    category: 'fun',
  },
  {
    id: '4',
    time: 'Sunday Morning',
    title: 'Prayer & Reflection',
    description: 'Share prayers for your relationship',
    category: 'spiritual',
  },
];

export default function RetreatBuilder({ onSaveRetreat }: RetreatBuilderProps) {
  const [location, setLocation] = useState('home');
  const [focuses, setFocuses] = useState<string[]>(['spiritual']);

  const toggleFocus = (value: string) => {
    setFocuses(prev =>
      prev.includes(value)
        ? prev.filter(f => f !== value)
        : [...prev, value]
    );
  };

  const handleSave = () => {
    onSaveRetreat({
      location,
      focuses,
      activities: SAMPLE_ACTIVITIES,
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
            Create a meaningful weekend to deepen your connection
          </p>
        </div>

        <Card className="p-8 mb-6">
          <h2 className="font-display text-xl font-semibold mb-4">Location</h2>
          <RadioGroup value={location} onValueChange={setLocation}>
            <div className="space-y-3">
              {LOCATION_OPTIONS.map((option) => (
                <div key={option.value} className="flex items-start space-x-3">
                  <RadioGroupItem value={option.value} id={option.value} className="mt-1" />
                  <Label htmlFor={option.value} className="flex-1 cursor-pointer">
                    <div className="font-medium">{option.label}</div>
                    <div className="text-sm text-muted-foreground">{option.description}</div>
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </Card>

        <Card className="p-8 mb-6">
          <h2 className="font-display text-xl font-semibold mb-4">Focus Areas</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {FOCUS_OPTIONS.map((option) => {
              const Icon = option.icon;
              const isSelected = focuses.includes(option.value);
              return (
                <button
                  key={option.value}
                  onClick={() => toggleFocus(option.value)}
                  className={`p-6 rounded-lg border-2 text-left transition-all hover-elevate ${
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
        </Card>

        <Card className="p-8 mb-6">
          <h2 className="font-display text-xl font-semibold mb-6">Your Retreat Itinerary</h2>
          <div className="space-y-4">
            {SAMPLE_ACTIVITIES.map((activity) => (
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
                  <h3 className="font-semibold mb-1">{activity.title}</h3>
                  <p className="text-sm text-muted-foreground">{activity.description}</p>
                </div>
                <Badge className="flex-shrink-0">
                  {activity.category}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        <div className="flex gap-4">
          <Button
            size="lg"
            className="flex-1 text-lg py-6"
            onClick={handleSave}
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
