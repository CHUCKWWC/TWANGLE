import { useState } from "react";
import { useLocation } from "wouter";
import AICoachChat, { type Message } from "@/components/AICoachChat";
import { AppHeader } from "@/components/AppHeader";
import { RequirePlan } from "@/components/RequirePlan";
import { SEO, SEO_CONTENT } from "@/components/SEO";
import { StructuredData, PERSON_SCHEMA } from "@/components/StructuredData";
import { CoachCredentials } from "@/components/CoachCredentials";

export default function Coach() {
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [, navigate] = useLocation();

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

  return (
    <>
      <SEO {...SEO_CONTENT.coach} />
      <StructuredData data={PERSON_SCHEMA} />
      
      <RequirePlan message="Access unlimited AI coaching with a premium subscription">
        <AppHeader />
        <div className="pt-16 px-4 max-w-4xl mx-auto">
          <div className="mt-6">
            <CoachCredentials />
          </div>
          <AICoachChat
            messages={chatMessages}
            onSendMessage={handleSendMessage}
            isLoading={isLoadingChat}
            onViewSummaries={() => navigate("/summaries")}
          />
      </div>
    </RequirePlan>
    </>
  );
}
