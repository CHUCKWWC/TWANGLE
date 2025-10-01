import { useState } from 'react';
import AICoachChat from '../AICoachChat';

export default function AICoachChatExample() {
  const [messages, setMessages] = useState([
    {
      id: '1',
      role: 'assistant' as const,
      content: "Hello! I'm here to support you on your relationship journey. Based on your attachment profile, I can help you navigate communication, conflicts, and connection. What would you like to explore today?",
      timestamp: new Date(),
    },
  ]);

  const handleSend = (message: string) => {
    setMessages([
      ...messages,
      {
        id: Date.now().toString(),
        role: 'user' as const,
        content: message,
        timestamp: new Date(),
      },
    ]);
    
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant' as const,
          content: "That's a great question. Based on your secure-anxious attachment mix, I recommend focusing on clear communication patterns. Let me share some specific strategies...",
          timestamp: new Date(),
        },
      ]);
    }, 1500);
  };

  return (
    <AICoachChat
      messages={messages}
      onSendMessage={handleSend}
      onSaveSummary={() => console.log('Save summary clicked')}
      isLoading={false}
    />
  );
}
