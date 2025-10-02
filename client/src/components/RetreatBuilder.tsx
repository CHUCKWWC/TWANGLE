import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Heart, Sparkles, BookOpen, Save, DollarSign, Calendar as CalendarIcon, Target, Smile, Lightbulb } from "lucide-react";

export interface RetreatActivity {
  id: string;
  day: number;
  time: string;
  title: string;
  description: string;
  category: 'growth' | 'play' | 'rest';
  whyItWorks: string;
  researchBasis: string;
}

interface RetreatBuilderProps {
  onSaveRetreat: (retreat: {
    vibe: string;
    goal: string;
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
];

const SAMPLE_ACTIVITIES: RetreatActivity[] = [
  {
    id: '1',
    day: 1,
    time: 'Morning',
    title: 'Gratitude Sharing',
    description: 'Share three things you appreciate about your partner and why',
    category: 'rest',
    whyItWorks: 'Expressing gratitude activates positive emotion systems and strengthens bond appreciation',
    researchBasis: 'Gottman Method - Building Love Maps & Fondness',
  },
  {
    id: '2',
    day: 1,
    time: 'Afternoon',
    title: 'Trust Walk',
    description: 'Blindfolded walk with partner guidance through a safe space',
    category: 'growth',
    whyItWorks: 'Builds trust through vulnerability and demonstrates reliable responsiveness',
    researchBasis: 'Attachment Theory - Safe Haven & Secure Base',
  },
  {
    id: '3',
    day: 1,
    time: 'Evening',
    title: 'Cooking Adventure',
    description: 'Prepare a new recipe together, taking turns leading',
    category: 'play',
    whyItWorks: 'Shared novel experiences release bonding hormones and create positive memories',
    researchBasis: 'Positive Psychology - Shared Joy & Co-creation',
  },
  {
    id: '4',
    day: 2,
    time: 'Morning',
    title: 'Reflective Meditation',
    description: 'Guided meditation focusing on your relationship journey',
    category: 'rest',
    whyItWorks: 'Mindful awareness reduces reactivity and increases emotional attunement',
    researchBasis: 'EFT - Present Moment Awareness',
  },
  {
    id: '5',
    day: 2,
    time: 'Afternoon',
    title: 'Emotion Sharing Circle',
    description: 'Take turns sharing feelings using "I feel..." statements',
    category: 'growth',
    whyItWorks: 'Vulnerable sharing builds emotional intimacy and deepens understanding',
    researchBasis: 'EFT - Accessing & Expressing Emotion',
  },
  {
    id: '6',
    day: 2,
    time: 'Evening',
    title: 'Dance & Movement',
    description: 'Put on favorite music and dance together freely',
    category: 'play',
    whyItWorks: 'Physical synchrony and playfulness strengthen connection and reduce stress',
    researchBasis: 'Positive Psychology - Shared Positive Affect',
  },
  {
    id: '7',
    day: 3,
    time: 'Morning',
    title: 'Nature Connection',
    description: 'Silent walk in nature, then share observations',
    category: 'rest',
    whyItWorks: 'Natural environments calm the nervous system and create shared peaceful experiences',
    researchBasis: 'Attachment Theory - Co-regulation',
  },
  {
    id: '8',
    day: 3,
    time: 'Afternoon',
    title: 'Dream Mapping',
    description: 'Create a visual map of your shared dreams and goals',
    category: 'growth',
    whyItWorks: 'Aligning on shared meaning strengthens relationship purpose and commitment',
    researchBasis: 'Gottman Method - Creating Shared Meaning',
  },
  {
    id: '9',
    day: 3,
    time: 'Evening',
    title: 'Game Night',
    description: 'Play cooperative board games or card games',
    category: 'play',
    whyItWorks: 'Cooperative play builds teamwork and creates lighthearted connection',
    researchBasis: 'Positive Psychology - Flow & Shared Experience',
  },
  {
    id: '10',
    day: 4,
    time: 'Morning',
    title: 'Appreciation Ritual',
    description: 'Share specific moments when you felt loved this retreat',
    category: 'rest',
    whyItWorks: 'Reflecting on positive moments strengthens positive sentiment override',
    researchBasis: 'Gottman Method - Positive Perspective',
  },
  {
    id: '11',
    day: 4,
    time: 'Afternoon',
    title: 'Future Planning',
    description: 'Discuss how to maintain connection in daily life',
    category: 'growth',
    whyItWorks: 'Planning integration ensures retreat benefits transfer to everyday relationship',
    researchBasis: 'EFT - Consolidation & Integration',
  },
];

export default function RetreatBuilder({ onSaveRetreat }: RetreatBuilderProps) {
  const [duration, setDuration] = useState(2);
  const [location, setLocation] = useState('home');
  const [budget, setBudget] = useState('medium');
  const [vibe, setVibe] = useState('cozy');
  const [goal, setGoal] = useState('reconnect');
  const [focuses, setFocuses] = useState<string[]>(['growth']);

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
      vibe,
      goal,
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
            Create a personalized retreat to deepen your connection
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
                <div className="space-y-4">
                  {dayActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className="p-5 rounded-lg border border-border bg-card"
                    >
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-lg">{activity.title}</h4>
                            <Badge variant="outline" className="font-accent">
                              {activity.time}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">{activity.description}</p>
                        </div>
                        <Badge className="flex-shrink-0 capitalize">
                          {activity.category}
                        </Badge>
                      </div>
                      <div className="bg-muted/30 rounded-md p-3 border border-border/50">
                        <div className="flex items-start gap-2">
                          <Lightbulb className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-medium mb-1">Why it works</p>
                            <p className="text-sm text-muted-foreground mb-2">{activity.whyItWorks}</p>
                            <p className="text-xs text-muted-foreground italic">{activity.researchBasis}</p>
                          </div>
                        </div>
                      </div>
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
