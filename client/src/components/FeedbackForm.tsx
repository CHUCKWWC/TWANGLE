import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { MessageSquare, Gift, X } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface FeedbackFormProps {
  open: boolean;
  onClose: () => void;
}

export default function FeedbackForm({ open, onClose }: FeedbackFormProps) {
  const { toast } = useToast();
  const [feedbackType, setFeedbackType] = useState("general");
  const [category, setCategory] = useState("feature");
  const [description, setDescription] = useState("");
  const [rating, setRating] = useState<string>("");

  const { data: eligibility } = useQuery({
    queryKey: ["/api/user/eligibility"],
    enabled: open,
  });

  const submitFeedback = useMutation({
    mutationFn: async (data: {
      feedbackType: string;
      category: string;
      description: string;
      rating?: number;
    }) => {
      const res = await apiRequest("POST", "/api/feedback/general", data);
      return await res.json();
    },
    onSuccess: (data: any) => {
      if (data.lifetimeAccessGranted) {
        toast({
          title: "Lifetime Access Granted!",
          description:
            "Thank you for your feedback! As one of our first 100 users, you now have lifetime access to Twangle!",
          duration: 8000,
        });
      } else {
        toast({
          title: "Feedback Submitted",
          description: "Thank you for helping us improve Twangle!",
        });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/user/eligibility"] });
      setDescription("");
      setRating("");
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      toast({
        title: "Error",
        description: "Please provide feedback before submitting.",
        variant: "destructive",
      });
      return;
    }

    submitFeedback.mutate({
      feedbackType,
      category,
      description,
      rating: rating ? parseInt(rating) : undefined,
    });
  };

  const isEligible = eligibility?.isEligibleForLifetime;
  const usersRemaining = eligibility?.usersRemaining || 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              <DialogTitle>Share Your Feedback</DialogTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              data-testid="button-close-feedback"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <DialogDescription>
            Help us improve Twangle by sharing your thoughts and experiences
          </DialogDescription>
        </DialogHeader>

        {eligibility && isEligible && usersRemaining > 0 && (
          <Card className="p-4 bg-primary/5 border-primary/20">
            <div className="flex items-start gap-3">
              <Gift className="w-5 h-5 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-foreground mb-1">
                  Special Offer: Lifetime Access!
                </p>
                <p className="text-sm text-muted-foreground">
                  You're one of our first 100 users! Submit your feedback now to
                  unlock lifetime access to Twangle.{" "}
                  <span className="font-semibold text-primary">
                    Only {usersRemaining} spots remaining!
                  </span>
                </p>
              </div>
            </div>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="feedback-type">Feedback Type</Label>
              <Select
                value={feedbackType}
                onValueChange={setFeedbackType}
              >
                <SelectTrigger id="feedback-type" data-testid="select-feedback-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General Feedback</SelectItem>
                  <SelectItem value="bug">Bug Report</SelectItem>
                  <SelectItem value="suggestion">Feature Suggestion</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category" data-testid="select-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="feature">Feature</SelectItem>
                  <SelectItem value="usability">Usability</SelectItem>
                  <SelectItem value="performance">Performance</SelectItem>
                  <SelectItem value="content">Content</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Your Feedback</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell us what you think, what you'd like to see, or any issues you've encountered..."
                className="min-h-32 resize-none"
                data-testid="textarea-feedback"
              />
            </div>

            <div>
              <Label className="mb-3 block">How would you rate your experience?</Label>
              <RadioGroup value={rating} onValueChange={setRating}>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <div key={num} className="flex items-center space-x-2">
                      <RadioGroupItem
                        value={num.toString()}
                        id={`rating-${num}`}
                        data-testid={`rating-${num}`}
                      />
                      <Label
                        htmlFor={`rating-${num}`}
                        className="cursor-pointer text-sm"
                      >
                        {num}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              data-testid="button-cancel-feedback"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={submitFeedback.isPending || !description.trim()}
              data-testid="button-submit-feedback"
            >
              {submitFeedback.isPending ? "Submitting..." : "Submit Feedback"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
