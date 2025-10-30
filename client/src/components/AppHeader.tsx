import { useLocation, Link } from "wouter";
import { FileText, BookOpen, BarChart3, TrendingUp, LogIn } from "lucide-react";
import { FeedbackButton } from "@/components/FeedbackButton";
import ThemeToggle from "@/components/ThemeToggle";
import { UserMenu } from "@/components/UserMenu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { isAdminUser } from "@shared/adminAccess";

export function AppHeader() {
  const [location] = useLocation();
  const { user } = useAuth();
  const isWelcome = location === "/";
  const isAnonymous = (user as any)?.isAnonymous;
  const showReports = isAdminUser(user?.email);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 ${isWelcome ? 'bg-transparent' : 'bg-background/80 backdrop-blur-md border-b border-border'}`}>
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {!isWelcome && (
          <div className="flex items-center gap-6">
            <Link 
              href="/" 
              className="font-display font-semibold text-xl text-primary hover-elevate px-2 py-1 rounded" 
              data-testid="link-home"
            >
              Twangle
            </Link>
            <Link 
              href="/exercises" 
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground hover-elevate px-3 py-2 rounded" 
              data-testid="link-exercises"
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
                >
                  <BarChart3 className="w-4 h-4" />
                  Reports
                </Link>
                <Link 
                  href="/analytics" 
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground hover-elevate px-3 py-2 rounded" 
                  data-testid="link-analytics"
                >
                  <TrendingUp className="w-4 h-4" />
                  Analytics
                </Link>
              </>
            )}
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
