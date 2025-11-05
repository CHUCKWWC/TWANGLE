import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Brain, Lock, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Sample questions from the actual assessment
const SAMPLE_QUESTIONS = [
  {
    id: "preview-1",
    text: "When I'm stressed, I tend to distance myself from my partner rather than seeking support.",
    category: "Avoidant"
  },
  {
    id: "preview-2",
    text: "I often worry that my partner doesn't really love me or will leave me.",
    category: "Anxious"
  },
  {
    id: "preview-3",
    text: "I find it easy to be close to my partner and feel comfortable depending on them.",
    category: "Secure"
  }
];

const OPTIONS = [
  { value: "1", label: "Strongly Disagree" },
  { value: "2", label: "Disagree" },
  { value: "3", label: "Neutral" },
  { value: "4", label: "Agree" },
  { value: "5", label: "Strongly Agree" },
];

export function AssessmentPreview() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const handleAnswer = (value: string) => {
    const questionId = SAMPLE_QUESTIONS[currentQuestion].id;
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleNext = () => {
    if (currentQuestion < SAMPLE_QUESTIONS.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const currentAnswer = answers[SAMPLE_QUESTIONS[currentQuestion].id];
  const isLastQuestion = currentQuestion === SAMPLE_QUESTIONS.length - 1;

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Brain className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Attachment Style Preview</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Sample question {currentQuestion + 1} of {SAMPLE_QUESTIONS.length}
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="gap-1">
            <Lock className="w-3 h-3" />
            Preview
          </Badge>
        </div>
        
        <div className="w-full bg-secondary rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentQuestion + 1) / SAMPLE_QUESTIONS.length) * 100}%` }}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
          <p className="text-lg leading-relaxed">
            {SAMPLE_QUESTIONS[currentQuestion].text}
          </p>
        </div>

        <RadioGroup 
          value={currentAnswer || ""} 
          onValueChange={handleAnswer}
          className="space-y-3"
        >
          {OPTIONS.map((option) => (
            <div 
              key={option.value} 
              className="flex items-center space-x-3 p-3 rounded-lg hover-elevate border border-border"
            >
              <RadioGroupItem 
                value={option.value} 
                id={`preview-${currentQuestion}-${option.value}`}
                data-testid={`radio-option-${option.value}`}
              />
              <Label 
                htmlFor={`preview-${currentQuestion}-${option.value}`}
                className="flex-1 cursor-pointer"
              >
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>

        <div className="flex justify-between gap-4 pt-4">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            data-testid="button-previous"
          >
            Previous
          </Button>

          {!isLastQuestion ? (
            <Button
              onClick={handleNext}
              disabled={!currentAnswer}
              data-testid="button-next"
            >
              Next Question
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              asChild
              data-testid="button-complete-assessment"
            >
              <a href="/api/signup">
                Sign Up to Complete Full Assessment
              </a>
            </Button>
          )}
        </div>

        <div className="bg-muted rounded-lg p-4 text-center">
          <p className="text-sm text-muted-foreground mb-2">
            This is a preview with {SAMPLE_QUESTIONS.length} sample questions
          </p>
          <p className="text-sm font-medium">
            The full assessment has 20 research-backed questions with personalized AI analysis
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
