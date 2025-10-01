import { useState } from 'react';
import AICoachChat, { type Message } from '../AICoachChat';

export default function AICoachChatExample() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async (content: string) => {
    const newMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content,
      timestamp: new Date(),
    };
    
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setIsLoading(true);

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

      const data = await response.json();
      
      const aiResponse = {
        id: (Date.now() + 1).toString(),
        role: 'assistant' as const,
        content: data.message.content,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant' as const,
        content: "I'm sorry, I'm having trouble responding right now. Please try again in a moment.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AICoachChat
      messages={messages}
      onSendMessage={handleSendMessage}
      isLoading={isLoading}
    />
  );
}
