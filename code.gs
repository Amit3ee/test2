// --- CONFIGURATION ---
// !!! IMPORTANT: Create a new Google Sheet and paste its ID here.
const SHEET_ID = '1jJAxG1hM5z0J-j3QoI1RIQ453AL69QeguQPFK81vNpY'; // This is YOUR Sheet ID from the screenshot.

// Sheet names (make sure these exist in your Google Sheet)
const SHEET_INDICATOR_1 = 'Indicator1';
const SHEET_INDICATOR_2 = 'Indicator2';
const SHEET_NIFTY = 'Nifty';
const SHEET_LOGS = 'DebugLogs'; // Optional: for logging errors

const OTP_VALIDITY_MINUTES = 3;
const SESSION_VALIDITY_HOURS = 24; // 1 day session
const ADMIN_EMAIL = 'amit3ree@gmail.com'; // OTPs will be sent here

// --- !!! GEMINI API KEY !!! ---
// Replace "YOUR_GEMINI_API_KEY" with your actual Gemini API Key
// Get one here: https://aistudio.google.com/app/apikey
const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY";
const GEMINI_API_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`;


// --- WEB APP ---

/**
 * Serves the main HTML page of the web app.
 */
function doGet(e) {
  try {
      return HtmlService.createTemplateFromFile('index').evaluate()
        .setTitle('Automated Trading Signals')
        .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (err) {
      Logger.log(`doGet Error: ${err.message} Stack: ${err.stack}`);
      return HtmlService.createHtmlOutput("<p>Error loading application. Please contact support.</p>");
  }
}

/**
 * Includes HTML content from another file. Used for templates.
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Handles all POST requests (TradingView alerts).
 */
function doPost(e) {
  let logSheet;
  try {
    const postData = e.postData.contents;
    if (!postData) { throw new Error("Received empty postData."); }
    const data = JSON.parse(postData);

    const ss = SpreadsheetApp.openById(SHEET_ID);
    logSheet = ss.getSheetByName(SHEET_LOGS);
    const lock = LockService.getScriptLock();
    lock.waitLock(10000);

    let timestamp;
    if (data.timestamp) {
      timestamp = new Date(data.timestamp.replace(' ', 'T') + 'Z');
      if (isNaN(timestamp.getTime())) {
        Logger.log(`Invalid timestamp received: ${data.timestamp}. Using current time.`);
        timestamp = new Date();
      }
    } else {
      Logger.log("No timestamp received. Using current time.");
      timestamp = new Date();
    }
    const scriptTimeZone = Session.getScriptTimeZone();
    const date = Utilities.formatDate(timestamp, scriptTimeZone, 'yyyy-MM-dd');
    const time = Utilities.formatDate(timestamp, scriptTimeZone, 'HH:mm:ss');

    // --- Data from Indicator 1 ---
    if (data.scrip && data.reason && !data.ticker) {
      const ind1Sheet = ss.getSheetByName(SHEET_INDICATOR_1);
      ind1Sheet.appendRow([ date, time, data.scrip, data.reason ]);
      // No sync check needed here, it happens when Ind2 data arrives.
    }
    // --- Data from Indicator 2 ---
    else if (data.ticker && data.reason && !data.ticker.includes('NIFTY')) {
       const ind2Sheet = ss.getSheetByName(SHEET_INDICATOR_2);
       // Append capital deployed if it exists
       const capital = data.capital_deployed_cr ? data.capital_deployed_cr : '';
       ind2Sheet.appendRow([ date, time, data.ticker, data.reason, capital ]);
       // After adding Ind2 data, check for a sync with Ind1
       checkForSync(ss, data.ticker, date);
    }
    // --- Data from Indicator 3 (Nifty) ---
    else if (data.ticker && data.ticker.includes('NIFTY')) {
       const niftySheet = ss.getSheetByName(SHEET_NIFTY);
       if (!niftySheet) throw new Error(`Sheet not found: ${SHEET_NIFTY}`);
       niftySheet.appendRow([ date, time, data.ticker, data.reason ]);
    } else {
       throw new Error(`Unrecognized data format received: ${JSON.stringify(data)}`);
    }

    lock.releaseLock();
    return ContentService.createTextOutput(JSON.stringify({ status: 'success', received: data }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    Logger.log(`doPost CRITICAL ERROR: ${err.message} Stack: ${err.stack}. Received Data: ${e.postData ? e.postData.contents : 'No postData'}`);
    _logErrorToSheet(logSheet, 'doPost Error', err, e.postData ? e.postData.contents : 'No postData');
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Utility to log errors to the DebugLogs sheet.
 */
function _logErrorToSheet(logSheet, context, error, details = '') {
    try {
        if (!logSheet) {
            const ss = SpreadsheetApp.openById(SHEET_ID);
            logSheet = ss.getSheetByName(SHEET_LOGS);
            if (!logSheet) {
                 Logger.log(`Cannot log error: ${SHEET_LOGS} sheet not found.`);
                 return;
            }
        }
        logSheet.appendRow([new Date(), context, error.message, details, error.stack]);
    } catch (logErr) {
        Logger.log(`CRITICAL: Failed to write error to ${SHEET_LOGS}: ${logErr.message}. Original error: ${error.message}`);
    }
}

/**
 * Checks for synchronization between Indicator 1 and Indicator 2.
 */
function checkForSync(ss, symbol, date) {
  let logSheet;
  try {
    logSheet = ss.getSheetByName(SHEET_LOGS);
    const ind1Sheet = ss.getSheetByName(SHEET_INDICATOR_1);
    const ind2Sheet = ss.getSheetByName(SHEET_INDICATOR_2);

    if (!ind1Sheet || !ind2Sheet) { Logger.log(`checkForSync: Missing Ind1 or Ind2 sheet for symbol ${symbol}`); return; }

    const ind1Range = ind1Sheet.getDataRange();
    const ind1Data = ind1Range.getDisplayValues().filter(row => row[0] === date && row[2] === symbol);
    const ind2Range = ind2Sheet.getDataRange();
    const ind2Data = ind2Range.getDisplayValues().filter(row => row[0] === date && row[2] === symbol);

    const latestInd2Signal = ind2Data.length > 0 ? ind2Data.reduce((latest, current) => (current[1] > latest[1] ? current : latest), ind2Data[0]) : null;

    if (!latestInd2Signal) { return; }

    const ind2Time = latestInd2Signal[1];
    let ind2Reason = latestInd2Signal[3];
    const ind2Capital = latestInd2Signal[4];
    if (ind2Reason === 'HVD' && ind2Capital) { ind2Reason = `HVD (${ind2Capital} Cr.)`; }

    let updatedCount = 0;
    const ind1FullData = ind1Sheet.getDataRange().getDisplayValues();

    for (let i = 1; i < ind1FullData.length; i++) {
      const row = ind1FullData[i];
      if (row[0] === date && row[2] === symbol && row[4] === 'Awaiting') {
        const rowNum = i + 1;
        ind1Sheet.getRange(rowNum, 5, 1, 3).setValues([[ 'Synced', ind2Time, ind2Reason ]]);
        updatedCount++;
      }
    }
    if (updatedCount > 0) { Logger.log(`checkForSync: Successfully updated ${updatedCount} rows for ${symbol} on ${date}.`); }

  } catch (err) {
    Logger.log(`checkForSync CRITICAL ERROR for ${symbol}: ${err.message} Stack: ${err.stack}`);
    _logErrorToSheet(logSheet, 'checkForSync Error', err, `Symbol: ${symbol}, Date: ${date}`);
  }
}

// --- AUTHENTICATION FUNCTIONS ---
function generateOTPServer(email) {
  if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    Logger.log(`generateOTPServer: Unauthorized attempt by ${email}`);
    return { status: 'error', message: 'Unauthorized user.' };
  }
  try {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const formattedOTP = `${otp.substring(0, 3)}-${otp.substring(3, 6)}`;
    const cache = CacheService.getScriptCache();
    cache.put(`otp_${email}`, otp, OTP_VALIDITY_MINUTES * 60);
    Logger.log(`Generated OTP ${formattedOTP} for ${email}`);
    MailApp.sendEmail({ to: email, subject: `Your Trading Signals OTP: ${formattedOTP}`, body: `Your one-time password is ${formattedOTP}. It is valid for ${OTP_VALIDITY_MINUTES} minutes.` });
    Logger.log(`Sent OTP email to ${email}`);
    return { status: 'success' };
  } catch (err) {
    Logger.log(`generateOTPServer CRITICAL ERROR: ${err.message} Stack: ${err.stack}`);
    _logErrorToSheet(null, 'generateOTPServer Error', err, `Email: ${email}`); // Try logging even if sheet wasn't opened yet
    return { status: 'error', message: 'Failed to send email: ' + err.message };
  }
}

function verifyOTPServer(email, otp) {
   if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    Logger.log(`verifyOTPServer: Unauthorized attempt by ${email}`);
    return { status: 'error', message: 'Unauthorized user.' };
  }
  try {
      const cache = CacheService.getScriptCache();
      const storedOTP = cache.get(`otp_${email}`);
      if (!storedOTP) { Logger.log(`verifyOTPServer: OTP expired or not found for ${email}`); return { status: 'error', message: 'OTP expired or was invalid. Please request a new one.' }; }
      const submittedOTP = otp.replace('-', '');
      if (submittedOTP === storedOTP) {
        const sessionToken = Utilities.computeHmacSha256Signature(email + new Date().getTime(), Utilities.getUuid()).map(b => (b + 256).toString(16).slice(-2)).join('');
        cache.put(`session_${sessionToken}`, email, SESSION_VALIDITY_HOURS * 3600);
        cache.remove(`otp_${email}`);
        Logger.log(`verifyOTPServer: OTP verified for ${email}. Session token created.`);
        return { status: 'success', sessionToken: sessionToken, userInfo: { name: email.split('@')[0] } };
      } else {
        Logger.log(`verifyOTPServer: Invalid OTP entered for ${email}. Submitted: ${submittedOTP}, Expected: ${storedOTP}`);
        return { status: 'error', message: 'Invalid OTP. Please try again.' };
      }
  } catch (err) {
       Logger.log(`verifyOTPServer CRITICAL ERROR: ${err.message} Stack: ${err.stack}`);
       _logErrorToSheet(null, 'verifyOTPServer Error', err, `Email: ${email}`);
       return { status: 'error', message: 'Server error during OTP verification.' };
  }
}

function verifySessionServer(sessionToken) {
  try {
      const cache = CacheService.getScriptCache();
      const email = cache.get(`session_${sessionToken}`);
      if (email) {
        cache.put(`session_${sessionToken}`, email, SESSION_VALIDITY_HOURS * 3600);
        Logger.log(`verifySessionServer: Valid session found for ${email}. Refreshed.`);
        return { status: 'success', userInfo: { name: email.split('@')[0] } };
      } else {
        Logger.log(`verifySessionServer: Session token invalid or expired: ${sessionToken}`);
        return { status: 'error', message: 'Session expired.' };
      }
  } catch (err) {
      Logger.log(`verifySessionServer CRITICAL ERROR: ${err.message} Stack: ${err.stack}`);
      _logErrorToSheet(null, 'verifySessionServer Error', err, `Token: ${sessionToken}`);
      return { status: 'error', message: 'Server error during session verification.' };
  }
}

// --- DATA-READING FUNCTIONS ---

/** Utility to get sheet data with caching */
function _getSheetData(sheetName) {
  const cache = CacheService.getScriptCache();
  const cacheKey = `sheetData_${sheetName}`;
  const cachedData = cache.get(cacheKey);
  if (cachedData != null) { return JSON.parse(cachedData); }

  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) { Logger.log(`_getSheetData: Sheet not found - ${sheetName}`); _logErrorToSheet(null, '_getSheetData Error', new Error('Sheet not found'), `Sheet: ${sheetName}`); return []; }
    const lastRow = sheet.getLastRow();
    let data = [];
    if (lastRow > 0) { data = sheet.getDataRange().getDisplayValues(); }
    else { Logger.log(`_getSheetData: Sheet ${sheetName} is empty.`); }
    cache.put(cacheKey, JSON.stringify(data), 60);
    return data;
  } catch (err) {
    Logger.log(`_getSheetData CRITICAL ERROR for ${sheetName}: ${err.message} Stack: ${err.stack}`);
    _logErrorToSheet(null, '_getSheetData Error', err, `Sheet: ${sheetName}`);
    return { error: `Server error in _getSheetData: ${err.message}`, stack: err.stack };
  }
}

/** Gets all data for the dashboard */
function getDashboardData() {
  try {
    Logger.log('getDashboardData: Function started.');
    const scriptTimeZone = Session.getScriptTimeZone();
    const today = Utilities.formatDate(new Date(), scriptTimeZone, 'yyyy-MM-dd');
    Logger.log(`getDashboardData: Today's date is ${today}`);

    const ind1FullData = _getSheetData(SHEET_INDICATOR_1);
    const ind2FullData = _getSheetData(SHEET_INDICATOR_2);
    const niftyFullData = _getSheetData(SHEET_NIFTY);

    if (ind1FullData.error || ind2FullData.error || niftyFullData.error) { throw new Error(`Error fetching sheet data: Ind1(${ind1FullData.error}), Ind2(${ind2FullData.error}), Nifty(${niftyFullData.error})`); }
    if (!Array.isArray(ind1FullData) || !Array.isArray(ind2FullData) || !Array.isArray(niftyFullData)) { throw new Error("_getSheetData did not return arrays."); }

    const headerRowLength = 7;
    const ind1Data = ind1FullData.slice(ind1FullData.length > 0 && ind1FullData[0].length === headerRowLength ? 1 : 0).filter(row => row[0] === today);
    const ind2Data = ind2FullData.slice(ind2FullData.length > 0 ? 1 : 0).filter(row => row[0] === today);
    const niftyData = niftyFullData.slice(niftyFullData.length > 0 ? 1 : 0).filter(row => row[0] === today);

    Logger.log(`getDashboardData: Today's data - Ind1: ${ind1Data.length}, Ind2: ${ind2Data.length}, Nifty: ${niftyData.length}`);

    const liveFeed = ind1Data.map(row => ({ symbol: row[2], time: row[1], reason: row[3], status: row[4], syncTime: row[5], syncReason: row[6] })).sort((a,b) => b.time.localeCompare(a.time));

    const logs = { hvd: [], bullish: [], bearish: [], oversold: [], overbought: [] };
    ind2Data.forEach(row => {
      const reason = (row[3] || '').toLowerCase();
      const signal = { symbol: row[2], time: row[1], reason: row[3], capital: row[4] };
      if (reason.includes('hvd')) logs.hvd.push(signal);
      else if (reason.includes('bullish')) logs.bullish.push(signal);
      else if (reason.includes('bearish')) logs.bearish.push(signal);
      else if (reason.includes('oversold')) logs.oversold.push(signal);
      else if (reason.includes('overbought')) logs.overbought.push(signal);
    });
    for (const key in logs) { logs[key].sort((a,b) => b.time.localeCompare(a.time)); }

    const dashboardSyncedList = liveFeed.filter(s => s.status === 'Synced').reduce((acc, signal) => {
        let entry = acc.find(e => e.symbol === signal.symbol);
        if (!entry) { entry = { symbol: signal.symbol, ind1Reason: signal.reason, ind2Reasons: [] }; acc.push(entry); }
        if (signal.syncTime && signal.syncReason) { const exists = entry.ind2Reasons.some(r => r.time === signal.syncTime && r.reason === signal.syncReason); if (!exists) { entry.ind2Reasons.push({ time: signal.syncTime, reason: signal.syncReason }); } }
        return acc;
      }, []).map(entry => { entry.ind2Reasons.sort((a,b) => b.time.localeCompare(a.time)); return entry; });

    const syncedSymbols = new Set(liveFeed.filter(s => s.status === 'Synced').map(s => s.symbol));
    const kpi = { totalSignals: liveFeed.length, syncedSignals: syncedSymbols.size, latestSignal: liveFeed.length > 0 ? liveFeed[0].symbol : '-' };

    const tickers = {
      hvd: logs.hvd.sort((a,b) => b.time.localeCompare(a.time)).slice(0, 7),
      patterns: [...logs.bullish, ...logs.bearish].sort((a,b) => b.time.localeCompare(a.time)).slice(0, 7)
    };

    const latestNifty = niftyData.length > 0 ? niftyData.reduce((latest, current) => (current[1] > latest[1] ? current : latest), niftyData[0]) : null;
    const niftyDataObj = latestNifty ? { ticker: latestNifty[2], timestamp: latestNifty[1], reason: latestNifty[3] } : null;

    Logger.log('getDashboardData: Successfully processed all data.');

    return { kpi, niftyData: niftyDataObj, tickers, dashboardSyncedList, liveFeed, logs };
  } catch (err) {
    Logger.log(`getDashboardData CRITICAL ERROR: ${err.message} Stack: ${err.stack}`);
    _logErrorToSheet(null, 'getDashboardData Error', err, '');
    return { error: `Server error in getDashboardData: ${err.message}`, stack: err.stack };
  }
}

