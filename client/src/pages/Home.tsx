import { useState } from "react";
import WelcomeHero from "@/components/WelcomeHero";
import AssessmentQuestion, { type Question } from "@/components/AssessmentQuestion";
import AttachmentResults, { type AttachmentScore } from "@/components/AttachmentResults";
import AICoachChat, { type Message } from "@/components/AICoachChat";
import RetreatBuilder from "@/components/RetreatBuilder";
import ExercisesLibrary from "@/components/ExercisesLibrary";
import ThemeToggle from "@/components/ThemeToggle";
import { BookOpen } from "lucide-react";

type View = 'welcome' | 'assessment' | 'results' | 'coach' | 'retreat' | 'exercises';

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
  const [chatMessages, setChatMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm here to support you on your relationship journey. Based on your attachment profile, I can help you navigate communication, conflicts, and connection. What would you like to explore today?",
      timestamp: new Date(),
    },
  ]);

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

  const handleSendMessage = (content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };
    setChatMessages([...chatMessages, newMessage]);
    
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "That's a great question. Based on your attachment profile, I recommend focusing on clear communication patterns and building trust through consistent actions. Would you like me to share some specific strategies?",
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, aiResponse]);
    }, 1500);
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
                onClick={() => setCurrentView('exercises')}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground hover-elevate px-3 py-2 rounded"
                data-testid="link-exercises"
              >
                <BookOpen className="w-4 h-4" />
                Exercises
              </button>
            </div>
            <ThemeToggle />
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
            onSaveSummary={() => console.log('Save summary clicked')}
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
      </div>
    </div>
  );
}
