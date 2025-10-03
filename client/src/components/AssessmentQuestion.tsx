import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft } from "lucide-react";

export interface QuestionOption {
  id: string;
  text: string;
  value: string;
}

export interface Question {
  id: string;
  text: string;
  options: QuestionOption[];
}

interface AssessmentQuestionProps {
  question: Question;
  currentQuestion: number;
  totalQuestions: number;
  selectedOption: string | null;
  onSelectOption: (optionId: string) => void;
  onNext: () => void;
  onBack: () => void;
  canGoBack: boolean;
}

export default function AssessmentQuestion({
  question,
  currentQuestion,
  totalQuestions,
  selectedOption,
  onSelectOption,
  onNext,
  onBack,
  canGoBack,
}: AssessmentQuestionProps) {
  const progress = (currentQuestion / totalQuestions) * 100;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-muted-foreground">
              Question {currentQuestion} of {totalQuestions}
            </p>
            {canGoBack && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                data-testid="button-back"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            )}
          </div>
          <Progress value={progress} className="h-2" data-testid="progress-assessment" />
        </div>

        <Card className="p-8 mb-6">
          <h2 className="font-display text-2xl md:text-3xl text-foreground mb-8 leading-relaxed">
            {question.text}
          </h2>

          <div className="space-y-3">
            {question.options.map((option) => (
              <button
                key={option.id}
                onClick={() => onSelectOption(option.id)}
                className={`w-full text-left p-6 rounded-lg border-2 transition-all min-h-16 hover-elevate ${
                  selectedOption === option.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-card'
                }`}
                data-testid={`option-${option.id}`}
              >
                <p className="text-base md:text-lg">{option.text}</p>
              </button>
            ))}
          </div>
        </Card>

        <div className="flex justify-end">
          <Button
            size="lg"
            onClick={onNext}
            disabled={!selectedOption}
            className="px-8"
            data-testid="button-continue"
          >
            {currentQuestion === totalQuestions ? 'See Results' : 'Continue'}
          </Button>
        </div>
      </div>
    </div>
  );
}
