// Reference: blueprint:javascript_log_in_with_replit
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Brain, Users, Map, BookOpen, Shield, Sparkles, CheckCircle2 } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <div className="relative flex-1 flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-secondary/10 min-h-screen">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=1920&h=1080&fit=crop')] bg-cover bg-center opacity-20" />
        
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-20 text-center">
          <div className="flex items-center justify-center mb-8">
            <Heart className="w-16 h-16 text-primary" />
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-foreground font-[Poppins]">
            Twangle
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-4 font-[Poppins] font-medium">
            Two Tangled Together
          </p>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
            Strengthen your relationship with AI-powered coaching, personalized retreats, and science-backed tools. 
            Understand your patterns. Deepen your connection.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Button
              asChild
              size="lg"
              className="text-lg px-8 py-6 rounded-xl"
              data-testid="button-login"
            >
              <a href="/api/login">
                Start Your Journey
              </a>
            </Button>
            
            <Button
              asChild
              size="lg"
              variant="outline"
              className="text-lg px-8 py-6 rounded-xl"
              data-testid="button-learn-more"
            >
              <a href="#how-it-works">
                Learn More
              </a>
            </Button>
          </div>

          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>Private & Secure</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>AI Personalized</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Research-Backed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 px-6 bg-card">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 font-[Poppins]">
            Everything You Need for Connection
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Designed with relationship psychology and attachment theory to create meaningful growth together.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="hover-elevate">
              <CardContent className="p-6">
                <div className="w-12 h-12 mb-4 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Brain className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3 font-[Poppins]">Attachment Assessment</h3>
                <p className="text-muted-foreground">
                  Discover your attachment style with a research-backed 20-question assessment. 
                  Understand how you connect and what you need to thrive.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardContent className="p-6">
                <div className="w-12 h-12 mb-4 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3 font-[Poppins]">AI Coach Charles</h3>
                <p className="text-muted-foreground">
                  Get personalized guidance from an AI trained in Gottman Method, EFT, and Attachment Theory. 
                  Available 24/7 for your relationship questions.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardContent className="p-6">
                <div className="w-12 h-12 mb-4 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Map className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3 font-[Poppins]">DIY Couples Retreats</h3>
                <p className="text-muted-foreground">
                  Create personalized retreat itineraries tailored to your goals, vibe, and budget. 
                  AI-powered planning for meaningful getaways.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardContent className="p-6">
                <div className="w-12 h-12 mb-4 rounded-xl bg-primary/10 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3 font-[Poppins]">Science-Based Exercises</h3>
                <p className="text-muted-foreground">
                  Access a curated library of relationship-building activities grounded in research. 
                  Build communication, trust, and intimacy.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardContent className="p-6">
                <div className="w-12 h-12 mb-4 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3 font-[Poppins]">Weekly Summaries</h3>
                <p className="text-muted-foreground">
                  Get AI-generated coaching session summaries with actionable insights and next steps. 
                  Track your progress over time.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardContent className="p-6">
                <div className="w-12 h-12 mb-4 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3 font-[Poppins]">Private & Secure</h3>
                <p className="text-muted-foreground">
                  Your relationship data stays private with enterprise-grade security. 
                  Built on trust and confidentiality.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div id="how-it-works" className="py-20 px-6 bg-background">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 font-[Poppins]">
            Get Started in Minutes
          </h2>
          <p className="text-center text-muted-foreground mb-16">
            Our guided experience creates a personalized journey just for you
          </p>

          <div className="space-y-12">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="flex-shrink-0 w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold">
                1
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-semibold mb-3 font-[Poppins]">Take the Assessment</h3>
                <p className="text-muted-foreground mb-4">
                  Complete our 20-question attachment style assessment to understand your relationship patterns. 
                  Discover whether you lean Secure, Anxious, Avoidant, or Fearful-Avoidant.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm px-3 py-1 rounded-full bg-primary/10 text-primary">5-7 minutes</span>
                  <span className="text-sm px-3 py-1 rounded-full bg-primary/10 text-primary">Research-backed</span>
                  <span className="text-sm px-3 py-1 rounded-full bg-primary/10 text-primary">Private results</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="flex-shrink-0 w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold">
                2
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-semibold mb-3 font-[Poppins]">Talk to Coach Charles</h3>
                <p className="text-muted-foreground mb-4">
                  Get personalized guidance from our AI relationship coach trained in proven methods: Gottman Method, 
                  Emotionally Focused Therapy, and Attachment Theory. Ask anything, anytime.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm px-3 py-1 rounded-full bg-primary/10 text-primary">24/7 available</span>
                  <span className="text-sm px-3 py-1 rounded-full bg-primary/10 text-primary">Evidence-based</span>
                  <span className="text-sm px-3 py-1 rounded-full bg-primary/10 text-primary">Judgment-free</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="flex-shrink-0 w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold">
                3
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-semibold mb-3 font-[Poppins]">Build Your Connection</h3>
                <p className="text-muted-foreground mb-4">
                  Plan personalized couples retreats, explore research-backed exercises, and track your progress with 
                  weekly coaching summaries. Build the relationship you both deserve.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm px-3 py-1 rounded-full bg-primary/10 text-primary">Custom retreats</span>
                  <span className="text-sm px-3 py-1 rounded-full bg-primary/10 text-primary">Exercises library</span>
                  <span className="text-sm px-3 py-1 rounded-full bg-primary/10 text-primary">Progress tracking</span>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-16">
            <Button
              asChild
              size="lg"
              className="text-lg px-8 py-6 rounded-xl"
              data-testid="button-get-started-bottom"
            >
              <a href="/api/login">
                Get Started Free
              </a>
            </Button>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="py-20 px-6 bg-card">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 font-[Poppins]">
            Couples Are Growing Together
          </h2>
          <p className="text-center text-muted-foreground mb-12">
            Real stories from real relationships
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground mb-4 italic">
                  "The attachment assessment was eye-opening. We finally understand why we were talking past each other. 
                  Coach Charles helped us find our way back."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Heart className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Sarah & Mike</p>
                    <p className="text-sm text-muted-foreground">Together 7 years</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground mb-4 italic">
                  "The DIY retreat builder helped us plan the perfect weekend getaway. The AI-generated itinerary 
                  was thoughtful and actually worked for our budget."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Heart className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">James & Alex</p>
                    <p className="text-sm text-muted-foreground">Together 3 years</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground mb-4 italic">
                  "Having access to research-backed exercises has been game-changing. We work through one each week 
                  and our communication has improved so much."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Heart className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Priya & Jordan</p>
                    <p className="text-sm text-muted-foreground">Together 5 years</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Final CTA Section */}
      <div className="py-20 px-6 bg-gradient-to-br from-primary/20 via-background to-secondary/10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 font-[Poppins]">
            Ready to Start the Conversation?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of couples growing together with Twangle. Start with a free assessment and 
            discover your attachment style today.
          </p>
          
          <Button
            asChild
            size="lg"
            className="text-lg px-8 py-6 rounded-xl mb-6"
            data-testid="button-cta-final"
          >
            <a href="/api/login">
              Start Your Free Assessment
            </a>
          </Button>

          <p className="text-sm text-muted-foreground">
            Private & secure • No credit card required • Research-backed tools
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border bg-card">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-primary" />
            <span className="font-semibold">Twangle</span>
            <span className="text-muted-foreground text-sm">Two Tangled Together</span>
          </div>
          
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="/terms" className="hover:text-foreground transition-colors" data-testid="link-terms">
              Terms of Service
            </a>
            <a href="/privacy" className="hover:text-foreground transition-colors" data-testid="link-privacy">
              Privacy Policy
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
