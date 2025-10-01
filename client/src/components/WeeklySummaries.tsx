import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle2, FileText } from "lucide-react";
import { format } from "date-fns";
import type { WeeklySummary } from "@shared/schema";

export default function WeeklySummaries() {
  const { data, isLoading } = useQuery<{ summaries: WeeklySummary[] }>({
    queryKey: ["/api/summaries"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-48" />
            <div className="h-64 bg-muted rounded" />
            <div className="h-64 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  const summaries = data?.summaries || [];

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-semibold mb-3">
            Weekly Summaries
          </h1>
          <p className="text-muted-foreground text-lg">
            Review your coaching sessions and action items to work on together
          </p>
        </div>

        {summaries.length === 0 ? (
          <Card className="p-12">
            <div className="text-center">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-xl mb-2">No summaries yet</h3>
              <p className="text-muted-foreground">
                Start a conversation with Coach Charles and generate your first weekly summary
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-6">
            {summaries.map((summary) => (
              <Card key={summary.id} data-testid={`summary-${summary.id}`}>
                <CardHeader className="space-y-0 pb-4">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <CardTitle className="text-xl font-semibold">
                      Coaching Session Summary
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(summary.createdAt), "MMM dd, yyyy")}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      Summary
                    </h3>
                    <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                      {summary.summary}
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      Action Items for This Week
                    </h3>
                    <div className="space-y-3">
                      {summary.actionItems.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex gap-3 items-start"
                          data-testid={`action-item-${idx}`}
                        >
                          <Badge
                            variant="secondary"
                            className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center p-0"
                          >
                            {idx + 1}
                          </Badge>
                          <p className="text-foreground flex-1 leading-relaxed">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
