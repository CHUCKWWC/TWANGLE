import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Heart, Send, User } from "lucide-react";

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AICoachChatProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
}

const SUGGESTED_PROMPTS = [
  "How can we improve our communication?",
  "Help us understand our attachment styles better",
  "We're having trouble resolving conflicts",
  "How can we build more emotional intimacy?",
];

export default function AICoachChat({
  messages,
  onSendMessage,
  isLoading = false,
}: AICoachChatProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      onSendMessage(input);
      setInput("");
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="max-w-3xl mx-auto px-4 py-12 md:py-24">
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Heart className="w-8 h-8 text-primary" />
              </div>
              <h1 className="font-display text-3xl md:text-4xl font-semibold mb-3">
                Coach Charles
              </h1>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Your AI relationship coach with expert guidance based on research-backed methods. Ask me anything about your relationship.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-3 max-w-2xl mx-auto">
              {SUGGESTED_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => onSendMessage(prompt)}
                  className="text-left p-4 rounded-lg border border-border bg-card hover-elevate active-elevate-2 transition-all"
                  data-testid={`prompt-${idx}`}
                >
                  <p className="text-sm">{prompt}</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto px-4 py-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`mb-8 ${message.role === 'user' ? 'ml-0' : 'mr-0'}`}
              >
                <div className="flex gap-4">
                  <Avatar className="flex-shrink-0 w-8 h-8">
                    <AvatarFallback className={message.role === 'user' ? 'bg-primary/10' : 'bg-accent'}>
                      {message.role === 'user' ? (
                        <User className="w-4 h-4" />
                      ) : (
                        <Heart className="w-4 h-4 text-primary" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="font-semibold text-sm">
                      {message.role === 'user' ? 'You' : 'Coach Charles'}
                    </div>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                        {message.content}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="mb-8">
                <div className="flex gap-4">
                  <Avatar className="flex-shrink-0 w-8 h-8">
                    <AvatarFallback className="bg-accent">
                      <Heart className="w-4 h-4 text-primary" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 pt-1">
                    <div className="font-semibold text-sm mb-2">Coach Charles</div>
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="border-t border-border bg-background">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex gap-3 items-end">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Message Coach Charles..."
              className="flex-1 min-h-[52px] max-h-[200px] resize-none"
              rows={1}
              disabled={isLoading}
              data-testid="input-message"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="flex-shrink-0"
              data-testid="button-send"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-3">
            AI coach provides research-based relationship guidance
          </p>
        </div>
      </div>
    </div>
  );
}
