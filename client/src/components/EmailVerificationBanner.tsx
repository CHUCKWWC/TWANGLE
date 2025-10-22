import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Mail, X } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface EmailVerificationBannerProps {
  emailVerified: boolean;
}

export function EmailVerificationBanner({ emailVerified }: EmailVerificationBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const { toast } = useToast();

  const sendVerificationMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/send-verification-email", {}),
    onSuccess: () => {
      toast({
        title: "Verification Email Sent",
        description: "Please check your inbox and click the verification link.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send verification email",
        variant: "destructive",
      });
    },
  });

  if (emailVerified || dismissed) {
    return null;
  }

  return (
    <Alert className="mb-4 border-primary/20 bg-primary/5" data-testid="banner-email-verification">
      <Mail className="h-4 w-4 text-primary" />
      <AlertDescription className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <p className="font-medium">Verify your email address</p>
          <p className="text-sm text-muted-foreground mt-1">
            Please verify your email to receive important updates and unlock all features.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => sendVerificationMutation.mutate()}
            disabled={sendVerificationMutation.isPending}
            data-testid="button-send-verification"
          >
            {sendVerificationMutation.isPending ? "Sending..." : "Send Verification Email"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setDismissed(true)}
            data-testid="button-dismiss-banner"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
