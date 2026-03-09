import { usePlan, type PlanTier } from "@/hooks/usePlan";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Gift } from "lucide-react";

interface RequirePlanProps {
  children: React.ReactNode;
  minTier?: PlanTier;
  message?: string;
}

export function RequirePlan({ 
  children, 
}: RequirePlanProps) {
  return <>{children}</>;
}
