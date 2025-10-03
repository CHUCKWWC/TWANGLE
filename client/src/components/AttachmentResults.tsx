import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, AlertTriangle, MessageCircle, Calendar, BookOpen, Share2, Sparkles, TrendingUp, Check } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { AttachmentStyleResult } from "@shared/schema";

export interface AttachmentScore {
  secure: number;
  anxious: number;
  avoidant: number;
  fearful: number;
}

export interface AttachmentResultsProps {
  scores: AttachmentScore;
  hasRedFlags: boolean;
  result?: AttachmentStyleResult;
  assessmentId?: string;
  onTalkToCoach: () => void;
  onPlanRetreat: () => void;
  onViewExercises: () => void;
}

const COLORS = {
  secure: 'hsl(var(--chart-3))',
  anxious: 'hsl(var(--chart-2))',
  avoidant: 'hsl(var(--chart-4))',
  fearful: 'hsl(var(--chart-5))',
};

const DESCRIPTIONS = {
  secure: 'You feel comfortable with intimacy and independence. You can balance closeness with autonomy.',
  anxious: 'You may seek high levels of intimacy and approval, sometimes worrying about your relationship.',
  avoidant: 'You value independence and may feel uncomfortable with too much closeness or emotional expression.',
  fearful: 'You desire closeness but also fear getting hurt, leading to conflicting feelings about relationships.',
};

export default function AttachmentResults({
  scores,
  hasRedFlags,
  result,
  assessmentId,
  onTalkToCoach,
  onPlanRetreat,
  onViewExercises,
}: AttachmentResultsProps) {
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const data = [
    { name: 'Secure', value: scores.secure, color: COLORS.secure },
    { name: 'Anxious', value: scores.anxious, color: COLORS.anxious },
    { name: 'Avoidant', value: scores.avoidant, color: COLORS.avoidant },
    { name: 'Fearful', value: scores.fearful, color: COLORS.fearful },
  ].filter(item => item.value > 0);

  const dominant = Object.entries(scores).reduce((a, b) => 
    scores[a[0] as keyof AttachmentScore] > scores[b[0] as keyof AttachmentScore] ? a : b
  )[0] as keyof AttachmentScore;

  const handleShare = async () => {
    if (!assessmentId) {
      toast({
        title: "Sharing unavailable",
        description: "This assessment cannot be shared at this time.",
        variant: "destructive",
      });
      return;
    }

    setIsSharing(true);
    try {
      const response = await apiRequest("POST", `/api/assessments/${assessmentId}/share`, {});
      const data = await response.json();
      setShareUrl(data.shareUrl);
      
      toast({
        title: "Sharing enabled!",
        description: "Your results can now be shared with others.",
      });
    } catch (error: any) {
      console.error("Sharing error:", error);
      toast({
        title: "Sharing failed",
        description: "We couldn't enable sharing. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Share URL has been copied to your clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Please manually copy the link.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Heart className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-display text-4xl md:text-5xl text-foreground mb-4">
            Your Attachment Profile
          </h1>
          <p className="text-lg text-muted-foreground">
            Understanding your patterns is the first step to growth
          </p>
        </div>

        {hasRedFlags && (
          <Card className="p-6 mb-8 border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
            <div className="flex gap-4">
              <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-display font-semibold text-amber-900 dark:text-amber-200 mb-2">
                  Important Observations
                </h3>
                <p className="text-amber-800 dark:text-amber-300 text-sm">
                  Your assessment indicates some patterns that may benefit from professional support. 
                  Consider speaking with a licensed therapist for deeper exploration.
                </p>
              </div>
            </div>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <Card className="p-8">
            <h2 className="font-display text-xl font-semibold mb-6">
              Attachment Style Distribution
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-8">
            <h2 className="font-display text-xl font-semibold mb-6">
              Your Primary Style
            </h2>
            <Badge className="mb-4 text-base px-4 py-2" style={{ backgroundColor: COLORS[dominant] }}>
              {dominant.charAt(0).toUpperCase() + dominant.slice(1)} Attachment
            </Badge>
            <p className="text-muted-foreground leading-relaxed mb-6">
              {result?.description || DESCRIPTIONS[dominant]}
            </p>
            <div className="space-y-3">
              {Object.entries(scores).map(([style, score]) => (
                <div key={style}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="capitalize">{style}</span>
                    <span className="text-muted-foreground">{score}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${score}%`,
                        backgroundColor: COLORS[style as keyof AttachmentScore],
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {result && (
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <Card className="p-8">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-primary" />
                <h2 className="font-display text-xl font-semibold">Your Strengths</h2>
              </div>
              <ul className="space-y-3">
                {result.strengths.map((strength, index) => (
                  <li key={index} className="flex gap-3">
                    <span className="text-primary mt-1">•</span>
                    <span className="text-muted-foreground">{strength}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="p-8">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-primary" />
                <h2 className="font-display text-xl font-semibold">Growth Areas</h2>
              </div>
              <ul className="space-y-3">
                {result.growthAreas.map((area, index) => (
                  <li key={index} className="flex gap-3">
                    <span className="text-primary mt-1">•</span>
                    <span className="text-muted-foreground">{area}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        )}

        {result && (
          <Card className="p-8 mb-8">
            <h2 className="font-display text-xl font-semibold mb-4">Personalized Analysis</h2>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {result.analysis}
            </p>
          </Card>
        )}

        {assessmentId && (
          <Card className="p-6 mb-8 border-primary/20 bg-primary/5">
            <div className="flex items-start gap-4">
              <Share2 className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-display font-semibold mb-2">Share Your Results</h3>
                {!shareUrl ? (
                  <>
                    <p className="text-sm text-muted-foreground mb-4">
                      Want to share your attachment profile with your partner or therapist? Generate a shareable link.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleShare}
                      disabled={isSharing}
                      data-testid="button-enable-sharing"
                    >
                      {isSharing ? "Generating..." : "Generate Share Link"}
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground mb-3">
                      Your results are now shareable. Anyone with this link can view your attachment profile.
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={shareUrl}
                        readOnly
                        className="flex-1 px-3 py-2 text-sm bg-background border border-border rounded-md"
                        data-testid="input-share-url"
                      />
                      <Button
                        size="sm"
                        onClick={handleCopyLink}
                        data-testid="button-copy-link"
                      >
                        {copied ? <Check className="w-4 h-4" /> : "Copy"}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </Card>
        )}

        <div className="grid md:grid-cols-3 gap-4">
          <Button
            size="lg"
            className="w-full text-lg py-6"
            onClick={onTalkToCoach}
            data-testid="button-talk-coach"
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            AI Coach
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="w-full text-lg py-6"
            onClick={onViewExercises}
            data-testid="button-view-exercises"
          >
            <BookOpen className="w-5 h-5 mr-2" />
            Exercises
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="w-full text-lg py-6"
            onClick={onPlanRetreat}
            data-testid="button-plan-retreat"
          >
            <Calendar className="w-5 h-5 mr-2" />
            Retreat
          </Button>
        </div>
      </div>
    </div>
  );
}
