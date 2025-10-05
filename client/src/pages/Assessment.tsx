import { useState } from "react";
import { useLocation } from "wouter";
import AssessmentQuestion from "@/components/AssessmentQuestion";
import { AppHeader } from "@/components/AppHeader";
import { Loader2 } from "lucide-react";
import { ASSESSMENT_QUESTIONS } from "@/lib/questions";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Assessment() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const handleNextQuestion = async () => {
    if (!selectedOption) return;
    
    const currentQuestion = ASSESSMENT_QUESTIONS[currentQuestionIndex];
    const selectedAnswer = currentQuestion.options.find(opt => opt.id === selectedOption);
    
    if (!selectedAnswer) return;
    
    const newAnswers = {
      ...answers,
      [currentQuestion.text]: selectedAnswer.text
    };
    
    setAnswers(newAnswers);
    
    if (currentQuestionIndex < ASSESSMENT_QUESTIONS.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedOption(null);
    } else {
      setIsAnalyzing(true);
      
      try {
        const createResponse = await apiRequest("POST", "/api/assessments", {
          responses: newAnswers
        });
        const { assessmentId: id } = await createResponse.json();
        
        const analyzeResponse = await apiRequest("POST", `/api/assessments/${id}/analyze`, {});
        const { result } = await analyzeResponse.json();
        
        navigate(`/results?id=${id}`);
      } catch (error: any) {
        console.error("Assessment error:", error);
        toast({
          title: "Analysis Failed",
          description: "We couldn't analyze your assessment. Please try again.",
          variant: "destructive",
        });
        setIsAnalyzing(false);
      }
    }
  };

  const handleBackQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      const prevQuestion = ASSESSMENT_QUESTIONS[currentQuestionIndex - 1];
      const prevAnswer = Object.entries(answers).find(([q, _]) => q === prevQuestion.text);
      if (prevAnswer) {
        const prevOption = prevQuestion.options.find(opt => opt.text === prevAnswer[1]);
        setSelectedOption(prevOption?.id || null);
      } else {
        setSelectedOption(null);
      }
    } else {
      navigate("/");
    }
  };

  if (isAnalyzing) {
    return (
      <>
        <AppHeader />
        <div className="min-h-screen bg-background flex items-center justify-center p-4 pt-20">
          <div className="text-center">
            <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
            <h2 className="font-display text-2xl mb-2">Analyzing Your Responses...</h2>
            <p className="text-muted-foreground">Coach Charles is preparing your personalized attachment profile</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <AppHeader />
      <div className="pt-16">
        <AssessmentQuestion
      question={ASSESSMENT_QUESTIONS[currentQuestionIndex]}
      currentQuestion={currentQuestionIndex + 1}
      totalQuestions={ASSESSMENT_QUESTIONS.length}
      selectedOption={selectedOption}
      onSelectOption={setSelectedOption}
      onNext={handleNextQuestion}
      onBack={handleBackQuestion}
      canGoBack={true}
        />
      </div>
    </>
  );
}
