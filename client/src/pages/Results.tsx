import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import AttachmentResults, { type AttachmentScore } from "@/components/AttachmentResults";
import { AppHeader } from "@/components/AppHeader";
import { Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { AttachmentStyleResult } from "@shared/schema";

export default function Results() {
  const [, navigate] = useLocation();
  const [assessmentResult, setAssessmentResult] = useState<AttachmentStyleResult | null>(null);
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
