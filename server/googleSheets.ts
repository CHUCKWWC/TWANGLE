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
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-sheet',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Google Sheet not connected');
  }
  return accessToken;
}

export async function getUncachableGoogleSheetClient() {
  const accessToken = await getAccessToken();

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken
  });

  return google.sheets({ version: 'v4', auth: oauth2Client });
}

let currentSpreadsheetId: string | null = null;
let currentSheetDate: string | null = null;

function getTodayDateString(): string {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

async function findExistingDailySheet(todayDate: string): Promise<string | null> {
  try {
    const sheets = await getUncachableGoogleSheetClient();
    const drive = google.drive({ version: 'v3', auth: sheets.context._options.auth as any });
    
    const title = `Twangle Access Log - ${todayDate}`;
    
    const response = await drive.files.list({
      q: `name='${title}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`,
      fields: 'files(id, name)',
      pageSize: 1,
    });
    
    if (response.data.files && response.data.files.length > 0) {
      const spreadsheetId = response.data.files[0].id;
      console.log(`Found existing daily access log sheet: ${title} (${spreadsheetId})`);
      return spreadsheetId || null;
    }
    
    return null;
  } catch (error) {
    console.error('Error finding existing sheet:', error);
    return null;
  }
}

async function createNewDailySheet(todayDate: string): Promise<string> {
  const sheets = await getUncachableGoogleSheetClient();
  const title = `Twangle Access Log - ${todayDate}`;

  const response = await sheets.spreadsheets.create({
    requestBody: {
      properties: {
        title,
      },
      sheets: [{
        properties: {
          title: todayDate,
        },
        data: [{
          startRow: 0,
          startColumn: 0,
          rowData: [{
            values: [
              { userEnteredValue: { stringValue: 'Timestamp' } },
              { userEnteredValue: { stringValue: 'IP Address' } },
              { userEnteredValue: { stringValue: 'Location' } },
              { userEnteredValue: { stringValue: 'User Name' } },
              { userEnteredValue: { stringValue: 'User ID' } },
              { userEnteredValue: { stringValue: 'Path' } },
              { userEnteredValue: { stringValue: 'Method' } },
            ]
          }]
        }]
      }]
    }
  });

  const spreadsheetId = response.data.spreadsheetId;
  if (!spreadsheetId) {
    throw new Error('Failed to create spreadsheet');
  }

  console.log(`Created new daily access log sheet: ${title} (${spreadsheetId})`);
  
  return spreadsheetId;
}

async function getCurrentSpreadsheetId(): Promise<string> {
  const todayDate = getTodayDateString();
  
  if (currentSpreadsheetId && currentSheetDate === todayDate) {
    return currentSpreadsheetId;
  }
  
  const existingId = await findExistingDailySheet(todayDate);
  if (existingId) {
    currentSpreadsheetId = existingId;
    currentSheetDate = todayDate;
    return existingId;
  }
  
  const newId = await createNewDailySheet(todayDate);
  currentSpreadsheetId = newId;
  currentSheetDate = todayDate;
  return newId;
}

export interface AccessLogEntry {
  timestamp: string;
  ipAddress: string;
  location: string;
  userName: string;
  userId: string;
  path: string;
  method: string;
}

let logQueue: AccessLogEntry[] = [];
let flushTimeout: NodeJS.Timeout | null = null;
const BATCH_SIZE = 10;
const FLUSH_INTERVAL = 5000;

async function flushLogQueue(): Promise<void> {
  if (logQueue.length === 0) {
    return;
  }

  const entriesToFlush = logQueue.splice(0, BATCH_SIZE);
  
  try {
    const sheets = await getUncachableGoogleSheetClient();
    const spreadsheetId = await getCurrentSpreadsheetId();
    const todayDate = getTodayDateString();

    const values = entriesToFlush.map(entry => [
      entry.timestamp,
      entry.ipAddress,
      entry.location,
      entry.userName,
      entry.userId,
      entry.path,
      entry.method,
    ]);

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${todayDate}!A:G`,
      valueInputOption: 'RAW',
      requestBody: {
        values
      }
    });
    
    console.log(`Flushed ${entriesToFlush.length} log entries to Google Sheets`);
  } catch (error) {
    console.error('Failed to flush logs to Google Sheet:', error);
    logQueue.unshift(...entriesToFlush);
  }

  if (logQueue.length > 0) {
    scheduleFlush();
  } else {
    flushTimeout = null;
  }
}

function scheduleFlush(): void {
  if (flushTimeout) {
    return;
  }
  
  flushTimeout = setTimeout(() => {
    flushTimeout = null;
    flushLogQueue();
  }, FLUSH_INTERVAL);
}

export async function logAccessToSheet(entry: AccessLogEntry): Promise<void> {
  logQueue.push(entry);
  
  if (logQueue.length >= BATCH_SIZE) {
    if (flushTimeout) {
      clearTimeout(flushTimeout);
      flushTimeout = null;
    }
    await flushLogQueue();
  } else {
    scheduleFlush();
  }
}

async function getLocationFromIP(ip: string): Promise<string> {
  if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('::ffff:127.')) {
    return 'localhost';
  }
  
  return 'Pending'
;
}

export async function createAccessLogEntry(req: any, user: any): Promise<AccessLogEntry> {
  const ipAddress = req.headers['x-forwarded-for']?.split(',')[0]?.trim() 
    || req.headers['x-real-ip'] 
    || req.connection?.remoteAddress 
    || req.socket?.remoteAddress 
    || 'Unknown';
  
  const location = await getLocationFromIP(ipAddress);
  
  return {
    timestamp: new Date().toISOString(),
    ipAddress,
    location,
    userName: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.email || 'Anonymous',
    userId: user?.id || 'N/A',
    path: req.path,
    method: req.method,
  };
}
