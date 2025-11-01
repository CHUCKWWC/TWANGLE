import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";

export type PlanTier = "free" | "premium";

interface ApiPlanStatus {
  tier: PlanTier;
  isActive: boolean;
  hasLifetimeAccess: boolean;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  onTrial?: boolean;
  trialEndsAt?: string | null;
}

export interface PlanStatus {
  tier: PlanTier;
  isActive: boolean;
  hasLifetimeAccess: boolean;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd: boolean;
  onTrial?: boolean;
  trialEndsAt?: Date;
}

export function usePlan() {
  const { user, isAuthenticated } = useAuth();

  const { data: apiData, isLoading, error } = useQuery<ApiPlanStatus>({
    queryKey: ["/api/billing/status"],
    enabled: isAuthenticated && !!user,
  });

  const data: PlanStatus | undefined = apiData ? {
    tier: apiData.tier,
    isActive: apiData.isActive,
    hasLifetimeAccess: apiData.hasLifetimeAccess,
    currentPeriodEnd: apiData.currentPeriodEnd ? new Date(apiData.currentPeriodEnd) : undefined,
    cancelAtPeriodEnd: apiData.cancelAtPeriodEnd,
    onTrial: apiData.onTrial,
    trialEndsAt: apiData.trialEndsAt ? new Date(apiData.trialEndsAt) : undefined,
  } : undefined;

  const tier: PlanTier = data?.tier || "free";
  const hasAccess = data?.hasLifetimeAccess || data?.isActive || data?.onTrial || false;

  return {
    tier,
    hasAccess,
    isActive: data?.isActive || false,
    hasLifetimeAccess: data?.hasLifetimeAccess || false,
    currentPeriodEnd: data?.currentPeriodEnd,
    cancelAtPeriodEnd: data?.cancelAtPeriodEnd || false,
    onTrial: data?.onTrial || false,
    trialEndsAt: data?.trialEndsAt,
    isLoading,
    error,
  };
}
