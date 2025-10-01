import { useState } from "react";
import { Star } from "lucide-react";
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

interface SessionFeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId?: string;
  userId?: string;
}

export function SessionFeedbackDialog({
  open,
  onOpenChange,
  sessionId,
  userId,
}: SessionFeedbackDialogProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: "Rating required",
        description: "Please select a rating before submitting",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await apiRequest("POST", "/api/feedback/session", {
        sessionId,
        userId,
        rating,
        feedbackText: feedbackText.trim() || null,
      });

      await queryClient.invalidateQueries({ queryKey: ["/api/feedback/session"] });

      toast({
        title: "Thank you!",
        description: "Your feedback helps us improve Coach Charles",
      });

      setRating(0);
      setFeedbackText("");
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    setRating(0);
    setFeedbackText("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="dialog-session-feedback">
        <DialogHeader>
          <DialogTitle>How was your session?</DialogTitle>
          <DialogDescription>
            Your feedback helps us make Coach Charles more helpful for you
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex flex-col items-center gap-3">
            <p className="text-sm text-muted-foreground">Rate this session</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110 focus:outline-none"
                  data-testid={`button-star-${star}`}
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= (hoveredRating || rating)
                        ? "fill-primary text-primary"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-sm text-muted-foreground" data-testid="text-rating-label">
                {rating === 1 && "Not helpful"}
                {rating === 2 && "Somewhat helpful"}
                {rating === 3 && "Helpful"}
                {rating === 4 && "Very helpful"}
                {rating === 5 && "Extremely helpful"}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="feedback" className="text-sm font-medium">
              Additional feedback (optional)
            </label>
            <Textarea
              id="feedback"
              placeholder="What did you find most helpful? What could be better?"
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              className="min-h-[100px]"
              data-testid="input-feedback-text"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleSkip}
            className="flex-1"
            data-testid="button-skip-feedback"
          >
            Skip
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || rating === 0}
            className="flex-1"
            data-testid="button-submit-feedback"
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
