import sgMail from '@sendgrid/mail';

let connectionSettings: any;

async function getCredentials() {
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
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=sendgrid',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key || !connectionSettings.settings.from_email)) {
    throw new Error('SendGrid not connected');
  }
  return {apiKey: connectionSettings.settings.api_key, email: connectionSettings.settings.from_email};
}

// WARNING: Never cache this client.
// Access tokens expire, so a new client must be created each time.
// Always call this function again to get a fresh client.
export async function getUncachableSendGridClient() {
  const {apiKey, email} = await getCredentials();
  sgMail.setApiKey(apiKey);
  return {
    client: sgMail,
    fromEmail: email
  };
}

export async function sendVerificationEmail(to: string, token: string, baseUrl: string) {
  try {
    const {client, fromEmail} = await getUncachableSendGridClient();
    
    const verificationUrl = `${baseUrl}/api/verify-email?token=${token}`;
    
    const msg = {
      to,
      from: fromEmail,
      subject: 'Verify your Twangle email address',
      text: `Welcome to Twangle! Please verify your email address by clicking this link: ${verificationUrl}`,
      html: `
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
      `,
    };
    
    await client.send(msg);
    console.log('Verification email sent to:', to);
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
}

export async function sendWelcomeEmail(to: string, firstName?: string) {
  try {
    const {client, fromEmail} = await getUncachableSendGridClient();
    
    const greeting = firstName ? `Hi ${firstName}` : 'Welcome';
    
    const msg = {
      to,
      from: fromEmail,
      subject: 'Welcome to Twangle - Start Building a Stronger Relationship',
      text: `${greeting}! Your email has been verified. Start exploring Twangle's relationship-building tools.`,
      html: `
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
      `,
    };
    
    await client.send(msg);
    console.log('Welcome email sent to:', to);
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw error;
  }
}
