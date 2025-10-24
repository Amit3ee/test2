# Gemini AI Integration Setup Guide

## Overview
This trading signals web app now includes Gemini AI integration for intelligent signal analysis and general chat assistance.

## Features

### 1. **Gemini Chat Assistant**
- Floating chat button in the bottom-right corner
- Full conversational AI powered by Google's Gemini API
- Context-aware responses about trading signals and market trends
- Grounded responses using Google Search for real-time market context

### 2. **Signal Analysis**
- "Ask Gemini" buttons on synced signal cards
- Automated analysis of trading signals with technical context
- Market news integration via Google Search grounding
- Click any "Ask Gemini" button to get AI-powered analysis

## Setup Instructions

### Step 1: Get Your Gemini API Key
1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key

### Step 2: Configure the API Key
1. Open `code.gs` in your Google Apps Script project
2. Find line 18 where it says:
   ```javascript
   const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY";
   ```
3. Replace `YOUR_GEMINI_API_KEY` with your actual API key:
   ```javascript
   const GEMINI_API_KEY = "AIza...your-actual-key-here";
   ```
4. Save the file

### Step 3: Deploy the Web App
1. In Google Apps Script, click "Deploy" → "New deployment"
2. Choose "Web app" as the deployment type
3. Set "Execute as" to "Me"
4. Set "Who has access" to "Anyone" (or your preferred setting)
5. Click "Deploy"
6. Copy the web app URL

## Using the Gemini Features

### Chat Assistant
1. Click the floating chat button (bottom-right corner) to open the chat panel
2. Type your question about trading signals, market trends, or technical analysis
3. Press Enter or click the send button
4. The AI will respond with context-aware insights

### Signal Analysis
1. Navigate to the Dashboard or Live Feed
2. Find a synced signal card
3. Click the "Ask Gemini" button on the card
4. The chat will open automatically with an analysis request
5. Review the AI-generated analysis

## Example Questions to Ask Gemini

- "Explain what a Bullish Engulfing pattern means"
- "What does HVD (High Volume Deployment) indicate?"
- "Analyze the current market sentiment for RELIANCE"
- "What should I consider when I see an RSI Oversold signal?"
- "Explain the significance of a 52-week high breakout"

## API Usage and Limits

### Free Tier Limits (Gemini API)
- **Rate Limits**: 60 requests per minute
- **Daily Limits**: Check [Google AI Studio](https://aistudio.google.com/) for your current quota
- **Best Practice**: The app automatically manages chat history to optimize API usage

### Grounding with Google Search
- Enabled for signal analysis requests
- Provides real-time market context and news
- May use additional API quota

## Troubleshooting

### "Gemini API Key not configured" Error
- Ensure you've replaced `YOUR_GEMINI_API_KEY` in `code.gs`
- Redeploy the web app after making changes

### "Failed to get response from Gemini" Error
- Check your API key is valid
- Verify you haven't exceeded rate limits
- Check the Apps Script logs for detailed error messages

### Chat Not Responding
1. Open the browser console (F12)
2. Check for JavaScript errors
3. Verify network connectivity
4. Ensure the Google Apps Script backend is deployed

## Privacy and Data

- Chat messages are sent to Google's Gemini API for processing
- No chat history is stored permanently (session-based only)
- Signal data is only used for analysis when you explicitly request it
- API keys should never be shared or committed to version control

## Advanced Configuration

### Changing the Gemini Model
Edit `code.gs` line 19 to use a different model:
```javascript
const GEMINI_API_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;
```

Available models:
- `gemini-2.5-flash-preview-09-2025` (current, fast and cost-effective)
- `gemini-1.5-pro-latest` (more capable, higher cost)
- `gemini-1.5-flash-latest` (faster, lower cost)

### Adjusting Chat History Length
In `index.html`, modify the `AppState.chatHistory` management in the `onChatResponse` function to limit history length if needed.

## Support

For issues related to:
- **Gemini API**: Visit [Google AI for Developers](https://ai.google.dev/)
- **App Functionality**: Check the Apps Script logs or browser console
- **Trading Signals**: Review the main README.md

## Future Enhancements

Planned features:
- Persistent chat history across sessions
- Multi-signal analysis comparisons
- Custom analysis templates
- Voice input for chat
- Export chat conversations

---

**Note**: This integration requires an active internet connection and a valid Gemini API key to function properly.
