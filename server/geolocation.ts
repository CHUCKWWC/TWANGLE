interface GeolocationResponse {
  country: string;
  countryCode: string;
  city: string;
  regionName: string;
  status: string;
}

const BLOCKED_COUNTRIES = ['RU', 'CN'];

export async function getLocationFromIP(ip: string): Promise<{ location: string; countryCode: string; blocked: boolean }> {
  if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('::ffff:127.')) {
    return {
      location: 'localhost',
      countryCode: 'LOCAL',
      blocked: false,
    };
  }
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,regionName,city`, {
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error('Geolocation API request failed');
    }
    
    const data: GeolocationResponse = await response.json();
    
    if (data.status === 'fail') {
      return {
        location: 'Unknown',
        countryCode: 'UNKNOWN',
        blocked: false,
      };
    }
    
    const location = [data.city, data.regionName, data.country]
      .filter(Boolean)
      .join(', ');
    
    const blocked = BLOCKED_COUNTRIES.includes(data.countryCode);
    
    return {
      location: location || data.country || 'Unknown',
      countryCode: data.countryCode,
      blocked,
    };
  } catch (error) {
    console.error('Error fetching geolocation:', error);
    return {
      location: 'Unknown',
      countryCode: 'UNKNOWN',
      blocked: false,
    };
  }
}

export function extractIPAddress(req: any): string {
  let ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() 
    || req.headers['x-real-ip'] 
    || req.connection?.remoteAddress 
    || req.socket?.remoteAddress 
    || '';
  
  if (ip.startsWith('::ffff:')) {
    ip = ip.substring(7);
  }
  
  if (!ip || ip === '::1') {
    ip = '127.0.0.1';
  }
  
  return ip || 'Unknown';
}
