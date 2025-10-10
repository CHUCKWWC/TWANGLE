import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Lightbulb, 
  Clock, 
  TrendingUp, 
  Heart, 
  Activity, 
  Briefcase, 
  Building2, 
  Sparkles, 
  HandHeart, 
  Users, 
  Home, 
  Mountain, 
  Target 
} from "lucide-react";
import { VisionPlanning as VisionPlanningType } from "@shared/schema";

interface VisionPlanningProps {
  value: VisionPlanningType | undefined;
  onChange: (value: VisionPlanningType) => void;
}

const TIMELINE_OPTIONS = [
  { value: 'sixMonths' as const, label: '6 Months', description: 'Near-term goals' },
  { value: 'oneYear' as const, label: '1 Year', description: 'Annual vision' },
  { value: 'fiveYears' as const, label: '5 Years', description: 'Mid-term future' },
  { value: 'tenYears' as const, label: '10 Years', description: 'Long-term legacy' },
];

const DIMENSION_OPTIONS = [
  { value: 'financial' as const, label: 'Financial', icon: TrendingUp, description: 'Money & security' },
  { value: 'intimacy' as const, label: 'Intimacy', icon: Heart, description: 'Connection & romance' },
  { value: 'health' as const, label: 'Health', icon: Activity, description: 'Wellness & fitness' },
  { value: 'career' as const, label: 'Career', icon: Briefcase, description: 'Professional growth' },
  { value: 'business' as const, label: 'Business', icon: Building2, description: 'Entrepreneurship' },
  { value: 'spiritual' as const, label: 'Spiritual', icon: Sparkles, description: 'Faith & meaning' },
  { value: 'ministry' as const, label: 'Ministry', icon: HandHeart, description: 'Service & giving' },
  { value: 'family' as const, label: 'Family', icon: Home, description: 'Children & parenting' },
  { value: 'personal' as const, label: 'Personal', icon: Mountain, description: 'Growth & skills' },
  { value: 'community' as const, label: 'Community', icon: Users, description: 'Friendships' },
  { value: 'legacy' as const, label: 'Legacy', icon: Target, description: 'Long-term impact' },
];

export default function VisionPlanning({ value, onChange }: VisionPlanningProps) {
  const selectedTimelines = value?.focusTimelines || [];
  const selectedDimensions = value?.focusDimensions || [];

  const toggleTimeline = (timeline: typeof TIMELINE_OPTIONS[number]['value']) => {
    const current = selectedTimelines;
    const updated = current.includes(timeline)
      ? current.filter(t => t !== timeline)
      : [...current, timeline];
    
    onChange({
      ...value,
      focusTimelines: updated.length > 0 ? updated : undefined,
    });
  };

  const toggleDimension = (dimension: typeof DIMENSION_OPTIONS[number]['value']) => {
    const current = selectedDimensions;
    const updated = current.includes(dimension)
      ? current.filter(d => d !== dimension)
      : [...current, dimension];
    
    onChange({
      ...value,
      focusDimensions: updated.length > 0 ? updated : undefined,
    });
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-2">
        <Lightbulb className="w-5 h-5 text-primary" />
        <h2 className="font-display text-xl font-semibold">Vision Planning</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Optional: Tell us what areas you want to explore together. We'll recommend exercises in your retreat itinerary to help you align on these topics.
      </p>

      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-primary" />
            <Label className="text-base font-semibold">Which timeframes matter most to you?</Label>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Select the time horizons you want to align on. We'll include exercises to help you explore your vision for these periods.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {TIMELINE_OPTIONS.map((option) => {
              const isSelected = selectedTimelines.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggleTimeline(option.value)}
                  className={`p-4 rounded-lg border-2 transition-all text-left hover-elevate ${
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-card'
                  }`}
                  data-testid={`timeline-${option.value}`}
                >
                  <div className={`font-medium mb-1 ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                    {option.label}
                  </div>
                  <div className="text-xs text-muted-foreground">{option.description}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-primary" />
            <Label className="text-base font-semibold">Which life areas do you want to align on?</Label>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Choose the dimensions where you'd like to create shared goals. Your retreat will include exercises to explore these areas together.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {DIMENSION_OPTIONS.map((option) => {
              const Icon = option.icon;
              const isSelected = selectedDimensions.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggleDimension(option.value)}
                  className={`p-4 rounded-lg border-2 transition-all text-left hover-elevate ${
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-card'
                  }`}
                  data-testid={`dimension-${option.value}`}
                >
                  <Icon className={`w-5 h-5 mb-2 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div className={`font-medium mb-1 text-sm ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                    {option.label}
                  </div>
                  <div className="text-xs text-muted-foreground">{option.description}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-secondary/30 rounded-lg">
        <p className="text-sm text-muted-foreground">
          <strong>How it works:</strong> Based on your selections, we'll recommend research-backed exercises in your retreat itinerary. These exercises will guide you through exploring and aligning on your future vision together.
        </p>
      </div>

      {(selectedTimelines.length > 0 || selectedDimensions.length > 0) && (
        <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <div className="text-sm font-medium mb-2">Your retreat will include exercises for:</div>
          <div className="flex flex-wrap gap-2">
            {selectedTimelines.map(t => {
              const option = TIMELINE_OPTIONS.find(o => o.value === t);
              return option ? (
                <Badge key={t} variant="secondary" className="text-xs">
                  {option.label}
                </Badge>
              ) : null;
            })}
            {selectedDimensions.map(d => {
              const option = DIMENSION_OPTIONS.find(o => o.value === d);
              return option ? (
                <Badge key={d} variant="secondary" className="text-xs">
                  {option.label}
                </Badge>
              ) : null;
            })}
          </div>
        </div>
      )}
    </Card>
  );
}
