import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { XCircle } from "lucide-react";
import { Link } from "wouter";

export default function PayCancel() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="bg-orange-500/10 p-4 rounded-full">
              <XCircle className="w-16 h-16 text-orange-500" />
            </div>
          </div>
          <div>
            <CardTitle className="font-display text-3xl">
              Payment Cancelled
            </CardTitle>
            <CardDescription className="text-base mt-2">
              No charges were made to your account
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <p className="text-sm text-center text-muted-foreground">
            Your subscription was not activated. You can try again anytime you're ready.
          </p>

          <div className="flex flex-col gap-3">
            <Link href="/paywall">
              <Button className="w-full" variant="default" size="lg" data-testid="button-try-again">
                Try Again
              </Button>
            </Link>
            <Link href="/">
              <Button className="w-full" variant="ghost" size="lg" data-testid="button-back-home">
                Back to Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
