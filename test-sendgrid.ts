import { getUncachableSendGridClient } from './server/sendgrid.js';

async function testSendGrid() {
  try {
    console.log('Testing SendGrid connection...');
    
    const { client, fromEmail } = await getUncachableSendGridClient();
    
    console.log('✅ SendGrid client initialized successfully');
    console.log(`📧 From email: ${fromEmail}`);
    
    // Test email - replace with your email
    const testEmail = process.argv[2] || 'charles.watson@wholewellness-coaching.org';
    
    console.log(`\nSending test email to: ${testEmail}`);
    
    const msg = {
      to: testEmail,
      from: fromEmail,
      subject: 'Twangle SendGrid Test',
      text: 'This is a test email from Twangle to verify SendGrid is working correctly.',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #d4718b;">SendGrid Test Successful! ✅</h2>
          <p>This test email confirms that:</p>
          <ul>
            <li>SendGrid API key is valid</li>
            <li>Connection is properly configured</li>
            <li>Email sending is working</li>
          </ul>
          <p style="color: #666; margin-top: 20px;">
            Sent from: Twangle Email Verification System
          </p>
        </div>
      `,
    };
    
    await client.send(msg);
    
    console.log('✅ Test email sent successfully!');
    console.log('\nCheck your inbox for the test email.');
    
  } catch (error: any) {
    console.error('❌ SendGrid test failed:');
    console.error('Error:', error.message);
    
    if (error.code === 401) {
      console.error('\n🔑 API Key Issue: The SendGrid API key is invalid or unauthorized');
      console.error('   → Check that your API key starts with "SG."');
      console.error('   → Verify the key has "Mail Send" permissions');
      console.error('   → Reconfigure the SendGrid connection with a valid key');
    }
    
    if (error.response) {
      console.error('\nResponse details:', error.response.body);
    }
    
    process.exit(1);
  }
}

testSendGrid();
