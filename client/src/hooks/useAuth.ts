// Reference: blueprint:javascript_log_in_with_replit
import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const isAnonymous = (user as any)?.isAnonymous === true;

  return {
    user,
    isLoading,
    isAuthenticated: !!user && !isAnonymous,
  };
}
