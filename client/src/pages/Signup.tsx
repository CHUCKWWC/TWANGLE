import { useState, useEffect } from "react";
import { Mail, Lock, User, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useLocation } from "wouter";
import { FaGoogle, FaFacebook } from "react-icons/fa";
import { SEO } from "@/components/SEO";

const registerSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function Signup() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [source, setSource] = useState<string>("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const utmSource = params.get('utm_source') || params.get('source') || '';
    setSource(utmSource);

    const error = params.get('error');
    if (error) {
      const errorMessages: Record<string, string> = {
        google_auth_error: "Google authentication encountered an error. Please try again.",
        google_auth_failed: "Google authentication failed. Please check your account settings.",
        facebook_auth_error: "Facebook authentication encountered an error. Please try again.",
        facebook_auth_failed: "Facebook authentication failed. Please check your account settings.",
        login_failed: "Login failed after authentication. Please try again.",
      };
      
      toast({
        title: "Authentication Error",
        description: errorMessages[error] || "An unknown error occurred during authentication.",
        variant: "destructive",
      });
      
      window.history.replaceState({}, '', '/signup');
    }
  }, [toast]);

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormData) => {
      const response = await apiRequest("POST", "/api/auth/register", {
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Welcome to Twangle!",
        description: "Your account has been created. Start your 7-day free trial now!",
      });
      navigate("/");
    },
    onError: (error: any) => {
      toast({
        title: "Registration failed",
        description: error.message || "Unable to create account. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSocialLogin = (provider: 'google' | 'facebook') => {
    const baseUrl = window.location.origin;
    const authUrl = `${baseUrl}/api/auth/${provider}`;
    window.location.href = authUrl;
  };

  const getSourceEmoji = (src: string) => {
    const lower = src.toLowerCase();
    if (lower.includes('facebook') || lower.includes('fb')) return '📘';
    if (lower.includes('twitter') || lower.includes('x.com')) return '🐦';
    if (lower.includes('instagram') || lower.includes('ig')) return '📸';
    if (lower.includes('tiktok')) return '🎵';
    return '✨';
  };

  return (
    <>
      <SEO
        title="Sign Up - Start Your 7-Day Free Trial"
        description="Join thousands of couples transforming their relationships. Sign up for Twangle and get 7 days free access to AI relationship coaching, attachment assessments, and personalized guidance."
        keywords="relationship coaching signup, couples therapy trial, AI coach registration, attachment style assessment"
      />
      
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-6">
            <a href="/" data-testid="link-home">
              <img 
                src="/twangle-logo.png" 
                alt="Twangle" 
                className="h-16 w-auto mx-auto crisp-image"
              />
            </a>
          </div>

          <Card className="border-2">
            <CardHeader className="space-y-2 pb-4">
              <div className="flex items-center justify-center gap-2">
                <CardTitle className="text-2xl font-bold text-center">
                  Start Your Free Trial
                </CardTitle>
                {source && (
                  <span className="text-2xl" aria-label={`Coming from ${source}`}>
                    {getSourceEmoji(source)}
                  </span>
                )}
              </div>
              <CardDescription className="text-center">
                7 days free • No credit card required • Cancel anytime
              </CardDescription>
              {source && (
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-2 mt-2">
                  <p className="text-xs text-center text-muted-foreground">
                    Welcome from <span className="font-semibold capitalize">{source}</span>!
                  </p>
                </div>
              )}
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Social Login Options */}
              <div className="space-y-3">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11"
                  onClick={() => handleSocialLogin('google')}
                  data-testid="button-google-signup"
                >
                  <FaGoogle className="mr-2 h-4 w-4" />
                  Sign up with Google
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11"
                  onClick={() => handleSocialLogin('facebook')}
                  data-testid="button-facebook-signup"
                >
                  <FaFacebook className="mr-2 h-4 w-4" />
                  Sign up with Facebook
                </Button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or continue with email</span>
                </div>
              </div>

              {/* Email Registration Form */}
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit((data) => registerMutation.mutate(data))} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={registerForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="John"
                              disabled={registerMutation.isPending}
                              data-testid="input-firstname"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Doe"
                              disabled={registerMutation.isPending}
                              data-testid="input-lastname"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={registerForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="email"
                            placeholder="you@example.com"
                            disabled={registerMutation.isPending}
                            data-testid="input-email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="password"
                            placeholder="At least 8 characters"
                            disabled={registerMutation.isPending}
                            data-testid="input-password"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={registerForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="password"
                            placeholder="Confirm your password"
                            disabled={registerMutation.isPending}
                            data-testid="input-confirm-password"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full h-11"
                    disabled={registerMutation.isPending}
                    data-testid="button-create-account"
                  >
                    {registerMutation.isPending ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                        Creating account...
                      </div>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Start Free Trial
                      </>
                    )}
                  </Button>
                </form>
              </Form>

              <div className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <a
                  href="/login"
                  className="text-primary hover:underline font-medium"
                  data-testid="link-login"
                >
                  Sign in
                </a>
              </div>

              <div className="text-xs text-muted-foreground text-center pt-2 border-t">
                By signing up, you agree to our{" "}
                <a href="/terms" className="text-primary hover:underline" data-testid="link-terms">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="/privacy" className="text-primary hover:underline" data-testid="link-privacy">
                  Privacy Policy
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Trust Indicators */}
          <div className="mt-6 text-center space-y-2">
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>7-Day Free Trial</span>
              </div>
              <div className="flex items-center gap-1">
                <span>💳</span>
                <span>No Credit Card</span>
              </div>
              <div className="flex items-center gap-1">
                <span>🔒</span>
                <span>Secure & Private</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
