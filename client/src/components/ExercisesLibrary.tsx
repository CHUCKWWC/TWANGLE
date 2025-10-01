import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Heart, MessageCircle, Users, Clock, CheckCircle } from "lucide-react";
import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface Exercise {
  id: string;
  title: string;
  category: 'communication' | 'attachment' | 'intimacy' | 'conflict';
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  researchBasis: string;
  description: string;
  steps: string[];
  benefits: string[];
}

const EXERCISES: Exercise[] = [
  {
    id: '1',
    title: 'Love Maps (Gottman Method)',
    category: 'intimacy',
    duration: '20-30 min',
    difficulty: 'beginner',
    researchBasis: 'Dr. John Gottman\'s research on marital stability',
    description: 'Build detailed knowledge of your partner\'s inner world, dreams, and daily experiences.',
    steps: [
      'Set aside uninterrupted time together in a comfortable space',
      'Take turns asking each other questions about dreams, stressors, and joys',
      'Listen actively without judgment or trying to fix',
      'Example questions: "What are your current worries?" "What are you most excited about?"',
      'Share one thing you learned about your partner',
    ],
    benefits: [
      'Increases emotional intimacy',
      'Builds friendship and fondness',
      'Helps partners feel known and understood',
      'Predicts relationship satisfaction',
    ],
  },
  {
    id: '2',
    title: 'Turn Toward Bids',
    category: 'communication',
    duration: '15-20 min',
    difficulty: 'beginner',
    researchBasis: 'Gottman\'s research on emotional connection',
    description: 'Practice recognizing and responding to your partner\'s bids for attention, affection, or support.',
    steps: [
      'Discuss what "bids" are: small moments when one partner reaches out',
      'Reflect on recent bids you made (sharing news, asking for help, seeking affection)',
      'Share how you felt when your bid was met or ignored',
      'Commit to "turning toward" at least 3 bids tomorrow',
      'Practice: One person makes a bid, the other responds enthusiastically',
    ],
    benefits: [
      'Strengthens emotional connection',
      'Builds trust and safety',
      'Prevents resentment buildup',
      'Increases relationship satisfaction',
    ],
  },
  {
    id: '3',
    title: 'Hold Me Tight Conversation (EFT)',
    category: 'attachment',
    duration: '30-45 min',
    difficulty: 'intermediate',
    researchBasis: 'Dr. Sue Johnson\'s Emotionally Focused Therapy',
    description: 'Address attachment fears and create secure emotional bonding through structured dialogue.',
    steps: [
      'Partner A shares a recent moment when they felt disconnected',
      'Partner A identifies the deeper fear beneath the reaction (abandonment, inadequacy)',
      'Partner B listens and reflects back what they heard',
      'Partner B shares how hearing this impacts them emotionally',
      'Both partners express a core attachment need: "I need to know..."',
      'Switch roles and repeat',
    ],
    benefits: [
      'Moves toward secure attachment',
      'Reduces anxiety and avoidance',
      'Creates emotional safety',
      'Deepens vulnerability and trust',
    ],
  },
  {
    id: '4',
    title: 'Softened Startup (Conflict)',
    category: 'conflict',
    duration: '10-15 min',
    difficulty: 'beginner',
    researchBasis: 'Gottman Method conflict resolution',
    description: 'Learn to bring up issues gently without blame, using "I feel" statements.',
    steps: [
      'Identify a small issue you want to address (not a major conflict)',
      'Use the formula: "I feel [emotion] about [situation] and I need [request]"',
      'Example: "I feel worried when plans change last-minute, and I need advance notice when possible"',
      'Partner listens and asks clarifying questions',
      'Partner responds with understanding, not defensiveness',
      'Agree on one small action to address the need',
    ],
    benefits: [
      'Reduces defensiveness',
      'Increases constructive conflict',
      'Prevents escalation',
      'Builds problem-solving skills',
    ],
  },
  {
    id: '5',
    title: 'Active Listening Practice',
    category: 'communication',
    duration: '20 min',
    difficulty: 'beginner',
    researchBasis: 'Carl Rogers\' person-centered therapy',
    description: 'Practice deep listening without interrupting, judging, or problem-solving.',
    steps: [
      'Set a timer for 5 minutes. Partner A shares about their day/feelings',
      'Partner B listens without interrupting, maintains eye contact',
      'When timer ends, Partner B reflects back key points: "I heard you say..."',
      'Partner A confirms or clarifies: "Yes, and I also meant..."',
      'Switch roles for 5 minutes',
      'Discuss: How did it feel to be truly heard?',
    ],
    benefits: [
      'Improves understanding',
      'Reduces misunderstandings',
      'Validates emotions',
      'Builds empathy',
    ],
  },
  {
    id: '6',
    title: 'Appreciation Exchange',
    category: 'intimacy',
    duration: '10 min',
    difficulty: 'beginner',
    researchBasis: 'Positive Psychology research on gratitude',
    description: 'Express specific, genuine appreciation for your partner daily.',
    steps: [
      'Each day, share one specific thing you appreciate about your partner',
      'Make it concrete: "I appreciate that you made coffee this morning"',
      'Include why it matters: "...because it showed you were thinking of me"',
      'Avoid generic compliments; focus on recent actions',
      'Receive appreciation graciously with "Thank you" (not deflecting)',
    ],
    benefits: [
      'Increases positive interactions',
      'Builds fondness and admiration',
      'Counteracts negativity bias',
      'Strengthens emotional bond',
    ],
  },
  {
    id: '7',
    title: 'Attachment Injury Healing',
    category: 'attachment',
    duration: '45-60 min',
    difficulty: 'advanced',
    researchBasis: 'EFT research on attachment wounds',
    description: 'Address past hurts that created attachment insecurity in the relationship.',
    steps: [
      'Partner A describes a specific incident that felt like betrayal or abandonment',
      'Partner A shares the impact: "When that happened, I felt..."',
      'Partner B validates without defending: "I can see how painful that was"',
      'Partner B takes responsibility for their part',
      'Partner B offers reassurance about current commitment',
      'Both partners identify what\'s needed for healing',
    ],
    benefits: [
      'Heals old wounds',
      'Rebuilds trust',
      'Increases secure attachment',
      'Prevents recurring triggers',
    ],
  },
  {
    id: '8',
    title: 'Dreams Within Conflict',
    category: 'conflict',
    duration: '30-40 min',
    difficulty: 'intermediate',
    researchBasis: 'Gottman Method on perpetual problems',
    description: 'Explore the deeper dreams and values underlying recurring conflicts.',
    steps: [
      'Choose a recurring disagreement (money, time, household tasks)',
      'Each partner shares the dream behind their position',
      'Example: "My need for saving relates to my dream of security and freedom"',
      'Listen for understanding, not agreement',
      'Find the place where both dreams overlap or can coexist',
      'Create a temporary compromise that honors both dreams',
    ],
    benefits: [
      'Resolves gridlock',
      'Increases understanding',
      'Validates both perspectives',
      'Creates win-win solutions',
    ],
  },
  {
    id: '9',
    title: 'Emotional Temperature Check',
    category: 'communication',
    duration: '5-10 min',
    difficulty: 'beginner',
    researchBasis: 'Emotion regulation research',
    description: 'Daily emotional check-in to stay connected and prevent disconnection.',
    steps: [
      'Set a regular time each day (morning coffee, before bed)',
      'Each partner rates their emotional state on a scale of 1-10',
      'Share one high and one low from the day',
      'Partner responds with empathy: "That sounds [emotion]"',
      'Ask: "What do you need from me right now?"',
      'Keep it brief—this is connection, not problem-solving',
    ],
    benefits: [
      'Maintains daily connection',
      'Prevents emotional distance',
      'Identifies needs early',
      'Builds emotional attunement',
    ],
  },
];

