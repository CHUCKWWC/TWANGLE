import { useState } from "react";
import { MessageSquare } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface FeedbackButtonProps {
  userId?: string;
}

export function FeedbackButton({ userId }: FeedbackButtonProps) {
  const [open, setOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState("suggestion");
  const [category, setCategory] = useState("general");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!description.trim()) {
      toast({
        title: "Description required",
        description: "Please describe your feedback",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await apiRequest("POST", "/api/feedback/general", {
        userId,
        feedbackType,
        category,
        description: description.trim(),
      });

      await queryClient.invalidateQueries({ queryKey: ["/api/feedback/general"] });

      toast({
        title: "Feedback sent!",
        description: "Thank you for helping us improve Twangle",
      });

      setFeedbackType("suggestion");
      setCategory("general");
      setDescription("");
      setOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          data-testid="button-open-feedback"
        >
          <MessageSquare className="h-4 w-4" />
          Feedback
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" data-testid="dialog-general-feedback">
        <DialogHeader>
          <DialogTitle>Send Feedback</DialogTitle>
          <DialogDescription>
            Help us improve Twangle with your suggestions and reports
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="feedback-type" className="text-sm font-medium">
              Type
            </label>
            <Select value={feedbackType} onValueChange={setFeedbackType}>
              <SelectTrigger id="feedback-type" data-testid="select-feedback-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bug">Bug Report</SelectItem>
                <SelectItem value="feature">Feature Request</SelectItem>
                <SelectItem value="suggestion">Suggestion</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label htmlFor="category" className="text-sm font-medium">
              Category
            </label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category" data-testid="select-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="coach">Coach Charles</SelectItem>
                <SelectItem value="exercises">Exercises Library</SelectItem>
                <SelectItem value="retreat">Retreat Builder</SelectItem>
                <SelectItem value="summaries">Weekly Summaries</SelectItem>
                <SelectItem value="general">General App</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description
            </label>
            <Textarea
              id="description"
              placeholder="Describe your feedback..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[120px]"
              data-testid="input-feedback-description"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="flex-1"
            data-testid="button-cancel-feedback"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !description.trim()}
            className="flex-1"
            data-testid="button-send-feedback"
          >
            {isSubmitting ? "Sending..." : "Send"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
