// Reference: blueprint:javascript_log_in_with_replit
import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import { getLocationFromIP, extractIPAddress } from "./geolocation";
import { createAccessLogEntry, logAccessToSheet } from "./googleSheets";
import { validateReturnToUrl } from "./redirectUtils";

// Store registered strategies to avoid duplicates
const registeredStrategies = new Set<string>();

// Get allowed domains for authentication
function getAllowedDomains(): Set<string> {
  const domains = new Set<string>();
  
  // Add domains from environment variable
  if (process.env.REPLIT_DOMAINS) {
    process.env.REPLIT_DOMAINS.split(",").forEach(d => domains.add(d.trim()));
  }
  
  // Add known production domains as fallback
  domains.add("twangle.org");
  domains.add("www.twangle.org");
  
  // Add replit.dev domains (wildcard pattern check will be done separately)
  return domains;
}

// Validate if a domain is allowed for authentication
function isAllowedDomain(hostname: string): boolean {
  const allowedDomains = getAllowedDomains();
  
  // Strict allowlist - only exact matches allowed
  if (allowedDomains.has(hostname)) {
    return true;
  }
  
  console.log(`[Auth] Rejected unauthorized domain: ${hostname}`);
  return false;
}

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(
  claims: any,
) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
    hasLifetimeAccess: process.env.NODE_ENV === 'development' ? 1 : 0,
  });
}

// Helper function to register a strategy for a domain dynamically
async function ensureStrategyExists(domain: string, verify: VerifyFunction) {
  const strategyName = `replitauth:${domain}`;
  
  if (registeredStrategies.has(strategyName)) {
    return; // Already registered
  }

  const config = await getOidcConfig();
  const strategy = new Strategy(
    {
      name: strategyName,
      config,
      scope: "openid email profile offline_access",
      callbackURL: `https://${domain}/api/callback`,
    },
    verify,
  );
  
  passport.use(strategy);
  registeredStrategies.add(strategyName);
  console.log(`[Auth] Registered strategy for domain: ${domain}`);
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  // Register strategies for any domains specified in REPLIT_DOMAINS
  if (process.env.REPLIT_DOMAINS) {
    for (const domain of process.env.REPLIT_DOMAINS.split(",")) {
      await ensureStrategyExists(domain.trim(), verify);
    }
  } else {
    console.log('[Auth] REPLIT_DOMAINS not set - will register strategies dynamically');
  }

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", async (req, res, next) => {
    const domain = req.hostname;
    
    // Validate domain before proceeding
    if (!isAllowedDomain(domain)) {
      console.error(`[Auth] Login attempt from unauthorized domain: ${domain}`);
      return res.status(403).json({ 
        error: "Authentication not available for this domain",
        message: "Please contact support if you believe this is an error."
      });
    }
    
    // Store validated returnTo in session for use after authentication
    const returnTo = req.query.returnTo as string | undefined;
    const validatedReturnTo = validateReturnToUrl(returnTo);
    if (validatedReturnTo) {
      (req.session as any).returnTo = validatedReturnTo;
      console.log('[Auth] Stored returnTo in session:', validatedReturnTo);
    }
    
    // Dynamically register strategy if it doesn't exist
    await ensureStrategyExists(domain, verify);
    
    passport.authenticate(`replitauth:${domain}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  // Sign-up endpoint for promotional links - works for both new and existing users
  app.get("/api/signup", async (req, res, next) => {
    const domain = req.hostname;
    
    // Validate domain before proceeding
    if (!isAllowedDomain(domain)) {
      console.error(`[Auth] Signup attempt from unauthorized domain: ${domain}`);
      return res.status(403).json({ 
        error: "Authentication not available for this domain",
        message: "Please contact support if you believe this is an error."
      });
    }
    
    // Store promo tracking data if provided (for analytics)
    const source = req.query.source as string | undefined;
    const campaign = req.query.campaign as string | undefined;
    if (source || campaign) {
      (req.session as any).promoSource = source;
      (req.session as any).promoCampaign = campaign;
      console.log('[Auth] Promo tracking:', { source, campaign });
    }
    
    // Store validated returnTo in session for use after authentication
    const returnTo = req.query.returnTo as string | undefined;
    const validatedReturnTo = validateReturnToUrl(returnTo);
    if (validatedReturnTo) {
      (req.session as any).returnTo = validatedReturnTo;
      console.log('[Auth] Stored returnTo in session:', validatedReturnTo);
    }
    
    // Dynamically register strategy if it doesn't exist
    await ensureStrategyExists(domain, verify);
    
    // Use "consent" prompt to encourage new account creation while still allowing existing users
    passport.authenticate(`replitauth:${domain}`, {
      prompt: "consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", async (req, res, next) => {
    const domain = req.hostname;
    
    // Validate domain before proceeding
    if (!isAllowedDomain(domain)) {
      console.error(`[Auth] Callback attempt from unauthorized domain: ${domain}`);
      return res.status(403).json({ 
        error: "Authentication callback not available for this domain"
      });
    }
    
    // Ensure strategy exists for callback as well
    await ensureStrategyExists(domain, verify);
    
    const ipAddress = extractIPAddress(req);
    console.log('[Auth Callback] IP Address:', ipAddress);
    const geoData = await getLocationFromIP(ipAddress);
    console.log('[Auth Callback] Geolocation result:', geoData);
    
    if (geoData.blocked) {
      console.log('[Auth Callback] Access blocked for country:', geoData.countryCode);
      return res.status(403).send('Access from your country is not permitted.');
    }
    
    passport.authenticate(`replitauth:${domain}`, (err: any, user: any) => {
      if (err) {
        return next(err);
      }
      
      if (!user) {
        return res.redirect("/api/login");
      }
      
      req.logIn(user, async (err: any) => {
        if (err) {
          return next(err);
        }
        
        const session = req.session as any;
        if (!Array.isArray(session.loggedIPs)) {
          session.loggedIPs = [];
        }
        
        console.log('[Auth Callback] Session loggedIPs before filter:', session.loggedIPs);
        session.loggedIPs = session.loggedIPs.filter((ip: string) => ip && ip !== 'Unknown');
        console.log('[Auth Callback] Session loggedIPs after filter:', session.loggedIPs);
        
        const shouldLog = ipAddress && ipAddress !== 'Unknown' && !session.loggedIPs.includes(ipAddress);
        console.log('[Auth Callback] Should log?', shouldLog, '(IP:', ipAddress, ')');
        
        if (shouldLog) {
          session.loggedIPs.push(ipAddress);
          console.log('[Auth Callback] Added IP to session, creating log entry...');
          
          try {
            const logEntry = await createAccessLogEntry(req, user, geoData.location);
            await logAccessToSheet(logEntry);
            console.log('[Auth Callback] Successfully logged access to Google Sheets');
          } catch (error) {
            console.error('Failed to log access:', error);
          }
        } else {
          console.log('[Auth Callback] Skipping log - IP already logged in this session');
        }
        
        // Redirect to returnTo destination if it exists, otherwise go to home
        const returnTo = session.returnTo;
        delete session.returnTo; // Clear it from session
        
        if (returnTo) {
          console.log('[Auth Callback] Redirecting to:', returnTo);
          res.redirect(returnTo);
        } else {
          console.log('[Auth Callback] No returnTo, redirecting to home');
          res.redirect("/");
        }
      });
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};
