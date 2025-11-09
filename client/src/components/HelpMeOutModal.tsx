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
      <DialogContent className="sm:max-w-2xl max-h-[90vh] sm:max-h-[80vh] overflow-y-auto p-4 sm:p-6" data-testid="modal-help-me-out">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-base sm:text-lg">Help Me Out</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Choose how you'd like support with this question
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-auto p-1">
            <TabsTrigger value="guidance" className="flex flex-col sm:flex-row items-center gap-1 py-2 px-2 sm:px-3" data-testid="tab-guidance">
              <Lightbulb className="h-4 w-4 sm:mr-2" />
              <span className="text-xs sm:text-sm">Guidance</span>
            </TabsTrigger>
            <TabsTrigger value="think_time" className="flex flex-col sm:flex-row items-center gap-1 py-2 px-2 sm:px-3" data-testid="tab-think-time">
              <Clock className="h-4 w-4 sm:mr-2" />
              <span className="text-xs sm:text-sm">Think Time</span>
            </TabsTrigger>
            <TabsTrigger value="alternative" className="flex flex-col sm:flex-row items-center gap-1 py-2 px-2 sm:px-3" data-testid="tab-alternative">
              <Shuffle className="h-4 w-4 sm:mr-2" />
              <span className="text-xs sm:text-sm">Alternative</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="guidance" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4" data-testid="content-guidance">
            <Card>
              <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <h4 className="text-xs sm:text-sm font-medium mb-2">Current Question:</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground italic">{question.questionText}</p>
                  </div>

                  {helpMutation.isPending && activeTab === 'guidance' ? (
                    <div className="flex items-center justify-center py-6 sm:py-8">
                      <Loader2 className="h-6 sm:h-8 w-6 sm:w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : guidanceContent ? (
                    <div className="space-y-2 sm:space-y-3">
                      <h4 className="text-xs sm:text-sm font-medium">Coaching Guidance:</h4>
                      <div className="bg-muted/50 rounded-lg p-3 sm:p-4">
                        <p className="text-xs sm:text-sm whitespace-pre-line" data-testid="text-guidance-content">
                          {guidanceContent}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <Button 
                      onClick={() => helpMutation.mutate('guidance')}
                      disabled={helpMutation.isPending}
                      className="w-full sm:w-auto"
                      data-testid="button-get-guidance"
                    >
                      Get Coaching Tips
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="think_time" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4" data-testid="content-think-time">
            <Card>
              <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
                <div className="space-y-3 sm:space-y-4">
                  <h4 className="text-xs sm:text-sm font-medium">Take the time you need</h4>
                  <div className="bg-muted/50 rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3">
                    <p className="text-xs sm:text-sm" data-testid="text-think-time-message">
                      It's okay to need a moment to gather your thoughts. Your feelings matter, and thoughtful reflection leads to deeper connection.
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Come back when you're ready to share your response. There's no rush.
                    </p>
                  </div>
                  <Button variant="outline" onClick={onClose} className="w-full sm:w-auto" data-testid="button-close-think-time">
                    I'll Come Back Later
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alternative" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4" data-testid="content-alternative">
            <Card>
              <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <h4 className="text-xs sm:text-sm font-medium mb-1 sm:mb-2">Want a gentler angle?</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Here are two alternative questions from the same topic that might feel easier to answer:
                    </p>
                  </div>

                  {helpMutation.isPending && activeTab === 'alternative' ? (
                    <div className="flex items-center justify-center py-6 sm:py-8">
                      <Loader2 className="h-6 sm:h-8 w-6 sm:w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : alternativeQuestions ? (
                    <div className="space-y-2 sm:space-y-3">
                      <div className="bg-muted/50 rounded-lg p-3 sm:p-4">
                        <p className="text-xs sm:text-sm font-medium mb-1">Option 1 (Feelings-focused):</p>
                        <p className="text-xs sm:text-sm" data-testid="text-alternative-1">{alternativeQuestions.question1}</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-3 sm:p-4">
                        <p className="text-xs sm:text-sm font-medium mb-1">Option 2 (Action-focused):</p>
                        <p className="text-xs sm:text-sm" data-testid="text-alternative-2">{alternativeQuestions.question2}</p>
                      </div>
                      <p className="text-xs text-muted-foreground italic">
                        Note: These are suggested alternatives. You can still answer the original question if you prefer.
                      </p>
                    </div>
                  ) : (
                    <Button 
                      onClick={() => helpMutation.mutate('alternative')}
                      disabled={helpMutation.isPending}
                      className="w-full sm:w-auto"
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
