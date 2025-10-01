import { useEffect, useState } from "react";
import { useLocation } from "wouter";

export default function OAuthCallback() {
  const [, setLocation] = useLocation();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    const handleCallback = () => {
      setIsRedirecting(true);
      
      setTimeout(() => {
        if (window.opener) {
          window.close();
        } else {
          setLocation("/");
        }
      }, 1000);
    };

    handleCallback();
  }, [setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background" data-testid="oauth-callback-page">
      <div className="text-center space-y-4">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary" data-testid="loading-spinner"></div>
        <p className="text-muted-foreground" data-testid="text-auth-message">
          {isRedirecting ? "Completing authentication..." : "Loading..."}
        </p>
      </div>
    </div>
  );
}
