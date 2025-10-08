import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import AttachmentResults, { type AttachmentScore } from "@/components/AttachmentResults";
import { AppHeader } from "@/components/AppHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, Save } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import type { AttachmentStyleResult } from "@shared/schema";

export default function Results() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [assessmentResult, setAssessmentResult] = useState<AttachmentStyleResult | null>(null);
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isAnonymous = (user as any)?.isAnonymous;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    
    if (!id) {
      navigate("/");
      return;
    }

    setAssessmentId(id);

    const fetchResult = async () => {
      try {
        const response = await apiRequest("GET", `/api/assessments/${id}`, undefined);
        const data = await response.json();
        
        if (data.assessment?.result) {
          setAssessmentResult(data.assessment.result);
        } else {
          navigate("/");
        }
      } catch (error) {
        console.error("Error fetching assessment:", error);
        navigate("/");
      } finally {
        setIsLoading(false);
      }
    };

    fetchResult();
  }, [navigate]);

  const getScoresFromResult = (result: AttachmentStyleResult | null): AttachmentScore => {
    if (!result) {
      return { secure: 0, anxious: 0, avoidant: 0, fearful: 0 };
    }
    return result.stylePercentages;
  };

  if (isLoading) {
    return (
      <>
        <AppHeader />
        <div className="min-h-screen bg-background flex items-center justify-center p-4 pt-20">
          <div className="text-center">
            <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading your results...</p>
          </div>
        </div>
      </>
    );
  }

  if (!assessmentResult) {
    return null;
  }

  return (
    <>
      <AppHeader />
      <div className="pt-16">
        {isAnonymous && (
          <div className="max-w-4xl mx-auto px-4 mb-8">
            <Card className="p-6 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/10 p-2">
                    <Save className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-lg mb-1" data-testid="text-upgrade-title">
                      Save Your Results
                    </h3>
                    <p className="text-sm text-muted-foreground" data-testid="text-upgrade-description">
                      Sign in to save your assessment, track progress over time, and unlock AI coaching.
                    </p>
                  </div>
                </div>
                <Button asChild size="lg" className="flex-shrink-0" data-testid="button-signup">
                  <a href="/api/login">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Sign In
                  </a>
                </Button>
              </div>
            </Card>
          </div>
        )}
        <AttachmentResults
      scores={getScoresFromResult(assessmentResult)}
      hasRedFlags={false}
      result={assessmentResult}
      assessmentId={assessmentId || undefined}
      onTalkToCoach={() => navigate("/coach")}
      onPlanRetreat={() => navigate("/retreat")}
      onViewExercises={() => navigate("/exercises")}
        />
      </div>
    </>
  );
}