const CATEGORY_INFO = {
  communication: { icon: MessageCircle, color: 'bg-blue-500', label: 'Communication' },
  attachment: { icon: Heart, color: 'bg-rose-500', label: 'Attachment' },
  intimacy: { icon: Users, color: 'bg-purple-500', label: 'Intimacy' },
  conflict: { icon: BookOpen, color: 'bg-amber-500', label: 'Conflict' },
};

export default function ExercisesLibrary() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());

  const filteredExercises = selectedCategory
    ? EXERCISES.filter(ex => ex.category === selectedCategory)
    : EXERCISES;

  const toggleComplete = (id: string) => {
    setCompletedExercises(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  return (
    <div className="min-h-screen bg-background p-4 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl text-foreground mb-2">
            Science-Based Exercises
          </h1>
          <p className="text-muted-foreground">
            Research-backed activities to strengthen your relationship
          </p>
        </div>

        <div className="flex flex-wrap gap-3 mb-8">
          <Button
            variant={selectedCategory === null ? 'default' : 'outline'}
            onClick={() => setSelectedCategory(null)}
            data-testid="filter-all"
          >
            All Exercises
          </Button>
          {Object.entries(CATEGORY_INFO).map(([key, info]) => {
            const Icon = info.icon;
            return (
              <Button
                key={key}
                variant={selectedCategory === key ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(key)}
                data-testid={`filter-${key}`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {info.label}
              </Button>
            );
          })}
        </div>

        <div className="space-y-4">
          {filteredExercises.map((exercise) => {
            const categoryInfo = CATEGORY_INFO[exercise.category];
            const Icon = categoryInfo.icon;
            const isCompleted = completedExercises.has(exercise.id);

            return (
              <Card key={exercise.id} className="overflow-hidden">
                <Accordion type="single" collapsible>
                  <AccordionItem value={exercise.id} className="border-none">
                    <AccordionTrigger className="px-6 py-4 hover:no-underline hover-elevate">
                      <div className="flex items-start gap-4 flex-1 text-left">
                        <div className={`w-10 h-10 rounded-lg ${categoryInfo.color} flex items-center justify-center flex-shrink-0`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-display font-semibold text-lg">
                              {exercise.title}
                            </h3>
                            {isCompleted && (
                              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {exercise.description}
                          </p>
                          <div className="flex gap-2 flex-wrap">
                            <Badge variant="outline" className="text-xs">
                              <Clock className="w-3 h-3 mr-1" />
                              {exercise.duration}
                            </Badge>
                            <Badge variant="outline" className="text-xs capitalize">
                              {exercise.difficulty}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {categoryInfo.label}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-6">
                      <div className="space-y-6 pt-4">
                        <div className="bg-accent/50 rounded-lg p-4">
                          <p className="text-sm font-medium mb-1">Research Basis</p>
                          <p className="text-sm text-muted-foreground">
                            {exercise.researchBasis}
                          </p>
                        </div>

                        <div>
                          <h4 className="font-semibold mb-3">Steps</h4>
                          <ol className="space-y-3">
                            {exercise.steps.map((step, idx) => (
                              <li key={idx} className="flex gap-3">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-sm flex items-center justify-center font-medium">
                                  {idx + 1}
                                </span>
                                <span className="text-sm leading-relaxed flex-1">{step}</span>
                              </li>
                            ))}
                          </ol>
                        </div>

                        <div>
                          <h4 className="font-semibold mb-3">Benefits</h4>
                          <ul className="grid md:grid-cols-2 gap-2">
                            {exercise.benefits.map((benefit, idx) => (
                              <li key={idx} className="flex gap-2 text-sm">
                                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                                <span>{benefit}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="flex gap-3 pt-4">
                          <Button
                            onClick={() => toggleComplete(exercise.id)}
                            variant={isCompleted ? 'outline' : 'default'}
                            data-testid={`button-complete-${exercise.id}`}
                          >
                            {isCompleted ? 'Mark Incomplete' : 'Mark as Completed'}
                          </Button>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </Card>
            );
          })}
        </div>

        {filteredExercises.length === 0 && (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">No exercises found in this category.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