/** Gets historical dates */
function getHistoricalDates() {
  try {
    const data = _getSheetData(SHEET_INDICATOR_1);
    if (data.error) throw new Error(data.error);
    if (!Array.isArray(data)) { throw new Error("_getSheetData did not return an array for historical dates."); }
    if (data.length < 2) return [];
    const dates = new Set();
    for (let i = 1; i < data.length; i++) { if (data[i] && data[i][0]) { dates.add(data[i][0]); } }
    const sortedDates = Array.from(dates).sort((a, b) => new Date(b) - new Date(a));
    Logger.log(`getHistoricalDates: Found ${sortedDates.length} unique dates.`);
    return sortedDates;
  } catch (err) {
     Logger.log(`getHistoricalDates CRITICAL ERROR: ${err.message} Stack: ${err.stack}`);
     _logErrorToSheet(null, 'getHistoricalDates Error', err, '');
    return { error: `Server error in getHistoricalDates: ${err.message}`, stack: err.stack };
  }
}

/** Gets signals for a specific date */
function getSignalsForDate(dateStr) {
  try {
    Logger.log(`getSignalsForDate: Fetching data for date ${dateStr}`);
    const ind1FullData = _getSheetData(SHEET_INDICATOR_1);
    if (ind1FullData.error) throw new Error(ind1FullData.error);
    if (!Array.isArray(ind1FullData)) { throw new Error("_getSheetData did not return an array for signals for date."); }
    const signals = ind1FullData.slice(ind1FullData.length > 0 ? 1 : 0).filter(row => row[0] === dateStr)
      .map(row => ({ symbol: row[2], time: row[1], reason: row[3], status: row[4], syncTime: row[5], syncReason: row[6] }))
      .sort((a,b) => b.time.localeCompare(a.time));
    Logger.log(`getSignalsForDate: Found ${signals.length} signals for ${dateStr}`);
    return { date: dateStr, signals: signals };
  } catch (err) {
     Logger.log(`getSignalsForDate CRITICAL ERROR for ${dateStr}: ${err.message} Stack: ${err.stack}`);
     _logErrorToSheet(null, 'getSignalsForDate Error', err, `Date: ${dateStr}`);
    return { error: `Server error in getSignalsForDate: ${err.message}`, stack: err.stack };
  }
}

