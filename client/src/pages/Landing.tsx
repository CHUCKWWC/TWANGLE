// Reference: blueprint:javascript_log_in_with_replit
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <div className="relative flex-1 flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-secondary/10">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=1920&h=1080&fit=crop')] bg-cover bg-center opacity-20" />
        
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-20 text-center">
          {/* Logo */}
          <div className="flex items-center justify-center mb-8">
            <Heart className="w-16 h-16 text-primary" />
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-foreground font-[Poppins]">
            Twangle
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-4 font-[Poppins] font-medium">
            Two Tangled Together
          </p>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
            Strengthen your relationship with AI-powered coaching based on proven methods
            from the Gottman Institute, Emotionally Focused Therapy, and Attachment Theory.
          </p>

          {/* CTA Button */}
          <Button
            asChild
            size="lg"
            className="text-lg px-8 py-6 rounded-xl"
            data-testid="button-login"
          >
            <a href="/api/login">
              Get Started
            </a>
          </Button>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 px-6 bg-card">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 font-[Poppins]">
            Relationship Tools Built on Science
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-2xl bg-background">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-3xl">🧭</span>
              </div>
              <h3 className="text-xl font-semibold mb-3 font-[Poppins]">Attachment Assessment</h3>
              <p className="text-muted-foreground">
                Discover your attachment style and understand your relationship patterns
              </p>
            </div>

            <div className="text-center p-6 rounded-2xl bg-background">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-3xl">💬</span>
              </div>
              <h3 className="text-xl font-semibold mb-3 font-[Poppins]">AI Coach Charles</h3>
              <p className="text-muted-foreground">
                Get personalized guidance from an AI trained in evidence-based relationship therapy
              </p>
            </div>

            <div className="text-center p-6 rounded-2xl bg-background">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-3xl">🌱</span>
              </div>
              <h3 className="text-xl font-semibold mb-3 font-[Poppins]">Growth Tools</h3>
              <p className="text-muted-foreground">
                Weekly summaries, exercises, and custom retreat planning for couples
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
