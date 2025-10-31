import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import AICoachChat, { type Message } from "@/components/AICoachChat";
import { AppHeader } from "@/components/AppHeader";
import { SEO, SEO_CONTENT } from "@/components/SEO";
import { StructuredData, PERSON_SCHEMA } from "@/components/StructuredData";
import { CoachCredentials } from "@/components/CoachCredentials";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Lock, MessageCircle } from "lucide-react";
import { usePlan } from "@/hooks/usePlan";

const FREE_MESSAGE_LIMIT = 3;

export default function Coach() {
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { hasAccess } = usePlan();
  const isAnonymous = (user as any)?.isAnonymous;
  
  // Load message count from localStorage for anonymous users
  useEffect(() => {
    if (isAnonymous) {
      const stored = localStorage.getItem('anonymousMessageCount');
      setMessageCount(stored ? parseInt(stored, 10) : 0);
    }
  }, [isAnonymous]);

  const handleSendMessage = async (content: string) => {
    // Check if anonymous user has exceeded free limit
    if (isAnonymous && messageCount >= FREE_MESSAGE_LIMIT) {
      return; // Prevent sending - UI will show sign-in prompt
    }

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
        // Handle 403 - free message limit reached
        if (response.status === 403) {
          const errorData = await response.json();
          if (errorData.requiresAuth && isAnonymous) {
            // Backend enforced the limit - sync frontend state
            setMessageCount(FREE_MESSAGE_LIMIT);
            localStorage.setItem('anonymousMessageCount', FREE_MESSAGE_LIMIT.toString());
            return; // Don't add error message, the UI will show the limit banner
          }
        }
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
      
      // Increment count for anonymous users
      if (isAnonymous) {
        const newCount = messageCount + 1;
        setMessageCount(newCount);
        localStorage.setItem('anonymousMessageCount', newCount.toString());
      }
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
  
  const remainingMessages = isAnonymous ? Math.max(0, FREE_MESSAGE_LIMIT - messageCount) : Infinity;
  const hasReachedLimit = isAnonymous && messageCount >= FREE_MESSAGE_LIMIT;

  return (
    <>
      <SEO {...SEO_CONTENT.coach} />
      <StructuredData data={PERSON_SCHEMA} />
      <AppHeader />
      <div className="pt-16 px-4 max-w-4xl mx-auto">
        {/* Anonymous user message counter banner */}
        {isAnonymous && messageCount > 0 && !hasReachedLimit && (
          <div className="mb-6">
            <Card className="p-4 bg-primary/5 border-primary/20">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <MessageCircle className="w-5 h-5 text-primary" />
                  <p className="text-sm" data-testid="text-message-counter">
                    <span className="font-semibold">{remainingMessages}</span> free message{remainingMessages !== 1 ? 's' : ''} remaining
                  </p>
                </div>
                <Button asChild size="sm" variant="outline" data-testid="button-signin-counter">
                  <a href="/api/login?returnTo=/coach">
                    Sign In for Unlimited
                  </a>
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Free messages exhausted - sign in prompt */}
        {hasReachedLimit && (
          <div className="mb-6">
            <Card className="p-6 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/10 p-2">
                    <Lock className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-lg mb-1" data-testid="text-limit-title">
                      You've used your 3 free messages
                    </h3>
                    <p className="text-sm text-muted-foreground" data-testid="text-limit-description">
                      Sign in to continue chatting with Coach Charles and unlock unlimited AI coaching
                    </p>
                  </div>
                </div>
                <Button asChild size="lg" className="flex-shrink-0" data-testid="button-signin-limit">
                  <a href="/api/login?returnTo=/coach">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Sign In to Continue
                  </a>
                </Button>
              </div>
            </Card>
          </div>
        )}

        <div className="mt-6">
          <CoachCredentials />
        </div>
        <AICoachChat
          messages={chatMessages}
          onSendMessage={handleSendMessage}
          isLoading={isLoadingChat}
          onViewSummaries={() => navigate("/summaries")}
          disabled={hasReachedLimit}
        />
      </div>
    </>
  );
}
