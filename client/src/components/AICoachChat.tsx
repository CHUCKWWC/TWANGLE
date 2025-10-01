import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Heart, Send, Download } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AICoachChatProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  onSaveSummary: () => void;
  isLoading?: boolean;
}

const SUGGESTED_PROMPTS = [
  "Help us with communication",
  "Plan our next date night",
  "Work through a recent conflict",
  "Understand our attachment styles",
];

export default function AICoachChat({
  messages,
  onSendMessage,
  onSaveSummary,
  isLoading = false,
}: AICoachChatProps) {
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (input.trim()) {
      onSendMessage(input);
      setInput("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="font-display text-3xl md:text-4xl text-foreground">
              AI Relationship Coach
            </h1>
            <Button
              variant="outline"
              onClick={onSaveSummary}
              data-testid="button-save-summary"
            >
              <Download className="w-4 h-4 mr-2" />
              Save Summary
            </Button>
          </div>
          <p className="text-muted-foreground">
            Get personalized advice based on your attachment profile
          </p>
        </div>

        {messages.length === 0 && (
          <div className="mb-6">
            <p className="text-sm text-muted-foreground mb-3">Suggested prompts:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SUGGESTED_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => onSendMessage(prompt)}
                  className="text-left p-4 rounded-lg border border-border bg-card hover-elevate"
                  data-testid={`prompt-${idx}`}
                >
                  <p className="text-sm">{prompt}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        <Card className="mb-4">
          <ScrollArea className="h-[500px] p-6">
            <div className="space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-4 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <Avatar className="flex-shrink-0">
                    <AvatarFallback className={message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}>
                      {message.role === 'user' ? 'You' : <Heart className="w-4 h-4" />}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={`flex-1 rounded-lg p-4 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground ml-12'
                        : 'bg-muted mr-12'
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-4">
                  <Avatar className="flex-shrink-0">
                    <AvatarFallback className="bg-muted">
                      <Heart className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-lg p-4">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </Card>

        <div className="flex gap-3">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1"
            data-testid="input-message"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            data-testid="button-send"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
