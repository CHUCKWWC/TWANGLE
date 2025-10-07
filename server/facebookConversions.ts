import crypto from 'crypto';

interface UserData {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

interface CustomData {
  currency?: string;
  value?: number;
  content_name?: string;
  content_category?: string;
  content_ids?: string[];
  contents?: Array<{ id: string; quantity: number }>;
  num_items?: number;
}

interface ConversionEvent {
  event_name: string;
  event_time: number;
  action_source: 'website' | 'email' | 'app' | 'phone_call' | 'chat' | 'physical_store' | 'system_generated' | 'other';
  event_source_url?: string;
  user_data: UserData;
  custom_data?: CustomData;
}

function hashData(data: string): string {
  return crypto.createHash('sha256').update(data.toLowerCase().trim()).digest('hex');
}

function prepareUserData(userData: UserData) {
  const prepared: any = {};
  
  if (userData.email) {
    prepared.em = [hashData(userData.email)];
  }
  if (userData.phone) {
    prepared.ph = [hashData(userData.phone)];
  }
  if (userData.firstName) {
    prepared.fn = [hashData(userData.firstName)];
  }
  if (userData.lastName) {
    prepared.ln = [hashData(userData.lastName)];
  }
  if (userData.city) {
    prepared.ct = [hashData(userData.city)];
  }
  if (userData.state) {
    prepared.st = [hashData(userData.state)];
  }
  if (userData.zip) {
    prepared.zp = [hashData(userData.zip)];
  }
  if (userData.country) {
    prepared.country = [hashData(userData.country)];
  }
  
  return prepared;
}

export async function sendConversionEvent(event: ConversionEvent): Promise<boolean> {
  const pixelId = process.env.FACEBOOK_PIXEL_ID;
  const accessToken = process.env.FACEBOOK_CONVERSIONS_API_TOKEN;
  
  if (!pixelId || !accessToken) {
    console.error('Facebook Conversions API not configured. Set FACEBOOK_PIXEL_ID and FACEBOOK_CONVERSIONS_API_TOKEN');
    return false;
  }
  
  try {
    const payload = {
      data: [{
        event_name: event.event_name,
        event_time: event.event_time,
        action_source: event.action_source,
        event_source_url: event.event_source_url,
        user_data: prepareUserData(event.user_data),
        custom_data: event.custom_data,
      }],
      access_token: accessToken,
    };
    
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${pixelId}/events`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );
    
    if (!response.ok) {
      const error = await response.text();
      console.error('Facebook Conversions API error:', response.status, error);
      return false;
    }
    
    const result = await response.json();
    console.log('Facebook conversion event sent:', event.event_name, result);
    return true;
  } catch (error) {
    console.error('Failed to send Facebook conversion event:', error);
    return false;
  }
}

// Common event helpers
export function trackPurchase(userData: UserData, value: number, currency: string = 'USD', contentIds?: string[]) {
  return sendConversionEvent({
    event_name: 'Purchase',
    event_time: Math.floor(Date.now() / 1000),
    action_source: 'website',
    user_data: userData,
    custom_data: {
      currency,
      value,
      content_ids: contentIds,
    },
  });
}

export function trackLead(userData: UserData, contentName?: string) {
  return sendConversionEvent({
    event_name: 'Lead',
    event_time: Math.floor(Date.now() / 1000),
    action_source: 'website',
    user_data: userData,
    custom_data: contentName ? { content_name: contentName } : undefined,
  });
}

export function trackCompleteRegistration(userData: UserData) {
  return sendConversionEvent({
    event_name: 'CompleteRegistration',
    event_time: Math.floor(Date.now() / 1000),
    action_source: 'website',
    user_data: userData,
  });
}

export function trackSubscribe(userData: UserData, value?: number, currency: string = 'USD') {
  return sendConversionEvent({
    event_name: 'Subscribe',
    event_time: Math.floor(Date.now() / 1000),
    action_source: 'website',
    user_data: userData,
    custom_data: value ? { currency, value } : undefined,
  });
}
