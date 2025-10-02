import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import heroImage from "@assets/generated_images/Couple_holding_hands_intimately_6528230c.png";

interface WelcomeHeroProps {
  onStartAssessment: () => void;
  onJumpToCoach: () => void;
  onPlanRetreat?: () => void;
}

export default function WelcomeHero({ onStartAssessment, onJumpToCoach, onPlanRetreat }: WelcomeHeroProps) {
  return (
    <div className="relative w-full h-screen flex items-center justify-center overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-primary/40 via-primary/30 to-background/95" />
      
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Heart className="w-12 h-12 text-primary-foreground fill-primary-foreground" />
          <h1 className="font-display font-bold text-5xl md:text-7xl text-primary-foreground">
            Twangle
          </h1>
        </div>
        
        <p className="font-display text-xl md:text-2xl text-primary-foreground/90 mb-3">
          Two Tangled Together
        </p>
        
        <p className="text-lg md:text-xl text-primary-foreground/80 mb-12 max-w-2xl mx-auto">
          Discover your patterns. Build your bond.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button 
            size="lg" 
            className="text-lg px-8 py-6 bg-background/90 backdrop-blur-sm text-foreground border-2 border-background/40 hover:bg-background"
            onClick={onStartAssessment}
            data-testid="button-start-assessment"
          >
            Start Assessment
          </Button>
          
          {onPlanRetreat && (
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8 py-6 bg-background/20 backdrop-blur-md text-primary-foreground border-2 border-primary-foreground/30"
              onClick={onPlanRetreat}
              data-testid="button-plan-retreat"
            >
              Plan a Retreat
            </Button>
          )}
          
          <Button 
            size="lg" 
            variant="outline" 
            className="text-lg px-8 py-6 bg-background/20 backdrop-blur-md text-primary-foreground border-2 border-primary-foreground/30"
            onClick={onJumpToCoach}
            data-testid="button-jump-coach"
          >
            Talk to Coach
          </Button>
        </div>
        
        <p className="text-sm text-primary-foreground/70 mt-8">
          Join 10,000+ couples growing together
        </p>
      </div>
    </div>
  );
}
