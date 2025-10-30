import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { createLoginUrl } from "@/lib/redirectUtils";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  destination: string;
  isPremium?: boolean;
  testId?: string;
}

export function FeatureCard({ 
  icon: Icon, 
  title, 
  description, 
  destination, 
  isPremium = false,
  testId 
}: FeatureCardProps) {
  const { user } = useAuth();
  const isAnonymous = (user as any)?.isAnonymous;
  
  const handleClick = (e: React.MouseEvent) => {
    // If user is authenticated OR feature is free, let them navigate directly
    if (!isAnonymous || !isPremium) {
      return;
    }
    
    // If anonymous AND premium feature, redirect to login with returnTo parameter
    e.preventDefault();
    window.location.href = createLoginUrl(destination);
  };
  
  return (
    <a 
      href={destination}
      onClick={handleClick}
      className="block"
      data-testid={testId}
    >
      <Card className="hover-elevate cursor-pointer h-full">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Icon className="w-6 h-6 text-primary" />
            </div>
            <Badge 
              variant={isPremium ? "default" : "secondary"} 
              className="text-xs"
            >
              {isPremium ? "PREMIUM" : "FREE"}
            </Badge>
          </div>
          <h3 className="text-xl font-semibold mb-3 font-[Poppins]">{title}</h3>
          <p className="text-muted-foreground">
            {description}
          </p>
        </CardContent>
      </Card>
    </a>
  );
}
