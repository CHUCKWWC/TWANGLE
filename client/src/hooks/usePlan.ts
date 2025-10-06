import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";

export type PlanTier = "free" | "premium";

export interface PlanStatus {
  tier: PlanTier;
  isActive: boolean;
  hasLifetimeAccess: boolean;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
}

export function usePlan() {
  const { user, isAuthenticated } = useAuth();

  const { data, isLoading, error } = useQuery<PlanStatus>({
    queryKey: ["/api/billing/status"],
    enabled: isAuthenticated && !!user,
  });

  const tier: PlanTier = data?.tier || "free";
  const hasAccess = data?.hasLifetimeAccess || data?.isActive || false;

  return {
    tier,
    hasAccess,
    isActive: data?.isActive || false,
    hasLifetimeAccess: data?.hasLifetimeAccess || false,
    currentPeriodEnd: data?.currentPeriodEnd,
    cancelAtPeriodEnd: data?.cancelAtPeriodEnd,
    isLoading,
    error,
  };
}