// --- GEMINI API FUNCTIONS ---

/**
 * Calls Gemini API to analyze a trading signal using Google Search grounding.
 * @param {string} symbol The stock symbol (e.g., "RELIANCE").
 * @param {string} ind1Reason The reason from Indicator 1.
 * @param {object[]} ind2Reasons Array of sync reasons from Indicator 2 [{time: "...", reason: "..."}].
 * @return {object} Object with { analysis: "..." } or { error: "..." }.
 */
function analyzeSignalWithGemini(symbol, ind1Reason, ind2Reasons) {
  if (GEMINI_API_KEY === "AIzaSyDn-2gPqYT7mxXo0_RSOdajXaJpRHouERg") {
    return { error: "Gemini API Key not configured in code.gs." };
  }
  try {
    Logger.log(`analyzeSignalWithGemini: Analyzing ${symbol}. Ind1: ${ind1Reason}, Ind2 Reasons: ${JSON.stringify(ind2Reasons)}`);

    let syncReasonText = "No sync event.";
    if (ind2Reasons && ind2Reasons.length > 0) {
      // Use the latest sync reason
      syncReasonText = `Synced due to: ${ind2Reasons[0].reason} at ${ind2Reasons[0].time}.`;
    }

    const prompt = `Analyze the following trading signal for the stock symbol ${symbol}.
Indicator 1 triggered due to: "${ind1Reason}".
Sync status: ${syncReasonText}
Provide a brief, neutral analysis (1-2 paragraphs max) considering these technical triggers and current market context for ${symbol}. Use Google Search for recent news or context. Do not give financial advice. Focus on explaining what the triggers might suggest in plain language.`;

    const payload = {
      contents: [{
        parts: [{ text: prompt }]
      }],
      tools: [{ "google_search": {} }] // Enable grounding
    };

    const options = {
      'method': 'post',
      'contentType': 'application/json',
      'payload': JSON.stringify(payload),
      'muteHttpExceptions': true // Prevent throwing errors for non-200 responses
    };

    const response = UrlFetchApp.fetch(GEMINI_API_ENDPOINT, options);
    const responseCode = response.getResponseCode();
    const result = JSON.parse(response.getContentText());

    if (responseCode === 200 && result.candidates && result.candidates[0].content && result.candidates[0].content.parts) {
      const analysis = result.candidates[0].content.parts[0].text;
      Logger.log(`analyzeSignalWithGemini: Success for ${symbol}. Analysis length: ${analysis.length}`);
      return { analysis: analysis };
    } else {
      const errorMsg = `Gemini API Error (HTTP ${responseCode}): ${JSON.stringify(result)}`;
      Logger.log(`analyzeSignalWithGemini: ${errorMsg}`);
      _logErrorToSheet(null, 'analyzeSignalWithGemini Error', new Error(errorMsg), `Symbol: ${symbol}`);
      return { error: `Could not get analysis from Gemini. ${result.error ? result.error.message : '(See logs)'}` };
    }

  } catch (err) {
    Logger.log(`analyzeSignalWithGemini CRITICAL ERROR: ${err.message} Stack: ${err.stack}`);
    _logErrorToSheet(null, 'analyzeSignalWithGemini Error', err, `Symbol: ${symbol}`);
    return { error: `Server error during analysis: ${err.message}` };
  }
}

