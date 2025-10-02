import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import FeedbackForm from "./FeedbackForm";

interface FeedbackButtonProps {
  userId?: string;
}

export function FeedbackButton({ userId }: FeedbackButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => setOpen(true)}
        data-testid="button-open-feedback"
      >
        <MessageSquare className="h-4 w-4" />
        Feedback
      </Button>
      <FeedbackForm open={open} onClose={() => setOpen(false)} />
    </>
  );
}
