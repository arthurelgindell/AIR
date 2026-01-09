# Gmail Spending Extractor

Automatically extract spending data from Gmail (bank alerts, receipts, invoices) and store in Google Sheets for AI Board of Directors meetings.

## Features

- **Automated Gmail scanning** for financial emails (bank alerts, receipts, invoices)
- **Claude AI extraction** for intelligent parsing of transaction details
- **Google Sheets storage** with transactions, summaries, and dashboard
- **Weekly summaries** generated before Monday board meetings
- **Monthly reports** with category breakdown and trends
- **Zero OAuth complexity** - runs natively in Google Workspace

## Quick Start

### Step 1: Create Google Apps Script Project

1. Go to [script.google.com](https://script.google.com)
2. Click **New Project**
3. Rename to "Gmail Spending Extractor"

### Step 2: Add the Script Files

Create these files in your project (copy content from this folder):

| File | Purpose |
|------|---------|
| `Code.gs` | Main entry points |
| `Config.gs` | Configuration |
| `EmailScanner.gs` | Gmail search |
| `ClaudeExtractor.gs` | Claude API |
| `SheetsManager.gs` | Sheets operations |
| `Scheduler.gs` | Time triggers |
| `Utils.gs` | Helper functions |

### Step 3: Configure API Key

1. Get your Claude API key from [console.anthropic.com](https://console.anthropic.com)
2. Open `Config.gs`
3. Find `initializeConfig()` function
4. Replace `YOUR_ANTHROPIC_API_KEY_HERE` with your actual key
5. Run `initializeConfig()` (Select function > Run)
6. **Delete the key from the code** (for security - it's now stored in Script Properties)

### Step 4: Run Setup

1. Select `setup` from the function dropdown
2. Click **Run**
3. **Authorize** when prompted (first time only)
4. Check the Execution Log for your spreadsheet URL

### Step 5: Test Extraction

```javascript
// Run these functions in order:
quickTest()           // Test with sample email
runManualExtraction(7) // Process last 7 days
```

### Step 6: Enable Automation

```javascript
setupTriggers()  // Enable weekly + monthly automation
```

## Schedule

| Trigger | When | What |
|---------|------|------|
| Weekly | Sunday 8 PM | Extract week's transactions, generate summary |
| Monthly | 1st at 6 AM | Generate monthly report with trends |
| Daily | 3 AM | Cleanup old records |

## Google Sheets Structure

The script creates these sheets:

| Sheet | Content |
|-------|---------|
| **Transactions** | All extracted transactions |
| **Weekly Summaries** | Week-by-week spending |
| **Monthly Summaries** | Month-by-month reports |
| **Dashboard** | Current month overview |
| **Processed Emails** | Tracking (prevents duplicates) |

## Customizing Email Sources

Edit `Config.gs` → `searchQueries` to add your banks:

```javascript
searchQueries: [
  // Add your bank
  'from:@yourbank.com subject:(transaction OR payment)',

  // UAE Banks (included)
  'from:@emiratesnbd.com subject:(transaction OR payment)',
  'from:@adcb.com subject:(transaction OR debit)',

  // Subscriptions
  'from:(apple OR netflix) subject:receipt',
]
```

## Functions Reference

### Main Functions

| Function | Description |
|----------|-------------|
| `setup()` | Complete setup wizard |
| `quickTest()` | Test with last 3 days |
| `runWeeklyExtraction()` | Manual weekly run |
| `runMonthlyExtraction()` | Manual monthly run |
| `runManualExtraction(days)` | Extract last N days |

### Utility Functions

| Function | Description |
|----------|-------------|
| `updateDashboard()` | Refresh dashboard |
| `showStatistics()` | Show spending stats |
| `viewConfig()` | View current config |
| `viewTriggers()` | View scheduled triggers |

### Setup Functions

| Function | Description |
|----------|-------------|
| `initializeConfig()` | Store API keys |
| `initializeSpreadsheet()` | Create sheets |
| `setupTriggers()` | Enable automation |
| `removeAllTriggers()` | Disable automation |

## Security

- **API keys** are stored in Script Properties (encrypted)
- **Email bodies** are processed but not stored
- **Only extracted data** is saved (amount, merchant, date, category)
- Card numbers are scrubbed (only last 4 digits kept)

## Costs

| Item | Cost |
|------|------|
| Google Apps Script | Free |
| Google Sheets | Free |
| Claude API (~50 emails/month) | ~$1/month |

## Troubleshooting

### "Claude API key not configured"
Run `initializeConfig()` with your API key.

### "No financial emails found"
- Check your search queries match your bank's email format
- Try `scanLastNDays(30)` to look back further
- Check Gmail spam folder

### "Failed to parse Claude response"
- Check Execution Log for details
- Verify API key is valid at console.anthropic.com

### Authorization Issues
1. Go to script.google.com
2. Select your project
3. Run any function
4. Re-authorize when prompted

## Support

For issues with:
- **This script**: Check the Execution Log in Apps Script
- **Claude API**: Visit console.anthropic.com
- **Google Apps Script**: See [developers.google.com/apps-script](https://developers.google.com/apps-script)

## License

MIT - Use freely for your personal/business finance tracking.
