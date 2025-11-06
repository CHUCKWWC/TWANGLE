import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import bcrypt from "bcrypt";
import rateLimit from "express-rate-limit";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { randomBytes } from "crypto";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const SALT_ROUNDS = 10;

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  return bcrypt.compare(supplied, stored);
}

function generateToken(): string {
  return randomBytes(32).toString('hex');
}

// Rate limiter for password reset to prevent abuse
const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Max 3 requests per 15 minutes per IP
  message: { 
    error: "Too many password reset requests",
    message: "Please wait before requesting another password reset.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'fallback-secret-key-change-me',
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      { usernameField: 'email', passwordField: 'password' },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          
          if (!user) {
            return done(null, false, { message: 'Invalid email or password' });
          }

          if (!user.password) {
            return done(null, false, { message: 'Please set up your password first. Check your email for instructions.' });
          }

          const isValid = await comparePasswords(password, user.password);
          if (!isValid) {
            return done(null, false, { message: 'Invalid email or password' });
          }

          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: "/auth/google/callback",
          state: true,
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const email = profile.emails?.[0]?.value;
            if (!email) {
              return done(new Error("No email found in Google profile"));
            }

            let user = await storage.getUserByEmail(email);
            
            if (user) {
              if (user.authProvider !== 'google' && user.authProviderId !== profile.id) {
                await storage.updateUser(user.id, {
                  authProvider: 'google',
                  authProviderId: profile.id,
                  profileImageUrl: profile.photos?.[0]?.value || user.profileImageUrl,
                  emailVerified: 1,
                });
                user = await storage.getUser(user.id);
              }
            } else {
              const trialStartedAt = new Date();
              const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
              
              user = await storage.createUser({
                email,
                authProvider: 'google',
                authProviderId: profile.id,
                firstName: profile.name?.givenName || null,
                lastName: profile.name?.familyName || null,
                displayName: profile.displayName || email,
                profileImageUrl: profile.photos?.[0]?.value || null,
                emailVerified: 1,
                trialStartedAt,
                trialEndsAt,
              });
            }

            return done(null, user);
          } catch (error) {
            return done(error as Error);
          }
        }
      )
    );
  }

  if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
    const domain = process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000';
    const isLocalhost = domain.startsWith('localhost') || domain.startsWith('127.0.0.1');
    const protocol = isLocalhost ? 'http' : 'https';
    const facebookCallbackURL = `${protocol}://${domain}/auth/facebook/callback`;
    
    passport.use(
      new FacebookStrategy(
        {
          clientID: process.env.FACEBOOK_APP_ID,
          clientSecret: process.env.FACEBOOK_APP_SECRET,
          callbackURL: facebookCallbackURL,
          profileFields: ['id', 'emails', 'name', 'picture.type(large)'],
          enableProof: true,
          state: true,
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const email = profile.emails?.[0]?.value;
            if (!email) {
              return done(new Error("No email found in Facebook profile"));
            }

            let user = await storage.getUserByEmail(email);
            
            if (user) {
              if (user.authProvider !== 'facebook' && user.authProviderId !== profile.id) {
                await storage.updateUser(user.id, {
                  authProvider: 'facebook',
                  authProviderId: profile.id,
                  profileImageUrl: profile.photos?.[0]?.value || user.profileImageUrl,
                  emailVerified: 1,
                });
                user = await storage.getUser(user.id);
              }
            } else {
              const trialStartedAt = new Date();
              const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
              
              user = await storage.createUser({
                email,
                authProvider: 'facebook',
                authProviderId: profile.id,
                firstName: profile.name?.givenName || null,
                lastName: profile.name?.familyName || null,
                displayName: profile.displayName || email,
                profileImageUrl: profile.photos?.[0]?.value || null,
                emailVerified: 1,
                trialStartedAt,
                trialEndsAt,
              });
            }

            return done(null, user);
          } catch (error) {
            return done(error as Error);
          }
        }
      )
    );
  }

  passport.serializeUser((user, done) => done(null, user.id));
  
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/auth/register", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password, firstName, lastName } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const hashedPassword = await hashPassword(password);
      const emailVerificationToken = generateToken();
      const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const trialStartedAt = new Date();
      const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const user = await storage.createUser({
        email,
        password: hashedPassword,
        firstName: firstName || null,
        lastName: lastName || null,
        displayName: firstName && lastName ? `${firstName} ${lastName}` : (firstName || email),
        emailVerificationToken,
        emailVerificationExpires,
        trialStartedAt,
        trialEndsAt,
      });

      if (user.email) {
        await storage.sendVerificationEmail(user.email, emailVerificationToken);
      }

      req.login(user, (err) => {
        if (err) return next(err);
        const { password: _, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/auth/login", (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate("local", (err: any, user: SelectUser | false, info: any) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Invalid email or password" });
      }

      req.login(user, (loginErr) => {
        if (loginErr) {
          return next(loginErr);
        }
        const { password: _, ...userWithoutPassword } = user;
        res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req: Request, res: Response, next: NextFunction) => {
    req.logout((err) => {
      if (err) return next(err);
      req.session.destroy((destroyErr) => {
        if (destroyErr) {
          console.error("Session destroy error:", destroyErr);
        }
        res.clearCookie('connect.sid');
        res.sendStatus(200);
      });
    });
  });

  app.get("/api/auth/user", (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }
    const { password: _, ...userWithoutPassword } = req.user!;
    res.json(userWithoutPassword);
  });

  app.post("/api/auth/request-password-reset", passwordResetLimiter, async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const user = await storage.getUserByEmail(email);
      
      if (user && user.email) {
        const resetToken = generateToken();
        const resetExpires = new Date(Date.now() + 60 * 60 * 1000);
        
        await storage.updateUser(user.id, {
          passwordResetToken: resetToken,
          passwordResetExpires: resetExpires,
        });

        await storage.sendPasswordResetEmail(user.email, resetToken);
      }

      res.status(200).json({ message: "If that email is registered, you will receive password reset instructions" });
    } catch (error) {
      console.error("Password reset request error:", error);
      res.status(500).json({ message: "Failed to process password reset request" });
    }
  });

  app.post("/api/auth/reset-password", async (req: Request, res: Response) => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({ message: "Token and new password are required" });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }

      const user = await storage.getUserByPasswordResetToken(token);

      if (!user || !user.passwordResetExpires || user.passwordResetExpires < new Date()) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }

      const hashedPassword = await hashPassword(newPassword);

      await storage.updateUser(user.id, {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
      });

      res.status(200).json({ message: "Password reset successfully" });
    } catch (error) {
      console.error("Password reset error:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  app.get("/auth/google", 
    passport.authenticate("google", { 
      scope: ["profile", "email"],
      session: true 
    })
  );

  app.get(
    "/auth/google/callback",
    (req: Request, res: Response, next: NextFunction) => {
      passport.authenticate("google", (err: any, user: SelectUser | false, info: any) => {
        if (err) {
          console.error("Google OAuth error:", err);
          return res.redirect("/login?error=google_auth_error");
        }
        if (!user) {
          console.error("Google OAuth failed - no user:", info);
          return res.redirect("/login?error=google_auth_failed");
        }
        
        req.login(user, (loginErr) => {
          if (loginErr) {
            console.error("Login error after Google OAuth:", loginErr);
            return res.redirect("/login?error=login_failed");
          }
          res.redirect("/");
        });
      })(req, res, next);
    }
  );

  app.get("/auth/facebook", 
    passport.authenticate("facebook", { 
      scope: ["email"],
      session: true 
    })
  );

  app.get(
    "/auth/facebook/callback",
    (req: Request, res: Response, next: NextFunction) => {
      passport.authenticate("facebook", (err: any, user: SelectUser | false, info: any) => {
        if (err) {
          console.error("Facebook OAuth error:", err);
          return res.redirect("/login?error=facebook_auth_error");
        }
        if (!user) {
          console.error("Facebook OAuth failed - no user:", info);
          return res.redirect("/login?error=facebook_auth_failed");
        }
        
        req.login(user, (loginErr) => {
          if (loginErr) {
            console.error("Login error after Facebook OAuth:", loginErr);
            return res.redirect("/login?error=login_failed");
          }
          res.redirect("/");
        });
      })(req, res, next);
    }
  );
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

// Alias for backward compatibility
export const isAuthenticated = requireAuth;
