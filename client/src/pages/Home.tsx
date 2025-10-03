import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import WelcomeHero from "@/components/WelcomeHero";
import AssessmentQuestion from "@/components/AssessmentQuestion";
import AttachmentResults, { type AttachmentScore } from "@/components/AttachmentResults";
import AICoachChat, { type Message } from "@/components/AICoachChat";
import RetreatBuilder from "@/components/RetreatBuilder";
import ExercisesLibrary from "@/components/ExercisesLibrary";
import WeeklySummaries from "@/components/WeeklySummaries";
import ThemeToggle from "@/components/ThemeToggle";
import { FeedbackButton } from "@/components/FeedbackButton";
import { RelationshipProgressDialog } from "@/components/RelationshipProgressDialog";
import { UserMenu } from "@/components/UserMenu";
import { BookOpen, FileText, Loader2 } from "lucide-react";
import { ASSESSMENT_QUESTIONS } from "@/lib/questions";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { AttachmentStyleResult } from "@shared/schema";

type View = 'welcome' | 'assessment' | 'results' | 'coach' | 'retreat' | 'exercises' | 'summaries';

export default function Home() {
  const [currentView, setCurrentView] = useState<View>('welcome');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [showProgressDialog, setShowProgressDialog] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState<AttachmentStyleResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const lastProgressCheck = localStorage.getItem('lastProgressCheck');
    const now = new Date();
    
    if (!lastProgressCheck) {
      const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      localStorage.setItem('lastProgressCheck', oneWeekFromNow.toISOString());
      return;
    }

    const lastCheck = new Date(lastProgressCheck);
    if (now > lastCheck) {
      setTimeout(() => setShowProgressDialog(true), 3000);
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      localStorage.setItem('lastProgressCheck', nextWeek.toISOString());
    }
  }, []);

  const handleStartAssessment = () => {
    setCurrentView('assessment');
    setCurrentQuestionIndex(0);
    setAnswers({});
    setSelectedOption(null);
  };

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
        const { assessmentId } = await createResponse.json();
        
        const analyzeResponse = await apiRequest("POST", `/api/assessments/${assessmentId}/analyze`, {});
        const { result } = await analyzeResponse.json();
        
        setAssessmentResult(result);
        setCurrentView('results');
      } catch (error: any) {
        console.error("Assessment error:", error);
        toast({
          title: "Analysis Failed",
          description: "We couldn't analyze your assessment. Please try again.",
          variant: "destructive",
        });
      } finally {
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
    }
  };

  const handleSendMessage = async (content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };
    
    const updatedMessages = [...chatMessages, newMessage];
    setChatMessages(updatedMessages);
    setIsLoadingChat(true);
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message.content,
        timestamp: new Date(),
      };
      
      setChatMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm sorry, I'm having trouble responding right now. Please try again in a moment.",
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoadingChat(false);
    }
  };

  const getScoresFromResult = (result: AttachmentStyleResult | null): AttachmentScore => {
    if (!result) {
      return { secure: 0, anxious: 0, avoidant: 0, fearful: 0 };
    }
    return result.stylePercentages;
  };

  return (
    <div className="min-h-screen bg-background">
      <header className={`fixed top-0 left-0 right-0 z-50 ${currentView === 'welcome' ? 'bg-transparent' : 'bg-background/80 backdrop-blur-md border-b border-border'}`}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          {currentView !== 'welcome' && (
            <div className="flex items-center gap-6">
              <button
                onClick={() => setCurrentView('welcome')}
                className="font-display font-semibold text-xl text-primary hover-elevate px-2 py-1 rounded"
                data-testid="link-home"
              >
                Twangle
              </button>
              <button
                onClick={() => setCurrentView('summaries')}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground hover-elevate px-3 py-2 rounded"
                data-testid="link-summaries"
              >
                <FileText className="w-4 h-4" />
                Summaries
              </button>
              <button
                onClick={() => setCurrentView('exercises')}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground hover-elevate px-3 py-2 rounded"
                data-testid="link-exercises"
              >
                <BookOpen className="w-4 h-4" />
                Exercises
              </button>
            </div>
          )}
          {currentView === 'welcome' && <div />}
          <div className="flex items-center gap-3">
            <FeedbackButton />
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>
      </header>

      <div className={currentView !== 'welcome' ? 'pt-16' : ''}>
        {currentView === 'welcome' && (
          <WelcomeHero
            onStartAssessment={handleStartAssessment}
            onJumpToCoach={() => setCurrentView('coach')}
            onPlanRetreat={() => setCurrentView('retreat')}
          />
        )}

        {currentView === 'assessment' && !isAnalyzing && (
          <AssessmentQuestion
            question={ASSESSMENT_QUESTIONS[currentQuestionIndex]}
            currentQuestion={currentQuestionIndex + 1}
            totalQuestions={ASSESSMENT_QUESTIONS.length}
            selectedOption={selectedOption}
            onSelectOption={setSelectedOption}
            onNext={handleNextQuestion}
            onBack={handleBackQuestion}
            canGoBack={currentQuestionIndex > 0}
          />
        )}

        {isAnalyzing && (
          <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="text-center">
              <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
              <h2 className="font-display text-2xl mb-2">Analyzing Your Responses...</h2>
              <p className="text-muted-foreground">Coach Charles is preparing your personalized attachment profile</p>
            </div>
          </div>
        )}

        {currentView === 'results' && assessmentResult && (
          <AttachmentResults
            scores={getScoresFromResult(assessmentResult)}
            hasRedFlags={false}
            result={assessmentResult}
            onTalkToCoach={() => setCurrentView('coach')}
            onPlanRetreat={() => setCurrentView('retreat')}
            onViewExercises={() => setCurrentView('exercises')}
          />
        )}

        {currentView === 'coach' && (
          <AICoachChat
            messages={chatMessages}
            onSendMessage={handleSendMessage}
            isLoading={isLoadingChat}
            onViewSummaries={() => setCurrentView('summaries')}
          />
        )}

        {currentView === 'retreat' && <RetreatBuilder />}

        {currentView === 'exercises' && <ExercisesLibrary />}

        {currentView === 'summaries' && <WeeklySummaries />}
      </div>

      <RelationshipProgressDialog 
        open={showProgressDialog} 
        onOpenChange={setShowProgressDialog}
      />
    </div>
  );
}
