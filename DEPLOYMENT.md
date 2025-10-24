# Deployment Guide - Maurvi Consultants Trading Signals App

This guide will walk you through deploying the Automated Trading Signals web application step-by-step.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Google Sheet Setup](#google-sheet-setup)
3. [Google Apps Script Setup](#google-apps-script-setup)
4. [Gemini API Configuration (Optional)](#gemini-api-configuration)
5. [Web App Deployment](#web-app-deployment)
6. [TradingView Integration](#tradingview-integration)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

Before you begin, ensure you have:
- A Google Account
- Access to TradingView (for alerts)
- Basic understanding of Google Apps Script
- (Optional) Gemini API key for AI features

## Google Sheet Setup

### Step 1: Create a New Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Click "Blank" to create a new spreadsheet
3. Name it "Trading Signals Data" (or any name you prefer)

### Step 2: Create Required Sheets

Create the following sheets (tabs) in your spreadsheet:

#### Sheet 1: Indicator1
**Columns:**
- A: Date
- B: Time
- C: Symbol
- D: Reason
- E: Status
- F: Sync Time
- G: Sync Reason

**Header Row:**
```
Date | Time | Symbol | Reason | Status | Sync Time | Sync Reason
```

#### Sheet 2: Indicator2
**Columns:**
- A: Date
- B: Time
- C: Symbol
- D: Reason
- E: Capital (Cr)

**Header Row:**
```
Date | Time | Symbol | Reason | Capital (Cr)
```

#### Sheet 3: Nifty
**Columns:**
- A: Date
- B: Time
- C: Ticker
- D: Reason

**Header Row:**
```
Date | Time | Ticker | Reason
```

#### Sheet 4: DebugLogs
**Columns:**
- A: Timestamp
- B: Context
- C: Error Message
- D: Details
- E: Stack Trace

**Header Row:**
```
Timestamp | Context | Error Message | Details | Stack Trace
```

### Step 3: Get Your Sheet ID

1. Look at your sheet URL: `https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit`
2. Copy the `SHEET_ID_HERE` part (between `/d/` and `/edit`)
3. Save this ID - you'll need it in the next section

Example:
```
URL: https://docs.google.com/spreadsheets/d/1jJAxG1hM5z0J-j3QoI1RIQ453AL69QeguQPFK81vNpY/edit
Sheet ID: 1jJAxG1hM5z0J-j3QoI1RIQ453AL69QeguQPFK81vNpY
```

## Google Apps Script Setup

### Step 1: Create Apps Script Project

1. Go to [Google Apps Script](https://script.google.com)
2. Click "New Project"
3. Name your project "Trading Signals Backend"

### Step 2: Add the Code Files

#### Create index.html
1. In Apps Script, click the "+" next to "Files"
2. Select "HTML"
3. Name it `index`
4. Delete the default content
5. Copy the entire contents of `index.html` from this repository
6. Paste it into the Apps Script HTML file
7. Click "Save" (or Ctrl+S / Cmd+S)

#### Update code.gs
1. Click on `Code.gs` in the Files list
2. Delete the default `myFunction()` code
3. Copy the entire contents of `code.gs` from this repository
4. Paste it into the Apps Script code file

### Step 3: Configure the Script

In `code.gs`, update these constants at the top:

```javascript
// Line 3: Replace with YOUR Sheet ID from Step 3 above
const SHEET_ID = 'YOUR_SHEET_ID_HERE';

// Line 14: Replace with YOUR email address
const ADMIN_EMAIL = 'your-email@gmail.com';

// Line 18: (Optional) Add your Gemini API key later
const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY";
```

### Step 4: Save Your Changes
- Click the save icon or press Ctrl+S (Cmd+S on Mac)
- You should see "Saved" appear briefly

## Gemini API Configuration

*This section is optional but recommended for AI features.*

### Step 1: Get Your API Key

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Choose "Create API key in new project" (or select an existing project)
5. Copy the generated API key

### Step 2: Add API Key to Code

1. In `code.gs`, find line 18:
   ```javascript
   const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY";
   ```
2. Replace `YOUR_GEMINI_API_KEY` with your actual key:
   ```javascript
   const GEMINI_API_KEY = "AIza...your-actual-key-here";
   ```
3. Save the file

**⚠️ Security Note:** Never share your API key or commit it to public repositories!

## Web App Deployment

### Step 1: Deploy the Web App

1. In Apps Script, click "Deploy" → "New deployment"
2. Click the gear icon (⚙️) next to "Select type"
3. Choose "Web app"
4. Configure the deployment:
   - **Description:** "Trading Signals v1.0" (or any description)
   - **Execute as:** "Me (your-email@gmail.com)"
   - **Who has access:** 
     - Choose "Anyone" for public access
     - Or "Only myself" for private access
5. Click "Deploy"

### Step 2: Authorize the Script

1. You'll see a popup asking to authorize
2. Click "Authorize access"
3. Choose your Google account
4. Click "Advanced" → "Go to Trading Signals Backend (unsafe)"
   - This is safe - it's your own script
5. Click "Allow"

### Step 3: Get Your Web App URL

1. After authorization, you'll see your deployment details
2. Copy the "Web app URL" - it will look like:
   ```
   https://script.google.com/macros/s/AKfycby.../exec
   ```
3. Save this URL - this is your web application!
4. Click "Done"

### Step 4: Test the Deployment

1. Open the Web app URL in a new browser tab
2. You should see the login screen
3. Click "Generate OTP"
4. Check your email (ADMIN_EMAIL) for the OTP
5. Enter the OTP to log in

## TradingView Integration

### Step 1: Create Your Indicators

Create your trading indicators in TradingView with the alert message formats:

#### Indicator 1 Format:
```javascript
string alert_message = '{"scrip": "' + scrip_name + '", "timestamp": "' + timestamp_str + '", "reason": "' + reason + '"}'
```

Example alert message:
```json
{"scrip": "HDFCBANK", "timestamp": "2025-01-15 09:25:00", "reason": "Volume Surge"}
```

#### Indicator 2 Format (HVD):
```javascript
alert_message = '{"timestamp": "' + str.tostring(timenow) + '", "ticker": "' + syminfo.ticker + '", "reason": "HVD", "capital_deployed_cr": "' + capital_deployed_cr + '"}'
```

Example:
```json
{"timestamp": "1736924700000", "ticker": "HDFCBANK", "reason": "HVD", "capital_deployed_cr": "350"}
```

#### Indicator 2 Format (Patterns):
```javascript
alert_message = '{"timestamp": "' + str.tostring(time_close) + '", "ticker": "' + syminfo.ticker + '", "reason": "' + alert_reason + '"}'
```

Example:
```json
{"timestamp": "1736924700000", "ticker": "HDFCBANK", "reason": "Bullish Engulfing"}
```

#### Indicator 3 Format (Nifty):
```javascript
standalone_alert_message = '{"timestamp": "' + str.tostring(time_close) + '", "ticker": "' + syminfo.ticker + '", "reason": "' + standalone_alert_reason + '"}'
```

### Step 2: Set Up TradingView Alerts

1. In TradingView, add your indicator to a chart
2. Right-click the chart → "Add alert"
3. Configure the alert:
   - **Condition:** Set based on your indicator
   - **Alert name:** Descriptive name
   - **Message:** Use the appropriate format from above
   - **Webhook URL:** Your Web App URL from deployment
4. Click "Create"

### Step 3: Test the Integration

1. Trigger a test alert in TradingView
2. Check your Google Sheet - a new row should appear in the appropriate sheet
3. Check the web app - the signal should appear in the Live Feed

## Testing

### Test with Mock Data

1. In Google Apps Script, open `code.gs`
2. Find the function `populateSheetWithMockData()`
3. Click "Run" → "Run function" → "populateSheetWithMockData"
4. Authorize if needed
5. Check your Google Sheet - it should now have sample data
6. Refresh your web app - you should see the test signals

### Manual Testing Checklist

- [ ] Login with OTP works
- [ ] Dashboard displays KPIs correctly
- [ ] Live Feed shows signals with status
- [ ] Logs categorize signals properly
- [ ] Historical view shows dates and signals
- [ ] Nifty card is clickable and shows details
- [ ] Signal cards open modals with sync details
- [ ] Gemini chat opens and closes smoothly
- [ ] Gemini responds to questions (if API key configured)
- [ ] "Ask Gemini" buttons work on synced signals
- [ ] Dark/Light mode toggle works
- [ ] Volume toggle works
- [ ] Theme persists after refresh

## Troubleshooting

### Issue: "Authorization Required" when opening web app
**Solution:** 
1. Redeploy the web app
2. Make sure to authorize access when prompted
3. Check that "Execute as: Me" is selected in deployment settings

### Issue: OTP not received
**Solution:**
1. Check spam/junk folder
2. Verify ADMIN_EMAIL is correct in code.gs
3. Check Google Apps Script logs for email sending errors

### Issue: Signals not appearing from TradingView
**Solution:**
1. Verify the webhook URL in TradingView alert matches your Web App URL exactly
2. Check the alert message format matches the expected JSON structure
3. Review the DebugLogs sheet in Google Sheets for errors
4. Check Apps Script execution logs: View → Executions

### Issue: "Sheet not found" errors
**Solution:**
1. Verify all 4 sheets exist: Indicator1, Indicator2, Nifty, DebugLogs
2. Check sheet names match exactly (case-sensitive)
3. Ensure SHEET_ID in code.gs is correct

### Issue: Gemini not responding
**Solution:**
1. Verify GEMINI_API_KEY is set correctly in code.gs
2. Check you have quota remaining at [Google AI Studio](https://aistudio.google.com)
3. Review browser console for errors (F12)
4. Check Apps Script logs for API errors

### Issue: Data not syncing between indicators
**Solution:**
1. Verify both indicators send the same symbol/ticker name
2. Check timestamps are on the same date
3. Review the checkForSync function logs in Apps Script

### Viewing Logs

**Apps Script Logs:**
1. In Apps Script editor: View → Logs
2. Or View → Executions for detailed execution history

**Browser Console:**
1. Press F12 in your browser
2. Click "Console" tab
3. Look for errors or warnings

**Google Sheet Logs:**
- Check the DebugLogs sheet for backend errors

## Next Steps

After successful deployment:

1. **Set up production alerts** in TradingView with your actual trading strategy
2. **Configure Gemini API** for AI-powered analysis (see GEMINI_SETUP.md)
3. **Customize the design** by editing CSS in index.html
4. **Add more indicators** by extending the data structure
5. **Set up monitoring** to track app uptime and performance

## Support Resources

- **Apps Script Documentation:** https://developers.google.com/apps-script
- **Gemini API Documentation:** https://ai.google.dev/docs
- **TradingView Alerts:** https://www.tradingview.com/support/solutions/43000529348
- **Project GitHub:** https://github.com/Amit3ee/test2

## Security Best Practices

1. **Never share your Apps Script deployment URL publicly** if it contains sensitive data
2. **Keep your Gemini API key private** - never commit to version control
3. **Use "Only myself" access** in deployment settings for maximum security
4. **Regularly review execution logs** for unauthorized access attempts
5. **Enable 2FA** on your Google account for added security

---

**Congratulations!** 🎉 Your trading signals app is now deployed and ready to use!

For AI features setup, see [GEMINI_SETUP.md](GEMINI_SETUP.md).
For general usage, see [README.md](README.md).
