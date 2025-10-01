import { useState } from "react";
import { Heart } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface RelationshipProgressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId?: string;
}

export function RelationshipProgressDialog({
  open,
  onOpenChange,
  userId,
}: RelationshipProgressDialogProps) {
  const [score, setScore] = useState(0);
  const [hoveredScore, setHoveredScore] = useState(0);
  const [improvementNotes, setImprovementNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const getStartOfWeek = () => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day;
    const startOfWeek = new Date(now.setDate(diff));
    startOfWeek.setHours(0, 0, 0, 0);
    return startOfWeek;
  };

  const handleSubmit = async () => {
    if (score === 0) {
      toast({
        title: "Rating required",
        description: "Please select how your relationship is doing",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await apiRequest("POST", "/api/feedback/progress", {
        userId,
        weekStartDate: getStartOfWeek().toISOString(),
        relationshipScore: score,
        improvementNotes: improvementNotes.trim() || null,
      });

      await queryClient.invalidateQueries({ queryKey: ["/api/feedback/progress"] });

      toast({
        title: "Progress tracked!",
        description: "Keep up the great work on your relationship",
      });

      setScore(0);
      setImprovementNotes("");
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save progress. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    setScore(0);
    setImprovementNotes("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="dialog-relationship-progress">
        <DialogHeader>
          <DialogTitle>How's your relationship this week?</DialogTitle>
          <DialogDescription>
            Tracking your progress helps us understand what's working
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex flex-col items-center gap-3">
            <p className="text-sm text-muted-foreground">Rate your relationship health</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setScore(num)}
                  onMouseEnter={() => setHoveredScore(num)}
                  onMouseLeave={() => setHoveredScore(0)}
                  className="transition-transform hover:scale-110 focus:outline-none"
                  data-testid={`button-heart-${num}`}
                >
                  <Heart
                    className={`h-8 w-8 ${
                      num <= (hoveredScore || score)
                        ? "fill-primary text-primary"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
            {score > 0 && (
              <p className="text-sm text-muted-foreground" data-testid="text-score-label">
                {score === 1 && "Struggling"}
                {score === 2 && "Needs work"}
                {score === 3 && "Okay"}
                {score === 4 && "Good"}
                {score === 5 && "Thriving"}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="improvements" className="text-sm font-medium">
              What improved this week? (optional)
            </label>
            <Textarea
              id="improvements"
              placeholder="Share any positive changes or things you're working on..."
              value={improvementNotes}
              onChange={(e) => setImprovementNotes(e.target.value)}
              className="min-h-[100px]"
              data-testid="input-improvement-notes"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleSkip}
            className="flex-1"
            data-testid="button-skip-progress"
          >
            Skip
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || score === 0}
            className="flex-1"
            data-testid="button-submit-progress"
          >
            {isSubmitting ? "Saving..." : "Save Progress"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
