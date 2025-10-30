import { Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { getLocationFromIP, extractIPAddress } from "./geolocation";

export async function logUserAccess(req: Request, res: Response, next: NextFunction) {
  try {
    const user = (req as any).user;
    const ipAddress = extractIPAddress(req);
    
    const geoData = await getLocationFromIP(ipAddress);
    
    const locationParts = geoData.location.split(', ');
    const city = locationParts[0] || null;
    const region = locationParts[1] || null;
    const country = locationParts[2] || geoData.location;
    
    // Extract user data from claims object (Replit Auth structure)
    const userId = user?.claims?.sub || null;
    const email = user?.claims?.email || null;
    const firstName = user?.claims?.first_name || null;
    const lastName = user?.claims?.last_name || null;
    const displayName = firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName || null;
    
    await storage.createAccessLog({
      userId,
      email,
      displayName,
      ipAddress,
      country: country || null,
      countryCode: geoData.countryCode || null,
      city: city || null,
      region: region || null,
      location: geoData.location || null,
      userAgent: req.headers['user-agent'] || null,
      path: req.path || null,
      accessType: userId ? 'authenticated' : 'anonymous',
    });
  } catch (error) {
    console.error('Error logging access:', error);
  }
  
  next();
}
