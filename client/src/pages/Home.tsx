import { useState, useEffect } from "react";
import WelcomeHero from "@/components/WelcomeHero";
import AssessmentQuestion, { type Question } from "@/components/AssessmentQuestion";
import AttachmentResults, { type AttachmentScore } from "@/components/AttachmentResults";
import AICoachChat, { type Message } from "@/components/AICoachChat";
import RetreatBuilder from "@/components/RetreatBuilder";
import ExercisesLibrary from "@/components/ExercisesLibrary";
import WeeklySummaries from "@/components/WeeklySummaries";
import ThemeToggle from "@/components/ThemeToggle";
import { FeedbackButton } from "@/components/FeedbackButton";
import { RelationshipProgressDialog } from "@/components/RelationshipProgressDialog";
import { BookOpen, FileText } from "lucide-react";

type View = 'welcome' | 'assessment' | 'results' | 'coach' | 'retreat' | 'exercises' | 'summaries';

const SAMPLE_QUESTIONS: Question[] = [
  {
    id: '1',
    text: 'When my partner seems distant, I tend to...',
    options: [
      { id: 'a', text: 'Give them space and wait for them to come to me', value: 1 },
      { id: 'b', text: 'Reach out and try to connect with them', value: 2 },
      { id: 'c', text: 'Feel anxious and worry about what I did wrong', value: 3 },
      { id: 'd', text: 'Withdraw and protect myself emotionally', value: 4 },
    ],
  },
  {
    id: '2',
    text: 'In relationships, I generally feel...',
    options: [
      { id: 'a', text: 'Comfortable with both closeness and independence', value: 1 },
      { id: 'b', text: 'A strong need for reassurance and validation', value: 2 },
      { id: 'c', text: 'More comfortable maintaining some distance', value: 3 },
      { id: 'd', text: 'Conflicted between wanting closeness and fearing it', value: 4 },
    ],
  },
  {
    id: '3',
    text: 'When conflicts arise, I typically...',
    options: [
      { id: 'a', text: 'Address them directly but calmly', value: 1 },
      { id: 'b', text: 'Get emotional and need to talk it through immediately', value: 2 },
      { id: 'c', text: 'Prefer to take time alone to process', value: 3 },
      { id: 'd', text: 'Avoid confrontation altogether', value: 4 },
    ],
  },
];

export default function Home() {
  const [currentView, setCurrentView] = useState<View>('welcome');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [showProgressDialog, setShowProgressDialog] = useState(false);

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

  const handleNextQuestion = () => {
    if (selectedOption) {
      setAnswers({ ...answers, [SAMPLE_QUESTIONS[currentQuestionIndex].id]: selectedOption });
      
      if (currentQuestionIndex < SAMPLE_QUESTIONS.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setSelectedOption(null);
      } else {
        setCurrentView('results');
      }
    }
  };

  const handleBackQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setSelectedOption(answers[SAMPLE_QUESTIONS[currentQuestionIndex - 1].id] || null);
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

  const sampleScores: AttachmentScore = {
    secure: 45,
    anxious: 30,
    avoidant: 15,
    fearful: 10,
  };

  return (
    <div className="min-h-screen bg-background">
      {currentView !== 'welcome' && (
        <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
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
            <div className="flex items-center gap-3">
              <FeedbackButton />
              <ThemeToggle />
            </div>
          </div>
        </header>
      )}

      <div className={currentView !== 'welcome' ? 'pt-16' : ''}>
        {currentView === 'welcome' && (
          <WelcomeHero
            onStartAssessment={handleStartAssessment}
            onJumpToCoach={() => setCurrentView('coach')}
          />
        )}

        {currentView === 'assessment' && (
          <AssessmentQuestion
            question={SAMPLE_QUESTIONS[currentQuestionIndex]}
            currentQuestion={currentQuestionIndex + 1}
            totalQuestions={SAMPLE_QUESTIONS.length}
            selectedOption={selectedOption}
            onSelectOption={setSelectedOption}
            onNext={handleNextQuestion}
            onBack={handleBackQuestion}
            canGoBack={currentQuestionIndex > 0}
          />
        )}

        {currentView === 'results' && (
          <AttachmentResults
            scores={sampleScores}
            hasRedFlags={false}
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

        {currentView === 'retreat' && (
          <RetreatBuilder
            onSaveRetreat={(retreat) => {
              console.log('Retreat saved:', {
                duration: retreat.duration,
                location: retreat.location,
                budget: retreat.budget,
                focuses: retreat.focuses,
                totalActivities: retreat.activities.length,
              });
              alert(`${retreat.duration}-day retreat plan saved! In the full app, this would be exported as PDF.`);
            }}
          />
        )}

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
