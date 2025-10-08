import { useLocation, Link } from "wouter";
import { FileText, BookOpen, BarChart3 } from "lucide-react";
import { FeedbackButton } from "@/components/FeedbackButton";
import ThemeToggle from "@/components/ThemeToggle";
import { UserMenu } from "@/components/UserMenu";

export function AppHeader() {
  const [location] = useLocation();
  const isWelcome = location === "/";

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
              href="/summaries" 
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground hover-elevate px-3 py-2 rounded" 
              data-testid="link-summaries"
            >
              <FileText className="w-4 h-4" />
              Summaries
            </Link>
            <Link 
              href="/exercises" 
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground hover-elevate px-3 py-2 rounded" 
              data-testid="link-exercises"
            >
              <BookOpen className="w-4 h-4" />
              Exercises
            </Link>
            <Link 
              href="/reports" 
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground hover-elevate px-3 py-2 rounded" 
              data-testid="link-reports"
            >
              <BarChart3 className="w-4 h-4" />
              Reports
            </Link>
          </div>
        )}
        {isWelcome && <div />}
        <div className="flex items-center gap-3">
          <FeedbackButton />
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
