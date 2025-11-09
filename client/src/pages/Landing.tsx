// Reference: blueprint:javascript_log_in_with_replit
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Brain, Users, Map, BookOpen, Shield, Sparkles, CheckCircle2, MessageSquare, Calendar } from "lucide-react";
import { FeatureCard } from "@/components/FeatureCard";
import { SEO, SEO_CONTENT } from "@/components/SEO";
import { StructuredData, ORGANIZATION_SCHEMA, SERVICE_SCHEMA } from "@/components/StructuredData";
import { useQuery } from "@tanstack/react-query";
import { ExitIntentPopup } from "@/components/ExitIntentPopup";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { CoachDemo } from "@/components/CoachDemo";
import { AssessmentPreview } from "@/components/AssessmentPreview";
import { RetreatPreview } from "@/components/RetreatPreview";

interface SocialProofStats {
  userCount: number;
  messageCount: number;
  avgRating: number;
  feedbackCount: number;
}

export default function Landing() {
  const { data: stats } = useQuery<SocialProofStats>({
    queryKey: ['/api/social-proof'],
    staleTime: 300000, // Cache for 5 minutes
  });

  return (
    <>
      <SEO {...SEO_CONTENT.home} />
      <StructuredData data={ORGANIZATION_SCHEMA} />
      <StructuredData data={SERVICE_SCHEMA} />
      
      {/* Skip to content link for accessibility */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
        data-testid="link-skip-to-content"
      >
        Skip to main content
      </a>

      <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <div id="main-content" className="relative flex-1 flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-secondary/10 min-h-screen">
        <div 
          className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=1920&h=1080&fit=crop')] bg-cover bg-center opacity-20" 
          role="img"
          aria-label="Background image of couple holding hands together"
        />
        
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-20 text-center">
          <div className="flex items-center justify-center mb-8">
            <img 
              src="/twangle-logo.png" 
              alt="Twangle - Two Tangled Together" 
              className="h-40 md:h-48 w-auto"
            />
          </div>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Strengthen your relationship with AI-powered coaching, personalized retreats, and science-backed tools. 
            Understand your relationship patterns. Deepen your connection.
          </p>

          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-8 max-w-md mx-auto">
            <p className="text-sm font-medium text-foreground">
              ✨ Start your 7-day free trial — then only $19.99/month
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Full access to AI coaching, assessments, retreat planning, and exercises. No credit card required to start. Cancel anytime.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Button
              asChild
              size="lg"
              className="text-lg px-8 py-6 rounded-xl"
              data-testid="button-get-started"
            >
              <a href="/login">
                Get Started Free
              </a>
            </Button>
            
            <Button
              asChild
              size="lg"
              variant="outline"
              className="text-lg px-8 py-6 rounded-xl"
              data-testid="button-login"
            >
              <a href="/login">
                Sign In
              </a>
            </Button>
          </div>

          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" aria-hidden="true" />
              <span>Private & Secure</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" aria-hidden="true" />
              <span>AI Personalized</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
              <span>Research-Backed</span>
            </div>
          </div>

          {stats && (
            <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto" data-testid="social-proof-stats" role="region" aria-label="Social proof statistics">
              <div className="bg-card/80 backdrop-blur border border-border rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-primary mb-1" data-testid="stat-user-count" aria-label={`${stats.userCount} couples growing together`}>
                  {stats.userCount.toLocaleString()}+
                </div>
                <div className="text-sm text-muted-foreground">
                  Couples Growing Together
                </div>
              </div>
              <div className="bg-card/80 backdrop-blur border border-border rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-primary mb-1" data-testid="stat-message-count" aria-label={`${stats.messageCount} coaching conversations`}>
                  {stats.messageCount.toLocaleString()}+
                </div>
                <div className="text-sm text-muted-foreground">
                  Coaching Conversations
                </div>
              </div>
              <div className="bg-card/80 backdrop-blur border border-border rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-primary mb-1" data-testid="stat-avg-rating" aria-label={`${stats.avgRating} out of 5 average user rating`}>
                  {stats.avgRating}/5
                </div>
                <div className="text-sm text-muted-foreground">
                  Average User Rating
                </div>
              </div>
            </div>
          )}
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
            <FeatureCard
              icon={Brain}
              title="Attachment Assessment"
              description="Discover your attachment style with a research-backed 20-question assessment. Understand how you connect and what you need to thrive."
              destination="/assessment"
              isPremium={false}
              testId="card-assessment"
            />

            <FeatureCard
              icon={Users}
              title="AI Coach Charles"
              description="Get unlimited personalized guidance from an AI trained in Gottman Method, EFT, and Attachment Theory. Save all your conversations."
              destination="/coach"
              isPremium={true}
              testId="card-coach"
            />

            <FeatureCard
              icon={Map}
              title="DIY Couples Retreats"
              description="Create and save personalized retreat itineraries tailored to your goals, vibe, and budget. Build your perfect getaway together."
              destination="/retreat"
              isPremium={true}
              testId="card-retreat"
            />

            <FeatureCard
              icon={BookOpen}
              title="Science-Based Exercises"
              description="Access a curated library of relationship-building activities grounded in research. Build communication, trust, and intimacy."
              destination="/exercises"
              isPremium={false}
              testId="card-exercises"
            />

            <FeatureCard
              icon={Sparkles}
              title="Weekly Summaries"
              description="Get AI-generated coaching session summaries with actionable insights and next steps. Track your progress over time."
              destination="/summaries"
              isPremium={true}
              testId="card-summaries"
            />

            <FeatureCard
              icon={MessageSquare}
              title="Daily Conversations"
              description="Answer therapy-informed questions together with your partner. Deepen connection through honest, double-blind responses. 3 free, unlimited with premium."
              destination="/conversations"
              isPremium={false}
              testId="card-conversations"
            />

            <FeatureCard
              icon={Calendar}
              title="40dayTwangle Challenge"
              description="A transformative 40-day faith-based journey with daily scripture teachings, action prompts, and reflection questions. Strengthen your relationship one day at a time."
              destination="/40day"
              isPremium={true}
              testId="card-40daytwangle"
            />

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

      {/* Comparison Table Section */}
      <div className="py-20 px-6 bg-background">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 font-[Poppins]">
            Why Couples Choose Twangle
          </h2>
          <p className="text-center text-muted-foreground mb-12">
            Get professional relationship guidance at a fraction of the cost
          </p>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse" data-testid="comparison-table" role="table" aria-label="Comparison between Traditional Therapy and Twangle">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-4 px-6 text-left font-semibold">Feature</th>
                  <th className="py-4 px-6 text-center font-semibold">Traditional Therapy</th>
                  <th className="py-4 px-6 text-center font-semibold text-primary">Twangle</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border hover-elevate">
                  <td className="py-4 px-6 font-medium">Cost</td>
                  <td className="py-4 px-6 text-center text-muted-foreground">$150-300/session</td>
                  <td className="py-4 px-6 text-center text-primary font-semibold">$19.99/month</td>
                </tr>
                <tr className="border-b border-border hover-elevate">
                  <td className="py-4 px-6 font-medium">Availability</td>
                  <td className="py-4 px-6 text-center text-muted-foreground">Weekly appointments</td>
                  <td className="py-4 px-6 text-center text-primary font-semibold">24/7 instant access</td>
                </tr>
                <tr className="border-b border-border hover-elevate">
                  <td className="py-4 px-6 font-medium">Wait Time</td>
                  <td className="py-4 px-6 text-center text-muted-foreground">2-4 weeks</td>
                  <td className="py-4 px-6 text-center text-primary font-semibold">Instant</td>
                </tr>
                <tr className="border-b border-border hover-elevate">
                  <td className="py-4 px-6 font-medium">Focus</td>
                  <td className="py-4 px-6 text-center text-muted-foreground">Individual or couples</td>
                  <td className="py-4 px-6 text-center text-primary font-semibold">Couples-specific</td>
                </tr>
                <tr className="border-b border-border hover-elevate">
                  <td className="py-4 px-6 font-medium">Progress Tracking</td>
                  <td className="py-4 px-6 text-center text-muted-foreground">Manual notes</td>
                  <td className="py-4 px-6 text-center text-primary font-semibold">Automated insights</td>
                </tr>
                <tr className="hover-elevate">
                  <td className="py-4 px-6 font-medium">Exercises & Tools</td>
                  <td className="py-4 px-6 text-center text-muted-foreground">Limited homework</td>
                  <td className="py-4 px-6 text-center text-primary font-semibold">Full library + AI coach</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="text-center mt-8">
            <p className="text-sm text-muted-foreground mb-4">
              Note: Twangle complements but does not replace clinical therapy for serious mental health concerns
            </p>
            <div className="mb-4">
              <p className="text-lg font-semibold mb-1">
                7 days free, then $19.99/month
              </p>
              <p className="text-sm text-muted-foreground">
                Cancel anytime. No hidden fees.
              </p>
            </div>
            <Button
              asChild
              size="lg"
              className="px-8 py-6"
              data-testid="button-start-trial-comparison"
            >
              <a href="/login">
                Start Your Free Trial
              </a>
            </Button>
          </div>
        </div>
      </div>

      {/* Coach Demo Section */}
      <div className="py-20 px-6 bg-card">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 font-[Poppins]">
              Experience Coach Charles
            </h2>
            <p className="text-muted-foreground">
              See how AI-powered relationship coaching works. Try 3 free messages - no signup required.
            </p>
          </div>
          <CoachDemo />
        </div>
      </div>

      {/* Assessment Preview Section */}
      <div className="py-20 px-6 bg-background">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 font-[Poppins]">
              Try the Attachment Assessment
            </h2>
            <p className="text-muted-foreground">
              Experience a preview of our research-backed attachment style assessment. Answer 3 sample questions to see how it works.
            </p>
          </div>
          <AssessmentPreview />
        </div>
      </div>

      {/* Retreat Preview Section */}
      <div className="py-20 px-6 bg-card">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 font-[Poppins]">
              Preview Retreat Planning
            </h2>
            <p className="text-muted-foreground">
              See how our AI creates personalized couples retreats tailored to your goals, budget, and preferences.
            </p>
          </div>
          <RetreatPreview />
        </div>
      </div>

      {/* How It Works Section */}
      <div id="how-it-works" className="py-20 px-6 bg-background">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 font-[Poppins]">
            Get Started in Minutes
          </h2>
          <p className="text-center text-muted-foreground mb-16">
            Start your free 7-day trial and transform your relationship together.
          </p>

          <div className="space-y-12">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="flex-shrink-0 w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold">
                1
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-semibold mb-3 font-[Poppins]">Create Your Free Account</h3>
                <p className="text-muted-foreground mb-4">
                  Sign up in seconds and start your 7-day free trial. No credit card required.
                  Access all premium features instantly—unlimited AI coaching, assessments, and more.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm px-3 py-1 rounded-full bg-primary/10 text-primary">7-day free trial</span>
                  <span className="text-sm px-3 py-1 rounded-full bg-primary/10 text-primary">No credit card</span>
                  <span className="text-sm px-3 py-1 rounded-full bg-primary/10 text-primary">Full access</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="flex-shrink-0 w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold">
                2
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-semibold mb-3 font-[Poppins]">Discover Your Patterns</h3>
                <p className="text-muted-foreground mb-4">
                  Take the attachment style assessment and get AI-analyzed results. Chat unlimited with Coach Charles,
                  trained in Gottman Method, Emotionally Focused Therapy, and Attachment Theory.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm px-3 py-1 rounded-full bg-primary/10 text-primary">Unlimited AI coach</span>
                  <span className="text-sm px-3 py-1 rounded-full bg-primary/10 text-primary">Saved progress</span>
                  <span className="text-sm px-3 py-1 rounded-full bg-primary/10 text-primary">Evidence-based</span>
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
                  Plan personalized couples retreats, explore research-backed exercises, and save all your progress.
                  Get weekly summaries and track your relationship growth over time.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm px-3 py-1 rounded-full bg-primary/10 text-primary">Retreat planning</span>
                  <span className="text-sm px-3 py-1 rounded-full bg-primary/10 text-primary">Weekly summaries</span>
                  <span className="text-sm px-3 py-1 rounded-full bg-primary/10 text-primary">Progress tracking</span>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-16">
            <div className="mb-4">
              <p className="text-lg font-semibold mb-1">
                7 days free, then $19.99/month
              </p>
              <p className="text-sm text-muted-foreground">
                Cancel anytime. All features included.
              </p>
            </div>
            <Button
              asChild
              size="lg"
              className="text-lg px-8 py-6 rounded-xl"
              data-testid="button-get-started-bottom"
            >
              <a href="/login">
                Start Your Free Trial
              </a>
            </Button>
          </div>
        </div>
      </div>

      {/* Newsletter Section */}
      <div className="py-20 px-6 bg-background">
        <div className="max-w-2xl mx-auto">
          <NewsletterSignup />
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

      {/* Privacy & Security Section */}
      <div className="py-20 px-6 bg-background">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 font-[Poppins]">
              Your Privacy Matters
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We understand that relationship conversations are deeply personal. Your data is protected with enterprise-grade security.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">End-to-End Encryption</h3>
                    <p className="text-sm text-muted-foreground">
                      All your conversations, assessments, and journal entries are encrypted in transit and at rest using industry-standard TLS/SSL protocols.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Private by Default</h3>
                    <p className="text-sm text-muted-foreground">
                      Your data belongs to you. We never sell your personal information to third parties or use it for advertising purposes.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Secure Infrastructure</h3>
                    <p className="text-sm text-muted-foreground">
                      Hosted on enterprise-grade cloud infrastructure with automatic backups, 24/7 monitoring, and regular security audits.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">You Control Your Data</h3>
                    <p className="text-sm text-muted-foreground">
                      Export or delete your data anytime. You decide what to share with your partner and can revoke access instantly.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Learn more about how we protect your privacy in our{" "}
              <a href="/privacy" className="text-primary hover:underline font-medium" data-testid="link-privacy-details">
                Privacy Policy
              </a>
              {" "}and{" "}
              <a href="/terms" className="text-primary hover:underline font-medium" data-testid="link-terms-details">
                Terms of Service
              </a>
            </p>
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
          
          <div className="mb-6">
            <p className="text-lg font-semibold mb-1">
              7 days free, then $19.99/month
            </p>
            <p className="text-sm text-muted-foreground">
              Cancel anytime. All features included.
            </p>
          </div>

          <Button
            asChild
            size="lg"
            className="text-lg px-8 py-6 rounded-xl mb-6"
            data-testid="button-cta-final"
          >
            <a href="/login">
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
            <a href="/faq" className="hover:text-foreground transition-colors" data-testid="link-faq">
              FAQ
            </a>
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
    <ExitIntentPopup />
    </>
  );
}
