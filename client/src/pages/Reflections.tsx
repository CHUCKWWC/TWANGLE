import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Heart, MessageSquare, Mic, Camera, Clock, Eye, Lock, Unlock, 
  Sparkles, TrendingUp, Calendar, Share2, Timer, BookOpen,
  Smile, Meh, Frown, Target, Activity, Award, Star, Zap,
  ChevronRight, Upload, Play, Pause, Send, Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AppHeader } from "@/components/AppHeader";
import { useAuth } from "@/hooks/useAuth";
import { format, formatDistanceToNow, startOfWeek, addDays } from "date-fns";

interface ReflectionPrompt {
  id: string;
  promptText: string;
  promptType: 'question' | 'activity' | 'challenge';
  category: string;
  weeklyTheme: string | null;
  intensity: number;
  isActive: boolean;
  tags: string[];
  suggestedMedia: string | null;
  metadata: any;
}

interface RelationshipReflection {
  id: string;
  promptId: string;
  userId: string;
  partnershipId: string | null;
  textResponse: string | null;
  voiceNoteUrl: string | null;
  imageUrl: string | null;
  responseType: 'text' | 'voice' | 'image' | 'mixed';
  shareMode: 'immediate' | 'delayed' | 'weekly' | 'private';
  scheduledRevealDate: Date | null;
  isRevealed: boolean;
  partnerViewedAt: Date | null;
  partnerReaction: string | null;
  mood: string | null;
  tags: string[];
  isHighlight: boolean;
  metadata: any;
  createdAt: Date;
}

interface ReflectionInsight {
  id: string;
  partnershipId: string;
  insightType: 'weekly' | 'monthly' | 'milestone' | 'pattern';
  insightTitle: string;
  insightContent: string;
  strengths: string[];
  growthAreas: string[];
  actionItems: string[];
  sentimentScore: number;
  connectionScore: number;
  metadata: any;
  createdAt: Date;
  viewedByUser1: boolean;
  viewedByUser2: boolean;
}

const MOOD_ICONS = {
  happy: { icon: Smile, color: "text-green-600" },
  neutral: { icon: Meh, color: "text-yellow-600" },
  sad: { icon: Frown, color: "text-blue-600" },
};

const SHARE_MODE_CONFIG = {
  immediate: { label: "Share Now", icon: Share2, description: "Partner sees immediately" },
  delayed: { label: "Share Tomorrow", icon: Timer, description: "Reveals tomorrow at noon" },
  weekly: { label: "Weekly Reveal", icon: Calendar, description: "Reveals on Sunday" },
  private: { label: "Keep Private", icon: Lock, description: "Only for your journal" },
};

