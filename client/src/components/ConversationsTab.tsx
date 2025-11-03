import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Heart, MessageCircle, HelpCircle, Lock, Unlock, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { HelpMeOutModal } from "@/components/HelpMeOutModal";

interface ConversationQuestion {
  id: string;
  category: string;
  intensity: number;
  questionText: string;
  therapyPrompt: string | null;
}

interface ConversationResponse {
  id: string;
  partnershipId: string;
  questionId: string;
  userId: string;
  responseText: string;
  createdAt: Date;
}

interface DailyQuestionData {
  question: ConversationQuestion;
  userResponse: ConversationResponse | null;
  partnerResponse: ConversationResponse | null;
  hasUserAnswered: boolean;
  hasPartnerAnswered: boolean;
  bothAnswered: boolean;
}

interface HistoryItem {
  question: ConversationQuestion;
  responses: ConversationResponse[];
  isComplete: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  emotional_intimacy: "Emotional Intimacy",
  communication_conflict: "Communication & Conflict",
  physical_intimacy: "Physical Intimacy",
  finances_planning: "Finances & Planning",
  values_spiritual: "Values & Spiritual",
  play_adventure: "Play & Adventure",
  trust_boundaries: "Trust & Boundaries",
};

const CATEGORY_COLORS: Record<string, string> = {
  emotional_intimacy: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  communication_conflict: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  physical_intimacy: "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200",
  finances_planning: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  values_spiritual: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  play_adventure: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  trust_boundaries: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
};

export function ConversationsTab() {
  const { toast } = useToast();
  const [responseText, setResponseText] = useState("");
  const [showHelpModal, setShowHelpModal] = useState(false);

  const { data: dailyData, isLoading, error } = useQuery<DailyQuestionData>({
    queryKey: ['/api/conversations/daily'],
    retry: false,
  });

  const { data: history } = useQuery<HistoryItem[]>({
    queryKey: ['/api/conversations/history'],
  });

  const respondMutation = useMutation({
    mutationFn: async (data: { questionId: string; responseText: string; partnershipId: string }) => {
      return await apiRequest('POST', '/api/conversations/respond', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations/daily'] });
      queryClient.invalidateQueries({ queryKey: ['/api/conversations/history'] });
      toast({
        title: "Response Saved",
        description: "Your response has been saved. Your partner's answer will appear once they respond.",
      });
      setResponseText("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmitResponse = async () => {
    if (!dailyData?.question || !responseText.trim()) return;
    
    // Get partnership ID from the existing response if available
    let partnershipId = dailyData.userResponse?.partnershipId || dailyData.partnerResponse?.partnershipId;
    
    // If no partnershipId from responses, fetch from partnerships API
    if (!partnershipId) {
      try {
        const partnershipResponse = await fetch('/api/partnerships');
        if (!partnershipResponse.ok) {
          throw new Error('Failed to fetch partnership information');
        }
        const partnership = await partnershipResponse.json();
        
        if (!partnership || partnership.status !== 'active') {
          toast({
            title: "Error",
            description: "No active partnership found. Please connect with your partner first.",
            variant: "destructive",
          });
          return;
        }
        
        partnershipId = partnership.id;
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch partnership information. Please try again.",
          variant: "destructive",
        });
        return;
      }
    }

    respondMutation.mutate({
      questionId: dailyData.question.id,
      responseText: responseText.trim(),
      partnershipId,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Card data-testid="card-no-partnership">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Partner Connection Required
          </CardTitle>
          <CardDescription>
            Daily Conversations is a feature for couples with linked accounts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Connect with your partner to unlock daily relationship questions and share your responses together.
          </p>
          <Button data-testid="button-connect-partner" onClick={() => window.location.href = '/partners'}>
            Connect with Partner
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!dailyData?.question) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">No question available at the moment.</p>
        </CardContent>
      </Card>
    );
  }

  const { question, userResponse, partnerResponse, hasUserAnswered, hasPartnerAnswered, bothAnswered } = dailyData;

  return (
    <div className="space-y-6">
      {/* Daily Question Card */}
      <Card data-testid="card-daily-question">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle className="h-5 w-5" />
                <CardTitle className="text-lg">Today's Question</CardTitle>
                <Badge className={CATEGORY_COLORS[question.category] || "bg-gray-100"} data-testid="badge-category">
                  {CATEGORY_LABELS[question.category] || question.category}
                </Badge>
              </div>
              {question.therapyPrompt && (
                <CardDescription className="italic text-sm mt-1" data-testid="text-therapy-prompt">
                  {question.therapyPrompt}
                </CardDescription>
              )}
            </div>
            {!hasUserAnswered && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHelpModal(true)}
                data-testid="button-help-me-out"
              >
                <HelpCircle className="h-4 w-4 mr-2" />
                Help Me Out
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-lg font-medium" data-testid="text-question">
            {question.questionText}
          </div>

          {!hasUserAnswered ? (
            <div className="space-y-3">
              <Textarea
                placeholder="Share your thoughts..."
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                rows={4}
                className="resize-none"
                data-testid="textarea-response"
              />
              <Button
                onClick={handleSubmitResponse}
                disabled={!responseText.trim() || respondMutation.isPending}
                data-testid="button-submit-response"
              >
                {respondMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Submit Response"
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* User's Response */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium">Your Response</span>
                </div>
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <p className="text-sm" data-testid="text-user-response">{userResponse?.responseText}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Partner Status or Response */}
              {bothAnswered && partnerResponse ? (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium">Partner's Response</span>
                    <Unlock className="h-4 w-4 text-green-600" />
                  </div>
                  <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="p-4">
                      <p className="text-sm" data-testid="text-partner-response">{partnerResponse.responseText}</p>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30 border border-dashed" data-testid="div-waiting-partner">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Waiting for your partner...</p>
                    <p className="text-xs text-muted-foreground">Their response will appear here once they answer</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Conversation History */}
      {history && history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Past Conversations</CardTitle>
            <CardDescription>Review your shared responses</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {history.filter(item => item.isComplete).slice(0, 5).map((item, index) => (
              <div key={item.question.id}>
                {index > 0 && <Separator className="my-4" />}
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Badge className={CATEGORY_COLORS[item.question.category] || "bg-gray-100"} variant="outline">
                      {CATEGORY_LABELS[item.question.category]}
                    </Badge>
                    <p className="text-sm font-medium flex-1">{item.question.questionText}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {item.responses.map((response) => (
                      <Card key={response.id} className="bg-muted/30">
                        <CardContent className="p-3">
                          <p className="text-xs text-muted-foreground mb-1">
                            {new Date(response.createdAt).toLocaleDateString()}
                          </p>
                          <p className="text-sm">{response.responseText}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Help Modal */}
      {showHelpModal && question && (
        <HelpMeOutModal
          question={question}
          isOpen={showHelpModal}
          onClose={() => setShowHelpModal(false)}
        />
      )}
    </div>
  );
}
