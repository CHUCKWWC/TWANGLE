// Test script for the /api/admin/seed-challenges endpoint
// Run this script to test the seeding functionality

async function testSeedEndpoint() {
  console.log("Testing /api/admin/seed-challenges endpoint...\n");
  
  const baseUrl = "http://localhost:5000";
  
  // Note: This test requires authentication
  // You'll need to either:
  // 1. Be logged in as an admin user
  // 2. Have lifetime access
  // 3. Or temporarily bypass auth for testing (not recommended for production)
  
  console.log("🔍 Testing endpoint without authentication (should fail):");
  try {
    const noAuthResponse = await fetch(`${baseUrl}/api/admin/seed-challenges`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const noAuthData = await noAuthResponse.json();
    console.log(`  Status: ${noAuthResponse.status}`);
    console.log(`  Response:`, noAuthData);
    
    if (noAuthResponse.status === 401) {
      console.log("  ✅ Correctly rejected unauthenticated request\n");
    }
  } catch (error) {
    console.error("  ❌ Error:", error);
  }
  
  console.log("📝 To test with authentication:");
  console.log("  1. Login as an admin or lifetime user");
  console.log("  2. Use the browser's developer tools");
  console.log("  3. Run this in the console:\n");
  
  console.log(`
fetch('/api/admin/seed-challenges', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include'
})
.then(res => res.json())
.then(data => {
  console.log('Seed Response:', data);
  if (data.success) {
    console.log('✅ Successfully seeded', data.count, 'challenges');
    console.log('Status:', data.status);
  } else {
    console.log('❌ Failed:', data.message);
  }
})
.catch(err => console.error('Error:', err));
`);

  console.log("\n🔍 Expected responses:");
  console.log("  - If not authenticated: 401 Unauthorized");
  console.log("  - If not admin/lifetime: 403 Access denied");
  console.log("  - If challenges exist: { success: true, status: 'already_seeded', count: 40 }");
  console.log("  - If newly seeded: { success: true, status: 'seeded', count: 40 }");
  console.log("  - If error occurs: { success: false, message: '...', error: '...' }");
}

// Run the test
testSeedEndpoint();