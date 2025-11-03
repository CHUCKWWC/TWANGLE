import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, Clock, Shuffle, Loader2 } from "lucide-react";

interface ConversationQuestion {
  id: string;
  category: string;
  intensity: number;
  questionText: string;
  therapyPrompt: string | null;
}

interface HelpMeOutModalProps {
  question: ConversationQuestion;
  isOpen: boolean;
  onClose: () => void;
}

export function HelpMeOutModal({ question, isOpen, onClose }: HelpMeOutModalProps) {
  const [activeTab, setActiveTab] = useState("guidance");
  const [guidanceContent, setGuidanceContent] = useState<string | null>(null);
  const [alternativeQuestions, setAlternativeQuestions] = useState<{ question1: string; question2: string } | null>(null);

  const helpMutation = useMutation({
    mutationFn: async (actionType: string) => {
      return await apiRequest('POST', '/api/conversations/help', {
        questionId: question.id,
        actionType,
      });
    },
    onSuccess: (data) => {
      if (data.type === 'guidance') {
        setGuidanceContent(data.content);
      } else if (data.type === 'alternative') {
        setAlternativeQuestions(data.content);
      }
    },
  });

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    // Load content for the selected tab if not already loaded
    if (value === 'guidance' && !guidanceContent && !helpMutation.isPending) {
      helpMutation.mutate('guidance');
    } else if (value === 'alternative' && !alternativeQuestions && !helpMutation.isPending) {
      helpMutation.mutate('alternative');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" data-testid="modal-help-me-out">
        <DialogHeader>
          <DialogTitle>Help Me Out</DialogTitle>
          <DialogDescription>
            Choose how you'd like support with this question
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="guidance" data-testid="tab-guidance">
              <Lightbulb className="h-4 w-4 mr-2" />
              Guidance
            </TabsTrigger>
            <TabsTrigger value="think_time" data-testid="tab-think-time">
              <Clock className="h-4 w-4 mr-2" />
              Think Time
            </TabsTrigger>
            <TabsTrigger value="alternative" data-testid="tab-alternative">
              <Shuffle className="h-4 w-4 mr-2" />
              Alternative
            </TabsTrigger>
          </TabsList>

          <TabsContent value="guidance" className="space-y-4" data-testid="content-guidance">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Current Question:</h4>
                    <p className="text-sm text-muted-foreground italic">{question.questionText}</p>
                  </div>

                  {helpMutation.isPending && activeTab === 'guidance' ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : guidanceContent ? (
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium">Coaching Guidance:</h4>
                      <div className="bg-muted/50 rounded-lg p-4">
                        <p className="text-sm whitespace-pre-line" data-testid="text-guidance-content">
                          {guidanceContent}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <Button 
                      onClick={() => helpMutation.mutate('guidance')}
                      disabled={helpMutation.isPending}
                      data-testid="button-get-guidance"
                    >
                      Get Coaching Tips
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="think_time" className="space-y-4" data-testid="content-think-time">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Take the time you need</h4>
                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    <p className="text-sm" data-testid="text-think-time-message">
                      It's okay to need a moment to gather your thoughts. Your feelings matter, and thoughtful reflection leads to deeper connection.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Come back when you're ready to share your response. There's no rush.
                    </p>
                  </div>
                  <Button variant="outline" onClick={onClose} data-testid="button-close-think-time">
                    I'll Come Back Later
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alternative" className="space-y-4" data-testid="content-alternative">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Want a gentler angle?</h4>
                    <p className="text-sm text-muted-foreground">
                      Here are two alternative questions from the same topic that might feel easier to answer:
                    </p>
                  </div>

                  {helpMutation.isPending && activeTab === 'alternative' ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : alternativeQuestions ? (
                    <div className="space-y-3">
                      <div className="bg-muted/50 rounded-lg p-4">
                        <p className="text-sm font-medium mb-1">Option 1 (Feelings-focused):</p>
                        <p className="text-sm" data-testid="text-alternative-1">{alternativeQuestions.question1}</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-4">
                        <p className="text-sm font-medium mb-1">Option 2 (Action-focused):</p>
                        <p className="text-sm" data-testid="text-alternative-2">{alternativeQuestions.question2}</p>
                      </div>
                      <p className="text-xs text-muted-foreground italic">
                        Note: These are suggested alternatives. You can still answer the original question if you prefer.
                      </p>
                    </div>
                  ) : (
                    <Button 
                      onClick={() => helpMutation.mutate('alternative')}
                      disabled={helpMutation.isPending}
                      data-testid="button-get-alternatives"
                    >
                      Show Alternatives
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
