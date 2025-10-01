import { FacebookLoginButton } from "@/components/FacebookLoginButton";
import { Heart } from "lucide-react";

export default function Login() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="bg-primary/10 p-4 rounded-full">
              <Heart className="w-12 h-12 text-primary" />
            </div>
          </div>
          
          <h1 className="font-display font-bold text-4xl text-foreground">
            Welcome to Twangle
          </h1>
          
          <p className="text-lg text-muted-foreground max-w-sm mx-auto">
            Your relationship coaching companion.
          </p>
        </div>

        <div className="pt-6 space-y-2">
          <h2 className="font-semibold text-foreground">What you'll get:</h2>
          <ul className="text-sm text-muted-foreground space-y-2 max-w-xs mx-auto">
            <li>✓ Personalized AI relationship coaching</li>
            <li>✓ Science-based exercises and activities</li>
            <li>✓ DIY Couples retreat planning</li>
            <li>✓ Weekly progress summaries</li>
          </ul>
        </div>

        <div className="pt-8 flex flex-col items-center gap-4">
          <FacebookLoginButton />
          
          <p className="text-xs text-muted-foreground max-w-xs">
            By continuing, you agree to our <a href="/terms" className="text-primary underline" data-testid="link-terms">Terms of Service</a> and <a href="/privacy" className="text-primary underline" data-testid="link-privacy">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}
