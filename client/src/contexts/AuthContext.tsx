import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface User {
  id: string;
  name: string | null;
  email: string | null;
  profilePicture: string | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (facebookResponse: any) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const { data: userData, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  useEffect(() => {
    if (userData && !userData.isAnonymous) {
      setUser({
        id: userData.id,
        name: userData.firstName && userData.lastName ? `${userData.firstName} ${userData.lastName}` : userData.firstName || userData.email || '',
        email: userData.email,
        profilePicture: userData.profileImageUrl,
      });
    }
  }, [userData]);

  const loginMutation = useMutation({
    mutationFn: async (facebookResponse: any) => {
      const response = await apiRequest("POST", "/api/auth/facebook", {
        accessToken: facebookResponse.authResponse.accessToken,
        userID: facebookResponse.authResponse.userID,
        name: facebookResponse.name,
        email: facebookResponse.email,
        picture: facebookResponse.picture,
      });
      const data = await response.json();
      return data as { user: User };
    },
    onSuccess: (data) => {
      setUser({
        id: data.user.id,
        name: data.user.firstName && data.user.lastName ? `${data.user.firstName} ${data.user.lastName}` : data.user.firstName || data.user.email || '',
        email: data.user.email,
        profilePicture: data.user.profileImageUrl,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout", {});
    },
    onSuccess: () => {
      setUser(null);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
  });

  const login = async (facebookResponse: any) => {
    await loginMutation.mutateAsync(facebookResponse);
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
