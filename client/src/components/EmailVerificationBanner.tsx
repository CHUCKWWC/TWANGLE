import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface EmailVerificationBannerProps {
  emailVerified: boolean;
}

export function EmailVerificationBanner({ emailVerified }: EmailVerificationBannerProps) {
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

  if (emailVerified) {
    return null;
  }

  return (
    <Button
      size="sm"
      onClick={() => sendVerificationMutation.mutate()}
      disabled={sendVerificationMutation.isPending}
      data-testid="button-send-verification"
      className="gap-2"
    >
      <Mail className="h-4 w-4" />
      {sendVerificationMutation.isPending ? "Sending..." : "Verify Your Email"}
    </Button>
  );
}
