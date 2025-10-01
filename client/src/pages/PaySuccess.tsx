import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import { Link } from "wouter";

export default function PaySuccess() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="bg-green-500/10 p-4 rounded-full">
              <CheckCircle2 className="w-16 h-16 text-green-500" />
            </div>
          </div>
          <div>
            <CardTitle className="font-display text-3xl">
              Welcome to Twangle!
            </CardTitle>
            <CardDescription className="text-base mt-2">
              Your subscription is now active
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              You now have full access to:
            </p>
            <ul className="text-sm space-y-1">
              <li>✓ AI relationship coaching</li>
              <li>✓ Attachment assessments</li>
              <li>✓ DIY retreat planning</li>
              <li>✓ Weekly summaries</li>
            </ul>
          </div>

          <Link href="/">
            <Button className="w-full" size="lg" data-testid="button-get-started">
              Get Started
            </Button>
          </Link>

          <p className="text-xs text-center text-muted-foreground">
            Your receipt has been sent to your email
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
