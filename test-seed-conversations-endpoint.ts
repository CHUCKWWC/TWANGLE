#!/usr/bin/env tsx

// Test script for the admin seed-conversations endpoint
// Usage: tsx test-seed-conversations-endpoint.ts

import fs from 'fs';
import path from 'path';

// Load cookies from file for authentication
const cookiesFile = path.join(process.cwd(), 'admin-cookies.txt');
let cookies = '';

try {
  cookies = fs.readFileSync(cookiesFile, 'utf-8').trim();
  console.log('✅ Loaded authentication cookies');
} catch (error) {
  console.error('❌ No admin-cookies.txt file found. Please login as admin first.');
  console.error('Run: npm run test:admin:login');
  process.exit(1);
}

async function testSeedConversations() {
  const url = 'http://localhost:5000/api/admin/seed-conversations';
  
  console.log('\n📝 Testing seed-conversations endpoint...\n');
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Cookie': cookies,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error(`❌ Error: ${response.status} ${response.statusText}`);
      console.error('Response:', data);
      return;
    }

    console.log('✅ Endpoint responded successfully!\n');
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (data.status === 'already_seeded') {
      console.log('\n⚠️  Questions already exist in database');
      console.log(`📊 Total questions: ${data.count}`);
    } else if (data.status === 'seeded') {
      console.log('\n🎉 Questions seeded successfully!');
      console.log(`📊 Total questions seeded: ${data.count}`);
      if (data.categories) {
        console.log(`📂 Categories: ${data.categories.join(', ')}`);
      }
      if (data.intensityLevels) {
        console.log(`🎯 Intensity levels: ${data.intensityLevels.join(', ')}`);
      }
    }
    
    // Test that we can retrieve the questions
    console.log('\n🔍 Verifying questions can be retrieved...');
    const verifyUrl = 'http://localhost:5000/api/conversations/questions/random';
    const verifyResponse = await fetch(verifyUrl, {
      method: 'GET',
      headers: {
        'Cookie': cookies
      }
    });
    
    if (verifyResponse.ok) {
      const question = await verifyResponse.json();
      console.log('✅ Successfully retrieved a sample question:');
      console.log(`   Category: ${question.category}`);
      console.log(`   Intensity: ${question.intensity}`);
      console.log(`   Question: ${question.questionText?.substring(0, 50)}...`);
    } else {
      console.log('⚠️  Could not retrieve a random question (endpoint may not exist yet)');
    }
    
  } catch (error: any) {
    console.error('❌ Failed to test endpoint:', error.message);
    process.exit(1);
  }
}

// Run the test
testSeedConversations()
  .then(() => {
    console.log('\n✅ Test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });