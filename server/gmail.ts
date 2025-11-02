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

interface TrialReminderData {
  firstName?: string;
  chatSessions: number;
  assessments: number;
  retreats: number;
  dateNights: number;
  daysRemaining: number;
}

export async function sendTrialReminder(to: string, data: TrialReminderData, baseUrl: string) {
  try {
    const gmail = await getUncachableGmailClient();
    const fromEmail = getFromEmail();
    const { firstName, chatSessions, assessments, retreats, dateNights, daysRemaining } = data;
    
    const greeting = firstName ? `Hi ${firstName}` : 'Hi there';
    const totalActivities = chatSessions + assessments + retreats + dateNights;
    
    let subject: string;
    let urgencyMessage: string;
    let ctaText: string;
    
    // Adjust messaging based on user activity level
    const hasActivity = totalActivities > 0;
    
    if (daysRemaining === 2) {
      subject = 'Your Twangle Trial - 2 Days Left';
      urgencyMessage = hasActivity 
        ? 'Your free trial ends in 2 days. Don\'t lose access to everything you\'ve created!'
        : 'Your free trial ends in 2 days. There\'s still time to explore all that Twangle offers!';
      ctaText = hasActivity ? 'Continue Your Journey' : 'Start Your Journey';
    } else if (daysRemaining === 1) {
      subject = 'Tomorrow is Your Last Day - Keep Your Progress';
      urgencyMessage = hasActivity
        ? 'Your trial expires tomorrow! Keep building on the progress you\'ve made.'
        : 'Your trial expires tomorrow! There\'s still time to try our AI coach and assessments.';
      ctaText = hasActivity ? 'Save My Progress' : 'Get Started Now';
    } else {
      subject = 'Final Hours - Your Trial Expires Today';
      urgencyMessage = hasActivity
        ? 'Your trial ends today! Choose a plan now to keep all your relationship insights and progress.'
        : 'Your trial ends today! Subscribe now to unlock unlimited coaching and relationship tools.';
      ctaText = hasActivity ? 'Keep Everything I Built' : 'Subscribe Now';
    }
    
    const valueItems: string[] = [];
    if (chatSessions > 0) {
      valueItems.push(`<li><strong>${chatSessions} coaching conversation${chatSessions > 1 ? 's' : ''}</strong> with Coach Charles</li>`);
    }
    if (assessments > 0) {
      valueItems.push(`<li><strong>${assessments} attachment assessment${assessments > 1 ? 's' : ''}</strong> completed</li>`);
    }
    if (retreats > 0) {
      valueItems.push(`<li><strong>${retreats} personalized retreat${retreats > 1 ? 's' : ''}</strong> planned</li>`);
    }
    if (dateNights > 0) {
      valueItems.push(`<li><strong>${dateNights} date night idea${dateNights > 1 ? 's' : ''}</strong> saved</li>`);
    }
    
    const hasActivities = valueItems.length > 0;
    
    const text = `${greeting}, ${urgencyMessage} Subscribe now to continue using Twangle.`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #d4718b;">${greeting},</h2>
        <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
          ${urgencyMessage}
        </p>
        
        ${hasActivities ? `
        <div style="background: #f8f9fa; border-left: 4px solid #d4718b; padding: 20px; margin: 25px 0;">
          <h3 style="margin-top: 0; color: #333;">What You've Built So Far:</h3>
          <ul style="margin: 0; padding-left: 20px; line-height: 1.8;">
            ${valueItems.join('\n            ')}
          </ul>
        </div>
        ` : `
        <div style="background: #f8f9fa; border-left: 4px solid #d4718b; padding: 20px; margin: 25px 0;">
          <p style="margin: 0; color: #666;">
            There's still time to explore all that Twangle offers! Talk to Coach Charles, take the attachment assessment, or plan your first retreat.
          </p>
        </div>
        `}
        
        <h3 style="color: #333; margin-top: 30px;">Continue With Premium:</h3>
        <ul style="line-height: 1.8;">
          <li>Unlimited AI coaching with Coach Charles</li>
          <li>Save all your assessments and progress</li>
          <li>Create unlimited retreat itineraries</li>
          <li>Weekly coaching summaries delivered to your inbox</li>
          <li>Priority support when you need help</li>
        </ul>
        
        <div style="text-align: center; margin: 35px 0;">
          <a href="${baseUrl}/pricing" 
             style="background-color: #d4718b; color: white; padding: 14px 35px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 16px;">
            ${ctaText}
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px; text-align: center;">
          Plans start at just $12/month
        </p>
        
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          Questions? We're here to help.<br>
          The Twangle Team
        </p>
      </div>
    `;
    
    const encodedMessage = createMimeMessage(to, fromEmail, subject, text, html);
    
    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage
      }
    });
    
    console.log(`Trial reminder email sent to: ${to} (${daysRemaining} days remaining)`);
  } catch (error) {
    console.error('Error sending trial reminder email:', error);
    throw error;
  }
}
