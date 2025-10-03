import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { Shield, Heart, AlertCircle, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const ATTACHMENT_STYLES = {
  secure: {
    name: "Secure",
    color: "#10b981",
    icon: Shield,
    description: "Comfortable with intimacy and independence"
  },
  anxious: {
    name: "Anxious",
    color: "#f59e0b",
    icon: Heart,
    description: "Desires closeness, may worry about relationships"
  },
  avoidant: {
    name: "Avoidant",
    color: "#6366f1",
    icon: AlertCircle,
    description: "Values independence, may be uncomfortable with closeness"
  },
  fearful: {
    name: "Fearful-Avoidant",
    color: "#ef4444",
    icon: Users,
    description: "Desires closeness but fears vulnerability"
  }
};

export default function SharedAssessment() {
  const [, params] = useRoute("/shared/:token");
  const shareToken = params?.token;

  const { data: assessment, isLoading, error } = useQuery({
    queryKey: ['/api/shared', shareToken],
    queryFn: async () => {
      const res = await fetch(`/api/shared/${shareToken}`);
      if (!res.ok) {
        throw new Error('Assessment not found or not shared');
      }
      return res.json();
    },
    enabled: !!shareToken,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900 p-4">
        <div className="max-w-4xl mx-auto space-y-6 py-8">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-destructive">Assessment Not Found</CardTitle>
            <CardDescription>
              This assessment link may be invalid or the sharing has been disabled.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const result = assessment.result;
  const primaryStyle = ATTACHMENT_STYLES[result.primaryStyle as keyof typeof ATTACHMENT_STYLES];
  const Icon = primaryStyle.icon;

  const pieData = Object.entries(result.stylePercentages).map(([style, percentage]) => ({
    name: ATTACHMENT_STYLES[style as keyof typeof ATTACHMENT_STYLES].name,
    value: percentage as number,
    color: ATTACHMENT_STYLES[style as keyof typeof ATTACHMENT_STYLES].color,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900 p-4">
      <div className="max-w-4xl mx-auto space-y-6 py-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-primary" data-testid="text-shared-title">
            Shared Attachment Assessment
          </h1>
          <p className="text-muted-foreground">
            Someone has shared their attachment style results with you
          </p>
        </div>

        <Card data-testid="card-primary-style">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-primary/10">
                <Icon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle data-testid="text-primary-style">Primary Style: {primaryStyle.name}</CardTitle>
                <CardDescription>{primaryStyle.description}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-foreground/90" data-testid="text-style-description">
              {result.description}
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-distribution">
          <CardHeader>
            <CardTitle>Attachment Style Distribution</CardTitle>
            <CardDescription>
              Your results across all four attachment patterns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {result.strengths && result.strengths.length > 0 && (
          <Card data-testid="card-strengths">
            <CardHeader>
              <CardTitle className="text-green-600 dark:text-green-400">Key Strengths</CardTitle>
              <CardDescription>
                Positive patterns identified in relationship style
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {result.strengths.map((strength: string, index: number) => (
                  <li key={index} className="flex items-start gap-2" data-testid={`text-strength-${index}`}>
                    <span className="text-green-600 dark:text-green-400 mt-1">✓</span>
                    <span className="text-foreground/90">{strength}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {result.growthAreas && result.growthAreas.length > 0 && (
          <Card data-testid="card-growth-areas">
            <CardHeader>
              <CardTitle className="text-amber-600 dark:text-amber-400">Growth Opportunities</CardTitle>
              <CardDescription>
                Areas for potential development
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {result.growthAreas.map((area: string, index: number) => (
                  <li key={index} className="flex items-start gap-2" data-testid={`text-growth-${index}`}>
                    <span className="text-amber-600 dark:text-amber-400 mt-1">→</span>
                    <span className="text-foreground/90">{area}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {result.analysis && (
          <Card data-testid="card-analysis">
            <CardHeader>
              <CardTitle>Personalized Analysis</CardTitle>
              <CardDescription>
                In-depth insights about this attachment style
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/90 whitespace-pre-line" data-testid="text-analysis">
                {result.analysis}
              </p>
            </CardContent>
          </Card>
        )}

        <div className="text-center text-sm text-muted-foreground pt-4">
          <p>Want to understand your own attachment style?</p>
          <p className="mt-1">
            Visit <a href="/" className="text-primary hover:underline" data-testid="link-home">Twangle</a> to take your own assessment
          </p>
        </div>
      </div>
    </div>
  );
}
