
import { db } from './storage';
import { accessLogs } from '../shared/schema';

async function generateAccessReport() {
  try {
    const logs = await db.select().from(accessLogs).all();
    
    console.log('\n========================================');
    console.log('ACCESS REPORT - TWANGLE APP');
    console.log('========================================\n');
    
    console.log(`Total Access Logs: ${logs.length}\n`);
    
    // Group by location
    const locationGroups = logs.reduce((acc, log) => {
      const location = log.location || 'Unknown';
      if (!acc[location]) {
        acc[location] = [];
      }
      acc[location].push(log);
      return acc;
    }, {} as Record<string, typeof logs>);
    
    console.log('=== ACCESS BY LOCATION ===\n');
    
    Object.entries(locationGroups)
      .sort((a, b) => b[1].length - a[1].length)
      .forEach(([location, locationLogs]) => {
        const uniqueIPs = new Set(locationLogs.map(log => log.ipAddress)).size;
        const uniqueUsers = new Set(locationLogs.map(log => log.userId || log.userEmail || 'anonymous')).size;
        
        console.log(`📍 ${location}`);
        console.log(`   Total accesses: ${locationLogs.length}`);
        console.log(`   Unique IPs: ${uniqueIPs}`);
        console.log(`   Unique users: ${uniqueUsers}`);
        console.log('');
      });
    
    // Unique IPs summary
    console.log('\n=== UNIQUE IP ADDRESSES ===\n');
    const uniqueIPs = new Set(logs.map(log => log.ipAddress));
    console.log(`Total unique IPs: ${uniqueIPs.size}\n`);
    
    uniqueIPs.forEach(ip => {
      const ipLogs = logs.filter(log => log.ipAddress === ip);
      const locations = [...new Set(ipLogs.map(log => log.location))];
      const users = [...new Set(ipLogs.map(log => log.userName || 'Anonymous'))];
      
      console.log(`IP: ${ip}`);
      console.log(`   Access count: ${ipLogs.length}`);
      console.log(`   Locations: ${locations.join(', ')}`);
      console.log(`   Users: ${users.join(', ')}`);
      console.log(`   First seen: ${ipLogs[0].timestamp}`);
      console.log(`   Last seen: ${ipLogs[ipLogs.length - 1].timestamp}`);
      console.log('');
    });
    
    // User summary
    console.log('\n=== USER ACCESS SUMMARY ===\n');
    const userGroups = logs.reduce((acc, log) => {
      const userKey = log.userId || log.userEmail || `anon-${log.ipAddress}`;
      if (!acc[userKey]) {
        acc[userKey] = [];
      }
      acc[userKey].push(log);
      return acc;
    }, {} as Record<string, typeof logs>);
    
    Object.entries(userGroups)
      .sort((a, b) => b[1].length - a[1].length)
      .forEach(([userKey, userLogs]) => {
        const firstLog = userLogs[0];
        const userName = firstLog.userName || 'Anonymous';
        const userEmail = firstLog.userEmail || 'N/A';
        const locations = [...new Set(userLogs.map(log => log.location))];
        const ips = [...new Set(userLogs.map(log => log.ipAddress))];
        
        console.log(`👤 ${userName}`);
        console.log(`   Email: ${userEmail}`);
        console.log(`   User ID: ${firstLog.userId || 'Anonymous'}`);
        console.log(`   Total accesses: ${userLogs.length}`);
        console.log(`   Locations: ${locations.join(', ')}`);
        console.log(`   IP addresses: ${ips.join(', ')}`);
        console.log(`   First access: ${userLogs[0].timestamp}`);
        console.log(`   Last access: ${userLogs[userLogs.length - 1].timestamp}`);
        console.log('');
      });
    
    // Geographic distribution
    console.log('\n=== GEOGRAPHIC DISTRIBUTION ===\n');
    const countries = logs.reduce((acc, log) => {
      const location = log.location || 'Unknown';
      const country = location.split(',').pop()?.trim() || 'Unknown';
      acc[country] = (acc[country] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    Object.entries(countries)
      .sort((a, b) => b[1] - a[1])
      .forEach(([country, count]) => {
        const percentage = ((count / logs.length) * 100).toFixed(1);
        console.log(`${country}: ${count} accesses (${percentage}%)`);
      });
    
    console.log('\n========================================');
    console.log('END OF REPORT');
    console.log('========================================\n');
    
  } catch (error) {
    console.error('Error generating access report:', error);
  }
}

generateAccessReport();
