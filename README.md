# Maurvi Consultants - Automated Trading Signals

A modern, Apple-inspired web application for collecting and analyzing trading signals from multiple TradingView indicators with AI-powered insights.

## 🌟 Features

### Core Functionality
- **Real-time Signal Collection**: Receives signals from 3 TradingView indicators
- **Signal Synchronization**: Automatically matches and syncs signals across indicators
- **Multiple Views**:
  - **Dashboard**: Overview with KPIs, live tickers, and synced signals
  - **Live Feed**: Real-time signals with status tracking
  - **Logs**: Categorized signals (HVD, Bullish/Bearish Activity, Oversold/Overbought)
  - **Historical**: Date-based signal archive

### AI Integration (Gemini)
- **Chat Assistant**: Interactive AI for market insights and signal analysis
- **Signal Analysis**: One-click AI analysis of trading signals
- **Google Search Grounding**: Real-time market context in AI responses

### Modern UI/UX
- **Apple Liquid Glass Design**: Glassmorphism effects and smooth animations
- **Dark/Light Mode**: System-aware theme switching
- **Responsive**: Works on desktop, tablet, and mobile
- **Voice Narration**: Text-to-speech for new signals (Hindi female voice)
- **No Scrollbars**: Clean, macOS-style scrolling

### Security
- **OTP Authentication**: 6-digit OTP sent via email
- **Session Management**: 24-hour sessions, device-specific
- **Secure Communication**: All data via HTTPS

## 🚀 Quick Start

### Prerequisites
- Google Account
- Google Sheets API access
- Gemini API key (optional, for AI features)

### Setup Steps

1. **Clone this repository**
   ```bash
   git clone https://github.com/Amit3ee/test2.git
   ```

2. **Create a Google Sheet**
   - Create a new Google Sheet
   - Add these tabs: `Indicator1`, `Indicator2`, `Nifty`, `DebugLogs`
   - Copy the Sheet ID from the URL

3. **Configure the Google Apps Script**
   - Open Google Apps Script (script.google.com)
   - Create a new project
   - Copy contents from `code.gs` and `index.html`
   - Update `SHEET_ID` in `code.gs` with your Sheet ID
   - Update `ADMIN_EMAIL` for OTP authentication

4. **Configure Gemini AI (Optional)**
   - Get your API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Update `GEMINI_API_KEY` in `code.gs`
   - See [GEMINI_SETUP.md](GEMINI_SETUP.md) for detailed instructions

5. **Deploy the Web App**
   - In Apps Script: Deploy → New deployment → Web app
   - Execute as: Me
   - Who has access: Anyone (or as needed)
   - Click Deploy and copy the URL

6. **Set up TradingView Webhooks**
   - In TradingView, create alerts with webhook URLs pointing to your deployed app
   - Use the alert message formats specified in the problem statement

## 📊 Data Structure

### Indicator 1 Format
```json
{
  "scrip": "HDFCBANK",
  "timestamp": "2025-01-15 09:25:00",
  "reason": "Volume Surge"
}
```

### Indicator 2 Format
```json
{
  "timestamp": "1736924700000",
  "ticker": "HDFCBANK",
  "reason": "Bullish Engulfing",
  "capital_deployed_cr": "350"
}
```

### Indicator 3 (Nifty) Format
```json
{
  "timestamp": "1736924700000",
  "ticker": "NIFTY",
  "reason": "Gap Up Opening"
}
```

## 🎨 Design Philosophy

This app follows Apple's Human Interface Guidelines:
- **Clarity**: Clear typography and purposeful use of color
- **Deference**: Content takes precedence over UI
- **Depth**: Visual layers and realistic motion provide hierarchy

The liquid glass effect (glassmorphism) creates a modern, translucent interface that adapts to both light and dark modes.

## 🔧 Configuration

### Environment Variables (in code.gs)
- `SHEET_ID`: Your Google Sheet ID
- `ADMIN_EMAIL`: Email for OTP delivery
- `GEMINI_API_KEY`: Your Gemini API key (optional)
- `OTP_VALIDITY_MINUTES`: OTP expiration time (default: 3)
- `SESSION_VALIDITY_HOURS`: Session duration (default: 24)

### Sheet Structure
- **Indicator1**: Date | Time | Symbol | Reason | Status | Sync Time | Sync Reason
- **Indicator2**: Date | Time | Symbol | Reason | Capital (Cr)
- **Nifty**: Date | Time | Ticker | Reason
- **DebugLogs**: Timestamp | Context | Error Message | Details

## 📱 Mobile Support

The app is fully responsive and works on:
- Desktop (Chrome, Safari, Firefox, Edge)
- Tablets (iPad, Android tablets)
- Mobile phones (iOS Safari, Chrome)

Touch gestures are supported for:
- Scrolling through signals
- Opening/closing modals
- Interacting with the Gemini chat

## 🛠️ Development

### Testing with Mock Data
Use the `populateSheetWithMockData()` function in code.gs to add test data:
```javascript
// In Apps Script editor
function runPopulateMock() {
  populateSheetWithMockData();
}
```

### Debugging
- Check Apps Script logs: View → Logs
- Check browser console for frontend errors
- Review DebugLogs sheet for backend errors

## 📄 License

This project is proprietary software for Maurvi Consultants.

## 🤝 Support

For support or questions:
- Email: amit3ree@gmail.com
- Review the GEMINI_SETUP.md for AI feature setup
- Check Apps Script logs for backend issues

## 🙏 Credits

- **Design**: Inspired by Apple's macOS and iOS design language
- **AI**: Powered by Google Gemini
- **Icons**: Feather Icons
- **Fonts**: Inter, Montserrat (Google Fonts)

---

**Version**: 2.0  
**Last Updated**: January 2025
