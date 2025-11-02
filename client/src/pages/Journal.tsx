import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Sparkles, Calendar, Heart, Smile, Meh, Frown, Lock, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";

interface JournalEntry {
  id: string;
  userId: string;
  entry: string;
  mood: string | null;
  tags: string[] | null;
  aiInsights: string[] | null;
  isPrivate: number;
  createdAt: Date;
}

const entrySchema = z.object({
  entry: z.string().min(10, "Entry must be at least 10 characters"),
  mood: z.string().optional(),
  generateInsights: z.boolean().default(true),
  isPrivate: z.number().default(1),
});

const MOOD_OPTIONS = [
  { value: "happy", label: "Happy", icon: Smile, color: "text-green-600" },
  { value: "content", label: "Content", icon: Smile, color: "text-blue-600" },
  { value: "neutral", label: "Neutral", icon: Meh, color: "text-gray-600" },
  { value: "stressed", label: "Stressed", icon: Frown, color: "text-yellow-600" },
  { value: "sad", label: "Sad", icon: Frown, color: "text-red-600" },
];

export default function Journal() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);

  const { data: entries, isLoading } = useQuery<JournalEntry[]>({
    queryKey: ['/api/journal'],
  });

  const form = useForm<z.infer<typeof entrySchema>>({
    resolver: zodResolver(entrySchema),
    defaultValues: {
      entry: "",
      mood: undefined,
      generateInsights: true,
      isPrivate: 1,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof entrySchema>) => {
      return await apiRequest('/api/journal', 'POST', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/journal'] });
      toast({
        title: "Entry Saved",
        description: "Your journal entry has been saved successfully.",
      });
      form.reset();
      setShowForm(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof entrySchema>) => {
    createMutation.mutate(data);
  };

  const getMoodIcon = (mood: string | null) => {
    if (!mood) return null;
    const moodOption = MOOD_OPTIONS.find(m => m.value === mood);
    if (!moodOption) return null;
    const Icon = moodOption.icon;
    return <Icon className={`h-4 w-4 ${moodOption.color}`} />;
  };

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Relationship Journal</h1>
          <p className="text-muted-foreground mt-1">
            Reflect on your relationship journey and gain AI-powered insights
          </p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} data-testid="button-new-entry">
            <BookOpen className="mr-2 h-4 w-4" />
            New Entry
          </Button>
        )}
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>New Journal Entry</CardTitle>
            <CardDescription>
              Share your thoughts and receive personalized insights
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="entry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Thoughts</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Write about your relationship, a recent interaction, or how you're feeling..."
                          className="min-h-[200px] resize-none"
                          data-testid="textarea-entry"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Be honest and reflective. This is a safe space for your thoughts.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="mood"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>How are you feeling?</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-mood">
                            <SelectValue placeholder="Select your mood" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {MOOD_OPTIONS.map((mood) => (
                            <SelectItem key={mood.value} value={mood.value}>
                              <div className="flex items-center gap-2">
                                <mood.icon className={`h-4 w-4 ${mood.color}`} />
                                {mood.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="generateInsights"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <FormLabel>Generate AI Insights</FormLabel>
                          <FormDescription>
                            Get personalized insights from our relationship coach
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-generate-insights"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isPrivate"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <FormLabel>Keep Private</FormLabel>
                          <FormDescription>
                            Don't share with your partner (if connected)
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={!!field.value}
                            onCheckedChange={(checked) => field.onChange(checked ? 1 : 0)}
                            data-testid="switch-is-private"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      form.reset();
                    }}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={createMutation.isPending}
                    data-testid="button-save-entry"
                  >
                    {createMutation.isPending ? (
                      <>
                        <Sparkles className="mr-2 h-4 w-4 animate-pulse" />
                        {form.watch('generateInsights') ? 'Saving & Analyzing...' : 'Saving...'}
                      </>
                    ) : (
                      <>
                        <BookOpen className="mr-2 h-4 w-4" />
                        Save Entry
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {!entries || entries.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No journal entries yet</h3>
            <p className="text-center text-muted-foreground mb-6 max-w-md">
              Start journaling to track your relationship journey, reflect on experiences,
              and receive personalized AI insights.
            </p>
            {!showForm && (
              <Button onClick={() => setShowForm(true)} data-testid="button-first-entry">
                <BookOpen className="mr-2 h-4 w-4" />
                Write Your First Entry
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <Card key={entry.id} data-testid={`entry-${entry.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {new Date(entry.createdAt).toLocaleDateString(undefined, {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {entry.mood && (
                      <Badge variant="secondary" className="gap-1">
                        {getMoodIcon(entry.mood)}
                        {entry.mood}
                      </Badge>
                    )}
                    {entry.isPrivate ? (
                      <Badge variant="outline" className="gap-1">
                        <Lock className="h-3 w-3" />
                        Private
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1">
                        <Eye className="h-3 w-3" />
                        Shared
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="whitespace-pre-wrap">{entry.entry}</p>
                </div>

                {entry.aiInsights && entry.aiInsights.length > 0 && (
                  <div className="border-t pt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">AI Insights</span>
                    </div>
                    <div className="space-y-2">
                      {entry.aiInsights.map((insight, index) => (
                        <div
                          key={index}
                          className="p-3 rounded-md bg-primary/5 border border-primary/10"
                          data-testid={`insight-${index}`}
                        >
                          <p className="text-sm">{insight}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