/**
 * Calls Gemini API for a general chat conversation.
 * @param {string} userMessage The user's latest message.
 * @param {object[]} chatHistory Array of previous messages [{role: "user"/"model", parts: [{text: "..."}]}].
 * @return {object} Object with { reply: "..." } or { error: "..." }.
 */
function chatWithGemini(userMessage, chatHistory) {
   if (GEMINI_API_KEY === "YOUR_GEMINI_API_KEY") {
    return { error: "Gemini API Key not configured in code.gs." };
  }
  try {
    Logger.log(`chatWithGemini: Received message. History length: ${chatHistory.length}`);

    // Ensure history is in the correct format
     const history = (chatHistory || []).map(entry => ({
         role: entry.role,
         parts: [{ text: entry.parts[0].text }] // Ensure parts structure
     }));

    const payload = {
      contents: [
        ...history, // Add previous history
        { role: "user", parts: [{ text: userMessage }] } // Add new user message
      ]
      // No grounding needed for general chat
    };

    const options = {
      'method': 'post',
      'contentType': 'application/json',
      'payload': JSON.stringify(payload),
      'muteHttpExceptions': true
    };

    const response = UrlFetchApp.fetch(GEMINI_API_ENDPOINT, options);
    const responseCode = response.getResponseCode();
    const result = JSON.parse(response.getContentText());

    if (responseCode === 200 && result.candidates && result.candidates[0].content && result.candidates[0].content.parts) {
      const reply = result.candidates[0].content.parts[0].text;
      Logger.log(`chatWithGemini: Success. Reply length: ${reply.length}`);
      return { reply: reply };
    } else {
      const errorMsg = `Gemini API Chat Error (HTTP ${responseCode}): ${JSON.stringify(result)}`;
      Logger.log(`chatWithGemini: ${errorMsg}`);
      _logErrorToSheet(null, 'chatWithGemini Error', new Error(errorMsg), `History Length: ${chatHistory.length}`);
      return { error: `Could not get chat reply from Gemini. ${result.error ? result.error.message : '(See logs)'}` };
    }

  } catch (err) {
    Logger.log(`chatWithGemini CRITICAL ERROR: ${err.message} Stack: ${err.stack}`);
    _logErrorToSheet(null, 'chatWithGemini Error', err, `History Length: ${chatHistory.length}`);
    return { error: `Server error during chat: ${err.message}` };
  }
}


