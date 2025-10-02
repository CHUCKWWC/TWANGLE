import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Heart, Sparkles, BookOpen, Save, DollarSign, Calendar as CalendarIcon, Target, Smile, Lightbulb, Clock, Coffee, Utensils } from "lucide-react";

export interface RetreatActivity {
  id: string;
  day: number;
  time: string;
  title: string;
  description: string;
  category: 'growth' | 'play' | 'rest';
  duration: number;
  whyItWorks: string;
  researchBasis: string;
  examples: string[];
}

interface RetreatBuilderProps {
  onSaveRetreat: (retreat: {
    vibe: string;
    goal: string;
    startTime: string;
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
];

const SAMPLE_ACTIVITIES: RetreatActivity[] = [
  {
    id: '1',
    day: 1,
    time: 'Morning',
    title: 'Gratitude Sharing',
    description: 'Share three things you appreciate about your partner and why',
    category: 'rest',
    duration: 30,
    whyItWorks: 'Expressing gratitude activates positive emotion systems and strengthens bond appreciation',
    researchBasis: 'Gottman Method - Building Love Maps & Fondness',
    examples: [
      'Sit facing each other in a comfortable spot',
      'Partner A shares: "I appreciate when you..." and explains why it matters',
      'Partner B listens without interrupting, then says "Thank you for sharing"',
      'Switch roles and repeat',
      'Share three things each, taking turns'
    ],
  },
  {
    id: '2',
    day: 1,
    time: 'Afternoon',
    title: 'Trust Walk',
    description: 'Blindfolded walk with partner guidance through a safe space',
    category: 'growth',
    duration: 45,
    whyItWorks: 'Builds trust through vulnerability and demonstrates reliable responsiveness',
    researchBasis: 'Attachment Theory - Safe Haven & Secure Base',
    examples: [
      'Choose a safe indoor or outdoor space with varied terrain',
      'One partner wears a blindfold or closes eyes',
      'Guiding partner uses gentle touch and clear verbal cues',
      'Guide through 10-15 minutes, then switch roles',
      'After both turns, discuss how it felt to trust and be trusted'
    ],
  },
  {
    id: '3',
    day: 1,
    time: 'Evening',
    title: 'Cooking Adventure',
    description: 'Prepare a new recipe together, taking turns leading',
    category: 'play',
    duration: 90,
    whyItWorks: 'Shared novel experiences release bonding hormones and create positive memories',
    researchBasis: 'Positive Psychology - Shared Joy & Co-creation',
    examples: [
      'Choose a recipe neither of you has made before',
      'One partner leads prep, the other assists',
      'Switch roles for cooking the main dish',
      'Work together on plating and presentation',
      'Share the meal and discuss what you enjoyed about the process'
    ],
  },
  {
    id: '4',
    day: 2,
    time: 'Morning',
    title: 'Reflective Meditation',
    description: 'Guided meditation focusing on your relationship journey',
    category: 'rest',
    duration: 30,
    whyItWorks: 'Mindful awareness reduces reactivity and increases emotional attunement',
    researchBasis: 'EFT - Present Moment Awareness',
    examples: [
      'Find a quiet space and sit comfortably together',
      'Use a couples meditation app or YouTube video (search "couples loving-kindness meditation")',
      'Focus on breathing together, matching your breath rhythms',
      'Visualize your favorite memories together',
      'End with 5 minutes of silence, then share one word about how you feel'
    ],
  },
  {
    id: '5',
    day: 2,
    time: 'Afternoon',
    title: 'Emotion Sharing Circle',
    description: 'Take turns sharing feelings using "I feel..." statements',
    category: 'growth',
    duration: 60,
    whyItWorks: 'Vulnerable sharing builds emotional intimacy and deepens understanding',
    researchBasis: 'EFT - Accessing & Expressing Emotion',
    examples: [
      'Set a timer for 10 minutes per person',
      'Partner A completes: "I feel... when you... because..."',
      'Partner B reflects back: "I hear you saying you feel..."',
      'No defending or problem-solving, just listening',
      'Switch roles, repeat 2-3 rounds each',
      'End with a hug and "Thank you for trusting me"'
    ],
  },
  {
    id: '6',
    day: 2,
    time: 'Evening',
    title: 'Dance & Movement',
    description: 'Put on favorite music and dance together freely',
    category: 'play',
    duration: 45,
    whyItWorks: 'Physical synchrony and playfulness strengthen connection and reduce stress',
    researchBasis: 'Positive Psychology - Shared Positive Affect',
    examples: [
      'Create a playlist with 8-10 songs you both love',
      'Start with slow songs, build to upbeat ones',
      'Try partner dancing (no experience needed - just sway and move)',
      'Be silly - do your worst dance moves and laugh together',
      'End with a slow song, holding each other close'
    ],
  },
  {
    id: '7',
    day: 3,
    time: 'Morning',
    title: 'Nature Connection',
    description: 'Silent walk in nature, then share observations',
    category: 'rest',
    duration: 60,
    whyItWorks: 'Natural environments calm the nervous system and create shared peaceful experiences',
    researchBasis: 'Attachment Theory - Co-regulation',
    examples: [
      'Find a nature trail, park, or quiet outdoor space',
      'Walk in silence for 20 minutes, holding hands if comfortable',
      'Each person notices 5 things: colors, sounds, textures, scents, feelings',
      'Sit together and share your observations',
      'Discuss how being in nature affected your mood and connection'
    ],
  },
  {
    id: '8',
    day: 3,
    time: 'Afternoon',
    title: 'Dream Mapping',
    description: 'Create a visual map of your shared dreams and goals',
    category: 'growth',
    duration: 90,
    whyItWorks: 'Aligning on shared meaning strengthens relationship purpose and commitment',
    researchBasis: 'Gottman Method - Creating Shared Meaning',
    examples: [
      'Get large paper or poster board and colored markers',
      'Each person draws/writes individual dreams on one side',
      'Identify overlapping dreams and place them in the center',
      'Create a visual timeline: 1 year, 5 years, 10 years, lifetime',
      'Display your dream map somewhere visible at home'
    ],
  },
  {
    id: '9',
    day: 3,
    time: 'Evening',
    title: 'Game Night',
    description: 'Play cooperative board games or card games',
    category: 'play',
    duration: 90,
    whyItWorks: 'Cooperative play builds teamwork and creates lighthearted connection',
    researchBasis: 'Positive Psychology - Flow & Shared Experience',
    examples: [
      'Choose cooperative games where you work together (Pandemic, Forbidden Island, or simple card games)',
      'Avoid competitive games that might create tension',
      'Play 2-3 different games to keep it fresh',
      'Take breaks for snacks and laughter',
      'Celebrate wins together, laugh at losses together'
    ],
  },
  {
    id: '10',
    day: 4,
    time: 'Morning',
    title: 'Appreciation Ritual',
    description: 'Share specific moments when you felt loved this retreat',
    category: 'rest',
    duration: 30,
    whyItWorks: 'Reflecting on positive moments strengthens positive sentiment override',
    researchBasis: 'Gottman Method - Positive Perspective',
    examples: [
      'Light a candle to mark this as special time',
      'Partner A: "I felt most loved when you..."',
      'Describe the specific moment and how it made you feel',
      'Partner B: "Thank you. That meant a lot to me too"',
      'Switch and repeat 3 times each',
      'Write down your favorite moment to remember later'
    ],
  },
  {
    id: '11',
    day: 4,
    time: 'Afternoon',
    title: 'Future Planning',
    description: 'Discuss how to maintain connection in daily life',
    category: 'growth',
    duration: 60,
    whyItWorks: 'Planning integration ensures retreat benefits transfer to everyday relationship',
    researchBasis: 'EFT - Consolidation & Integration',
    examples: [
      'Review what you learned about each other this retreat',
      'Identify 3 specific practices to continue at home',
      'Schedule weekly "connection time" in your calendar',
      'Create a simple ritual (10-minute morning coffee, evening walk, etc.)',
      'Plan your next mini-retreat or date night'
    ],
  },
];

interface TimelineItem {
  type: 'activity' | 'break' | 'meal';
  time: string;
  activity?: RetreatActivity;
  breakType?: 'short' | 'long';
  breakLabel?: string;
}

function generateTimeline(startTime: string, activities: RetreatActivity[]): Record<number, TimelineItem[]> {
  const timeline: Record<number, TimelineItem[]> = {};
  const [startHour] = startTime.split(':').map(Number);

  for (let day = 1; day <= Math.max(...activities.map(a => a.day)); day++) {
    const dayActivities = activities.filter(a => a.day === day);
    const items: TimelineItem[] = [];
    let currentMinutes = startHour * 60;

    const formatTime = (minutes: number) => {
      const hours = Math.floor(minutes / 60) % 24;
      const mins = minutes % 60;
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
      return `${displayHour}:${mins.toString().padStart(2, '0')} ${period}`;
    };

    dayActivities.forEach((activity, index) => {
      items.push({
        type: 'activity',
        time: formatTime(currentMinutes),
        activity,
      });
      currentMinutes += activity.duration;

      if (index === 0) {
        items.push({
          type: 'break',
          time: formatTime(currentMinutes),
          breakType: 'short',
          breakLabel: 'Short Break (15 min)',
        });
        currentMinutes += 15;
      } else if (index === 1) {
        items.push({
          type: 'meal',
          time: formatTime(currentMinutes),
          breakLabel: 'Lunch Break (2 hours)',
        });
        currentMinutes += 120;
      } else if (index === 2) {
        items.push({
          type: 'break',
          time: formatTime(currentMinutes),
          breakType: 'long',
          breakLabel: 'Free Time (3 hours)',
        });
        currentMinutes += 180;
      }
    });

    timeline[day] = items;
  }

  return timeline;
}

export default function RetreatBuilder({ onSaveRetreat }: RetreatBuilderProps) {
  const [duration, setDuration] = useState(2);
  const [location, setLocation] = useState('home');
  const [budget, setBudget] = useState('medium');
  const [vibe, setVibe] = useState('cozy');
  const [goal, setGoal] = useState('reconnect');
  const [startTime, setStartTime] = useState('9:00');
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
  const timeline = generateTimeline(startTime, filteredActivities);

  const handleSave = () => {
    onSaveRetreat({
      vibe,
      goal,
      startTime,
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
          <div className="mb-6">
            <h2 className="font-display text-xl font-semibold mb-2">Your Retreat Timeline</h2>
            <p className="text-sm text-muted-foreground">
              A structured schedule with activities, breaks, and free time to enjoy your surroundings
            </p>
          </div>
          {Object.entries(timeline).map(([day, items]) => (
            <div key={day} className="mb-8 last:mb-0">
              <h3 className="font-display font-semibold text-lg mb-4">Day {day}</h3>
              <div className="space-y-4">
                {items.map((item, index) => {
                  if (item.type === 'activity' && item.activity) {
                    const activity = item.activity;
                    return (
                      <div key={`${day}-${index}`} className="relative pl-12">
                        <div className="absolute left-0 top-0 flex flex-col items-center">
                          <Clock className="w-5 h-5 text-primary mb-1" />
                          <div className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                            {item.time}
                          </div>
                        </div>
                        <div className="p-5 rounded-lg border border-border bg-card">
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold text-lg">{activity.title}</h4>
                                <Badge className="flex-shrink-0 capitalize">
                                  {activity.category}
                                </Badge>
                                <Badge variant="outline" className="font-accent">
                                  {activity.duration} min
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-3">{activity.description}</p>
                            </div>
                          </div>

                          <div className="bg-accent/10 rounded-md p-4 mb-3 border border-accent/20">
                            <div className="flex items-start gap-2 mb-2">
                              <Sparkles className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                              <p className="text-sm font-semibold text-foreground">How to engage:</p>
                            </div>
                            <ol className="space-y-2 ml-6">
                              {activity.examples.map((example, exIdx) => (
                                <li key={exIdx} className="text-sm text-muted-foreground list-decimal">
                                  {example}
                                </li>
                              ))}
                            </ol>
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
                      </div>
                    );
                  }
                  
                  if (item.type === 'break') {
                    return (
                      <div key={`${day}-${index}`} className="relative pl-12">
                        <div className="absolute left-0 top-0 flex flex-col items-center">
                          <Coffee className="w-5 h-5 text-muted-foreground mb-1" />
                          <div className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                            {item.time}
                          </div>
                        </div>
                        <div className="p-4 rounded-lg border border-dashed border-muted-foreground/30 bg-muted/10">
                          <p className="text-sm font-medium text-muted-foreground">{item.breakLabel}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {item.breakType === 'long' 
                              ? 'Explore your surroundings, rest, or do something spontaneous together' 
                              : 'Grab a snack, stretch, or take a quick walk'}
                          </p>
                        </div>
                      </div>
                    );
                  }
                  
                  if (item.type === 'meal') {
                    return (
                      <div key={`${day}-${index}`} className="relative pl-12">
                        <div className="absolute left-0 top-0 flex flex-col items-center">
                          <Utensils className="w-5 h-5 text-muted-foreground mb-1" />
                          <div className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                            {item.time}
                          </div>
                        </div>
                        <div className="p-4 rounded-lg border border-dashed border-muted-foreground/30 bg-muted/10">
                          <p className="text-sm font-medium text-muted-foreground">{item.breakLabel}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Enjoy a meal together and take time to relax and recharge
                          </p>
                        </div>
                      </div>
                    );
                  }
                  
                  return null;
                })}
              </div>
            </div>
          ))}
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
