
import { db } from './storage';
import { accessLogs } from '../shared/schema';
import { sql } from 'drizzle-orm';

async function checkSanAntonioIPs() {
  try {
    const logs = await db.select().from(accessLogs).all();
    
    const sanAntonioLogs = logs.filter(log => 
      log.location?.toLowerCase().includes('san antonio') || 
      log.location?.toLowerCase().includes('san antonio')
    );
    
    console.log('\n=== San Antonio IP Analysis ===\n');
    console.log(`Total access logs: ${logs.length}`);
    console.log(`San Antonio logs: ${sanAntonioLogs.length}`);
    console.log(`Percentage: ${((sanAntonioLogs.length / logs.length) * 100).toFixed(2)}%`);
    
    if (sanAntonioLogs.length > 0) {
      console.log('\n=== San Antonio IP Addresses ===\n');
      const uniqueIPs = new Set(sanAntonioLogs.map(log => log.ipAddress));
      console.log(`Unique IPs from San Antonio: ${uniqueIPs.size}`);
      
      uniqueIPs.forEach(ip => {
        const logsForIP = sanAntonioLogs.filter(log => log.ipAddress === ip);
        console.log(`\nIP: ${ip}`);
        console.log(`  Times accessed: ${logsForIP.length}`);
        console.log(`  First seen: ${logsForIP[0].timestamp}`);
        console.log(`  Last seen: ${logsForIP[logsForIP.length - 1].timestamp}`);
        console.log(`  Location: ${logsForIP[0].location}`);
      });
    }
    
  } catch (error) {
    console.error('Error checking IPs:', error);
  }
}

checkSanAntonioIPs();
