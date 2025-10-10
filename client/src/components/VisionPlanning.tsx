import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { Lightbulb, Clock, TrendingUp, Heart, Activity, Briefcase, Building2, Sparkles, HandHeart, Users, Home, Mountain, Plus, X, Target } from "lucide-react";
import { VisionPlanning as VisionPlanningType } from "@shared/schema";

interface VisionPlanningProps {
  value: VisionPlanningType | undefined;
  onChange: (value: VisionPlanningType) => void;
}

const TIMELINE_HORIZONS = [
  { 
    key: 'sixMonths' as const, 
    label: '6 Months', 
    placeholder: 'Where do you see yourselves in 6 months? What small wins do you want to achieve?',
  },
  { 
    key: 'oneYear' as const, 
    label: '1 Year', 
    placeholder: 'What does your life look like in 1 year? What major milestones will you celebrate?',
  },
  { 
    key: 'fiveYears' as const, 
    label: '5 Years', 
    placeholder: 'Paint a picture of your life 5 years ahead. What has changed? What have you built together?',
  },
  { 
    key: 'tenYears' as const, 
    label: '10 Years', 
    placeholder: 'Dream big. Where are you in 10 years? What legacy are you building?',
  },
];

const LIFE_DIMENSIONS = [
  { 
    key: 'financial' as const, 
    label: 'Financial', 
    icon: TrendingUp,
    placeholder: 'Financial goals, savings, investments...',
  },
  { 
    key: 'intimacy' as const, 
    label: 'Intimacy', 
    icon: Heart,
    placeholder: 'Emotional and physical connection...',
  },
  { 
    key: 'health' as const, 
    label: 'Health', 
    icon: Activity,
    placeholder: 'Physical and mental wellness...',
  },
  { 
    key: 'career' as const, 
    label: 'Career', 
    icon: Briefcase,
    placeholder: 'Professional growth and purpose...',
  },
  { 
    key: 'business' as const, 
    label: 'Business', 
    icon: Building2,
    placeholder: 'Entrepreneurship and ventures...',
  },
  { 
    key: 'spiritual' as const, 
    label: 'Spiritual', 
    icon: Sparkles,
    placeholder: 'Faith and inner peace...',
  },
  { 
    key: 'ministry' as const, 
    label: 'Ministry', 
    icon: HandHeart,
    placeholder: 'Service and giving back...',
  },
  { 
    key: 'family' as const, 
    label: 'Family', 
    icon: Home,
    placeholder: 'Children and family life...',
  },
  { 
    key: 'personal' as const, 
    label: 'Personal Growth', 
    icon: Mountain,
    placeholder: 'Skills and self-improvement...',
  },
  { 
    key: 'community' as const, 
    label: 'Community', 
    icon: Users,
    placeholder: 'Friendships and connections...',
  },
  { 
    key: 'legacy' as const, 
    label: 'Legacy', 
    icon: Target,
    placeholder: 'Long-term impact...',
  },
];

