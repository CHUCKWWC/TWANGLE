import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Lightbulb, TrendingUp, Heart, Activity, Briefcase, Building2, Sparkles, HandHeart, Users, Home, Mountain, Plus, X } from "lucide-react";
import { VisionPlanning as VisionPlanningType } from "@shared/schema";

interface VisionPlanningProps {
  value: VisionPlanningType | undefined;
  onChange: (value: VisionPlanningType) => void;
}

const LIFE_DIMENSIONS = [
  { 
    key: 'financial' as const, 
    label: 'Financial Goals', 
    icon: TrendingUp,
    placeholder: 'Describe your financial vision and goals...',
    description: 'Money, savings, investments, financial freedom'
  },
  { 
    key: 'intimacy' as const, 
    label: 'Intimacy & Romance', 
    icon: Heart,
    placeholder: 'Share your vision for emotional and physical intimacy...',
    description: 'Connection, romance, emotional closeness'
  },
  { 
    key: 'health' as const, 
    label: 'Health & Wellness', 
    icon: Activity,
    placeholder: 'Describe your health and wellness aspirations...',
    description: 'Physical fitness, mental health, well-being'
  },
  { 
    key: 'career' as const, 
    label: 'Career & Purpose', 
    icon: Briefcase,
    placeholder: 'Share your career vision and professional goals...',
    description: 'Professional growth, purpose, career trajectory'
  },
  { 
    key: 'business' as const, 
    label: 'Business & Entrepreneurship', 
    icon: Building2,
    placeholder: 'Describe your business dreams and ventures...',
    description: 'Entrepreneurship, ventures, business goals'
  },
  { 
    key: 'spiritual' as const, 
    label: 'Spiritual Life', 
    icon: Sparkles,
    placeholder: 'Share your spiritual journey and growth...',
    description: 'Faith, spirituality, inner peace, practices'
  },
  { 
    key: 'ministry' as const, 
    label: 'Ministry & Service', 
    icon: HandHeart,
    placeholder: 'Describe how you want to serve and give back...',
    description: 'Service, giving back, making a difference'
  },
  { 
    key: 'family' as const, 
    label: 'Family & Children', 
    icon: Home,
    placeholder: 'Share your vision for family life...',
    description: 'Children, family dynamics, parenting'
  },
  { 
    key: 'personal' as const, 
    label: 'Personal Growth', 
    icon: Mountain,
    placeholder: 'Describe your personal development goals...',
    description: 'Skills, hobbies, self-improvement, learning'
  },
  { 
    key: 'community' as const, 
    label: 'Community & Friendship', 
    icon: Users,
    placeholder: 'Share your vision for community and friendships...',
    description: 'Social connections, friendships, belonging'
  },
  { 
    key: 'legacy' as const, 
    label: 'Legacy & Impact', 
    icon: Mountain,
    placeholder: 'Describe the legacy you want to leave...',
    description: 'Long-term impact, what you want to be remembered for'
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
    <Card className="p-8">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="w-5 h-5 text-primary" />
        <h2 className="font-display text-xl font-semibold">Vision Planning (Optional)</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Add future planning to your retreat. Share your vision across different timelines and life dimensions to create a retreat that aligns with your long-term goals.
      </p>

      <Tabs defaultValue="timelines" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="timelines" data-testid="tab-timelines">Time Horizons</TabsTrigger>
          <TabsTrigger value="dimensions" data-testid="tab-dimensions">Life Dimensions</TabsTrigger>
        </TabsList>

        <TabsContent value="timelines" className="space-y-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="vision-6mo" className="mb-2 block font-medium">
                6 Months from Now
              </Label>
              <Textarea
                id="vision-6mo"
                placeholder="Where do you see yourselves in 6 months? What small wins do you want to achieve?"
                value={value?.timelines?.sixMonths || ''}
                onChange={(e) => updateTimeline('sixMonths', e.target.value)}
                className="min-h-[80px]"
                data-testid="textarea-vision-6mo"
              />
            </div>

            <div>
              <Label htmlFor="vision-1yr" className="mb-2 block font-medium">
                1 Year from Now
              </Label>
              <Textarea
                id="vision-1yr"
                placeholder="What does your life look like in 1 year? What major milestones will you celebrate?"
                value={value?.timelines?.oneYear || ''}
                onChange={(e) => updateTimeline('oneYear', e.target.value)}
                className="min-h-[80px]"
                data-testid="textarea-vision-1yr"
              />
            </div>

            <div>
              <Label htmlFor="vision-5yr" className="mb-2 block font-medium">
                5 Years from Now
              </Label>
              <Textarea
                id="vision-5yr"
                placeholder="Paint a picture of your life 5 years ahead. What has changed? What have you built together?"
                value={value?.timelines?.fiveYears || ''}
                onChange={(e) => updateTimeline('fiveYears', e.target.value)}
                className="min-h-[80px]"
                data-testid="textarea-vision-5yr"
              />
            </div>

            <div>
              <Label htmlFor="vision-10yr" className="mb-2 block font-medium">
                10 Years from Now
              </Label>
              <Textarea
                id="vision-10yr"
                placeholder="Dream big. Where are you in 10 years? What legacy are you building?"
                value={value?.timelines?.tenYears || ''}
                onChange={(e) => updateTimeline('tenYears', e.target.value)}
                className="min-h-[80px]"
                data-testid="textarea-vision-10yr"
              />
            </div>

            {!showCustomTimeline ? (
              <div className="pt-2">
                <Label htmlFor="custom-timeline-label" className="mb-2 block font-medium">
                  Custom Timeline
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="custom-timeline-label"
                    placeholder="e.g., 3 Years, 20 Years, Retirement"
                    value={customTimelineLabel}
                    onChange={(e) => setCustomTimelineLabel(e.target.value)}
                    data-testid="input-custom-timeline-label"
                  />
                  <Button
                    type="button"
                    onClick={addCustomTimeline}
                    disabled={!customTimelineLabel.trim()}
                    data-testid="button-add-custom-timeline"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="vision-custom" className="font-medium">
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
                  id="vision-custom"
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
                  className="min-h-[80px]"
                  data-testid="textarea-vision-custom"
                />
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="dimensions" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            {LIFE_DIMENSIONS.map((dimension) => {
              const Icon = dimension.icon;
              return (
                <div key={dimension.key}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-4 h-4 text-primary" />
                    <Label htmlFor={`dimension-${dimension.key}`} className="font-medium">
                      {dimension.label}
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{dimension.description}</p>
                  <Textarea
                    id={`dimension-${dimension.key}`}
                    placeholder={dimension.placeholder}
                    value={value?.lifeDimensions?.[dimension.key] || ''}
                    onChange={(e) => updateLifeDimension(dimension.key, e.target.value)}
                    className="min-h-[100px]"
                    data-testid={`textarea-dimension-${dimension.key}`}
                  />
                </div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      <div className="mt-6 p-4 bg-secondary/50 rounded-lg">
        <p className="text-sm text-muted-foreground">
          <strong>Tip:</strong> Your vision planning will be woven into your retreat itinerary, helping you create activities and conversations that align with your future goals.
        </p>
      </div>
    </Card>
  );
}
