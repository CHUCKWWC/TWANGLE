// URL validation utility to prevent open redirect attacks

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
  '/40day',
  '/conversations',
  '/health-score',
  '/journal',
  '/insights',
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
    
    // Extract path without query params or hash
    const url = new URL(trimmed, window.location.origin);
    const path = url.pathname;
    
    // Check if path is in allowed routes or starts with an allowed route
    const isAllowed = ALLOWED_ROUTES.some(route => 
      path === route || path.startsWith(route + '/')
    );
    
    if (!isAllowed) {
      return null;
    }
    
    // Return full path including query params
    return url.pathname + url.search + url.hash;
  } catch (error) {
    console.error('Invalid returnTo URL:', error);
    return null;
  }
}

/**
 * Creates a login URL with returnTo parameter
 * @param destination - The destination path to return to after login
 * @returns The login URL with encoded returnTo parameter
 */
export function createLoginUrl(destination: string): string {
  const validatedDestination = validateReturnToUrl(destination);
  if (!validatedDestination) {
    return '/login';
  }
  
  return `/login?returnTo=${encodeURIComponent(validatedDestination)}`;
}