export default function VisionPlanning({ value, onChange }: VisionPlanningProps) {
  const [customTimelineLabel, setCustomTimelineLabel] = useState(value?.timelines?.custom?.label || '');
  const [showCustomTimeline, setShowCustomTimeline] = useState(!!value?.timelines?.custom);

  const updateTimeline = (timeline: string, vision: string) => {
    onChange({
      ...(value ?? {}),
      timelines: {
        ...(value?.timelines ?? {}),
        [timeline]: vision,
      },
    });
  };

  const updateLifeDimension = (dimension: string, vision: string) => {
    onChange({
      ...(value ?? {}),
      lifeDimensions: {
        ...(value?.lifeDimensions ?? {}),
        [dimension]: vision,
      },
    });
  };

  const addCustomTimeline = () => {
    if (!customTimelineLabel.trim()) return;
    
    setShowCustomTimeline(true);
    onChange({
      ...(value ?? {}),
      timelines: {
        ...(value?.timelines ?? {}),
        custom: {
          label: customTimelineLabel,
          vision: value?.timelines?.custom?.vision || '',
        },
      },
    });
  };

  const removeCustomTimeline = () => {
    setShowCustomTimeline(false);
    setCustomTimelineLabel('');
    const { custom, ...restTimelines } = value?.timelines || {};
    onChange({
      ...(value ?? {}),
      timelines: restTimelines,
    });
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-2">
        <Lightbulb className="w-5 h-5 text-primary" />
        <h2 className="font-display text-xl font-semibold">Vision Planning</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Optional: Shape your retreat around your shared future. Fill in any sections that matter to you.
      </p>

      <Accordion type="multiple" className="space-y-3">
        <AccordionItem value="timelines" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline py-4" data-testid="accordion-timelines">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <span className="font-medium">Time Horizons</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4 pt-2">
            <div className="grid md:grid-cols-2 gap-4">
              {TIMELINE_HORIZONS.map((timeline) => (
                <div key={timeline.key}>
                  <Label htmlFor={`timeline-${timeline.key}`} className="mb-2 block text-sm font-medium">
                    {timeline.label}
                  </Label>
                  <Textarea
                    id={`timeline-${timeline.key}`}
                    placeholder={timeline.placeholder}
                    value={value?.timelines?.[timeline.key] || ''}
                    onChange={(e) => updateTimeline(timeline.key, e.target.value)}
                    className="min-h-[90px] text-sm"
                    data-testid={`textarea-timeline-${timeline.key}`}
                  />
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t">
              {!showCustomTimeline ? (
                <div>
                  <Label htmlFor="custom-timeline-label" className="mb-2 block text-sm font-medium">
                    Custom Timeline
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="custom-timeline-label"
                      placeholder="e.g., 3 Years, Retirement"
                      value={customTimelineLabel}
                      onChange={(e) => setCustomTimelineLabel(e.target.value)}
                      className="text-sm"
                      data-testid="input-custom-timeline-label"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={addCustomTimeline}
                      disabled={!customTimelineLabel.trim()}
                      data-testid="button-add-custom-timeline"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="timeline-custom" className="text-sm font-medium">
                      {value?.timelines?.custom?.label}
                    </Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeCustomTimeline}
                      data-testid="button-remove-custom-timeline"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <Textarea
                    id="timeline-custom"
                    placeholder={`What's your vision for ${value?.timelines?.custom?.label?.toLowerCase()}?`}
                    value={value?.timelines?.custom?.vision || ''}
                    onChange={(e) => {
                      onChange({
                        ...(value ?? {}),
                        timelines: {
                          ...(value?.timelines ?? {}),
                          custom: {
                            label: value?.timelines?.custom?.label || '',
                            vision: e.target.value,
                          },
                        },
                      });
                    }}
                    className="min-h-[90px] text-sm"
                    data-testid="textarea-timeline-custom"
                  />
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="dimensions" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline py-4" data-testid="accordion-dimensions">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              <span className="font-medium">Life Dimensions</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4 pt-2">
            <div className="grid md:grid-cols-3 gap-4">
              {LIFE_DIMENSIONS.map((dimension) => {
                const Icon = dimension.icon;
                return (
                  <div key={dimension.key}>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Icon className="w-3.5 h-3.5 text-primary" />
                      <Label htmlFor={`dimension-${dimension.key}`} className="text-sm font-medium">
                        {dimension.label}
                      </Label>
                    </div>
                    <Textarea
                      id={`dimension-${dimension.key}`}
                      placeholder={dimension.placeholder}
                      value={value?.lifeDimensions?.[dimension.key] || ''}
                      onChange={(e) => updateLifeDimension(dimension.key, e.target.value)}
                      className="min-h-[85px] text-sm"
                      data-testid={`textarea-dimension-${dimension.key}`}
                    />
                  </div>
                );
              })}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="mt-4 p-3 bg-secondary/30 rounded-lg">
        <p className="text-xs text-muted-foreground">
          <strong>Tip:</strong> Your vision will be woven into your retreat itinerary, creating activities that align with your future goals.
        </p>
      </div>
    </Card>
  );
}
