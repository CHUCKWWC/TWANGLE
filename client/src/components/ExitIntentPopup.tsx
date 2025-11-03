import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Heart, X } from "lucide-react";

interface ExitIntentPopupProps {
  onClose?: () => void;
}

export function ExitIntentPopup({ onClose }: ExitIntentPopupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasShown, setHasShown] = useState(false);

  useEffect(() => {
    // Don't show if already shown in this session
    if (hasShown) return;

    const handleMouseLeave = (e: MouseEvent) => {
      // Only trigger if mouse is leaving from the top (going to browser chrome/tabs)
      if (e.clientY <= 0 && !hasShown) {
        setIsOpen(true);
        setHasShown(true);
      }
    };

    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [hasShown]);

  const handleClose = () => {
    setIsOpen(false);
    onClose?.();
  };

  const handleStartQuiz = () => {
    window.location.href = "/assessment";
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg" data-testid="exit-intent-popup">
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          data-testid="button-close-exit-popup"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
        
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Heart className="w-8 h-8 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">
            Wait! Before you go...
          </DialogTitle>
          <DialogDescription className="text-center pt-4 space-y-4">
            <p className="text-base">
              Take our free 2-minute attachment quiz to discover your relationship patterns.
            </p>
            <ul className="text-left space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span>Understand your attachment style instantly</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span>Get personalized insights based on research</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span>No credit card required, completely free</span>
              </li>
            </ul>
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-3 mt-6">
          <Button 
            onClick={handleStartQuiz}
            size="lg"
            className="w-full"
            data-testid="button-start-quiz"
          >
            Start Free Quiz
          </Button>
          <Button 
            onClick={handleClose}
            variant="ghost"
            size="lg"
            className="w-full"
            data-testid="button-no-thanks"
          >
            No thanks
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
