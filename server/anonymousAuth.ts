import type { RequestHandler } from "express";
import { randomUUID } from "crypto";

export const detectFacebookReferral: RequestHandler = (req, res, next) => {
  const session = req.session as any;
  
  // Check if user is already authenticated
  if (req.isAuthenticated?.()) {
    return next();
  }
  
  // Check for Facebook referral indicators
  const fbad = req.query.fbad;
  const utmSource = req.query.utm_source;
  const utmCampaign = req.query.utm_campaign;
  const isFacebookReferral = fbad === '1' || utmSource === 'facebook' || utmSource === 'fb';
  
  // If this is a Facebook referral and no anonymous session exists, create one
  if (isFacebookReferral && !session.anonymousUser) {
    const anonId = randomUUID();
    session.anonymousUser = {
      anonId,
      source: 'facebook',
      createdAt: new Date().toISOString(),
      utmCampaign: utmCampaign || null,
    };
    console.log('[Anonymous Auth] Created anonymous session for Facebook visitor:', anonId);
  }
  
  next();
};

export const optionalAuth: RequestHandler = async (req: any, res, next) => {
  // If user is authenticated via Replit Auth, proceed normally
  if (req.isAuthenticated?.() && req.user) {
    return next();
  }
  
  // Check for anonymous session
  const session = req.session as any;
  if (session?.anonymousUser) {
    req.anonymousUser = session.anonymousUser;
    console.log('[Optional Auth] Anonymous user detected:', req.anonymousUser.anonId);
  }
  
  next();
};

export const requireAuthOrAnonymous: RequestHandler = (req: any, res, next) => {
  if (req.isAuthenticated?.() || req.anonymousUser) {
    return next();
  }
  
  res.status(401).json({ message: "Authentication required" });
};
