// Server-side URL validation utility to prevent open redirect attacks

const ALLOWED_ROUTES = [
  '/',
  '/assessment',
  '/coach',
  '/retreat',
  '/exercises',
  '/summaries',
  '/datenight',
  '/profile',
  '/reports',
];

/**
 * Validates that a returnTo URL is an internal route to prevent open redirect attacks
 * @param returnTo - The URL to validate
 * @returns The validated path or null if invalid
 */
export function validateReturnToUrl(returnTo: string | null | undefined): string | null {
  if (!returnTo) return null;
  
  try {
    // Remove leading/trailing whitespace
    const trimmed = returnTo.trim();
    
    // Must start with / (relative path)
    if (!trimmed.startsWith('/')) {
      return null;
    }
    
    // Parse the URL
    const url = new URL(trimmed, 'http://localhost');
    const path = url.pathname;
    
    // Check if path is in allowed routes or starts with an allowed route
    const isAllowed = ALLOWED_ROUTES.some(route => 
      path === route || path.startsWith(route + '/')
    );
    
    if (!isAllowed) {
      console.log('[Auth] Rejected invalid returnTo URL:', path);
      return null;
    }
    
    // Return full path including query params
    return url.pathname + url.search + url.hash;
  } catch (error) {
    console.error('[Auth] Error validating returnTo URL:', error);
    return null;
  }
}