export default function Reflections() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [responseText, setResponseText] = useState("");
  const [selectedMood, setSelectedMood] = useState<string>("neutral");
  const [selectedShareMode, setSelectedShareMode] = useState<string>("immediate");
  const [isRecording, setIsRecording] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState("respond");

  // Fetch today's reflection prompt
  const { data: promptData, isLoading: promptLoading } = useQuery({
    queryKey: ["/api/reflections/prompt"],
    enabled: isAuthenticated,
  });

  // Fetch timeline of shared reflections
  const { data: timeline, isLoading: timelineLoading } = useQuery({
    queryKey: ["/api/reflections/timeline"],
    enabled: isAuthenticated && activeTab === "timeline",
  });

  // Fetch AI insights
  const { data: insights, isLoading: insightsLoading } = useQuery({
    queryKey: ["/api/reflections/insights"],
    enabled: isAuthenticated && activeTab === "insights",
  });

  // Submit reflection mutation
  const submitReflection = useMutation({
    mutationFn: async (data: any) => {
      const formData = new FormData();
      formData.append("promptId", promptData?.prompt?.id);
      formData.append("textResponse", data.text);
      formData.append("mood", data.mood);
      formData.append("shareMode", data.shareMode);
      formData.append("tags", JSON.stringify(data.tags || []));
      
      if (selectedImage) {
        formData.append("image", selectedImage);
      }
      
      return apiRequest("/api/reflections/respond", {
        method: "POST",
        body: formData,
      });
    },
    onSuccess: () => {
      toast({
        title: "Reflection Shared",
        description: selectedShareMode === "immediate" 
          ? "Your partner can see your reflection now!"
          : "Your reflection has been saved and will be shared as scheduled.",
      });
      setResponseText("");
      setSelectedImage(null);
      queryClient.invalidateQueries({ queryKey: ["/api/reflections"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit reflection. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Add partner reaction mutation
  const addReaction = useMutation({
    mutationFn: async ({ reflectionId, reaction }: any) => {
      return apiRequest(`/api/reflections/${reflectionId}/react`, {
        method: "POST",
        body: JSON.stringify({ reaction }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reflections/timeline"] });
    },
  });

  // Reveal delayed reflection mutation
  const revealReflection = useMutation({
    mutationFn: async (reflectionId: string) => {
      return apiRequest("/api/reflections/reveal", {
        method: "POST",
        body: JSON.stringify({ reflectionId }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Reflection Revealed",
        description: "Your partner can now see this reflection!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/reflections/timeline"] });
    },
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
    }
  };

  const handleSubmit = () => {
    if (!responseText.trim() && !selectedImage) {
      toast({
        title: "Empty Reflection",
        description: "Please write something or add a photo to share.",
        variant: "destructive",
      });
      return;
    }

    submitReflection.mutate({
      text: responseText,
      mood: selectedMood,
      shareMode: selectedShareMode,
      tags: [],
    });
  };

  const renderPromptCard = () => {
    const prompt = promptData?.prompt as ReflectionPrompt;
    if (!prompt) return null;

    return (
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {prompt.promptType === 'activity' && <Activity className="h-5 w-5 text-primary" />}
              {prompt.promptType === 'challenge' && <Target className="h-5 w-5 text-primary" />}
              {prompt.promptType === 'question' && <MessageSquare className="h-5 w-5 text-primary" />}
              <Badge variant="secondary">Today's {prompt.promptType}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-gradient-to-r from-primary to-primary-foreground">
                {prompt.category.replace('_', ' ')}
              </Badge>
              {prompt.weeklyTheme && (
                <Badge variant="outline">
                  Week: {prompt.weeklyTheme}
                </Badge>
              )}
            </div>
          </div>
          <CardTitle className="mt-4 text-2xl">
            {prompt.promptText}
          </CardTitle>
          {prompt.suggestedMedia && (
            <CardDescription className="mt-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Tip: {prompt.suggestedMedia}
            </CardDescription>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Response Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Your Reflection</label>
            <Textarea
              data-testid="input-reflection"
              placeholder="Share your thoughts, feelings, or experiences..."
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              className="min-h-[120px] resize-none"
            />
          </div>

          {/* Media Options */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="gap-2"
            >
              <Camera className="h-4 w-4" />
              Add Photo
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsRecording(!isRecording)}
              className="gap-2"
            >
              {isRecording ? (
                <>
                  <Pause className="h-4 w-4" />
                  Stop Recording
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4" />
                  Voice Note
                </>
              )}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageSelect}
            />
          </div>

          {selectedImage && (
            <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
              <Upload className="h-4 w-4" />
              <span className="text-sm">{selectedImage.name}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedImage(null)}
                className="ml-auto"
              >
                Remove
              </Button>
            </div>
          )}

          <Separator />

          {/* Mood & Sharing Options */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">How are you feeling?</label>
              <Select value={selectedMood} onValueChange={setSelectedMood}>
                <SelectTrigger data-testid="select-mood">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(MOOD_ICONS).map(([mood, config]) => {
                    const Icon = config.icon;
                    return (
                      <SelectItem key={mood} value={mood}>
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${config.color}`} />
                          <span className="capitalize">{mood}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">When to share?</label>
              <Select value={selectedShareMode} onValueChange={setSelectedShareMode}>
                <SelectTrigger data-testid="select-share-mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SHARE_MODE_CONFIG).map(([mode, config]) => {
                    const Icon = config.icon;
                    return (
                      <SelectItem key={mode} value={mode}>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            <span>{config.label}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {config.description}
                          </div>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            data-testid="button-share-reflection"
            onClick={handleSubmit}
            disabled={submitReflection.isPending}
            className="w-full gap-2"
            size="lg"
          >
            {submitReflection.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sharing...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Share Reflection
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  };

  const renderTimeline = () => {
    if (timelineLoading) {
      return (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    const reflections = (timeline?.reflections || []) as RelationshipReflection[];
    
    if (reflections.length === 0) {
      return (
        <Card className="text-center p-8">
          <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <CardTitle>Start Your Journey</CardTitle>
          <CardDescription className="mt-2">
            Share your first reflection to begin building your relationship timeline together.
          </CardDescription>
        </Card>
      );
    }

    return (
      <ScrollArea className="h-[600px] pr-4">
        <div className="space-y-4">
          {reflections.map((reflection) => (
            <Card key={reflection.id} className="hover-elevate">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {reflection.userId === user?.id ? 'You' : 'P'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm font-medium">
                        {reflection.userId === user?.id ? 'You' : 'Your Partner'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(reflection.createdAt), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {reflection.mood && MOOD_ICONS[reflection.mood as keyof typeof MOOD_ICONS] && (
                      <div className={MOOD_ICONS[reflection.mood as keyof typeof MOOD_ICONS].color}>
                        {(() => {
                          const Icon = MOOD_ICONS[reflection.mood as keyof typeof MOOD_ICONS].icon;
                          return <Icon className="h-4 w-4" />;
                        })()}
                      </div>
                    )}
                    {!reflection.isRevealed && (
                      <Badge variant="secondary" className="gap-1">
                        <Lock className="h-3 w-3" />
                        {reflection.shareMode === 'weekly' ? 'Sunday' : 'Tomorrow'}
                      </Badge>
                    )}
                    {reflection.isHighlight && (
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {reflection.isRevealed || reflection.userId === user?.id ? (
                  <>
                    {reflection.textResponse && (
                      <p className="text-sm leading-relaxed">{reflection.textResponse}</p>
                    )}
                    {reflection.imageUrl && (
                      <img 
                        src={reflection.imageUrl} 
                        alt="Reflection" 
                        className="mt-2 rounded-lg max-w-full h-auto"
                      />
                    )}
                    {reflection.voiceNoteUrl && (
                      <div className="mt-2 flex items-center gap-2 p-2 bg-muted rounded-lg">
                        <Play className="h-4 w-4" />
                        <span className="text-sm">Voice note</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Lock className="h-4 w-4" />
                    <span className="text-sm">
                      This reflection will be revealed {reflection.shareMode === 'weekly' ? 'on Sunday' : 'tomorrow'}
                    </span>
                    {reflection.userId === user?.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => revealReflection.mutate(reflection.id)}
                        className="ml-auto"
                      >
                        Reveal Now
                      </Button>
                    )}
                  </div>
                )}

                {/* Reactions */}
                {reflection.isRevealed && reflection.userId !== user?.id && (
                  <div className="mt-3 flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => addReaction.mutate({ reflectionId: reflection.id, reaction: '❤️' })}
                      className="gap-1"
                    >
                      <Heart className="h-4 w-4" />
                      Love
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => addReaction.mutate({ reflectionId: reflection.id, reaction: '🤗' })}
                      className="gap-1"
                    >
                      Hug
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => addReaction.mutate({ reflectionId: reflection.id, reaction: '💪' })}
                      className="gap-1"
                    >
                      Support
                    </Button>
                  </div>
                )}

                {reflection.partnerReaction && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    Your partner reacted: {reflection.partnerReaction}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    );
  };

  const renderInsights = () => {
    if (insightsLoading) {
      return (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    const insightsList = (insights?.insights || []) as ReflectionInsight[];

    if (insightsList.length === 0) {
      return (
        <Card className="text-center p-8">
          <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <CardTitle>Insights Coming Soon</CardTitle>
          <CardDescription className="mt-2">
            Share more reflections to unlock AI-powered insights about your relationship patterns.
          </CardDescription>
        </Card>
      );
    }

    return (
      <div className="space-y-4">
        {insightsList.map((insight) => (
          <Card key={insight.id} className="border-2 border-primary/10">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {insight.insightType === 'weekly' && <Calendar className="h-5 w-5 text-primary" />}
                  {insight.insightType === 'monthly' && <TrendingUp className="h-5 w-5 text-primary" />}
                  {insight.insightType === 'milestone' && <Award className="h-5 w-5 text-primary" />}
                  {insight.insightType === 'pattern' && <Zap className="h-5 w-5 text-primary" />}
                  <Badge variant="default">
                    {insight.insightType.charAt(0).toUpperCase() + insight.insightType.slice(1)} Insight
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  Connection Score
                  <Badge variant="secondary">
                    {Math.round(insight.connectionScore)}%
                  </Badge>
                </div>
              </div>
              <CardTitle className="mt-3">{insight.insightTitle}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-relaxed">{insight.insightContent}</p>
              
              {insight.strengths.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    Relationship Strengths
                  </h4>
                  <ul className="space-y-1">
                    {insight.strengths.map((strength, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <ChevronRight className="h-3 w-3 mt-0.5" />
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {insight.growthAreas.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Target className="h-4 w-4 text-blue-500" />
                    Growth Opportunities
                  </h4>
                  <ul className="space-y-1">
                    {insight.growthAreas.map((area, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <ChevronRight className="h-3 w-3 mt-0.5" />
                        {area}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {insight.actionItems.length > 0 && (
                <div className="pt-2 border-t">
                  <h4 className="font-medium mb-2">Try This Week:</h4>
                  <div className="space-y-2">
                    {insight.actionItems.map((action, i) => (
                      <div key={i} className="flex items-start gap-2 p-2 bg-primary/5 rounded-lg">
                        <div className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                          {i + 1}
                        </div>
                        <span className="text-sm">{action}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
        <AppHeader />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
        <AppHeader />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto text-center p-8">
            <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription className="mt-2">
              Please sign in to access Relationship Reflections
            </CardDescription>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <AppHeader />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Relationship Reflections</h1>
          <p className="text-muted-foreground">
            Share meaningful moments, thoughts, and experiences with your partner
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="respond" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Today
            </TabsTrigger>
            <TabsTrigger value="timeline" className="gap-2">
              <Clock className="h-4 w-4" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="insights" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Insights
            </TabsTrigger>
          </TabsList>

          <TabsContent value="respond" className="space-y-4">
            {promptLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              renderPromptCard()
            )}
          </TabsContent>

          <TabsContent value="timeline" className="space-y-4">
            {renderTimeline()}
          </TabsContent>

          <TabsContent value="insights" className="space-y-4">
            {renderInsights()}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}