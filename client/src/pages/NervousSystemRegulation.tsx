import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { SEO } from "@/components/SEO";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Brain, 
  Heart, 
  Wind, 
  Hand, 
  Eye, 
  Snowflake,
  Clock,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Sunrise,
  Moon,
  MessageCircle,
  Sparkles
} from "lucide-react";

interface RegulationTechnique {
  id: string;
  title: string;
  duration: string;
  icon: any;
  howTo: string;
  benefits: string[];
  color: string;
  bgColor: string;
}

const techniques: RegulationTechnique[] = [
  {
    id: "box-breathing",
    title: "Box Breathing",
    duration: "2-5 minutes",
    icon: Wind,
    howTo: "Breathe in for 4 counts, hold for 4, exhale for 4, hold for 4. Repeat this cycle.",
    benefits: [
      "Calms nervous system",
      "Reduces anxiety",
      "Improves focus"
    ],
    color: "text-blue-500",
    bgColor: "bg-blue-500/10"
  },
  {
    id: "progressive-relaxation",
    title: "Progressive Muscle Relaxation",
    duration: "10-15 minutes",
    icon: Hand,
    howTo: "Tense and release each muscle group from toes to head, one at a time. Hold tension for 5 seconds, then release.",
    benefits: [
      "Releases physical tension",
      "Increases body awareness",
      "Promotes deep relaxation"
    ],
    color: "text-purple-500",
    bgColor: "bg-purple-500/10"
  },
  {
    id: "grounding",
    title: "5-4-3-2-1 Grounding",
    duration: "3-5 minutes",
    icon: Eye,
    howTo: "Name 5 things you see, 4 things you hear, 3 things you touch, 2 things you smell, 1 thing you taste.",
    benefits: [
      "Brings you to present moment",
      "Reduces overwhelm",
      "Quick anxiety relief"
    ],
    color: "text-green-500",
    bgColor: "bg-green-500/10"
  },
  {
    id: "cold-water",
    title: "Cold Water Reset",
    duration: "30 seconds",
    icon: Snowflake,
    howTo: "Splash cold water on your face, wrists, or behind your neck to activate the vagus nerve.",
    benefits: [
      "Instant nervous system reset",
      "Reduces stress hormones",
      "Improves emotional regulation"
    ],
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10"
  }
];

const dailyPractices = [
  {
    time: "Morning",
    icon: Sunrise,
    practice: "5-minute breathing meditation",
    purpose: "Set a regulated tone for the day"
  },
  {
    time: "Before Difficult Conversations",
    icon: MessageCircle,
    practice: "Box breathing for 1 minute",
    purpose: "Enter discussion from a calm state"
  },
  {
    time: "When Triggered",
    icon: Sparkles,
    practice: "5-4-3-2-1 grounding technique",
    purpose: "Return to present moment awareness"
  },
  {
    time: "Evening",
    icon: Moon,
    practice: "Progressive muscle relaxation",
    purpose: "Release the day's tension and stress"
  }
];

