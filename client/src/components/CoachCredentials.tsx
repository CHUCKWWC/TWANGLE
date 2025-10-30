import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Award, Heart } from "lucide-react";

export function CoachCredentials() {
  return (
    <Card className="mb-6" data-testid="card-coach-credentials">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Heart className="w-8 h-8 text-primary" />
          </div>
          
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2" data-testid="text-coach-name">
              Coach Charles Watson
            </h3>
            
            <p className="text-sm text-muted-foreground mb-3" data-testid="text-coach-title">
              Certified Relationship Coach • Founder of Twangle
            </p>
            
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge variant="secondary" className="gap-1" data-testid="badge-gottman">
                <Award className="w-3 h-3" />
                Gottman Method
              </Badge>
              <Badge variant="secondary" className="gap-1" data-testid="badge-eft">
                <GraduationCap className="w-3 h-3" />
                EFT Certified
              </Badge>
              <Badge variant="secondary" className="gap-1" data-testid="badge-attachment">
                <GraduationCap className="w-3 h-3" />
                Attachment Theory Expert
              </Badge>
            </div>
            
            <p className="text-sm leading-relaxed" data-testid="text-coach-bio">
              Coach Charles specializes in helping couples strengthen their relationships through evidence-based therapeutic approaches. 
              With expertise in <strong>Gottman Method</strong>, <strong>Emotionally Focused Therapy (EFT)</strong>, and <strong>Attachment Theory</strong>, 
              he provides personalized guidance grounded in research to help you build deeper connection, improve communication, and create lasting positive change.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