// --- MOCK DATA FUNCTION ---
function _getTodayAndYesterdayStrings() { /* ... (unchanged) ... */
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const timezone = Session.getScriptTimeZone();
  return {
    todayStr: Utilities.formatDate(today, timezone, 'yyyy-MM-dd'),
    yestStr: Utilities.formatDate(yesterday, timezone, 'yyyy-MM-dd')
  };
}
function populateSheetWithMockData() { /* ... (unchanged) ... */
  let logSheet;
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const ind1Sheet = ss.getSheetByName(SHEET_INDICATOR_1);
    const ind2Sheet = ss.getSheetByName(SHEET_INDICATOR_2);
    const niftySheet = ss.getSheetByName(SHEET_NIFTY);
    logSheet = ss.getSheetByName(SHEET_LOGS);

    if (!ind1Sheet || !ind2Sheet || !niftySheet) { throw new Error("One or more sheets are missing. Please create: " + SHEET_INDICATOR_1 + ", " + SHEET_INDICATOR_2 + ", " + SHEET_NIFTY); }
    if (!logSheet) { logSheet = ss.insertSheet(SHEET_LOGS); logSheet.appendRow(["Timestamp", "Context", "Error Message", "Details"]); Logger.log(`Created ${SHEET_LOGS} sheet.`); }

    const { todayStr, yestStr } = _getTodayAndYesterdayStrings();
    Logger.log(`Populating data for today (${todayStr}) and yesterday (${yestStr})`);

    const clearSheet = (sheet) => { if (sheet.getLastRow() > 1) { sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).clearContent(); } };
    clearSheet(ind1Sheet); clearSheet(ind2Sheet); clearSheet(niftySheet);

    ind1Sheet.getRange("A1:G1").setValues([["Date", "Time", "Symbol", "Reason", "Status", "Sync Time", "Sync Reason"]]);
    ind2Sheet.getRange("A1:E1").setValues([["Date", "Time", "Symbol", "Reason", "Capital (Cr)"]]);
    niftySheet.getRange("A1:D1").setValues([["Date", "Time", "Ticker", "Reason"]]);

    const ind1Data = [ [todayStr, '09:20:05', 'RELIANCE', 'Volume Surge', 'Awaiting', '', ''], [todayStr, '09:25:12', 'HDFCBANK', 'Price Breakout', 'Synced', '09:30:15', 'Bullish Engulfing'], [todayStr, '09:40:00', 'TCS', '52 Week High', 'Synced', '09:42:00', 'HVD (350 Cr.)'], [todayStr, '09:45:30', 'INFY', 'RSI Oversold', 'Awaiting', '', ''], [todayStr, '10:05:00', 'SBIN', 'Moving Avg Cross', 'Awaiting', '', ''], [todayStr, '10:10:00', 'AXISBANK', 'MACD Bullish', 'Awaiting', '', ''], [yestStr, '10:15:00', 'WIPRO', 'Support Level', 'Synced', '10:30:00', 'HVD (120 Cr.)'], [yestStr, '11:05:00', 'ITC', 'Volume Spike', 'Awaiting', '', ''], [yestStr, '14:30:00', 'LT', 'Resistance Break', 'Synced', '14:35:00', 'Bearish Harami'] ];
    const ind2Data = [ [todayStr, '09:30:15', 'HDFCBANK', 'Bullish Engulfing', ''], [todayStr, '09:42:00', 'TCS', 'HVD', '350'], [todayStr, '09:50:00', 'SBIN', 'Bearish Harami', ''], [todayStr, '10:15:00', 'AXISBANK', 'Bullish Pin Bar', ''], [yestStr, '10:30:00', 'WIPRO', 'HVD', '120'], [yestStr, '14:35:00', 'LT', 'Bearish Harami', ''] ];
    const niftyData = [ [todayStr, '09:15:10', 'NIFTY', 'Gap Up Opening'], [todayStr, '10:00:00', 'NIFTY', 'Approaching Resistance'] ];

    if (ind1Data.length > 0) { ind1Sheet.getRange(2, 1, ind1Data.length, ind1Data[0].length).setValues(ind1Data); }
    if (ind2Data.length > 0) { ind2Sheet.getRange(2, 1, ind2Data.length, ind2Data[0].length).setValues(ind2Data); }
    if (niftyData.length > 0) { niftySheet.getRange(2, 1, niftyData.length, niftyData[0].length).setValues(niftyData); }

    CacheService.getScriptCache().removeAll([`sheetData_${SHEET_INDICATOR_1}`, `sheetData_${SHEET_INDICATOR_2}`, `sheetData_${SHEET_NIFTY}`]);
    const message = "Mock data populated successfully!"; Logger.log(message); SpreadsheetApp.flush(); return message;
  } catch (err) {
    const errorMessage = "Error populating mock data: " + err.message; Logger.log(errorMessage + ` Stack: ${err.stack}`);
    _logErrorToSheet(logSheet, 'populateSheetWithMockData Error', err, ''); return errorMessage;
  }
}

// --- SIMPLE TEST FUNCTION ---
function testOpenSheet() { /* ... (unchanged) ... */
  const testSheetId = '1jJAxG1hM5z0J-j3QoI1RIQ453AL69QeguQPFK81vNpY'; // Your confirmed ID
  Logger.log(`TEST: Attempting to open sheet with ID: ${testSheetId}`);
  try {
    const ss = SpreadsheetApp.openById(testSheetId);
    Logger.log(`TEST: Successfully opened sheet. Name: ${ss.getName()}`);
    const sheetTab = ss.getSheetByName('Indicator1');
    if (sheetTab) { Logger.log(`TEST: Successfully accessed sheet tab: ${sheetTab.getName()}`); }
    else { Logger.log(`TEST: Could NOT find sheet tab: Indicator1`); }
  } catch (err) { Logger.log(`TEST ERROR: ${err.message} Stack: ${err.stack}`); throw err; }
}

