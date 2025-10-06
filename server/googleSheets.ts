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
const SHEET_NAME = 'Access Log';

async function findExistingSheet(): Promise<string | null> {
  try {
    const sheets = await getUncachableGoogleSheetClient();
    const drive = google.drive({ version: 'v3', auth: sheets.context._options.auth as any });
    
    const response = await drive.files.list({
      q: `name contains 'Twangle Access Log' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`,
      fields: 'files(id, name, createdTime)',
      pageSize: 10,
      orderBy: 'createdTime desc',
    });
    
    if (response.data.files && response.data.files.length > 0) {
      for (const file of response.data.files) {
        const spreadsheetId = file.id;
        if (!spreadsheetId) continue;
        
        try {
          const spreadsheet = await sheets.spreadsheets.get({
            spreadsheetId,
          });
          
          const hasAccessLogSheet = spreadsheet.data.sheets?.some(
            sheet => sheet.properties?.title === SHEET_NAME
          );
          
          if (hasAccessLogSheet) {
            return spreadsheetId;
          }
        } catch (error) {
          continue;
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error finding existing sheet:', error);
    return null;
  }
}

async function createNewSheet(): Promise<string> {
  const sheets = await getUncachableGoogleSheetClient();
  const now = new Date();
  const formattedDate = now.toISOString().replace(/[:.]/g, '-').split('T')[0];
  const formattedTime = now.toTimeString().split(' ')[0].replace(/:/g, '-');
  const title = `Twangle Access Log ${formattedDate} ${formattedTime}`;

  const response = await sheets.spreadsheets.create({
    requestBody: {
      properties: {
        title,
      },
      sheets: [{
        properties: {
          title: SHEET_NAME,
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
              { userEnteredValue: { stringValue: 'Email/Login' } },
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
  
  return spreadsheetId;
}

async function getCurrentSpreadsheetId(): Promise<string> {
  if (currentSpreadsheetId) {
    return currentSpreadsheetId;
  }
  
  const existingId = await findExistingSheet();
  if (existingId) {
    currentSpreadsheetId = existingId;
    return existingId;
  }
  
  const newId = await createNewSheet();
  currentSpreadsheetId = newId;
  return newId;
}

export interface AccessLogEntry {
  timestamp: string;
  ipAddress: string;
  location: string;
  userName: string;
  userEmail: string;
  userId: string;
  path: string;
  method: string;
}

let logQueue: AccessLogEntry[] = [];
let flushTimeout: NodeJS.Timeout | null = null;
let retryCount = 0;
let isFlushInProgress = false;
const BATCH_SIZE = 10;
const FLUSH_INTERVAL = 5000;
const MAX_RETRIES = 3;
const MAX_QUEUE_SIZE = 1000;

async function flushLogQueue(): Promise<void> {
  if (logQueue.length === 0 || isFlushInProgress) {
    return;
  }

  isFlushInProgress = true;
  const entriesToFlush = logQueue.splice(0, BATCH_SIZE);
  
  try {
    const sheets = await getUncachableGoogleSheetClient();
    const spreadsheetId = await getCurrentSpreadsheetId();

    const values = entriesToFlush.map(entry => [
      entry.timestamp,
      entry.ipAddress,
      entry.location,
      entry.userName,
      entry.userEmail,
      entry.userId,
      entry.path,
      entry.method,
    ]);

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${SHEET_NAME}!A:H`,
      valueInputOption: 'RAW',
      requestBody: {
        values
      }
    });
    
    retryCount = 0;
  } catch (error: any) {
    const isSheetNotFound = error?.message?.includes('Unable to parse range') || 
                            error?.message?.includes('not found') ||
                            error?.code === 400 || 
                            error?.status === 400 ||
                            error?.code === 404 || 
                            error?.status === 404;
    
    if (isSheetNotFound && retryCount === 0) {
      console.error('Sheet or worksheet not found, clearing cache and creating new sheet');
      currentSpreadsheetId = null;
      logQueue.unshift(...entriesToFlush);
      retryCount++;
    } else {
      retryCount++;
      
      if (retryCount <= MAX_RETRIES && logQueue.length < MAX_QUEUE_SIZE) {
        logQueue.unshift(...entriesToFlush);
      } else if (retryCount > MAX_RETRIES) {
        console.error(`Max retries (${MAX_RETRIES}) exceeded. Dropping ${entriesToFlush.length} log entries.`);
        retryCount = 0;
      } else {
        console.error(`Queue size limit (${MAX_QUEUE_SIZE}) exceeded. Dropping ${entriesToFlush.length} log entries.`);
      }
    }
  } finally {
    isFlushInProgress = false;
    
    if (logQueue.length > 0) {
      scheduleFlush();
    } else {
      flushTimeout = null;
    }
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
  
  return 'Unknown';
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
    userName: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : 'Anonymous',
    userEmail: user?.email || 'N/A',
    userId: user?.id || 'N/A',
    path: req.path,
    method: req.method,
  };
}
