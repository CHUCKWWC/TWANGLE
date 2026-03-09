import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { AlertTriangle, MessageSquare, ClipboardList, Calendar, Heart, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface TrialProgress {
  onTrial: boolean;
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  daysRemaining: number;
  totalTrialDays: number;
  metrics: {
    chatSessions: number;
    assessments: number;
    retreats: number;
    dateNights: number;
  };
}

export function TrialExpiringModal() {
  return null;
}
