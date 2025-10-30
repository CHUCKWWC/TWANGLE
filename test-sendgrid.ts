import { sendVerificationEmail } from './server/gmail.js';

async function testGmail() {
  try {
    console.log('Testing Gmail connection...');
    
    // Test email - replace with your email
    const testEmail = process.argv[2] || 'charles.watson@wholewellness-coaching.org';
    
    console.log(`\nSending test verification email to: ${testEmail}`);
    
    const testToken = 'test-token-' + Date.now();
    const baseUrl = 'http://localhost:5000';
    
    await sendVerificationEmail(testEmail, testToken, baseUrl);
    
    console.log('✅ Test email sent successfully via Gmail!');
    console.log('\nCheck your inbox for the verification email.');
    console.log('Note: The verification link is just for testing and will not work.');
    
  } catch (error: any) {
    console.error('❌ Gmail test failed:');
    console.error('Error:', error.message);
    
    if (error.code === 401 || error.code === 403) {
      console.error('\n🔑 Authentication Issue: Gmail connection is not properly authenticated');
      console.error('   → Make sure you connected your Gmail account in Replit');
      console.error('   → The connection should have "Send" permissions');
    }
    
    if (error.response) {
      console.error('\nResponse details:', JSON.stringify(error.response.data, null, 2));
    }
    
    process.exit(1);
  }
}

testGmail();
