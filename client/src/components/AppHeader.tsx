import { useLocation, Link } from "wouter";
import { FileText, BookOpen, BarChart3, TrendingUp, LogIn, MessageCircle, Menu, X, MessageSquare } from "lucide-react";
import { FeedbackButton } from "@/components/FeedbackButton";
import ThemeToggle from "@/components/ThemeToggle";
import { UserMenu } from "@/components/UserMenu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { isAdminUser } from "@shared/adminAccess";
import { useState } from "react";

export function AppHeader() {
  const [location] = useLocation();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isWelcome = location === "/";
  const isAnonymous = (user as any)?.isAnonymous;
  const showReports = isAdminUser(user?.email);

  const navigationLinks = (
    <>
      <Link 
        href="/coach" 
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground hover-elevate px-3 py-2 rounded" 
        data-testid="link-coach"
        onClick={() => setMobileMenuOpen(false)}
      >
        <MessageCircle className="w-4 h-4" />
        Coach
        <Badge variant="default" className="text-xs">PREMIUM</Badge>
      </Link>
      <Link 
        href="/exercises" 
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground hover-elevate px-3 py-2 rounded" 
        data-testid="link-exercises"
        onClick={() => setMobileMenuOpen(false)}
      >
        <BookOpen className="w-4 h-4" />
        Exercises
        <Badge variant="secondary" className="text-xs">FREE</Badge>
      </Link>
      {!isAnonymous && (
        <Link 
          href="/summaries" 
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground hover-elevate px-3 py-2 rounded" 
          data-testid="link-summaries"
          onClick={() => setMobileMenuOpen(false)}
        >
          <FileText className="w-4 h-4" />
          Summaries
          <Badge variant="default" className="text-xs">PREMIUM</Badge>
        </Link>
      )}
      {showReports && (
        <>
          <Link 
            href="/reports" 
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground hover-elevate px-3 py-2 rounded" 
            data-testid="link-reports"
            onClick={() => setMobileMenuOpen(false)}
          >
            <BarChart3 className="w-4 h-4" />
            Reports
          </Link>
          <Link 
            href="/analytics" 
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground hover-elevate px-3 py-2 rounded" 
            data-testid="link-analytics"
            onClick={() => setMobileMenuOpen(false)}
          >
            <TrendingUp className="w-4 h-4" />
            Analytics
          </Link>
          <Link 
            href="/feedback-report" 
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground hover-elevate px-3 py-2 rounded" 
            data-testid="link-feedback-report"
            onClick={() => setMobileMenuOpen(false)}
          >
            <MessageSquare className="w-4 h-4" />
            Feedback
          </Link>
        </>
      )}
    </>
  );

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 ${isWelcome ? 'bg-transparent' : 'bg-background/80 backdrop-blur-md border-b border-border'}`}>
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {!isWelcome && (
          <div className="flex items-center gap-3 md:gap-6">
            <Link 
              href="/" 
              className="font-display font-semibold text-xl text-primary hover-elevate px-2 py-1 rounded" 
              data-testid="link-home"
            >
              Twangle
            </Link>
            
            {/* Mobile hamburger menu - visible on screens < 768px */}
            <div className="md:hidden">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    data-testid="button-mobile-menu"
                    aria-label="Open navigation menu"
                    aria-expanded={mobileMenuOpen}
                  >
                    {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px]">
                  <div className="flex flex-col gap-4 mt-8">
                    <div className="font-display font-semibold text-lg mb-4">Navigation</div>
                    {navigationLinks}
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Desktop navigation - visible on screens >= 768px */}
            <div className="hidden md:flex items-center gap-6">
              {navigationLinks}
            </div>
          </div>
        )}
        {isWelcome && <div />}
        <div className="flex items-center gap-3">
          <FeedbackButton />
          <ThemeToggle />
          {isAnonymous ? (
            <Button asChild variant="default" size="sm" data-testid="button-login">
              <a href="/api/login">
                <LogIn className="w-4 h-4 mr-2" />
                Sign In
              </a>
            </Button>
          ) : (
            <UserMenu />
          )}
        </div>
      </div>
    </header>
  );
}