export default function NervousSystemRegulation() {
  const [expandedTechnique, setExpandedTechnique] = useState<string | null>(null);

  const toggleTechnique = (id: string) => {
    setExpandedTechnique(expandedTechnique === id ? null : id);
  };

  return (
    <>
      <SEO 
        title="Nervous System Regulation for Relationships | Twangle"
        description="Learn evidence-based techniques to regulate your nervous system, build secure attachment, and create healthier relationships through breathing, grounding, and relaxation practices."
        keywords="nervous system regulation, vagus nerve, attachment theory, relationship wellness, breathing exercises, grounding techniques"
      />
      <AppHeader />
      
      <div className="min-h-screen bg-background pt-16">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Hero Section */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Brain className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-3">
              Understanding Nervous System Regulation
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Learn how nervous system regulation supports secure attachment and healthier relationships
            </p>
          </div>

          {/* Overview Card */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-500" />
                What is Nervous System Regulation?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Nervous system regulation is your body's ability to manage stress responses and return to a calm, balanced state. It's the foundation of emotional stability and healthy relationships.
              </p>
              
              <div className="grid md:grid-cols-2 gap-4 mt-6">
                <div className="p-4 rounded-lg bg-muted/50">
                  <h3 className="font-semibold mb-2">The Autonomic Nervous System</h3>
                  <p className="text-sm text-muted-foreground">
                    Your nervous system has two branches: sympathetic (fight-or-flight) and parasympathetic (rest-and-digest). Healthy relationships thrive when we can access the calm state.
                  </p>
                </div>
                
                <div className="p-4 rounded-lg bg-muted/50">
                  <h3 className="font-semibold mb-2">Vagus Nerve Activation</h3>
                  <p className="text-sm text-muted-foreground">
                    The vagus nerve promotes feelings of safety, connection, and calm - essential for secure attachment bonds.
                  </p>
                </div>
                
                <div className="p-4 rounded-lg bg-muted/50">
                  <h3 className="font-semibold mb-2">Window of Tolerance</h3>
                  <p className="text-sm text-muted-foreground">
                    Each person has a zone where they can handle stress without becoming overwhelmed. Regulation techniques help expand this window.
                  </p>
                </div>
                
                <div className="p-4 rounded-lg bg-muted/50">
                  <h3 className="font-semibold mb-2">Co-regulation</h3>
                  <p className="text-sm text-muted-foreground">
                    Partners can help regulate each other's nervous systems through calm presence, synchronized breathing, and consensual touch.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Regulation Techniques */}
          <div className="mb-8">
            <h2 className="text-2xl font-display font-bold mb-4">Regulation Techniques</h2>
            <div className="space-y-3">
              {techniques.map((technique) => {
                const Icon = technique.icon;
                const isExpanded = expandedTechnique === technique.id;
                
                return (
                  <Card key={technique.id} className="hover-elevate" data-testid={`technique-${technique.id}`}>
                    <CardHeader 
                      className="cursor-pointer"
                      onClick={() => toggleTechnique(technique.id)}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 flex-1">
                          <div className={`p-2 rounded-full ${technique.bgColor}`}>
                            <Icon className={`w-5 h-5 ${technique.color}`} />
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-lg font-display">{technique.title}</CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              <Clock className="w-3 h-3 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">{technique.duration}</span>
                            </div>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          data-testid={`button-toggle-${technique.id}`}
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5" />
                          ) : (
                            <ChevronDown className="w-5 h-5" />
                          )}
                        </Button>
                      </div>
                    </CardHeader>
                    
                    {isExpanded && (
                      <CardContent className="space-y-4">
                        <div>
                          <h4 className="font-semibold mb-2">How to do it:</h4>
                          <p className="text-muted-foreground">{technique.howTo}</p>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold mb-2">Benefits:</h4>
                          <ul className="space-y-1">
                            {technique.benefits.map((benefit, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                                <CheckCircle2 className={`w-4 h-4 mt-0.5 ${technique.color} flex-shrink-0`} />
                                <span>{benefit}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Benefits for Relationships */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="font-display">Benefits for Relationships</CardTitle>
              <CardDescription>
                How regulation strengthens your connection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-3 rounded-lg border">
                  <h4 className="font-semibold mb-1">Emotional Availability</h4>
                  <p className="text-sm text-muted-foreground">
                    Be more present and emotionally available to your partner
                  </p>
                </div>
                <div className="p-3 rounded-lg border">
                  <h4 className="font-semibold mb-1">Better Communication</h4>
                  <p className="text-sm text-muted-foreground">
                    Respond thoughtfully rather than react impulsively
                  </p>
                </div>
                <div className="p-3 rounded-lg border">
                  <h4 className="font-semibold mb-1">Increased Intimacy</h4>
                  <p className="text-sm text-muted-foreground">
                    Allow for deeper connection and vulnerability
                  </p>
                </div>
                <div className="p-3 rounded-lg border">
                  <h4 className="font-semibold mb-1">Conflict Resolution</h4>
                  <p className="text-sm text-muted-foreground">
                    Navigate disagreements skillfully from a calm state
                  </p>
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <h4 className="font-semibold mb-2">The Attachment Connection</h4>
                <p className="text-sm text-muted-foreground">
                  People with secure attachment naturally have better nervous system regulation. However, anyone can learn these skills. Regular practice can help shift your attachment style toward more secure patterns over time.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Daily Practice */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="font-display">Building Your Daily Practice</CardTitle>
              <CardDescription>
                Integrate regulation into your routine
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dailyPractices.map((practice, idx) => {
                  const Icon = practice.icon;
                  return (
                    <div 
                      key={idx} 
                      className="flex items-start gap-3 p-3 rounded-lg bg-muted/30"
                      data-testid={`practice-${idx}`}
                    >
                      <Icon className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">{practice.time}</span>
                          <Badge variant="secondary" className="text-xs">{practice.practice}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{practice.purpose}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <Separator className="my-6" />
              
              <div className="text-center">
                <h4 className="font-semibold mb-2">Start Small, Build Consistency</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Begin with just 2-3 minutes of breathing practice daily. Consistency matters more than duration.
                </p>
                
                <div className="inline-flex flex-col gap-2 text-left bg-muted/30 p-4 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Week 1-2</Badge>
                    <span className="text-sm">Focus on morning breathing practice</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Week 3-4</Badge>
                    <span className="text-sm">Add grounding when stressed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Week 5+</Badge>
                    <span className="text-sm">Include evening relaxation</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
