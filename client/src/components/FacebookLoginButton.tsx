import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

declare global {
  interface Window {
    FB: any;
    fbAsyncInit: () => void;
  }
}

export function FacebookLoginButton() {
  const { login } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleFacebookLogin = () => {
    setIsLoading(true);
    
    if (!window.FB) {
      toast({
        title: "Error",
        description: "Facebook SDK not loaded. Please refresh the page.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    window.FB.login(
      (response: any) => {
        if (response.authResponse) {
          window.FB.api('/me', { fields: 'name,email,picture' }, async (userInfo: any) => {
            try {
              await login({
                authResponse: response.authResponse,
                name: userInfo.name,
                email: userInfo.email,
                picture: userInfo.picture,
              });
              toast({
                title: "Welcome!",
                description: `Logged in as ${userInfo.name}`,
              });
            } catch (error) {
              toast({
                title: "Login failed",
                description: "Failed to authenticate with Facebook. Please try again.",
                variant: "destructive",
              });
            } finally {
              setIsLoading(false);
            }
          });
        } else {
          toast({
            title: "Login cancelled",
            description: "Facebook login was cancelled.",
          });
          setIsLoading(false);
        }
      },
      { scope: 'public_profile,email' }
    );
  };

  return (
    <Button
      onClick={handleFacebookLogin}
      disabled={isLoading}
      size="lg"
      className="w-full max-w-sm bg-[#1877F2] hover:bg-[#166FE5] text-white"
      data-testid="button-facebook-login"
    >
      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
      {isLoading ? "Logging in..." : "Continue with Facebook"}
    </Button>
  );
}
