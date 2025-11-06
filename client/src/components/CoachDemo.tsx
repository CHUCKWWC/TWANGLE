import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Send, Sparkles } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SAMPLE_CONVERSATIONS = [
  {
    title: "Understanding Conflict",
    messages: [
      { role: "user" as const, content: "My partner and I keep having the same argument over and over. How do we break this cycle?" },
      { role: "assistant" as const, content: "It sounds like you're experiencing what's called a 'negative cycle' - a common pattern in relationships. These cycles often happen because each partner is trying to get a core emotional need met, but the way they're going about it triggers the other person's defenses.\n\nLet me help you understand what might be happening:\n\n1. **Identify the Pattern**: What typically starts the argument? Is there a trigger?\n2. **Look Beneath the Surface**: Often, complaints about dishes or being late mask deeper needs like feeling valued or secure\n3. **Recognize Your Dance**: One partner might pursue (seeking connection) while the other withdraws (seeking space)\n\nThe key is to slow down the cycle and talk about what's happening emotionally for each of you, rather than focusing on who's right or wrong.\n\nWould you like to explore what your specific pattern might be?" }
    ]
  },
  {
    title: "Improving Communication",
    messages: [
      { role: "user" as const, content: "We love each other but struggle to really communicate. How can we get better at this?" },
      { role: "assistant" as const, content: "I'm glad you're both committed to improving! Communication is a skill that can absolutely be developed. Here are some evidence-based approaches:\n\n**Active Listening Techniques:**\n- Reflect back what you hear: 'It sounds like you're feeling...'\n- Ask clarifying questions before jumping to solutions\n- Put away distractions when having important conversations\n\n**Speaking from the Heart:**\n- Use 'I' statements: 'I feel...' instead of 'You always...'\n- Share your underlying feelings, not just your thoughts\n- Be specific about what you need\n\n**Creating Safety:**\n- Take breaks if things get heated (20+ minutes to calm)\n- Assume positive intent - your partner isn't trying to hurt you\n- Thank each other for being vulnerable\n\nWould you like me to suggest some specific exercises you could try together?" }
    ]
  },
  {
    title: "Building Intimacy",
    messages: [
      { role: "user" as const, content: "We've been together for years and feel more like roommates than partners. How do we reconnect?" },
      { role: "assistant" as const, content: "This is such a common experience, especially for long-term couples juggling work, kids, and life responsibilities. The good news is that emotional intimacy can absolutely be rebuilt with intention.\n\n**Small Daily Connections:**\n- 6-second kiss when reuniting\n- Ask open-ended questions: 'What was the best part of your day?'\n- Physical touch that isn't sexual (holding hands, hugs)\n\n**Quality Time Rituals:**\n- Weekly 'state of the union' check-ins\n- Phone-free dinners together\n- Share something you appreciate about each other daily\n\n**Vulnerability and Novelty:**\n- Try new experiences together (novelty increases bonding)\n- Share hopes, fears, and dreams - not just logistics\n- Practice the '36 Questions' exercise for deepening intimacy\n\nThe key is consistency over intensity. Small daily efforts compound over time.\n\nWhat resonates most with you? I can help you create a specific plan." }
    ]
  }
];

export function CoachDemo() {
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [messageCount, setMessageCount] = useState(0);

  const sendMessageMutation = useMutation({
    mutationFn: async (userMessage: string) => {
      const newMessages = [...messages, { role: "user" as const, content: userMessage }];
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send message');
      }

      const data = await response.json();
      return data.message.content;
    },
    onSuccess: (assistantMessage) => {
      setMessages(prev => [...prev, { role: "assistant", content: assistantMessage }]);
      setMessageCount(prev => prev + 1);
      setInput("");
    },
  });

  const handleSelectConversation = (index: number) => {
    setSelectedConversation(index);
    setMessages(SAMPLE_CONVERSATIONS[index].messages);
    setMessageCount(0);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || messageCount >= 3) return;

    setMessages(prev => [...prev, { role: "user", content: input }]);
    sendMessageMutation.mutate(input);
  };

  const handleStartFresh = () => {
    setSelectedConversation(null);
    setMessages([]);
    setMessageCount(0);
    setInput("");
  };

  return (
    <Card className="w-full" data-testid="coach-demo">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-primary" />
          Try Coach Charles - Free Demo
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Explore sample conversations or ask your own questions (3 free messages)
        </p>
      </CardHeader>
      <CardContent>
        {messages.length === 0 ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Choose a sample conversation to explore, or start asking your own questions:
            </p>
            
            <div className="grid gap-3">
              {SAMPLE_CONVERSATIONS.map((conv, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="justify-start h-auto py-4 px-4"
                  onClick={() => handleSelectConversation(index)}
                  data-testid={`button-sample-${index}`}
                >
                  <div className="text-left">
                    <div className="font-semibold">{conv.title}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {conv.messages[0].content.substring(0, 60)}...
                    </div>
                  </div>
                </Button>
              ))}
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or ask your own</span>
              </div>
            </div>

            <form onSubmit={handleSendMessage} className="space-y-3">
              <Input
                placeholder="Ask Coach Charles anything about your relationship..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={sendMessageMutation.isPending}
                autoComplete="off"
                data-testid="input-demo-message"
              />
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">
                  {messageCount}/3 free messages used
                </span>
                <Button
                  type="submit"
                  disabled={sendMessageMutation.isPending || !input.trim() || messageCount >= 3}
                  data-testid="button-send-demo"
                >
                  {sendMessageMutation.isPending ? "Sending..." : "Send"}
                  <Send className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </form>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">
                {selectedConversation !== null ? SAMPLE_CONVERSATIONS[selectedConversation].title : "Your Conversation"}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleStartFresh}
                data-testid="button-back-demo"
              >
                Back
              </Button>
            </div>

            <ScrollArea className="h-96 pr-4">
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    data-testid={`message-${message.role}-${index}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-4 ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                ))}
                {sendMessageMutation.isPending && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] rounded-lg p-4 bg-muted">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 animate-pulse" />
                        <span className="text-sm">Coach Charles is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {messageCount < 3 && (
              <form onSubmit={handleSendMessage} className="space-y-2">
                <Input
                  placeholder="Continue the conversation..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={sendMessageMutation.isPending}
                  autoComplete="off"
                  data-testid="input-continue-demo"
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {messageCount}/3 free messages used
                  </span>
                  <Button
                    type="submit"
                    disabled={sendMessageMutation.isPending || !input.trim()}
                    data-testid="button-send-continue"
                  >
                    Send
                    <Send className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </form>
            )}

            {messageCount >= 3 && (
              <div className="text-center p-4 bg-primary/10 rounded-lg" data-testid="demo-limit-reached">
                <p className="text-sm font-medium mb-2">You've used all 3 free messages</p>
                <Button asChild data-testid="button-signup-demo">
                  <a href="/api/signup">Sign Up for Unlimited Access</a>
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
