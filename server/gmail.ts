import { google } from 'googleapis';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-mail',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Gmail not connected');
  }
  return accessToken;
}

// WARNING: Never cache this client.
// Access tokens expire, so a new client must be created each time.
// Always call this function again to get a fresh client.
export async function getUncachableGmailClient() {
  const accessToken = await getAccessToken();

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken
  });

  return google.gmail({ version: 'v1', auth: oauth2Client });
}

// Get the user's email address - since we can't access profile without additional scopes,
// we'll use a default or environment variable
function getFromEmail() {
  // Gmail will automatically use the authenticated user's email as the from address
  // when sending via the API, so we can return a placeholder or environment variable
  return process.env.FROM_EMAIL || 'info@wholewellness-coaching.org';
}

// Create a MIME email message
function createMimeMessage(to: string, from: string, subject: string, text: string, html: string): string {
  const boundary = '----=_Part_0_' + Date.now();
  
  const message = [
    `To: ${to}`,
    `From: ${from}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=UTF-8',
    '',
    text,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    '',
    html,
    '',
    `--${boundary}--`
  ].join('\r\n');
  
  return Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function sendVerificationEmail(to: string, token: string, baseUrl: string) {
  try {
    const gmail = await getUncachableGmailClient();
    const fromEmail = getFromEmail();
    
    const verificationUrl = `${baseUrl}/api/verify-email?token=${token}`;
    
    const text = `Welcome to Twangle! Please verify your email address by clicking this link: ${verificationUrl}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #d4718b;">Welcome to Twangle!</h2>
        <p>Thank you for joining Twangle, your couples' relationship wellness platform.</p>
        <p>Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" 
             style="background-color: #d4718b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Verify Email Address
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">
          Or copy and paste this link into your browser:<br>
          <a href="${verificationUrl}">${verificationUrl}</a>
        </p>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          This link will expire in 24 hours. If you didn't create an account with Twangle, you can safely ignore this email.
        </p>
      </div>
    `;
    
    const encodedMessage = createMimeMessage(to, fromEmail, 'Verify your Twangle email address', text, html);
    
    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage
      }
    });
    
    console.log('Verification email sent to:', to);
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
}

export async function sendWelcomeEmail(to: string, firstName?: string) {
  try {
    const gmail = await getUncachableGmailClient();
    const fromEmail = getFromEmail();
    
    const greeting = firstName ? `Hi ${firstName}` : 'Welcome';
    
    const text = `${greeting}! Your email has been verified. Start exploring Twangle's relationship-building tools.`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #d4718b;">${greeting}!</h2>
        <p>Your email has been verified successfully. You're all set to start strengthening your relationship with Twangle.</p>
        
        <h3 style="color: #333; margin-top: 25px;">Get Started:</h3>
        <ul style="line-height: 1.8;">
          <li><strong>Take the Attachment Assessment</strong> - Understand your relationship patterns</li>
          <li><strong>Talk to Coach Charles</strong> - Get 24/7 AI-powered relationship guidance</li>
          <li><strong>Plan a Retreat</strong> - Create meaningful couple getaways</li>
          <li><strong>Explore Exercises</strong> - Research-backed activities to build connection</li>
        </ul>
        
        <p style="margin-top: 25px;">We're here to support your relationship journey every step of the way.</p>
        
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          With gratitude,<br>
          The Twangle Team
        </p>
      </div>
    `;
    
    const encodedMessage = createMimeMessage(to, fromEmail, 'Welcome to Twangle - Start Building a Stronger Relationship', text, html);
    
    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage
      }
    });
    
    console.log('Welcome email sent to:', to);
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw error;
  }
}
