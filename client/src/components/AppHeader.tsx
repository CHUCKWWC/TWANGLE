import { useLocation, Link } from "wouter";
import { FileText, BookOpen, BarChart3, TrendingUp, LogIn, MessageCircle, Menu, Heart, Users, Activity, Sparkles, MessageSquare, Shield, Calendar, Mountain, Zap } from "lucide-react";
import { FeedbackButton } from "@/components/FeedbackButton";
import ThemeToggle from "@/components/ThemeToggle";
import { UserMenu } from "@/components/UserMenu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { isAdminUser } from "@shared/adminAccess";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function AppHeader() {
  const [location] = useLocation();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isAnonymous = (user as any)?.isAnonymous;
  const isWelcome = location === "/" && isAnonymous;
  const showReports = isAdminUser(user?.email);

  const NavButton = ({ href, icon: Icon, label, badge }: any) => {
    const isActive = location === href;
    return (
      <Link href={href}>
        <Button
          variant={isActive ? "default" : "ghost"}
          size="sm"
          className={cn(
            "gap-2",
            !isActive && "text-muted-foreground hover:text-foreground"
          )}
          data-testid={`link-${href.replace(/\//g, '') || 'home'}`}
        >
          <Icon className="h-4 w-4" />
          {label}
          {badge && <Badge variant={badge.variant} className="text-xs ml-1">{badge.text}</Badge>}
        </Button>
      </Link>
    );
  };

  const MobileNavLink = ({ href, icon: Icon, label, badge, onClick }: any) => {
    const isActive = location === href;
    return (
      <Link href={href}>
        <a
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-md text-sm transition-colors hover-elevate",
            isActive 
              ? "bg-accent text-accent-foreground font-medium" 
              : "text-muted-foreground hover:text-foreground"
          )}
          onClick={onClick}
        >
          <Icon className="h-4 w-4" />
          <span className="flex-1">{label}</span>
          {badge && <Badge variant={badge.variant} className="text-xs">{badge.text}</Badge>}
        </a>
      </Link>
    );
  };

  const MobileNav = () => (
    <div className="flex flex-col gap-1 mt-6">
      <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Main Features
      </div>
      <MobileNavLink 
        href="/coach" 
        icon={MessageCircle} 
        label="AI Coach" 
        badge={{ text: "PREMIUM", variant: "default" }}
        onClick={() => setMobileMenuOpen(false)}
      />
      <MobileNavLink 
        href="/exercises" 
        icon={BookOpen} 
        label="Exercises" 
        badge={{ text: "FREE", variant: "secondary" }}
        onClick={() => setMobileMenuOpen(false)}
      />
      
      <div className="px-4 py-2 mt-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Programs & Activities
      </div>
          <MobileNavLink 
            href="/datenight" 
            icon={Heart} 
            label="Date Night Planner" 
            badge={{ text: "FREE", variant: "secondary" }}
            onClick={() => setMobileMenuOpen(false)}
          />
          <MobileNavLink 
            href="/40day" 
            icon={Zap} 
            label="40-Day Twangle" 
            badge={{ text: "NEW", variant: "destructive" }}
            onClick={() => setMobileMenuOpen(false)}
          />
          <MobileNavLink 
            href="/retreat" 
            icon={Mountain} 
            label="Retreat Builder" 
            badge={{ text: "PREMIUM", variant: "default" }}
            onClick={() => setMobileMenuOpen(false)}
          />
          
          <div className="px-4 py-2 mt-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Track & Analyze
          </div>
          <MobileNavLink 
            href="/health-score" 
            icon={Heart} 
            label="Health Score" 
            badge={{ text: "PREMIUM", variant: "default" }}
            onClick={() => setMobileMenuOpen(false)}
          />
          <MobileNavLink 
            href="/insights" 
            icon={TrendingUp} 
            label="Insights" 
            badge={{ text: "PREMIUM", variant: "default" }}
            onClick={() => setMobileMenuOpen(false)}
          />
          <MobileNavLink 
            href="/summaries" 
            icon={FileText} 
            label="Summaries" 
            badge={{ text: "PREMIUM", variant: "default" }}
            onClick={() => setMobileMenuOpen(false)}
          />
          
          <div className="px-4 py-2 mt-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Connect & Share
          </div>
          <MobileNavLink 
            href="/partner-connection" 
            icon={Users} 
            label="Partner Connection" 
            badge={{ text: "PREMIUM", variant: "default" }}
            onClick={() => setMobileMenuOpen(false)}
          />
          <MobileNavLink 
            href="/journal" 
            icon={Activity} 
            label="Journal" 
            badge={{ text: "PREMIUM", variant: "default" }}
            onClick={() => setMobileMenuOpen(false)}
          />
          <MobileNavLink 
            href="/conversations" 
            icon={MessageSquare} 
            label="Daily Conversations" 
            badge={{ text: "FREE", variant: "secondary" }}
            onClick={() => setMobileMenuOpen(false)}
          />

      {showReports && (
        <>
          <div className="px-4 py-2 mt-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Admin
          </div>
          <MobileNavLink 
            href="/admin" 
            icon={Shield} 
            label="Admin Panel"
            badge={{ text: "NEW", variant: "destructive" }}
            onClick={() => setMobileMenuOpen(false)}
          />
          <MobileNavLink 
            href="/reports" 
            icon={BarChart3} 
            label="Reports"
            onClick={() => setMobileMenuOpen(false)}
          />
          <MobileNavLink 
            href="/analytics" 
            icon={TrendingUp} 
            label="Analytics"
            onClick={() => setMobileMenuOpen(false)}
          />
          <MobileNavLink 
            href="/feedback-report" 
            icon={MessageSquare} 
            label="Feedback"
            onClick={() => setMobileMenuOpen(false)}
          />
        </>
      )}
    </div>
  );

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 ${isWelcome ? 'bg-transparent' : 'bg-background/95 backdrop-blur-md border-b border-border'}`}>
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
        {!isWelcome && (
          <div className="flex items-center gap-4">
            <Link 
              href="/" 
              className="hover-elevate px-2 py-1 rounded shrink-0 flex items-center gap-2" 
              data-testid="link-home"
            >
              <img 
                src="/twangle-logo.png" 
                alt="Twangle - Two Tangled Together" 
                className="h-15 w-auto"
              />
            </Link>
            
            {/* Mobile hamburger menu */}
            <div className="lg:hidden">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    data-testid="button-mobile-menu"
                    aria-label="Open navigation menu"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] overflow-y-auto">
                  <div className="font-display font-semibold text-lg mb-2">Menu</div>
                  <MobileNav />
                </SheetContent>
              </Sheet>
            </div>

            {/* Desktop navigation */}
            <nav className="hidden lg:flex items-center gap-2">
              <NavButton 
                href="/coach" 
                icon={MessageCircle} 
                label="Coach" 
                badge={{ text: "PREMIUM", variant: "default" }}
              />
              <NavButton 
                href="/exercises" 
                icon={BookOpen} 
                label="Exercises" 
                badge={{ text: "FREE", variant: "secondary" }}
              />

              <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="gap-2 text-muted-foreground hover:text-foreground"
                        data-testid="dropdown-programs"
                      >
                        <Zap className="h-4 w-4" />
                        Programs & Activities
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                      <DropdownMenuLabel>Build Your Journey</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <Link href="/datenight">
                        <DropdownMenuItem className="gap-2 cursor-pointer" data-testid="link-datenight">
                          <Heart className="h-4 w-4 text-primary" />
                          <div className="flex-1">
                            <div className="font-medium">Date Night Planner</div>
                            <div className="text-xs text-muted-foreground">Create memorable experiences</div>
                          </div>
                          <Badge variant="secondary" className="text-xs">FREE</Badge>
                        </DropdownMenuItem>
                      </Link>
                      <Link href="/40day">
                        <DropdownMenuItem className="gap-2 cursor-pointer" data-testid="link-40day">
                          <Zap className="h-4 w-4 text-primary" />
                          <div className="flex-1">
                            <div className="font-medium">40-Day Twangle</div>
                            <div className="text-xs text-muted-foreground">Daily growth challenges</div>
                          </div>
                          <Badge variant="destructive" className="text-xs">NEW</Badge>
                        </DropdownMenuItem>
                      </Link>
                      <Link href="/retreat">
                        <DropdownMenuItem className="gap-2 cursor-pointer" data-testid="link-retreat">
                          <Mountain className="h-4 w-4 text-primary" />
                          <div className="flex-1">
                            <div className="font-medium">Retreat Builder</div>
                            <div className="text-xs text-muted-foreground">Plan your getaway</div>
                          </div>
                          <Badge variant="default" className="text-xs">PREMIUM</Badge>
                        </DropdownMenuItem>
                      </Link>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="gap-2 text-muted-foreground hover:text-foreground"
                        data-testid="dropdown-track"
                      >
                        <TrendingUp className="h-4 w-4" />
                        Track & Analyze
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                      <DropdownMenuLabel>Monitor Your Progress</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <Link href="/health-score">
                        <DropdownMenuItem className="gap-2 cursor-pointer" data-testid="link-health-score">
                          <Heart className="h-4 w-4 text-primary" />
                          <div className="flex-1">
                            <div className="font-medium">Health Score</div>
                            <div className="text-xs text-muted-foreground">Track relationship wellness</div>
                          </div>
                          <Badge variant="default" className="text-xs">PREMIUM</Badge>
                        </DropdownMenuItem>
                      </Link>
                      <Link href="/insights">
                        <DropdownMenuItem className="gap-2 cursor-pointer" data-testid="link-insights">
                          <Sparkles className="h-4 w-4 text-primary" />
                          <div className="flex-1">
                            <div className="font-medium">AI Insights</div>
                            <div className="text-xs text-muted-foreground">Personalized analytics</div>
                          </div>
                          <Badge variant="default" className="text-xs">PREMIUM</Badge>
                        </DropdownMenuItem>
                      </Link>
                      <Link href="/summaries">
                        <DropdownMenuItem className="gap-2 cursor-pointer" data-testid="link-summaries">
                          <FileText className="h-4 w-4 text-primary" />
                          <div className="flex-1">
                            <div className="font-medium">Weekly Summaries</div>
                            <div className="text-xs text-muted-foreground">Review your journey</div>
                          </div>
                          <Badge variant="default" className="text-xs">PREMIUM</Badge>
                        </DropdownMenuItem>
                      </Link>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="gap-2 text-muted-foreground hover:text-foreground"
                        data-testid="dropdown-connect"
                      >
                        <Users className="h-4 w-4" />
                        Connect & Share
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                      <DropdownMenuLabel>Strengthen Your Bond</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <Link href="/partner-connection">
                        <DropdownMenuItem className="gap-2 cursor-pointer" data-testid="link-partner-connection">
                          <Users className="h-4 w-4 text-primary" />
                          <div className="flex-1">
                            <div className="font-medium">Partner Connection</div>
                            <div className="text-xs text-muted-foreground">Share your progress</div>
                          </div>
                          <Badge variant="default" className="text-xs">PREMIUM</Badge>
                        </DropdownMenuItem>
                      </Link>
                      <Link href="/journal">
                        <DropdownMenuItem className="gap-2 cursor-pointer" data-testid="link-journal">
                          <Activity className="h-4 w-4 text-primary" />
                          <div className="flex-1">
                            <div className="font-medium">Relationship Journal</div>
                            <div className="text-xs text-muted-foreground">Reflect together</div>
                          </div>
                          <Badge variant="default" className="text-xs">PREMIUM</Badge>
                        </DropdownMenuItem>
                      </Link>
                      <Link href="/conversations">
                        <DropdownMenuItem className="gap-2 cursor-pointer" data-testid="link-conversations">
                          <MessageSquare className="h-4 w-4 text-primary" />
                          <div className="flex-1">
                            <div className="font-medium">Daily Conversations</div>
                            <div className="text-xs text-muted-foreground">Deepen your connection</div>
                          </div>
                          <Badge variant="secondary" className="text-xs">FREE</Badge>
                        </DropdownMenuItem>
                      </Link>
                    </DropdownMenuContent>
                  </DropdownMenu>

              {showReports && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="gap-2 text-muted-foreground hover:text-foreground"
                      data-testid="dropdown-admin"
                    >
                      <BarChart3 className="h-4 w-4" />
                      Admin
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuLabel>Admin Tools</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <Link href="/admin">
                      <DropdownMenuItem className="gap-2 cursor-pointer" data-testid="link-admin">
                        <Shield className="h-4 w-4 text-primary" />
                        <div className="flex-1">
                          <div className="font-medium">Admin Panel</div>
                          <div className="text-xs text-muted-foreground">Database seeding</div>
                        </div>
                        <Badge variant="destructive" className="text-xs">NEW</Badge>
                      </DropdownMenuItem>
                    </Link>
                    <Link href="/reports">
                      <DropdownMenuItem className="gap-2 cursor-pointer" data-testid="link-reports">
                        <BarChart3 className="h-4 w-4" />
                        Reports
                      </DropdownMenuItem>
                    </Link>
                    <Link href="/analytics">
                      <DropdownMenuItem className="gap-2 cursor-pointer" data-testid="link-analytics">
                        <TrendingUp className="h-4 w-4" />
                        Analytics
                      </DropdownMenuItem>
                    </Link>
                    <Link href="/feedback-report">
                      <DropdownMenuItem className="gap-2 cursor-pointer" data-testid="link-feedback-report">
                        <MessageSquare className="h-4 w-4" />
                        Feedback
                      </DropdownMenuItem>
                    </Link>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </nav>
          </div>
        )}
        {isWelcome && <div />}
        <div className="flex items-center gap-2">
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
