/**
 * Config.gs - Configuration and API key management
 * Gmail Spending Extractor for AI Board
 */

/**
 * Get configuration object
 * All sensitive values are stored in Script Properties
 */
function getConfig() {
  const scriptProperties = PropertiesService.getScriptProperties();

  return {
    // API Keys (stored securely in Script Properties)
    claudeApiKey: scriptProperties.getProperty('CLAUDE_API_KEY'),
    aiBoardUrl: scriptProperties.getProperty('AI_BOARD_URL') || 'http://localhost:8000',

    // Google Sheets
    spreadsheetId: scriptProperties.getProperty('SPREADSHEET_ID'),

    // Email search queries - customize for your banks/services
    searchQueries: [
      // UAE Bank notifications
      'from:@emiratesnbd.com subject:(transaction OR payment OR purchase)',
      'from:@adcb.com subject:(transaction OR debit OR credit)',
      'from:@fab.com subject:(transaction OR alert)',
      'from:@mashreq.com subject:(transaction OR payment)',
      'from:@rakbank.ae subject:(transaction OR alert)',

      // International banks
      'from:@chase.com subject:(transaction OR purchase)',
      'from:@citi.com subject:(alert OR transaction)',

      // Receipts & invoices
      'subject:(receipt OR invoice) has:attachment',
      'subject:("order confirmation" OR "payment confirmation")',

      // Subscriptions
      'from:(apple OR google OR microsoft OR adobe OR netflix OR spotify) subject:(receipt OR invoice OR payment)',

      // UAE Utilities
      'from:(@dewa.gov.ae OR @du.ae OR @etisalat.ae) subject:(bill OR invoice OR payment)',
    ],

    // Currency settings
    primaryCurrency: 'AED',
    supportedCurrencies: ['AED', 'USD', 'EUR', 'GBP'],

    // Processing settings
    maxEmailsPerRun: 50,        // Avoid hitting quotas
    batchSize: 5,               // Emails per Claude API call

    // Feature flags
    syncToAIBoard: false,       // Set true to sync to AI Board backend
    sendSummaryEmail: true,
    summaryEmailRecipient: scriptProperties.getProperty('SUMMARY_EMAIL') || Session.getActiveUser().getEmail(),

    // Categories for classification
    categories: [
      'Food & Dining',
      'Transportation',
      'Shopping',
      'Utilities',
      'Subscriptions',
      'Entertainment',
      'Healthcare',
      'Travel',
      'Business',
      'Other'
    ]
  };
}

/**
 * Initialize script properties - RUN THIS ONCE MANUALLY
 * After running, delete your API key from this function for security
 */
function initializeConfig() {
  const scriptProperties = PropertiesService.getScriptProperties();

  // === EDIT THESE VALUES, THEN RUN ONCE, THEN DELETE THE VALUES ===

  // Your Anthropic API key (get from console.anthropic.com)
  scriptProperties.setProperty('CLAUDE_API_KEY', 'YOUR_ANTHROPIC_API_KEY_HERE');

  // Email address for weekly summaries (defaults to your email)
  scriptProperties.setProperty('SUMMARY_EMAIL', 'your@email.com');

  // AI Board backend URL (optional, for syncing)
  scriptProperties.setProperty('AI_BOARD_URL', 'http://localhost:8000');

  // Spreadsheet ID will be auto-set when you run initializeSpreadsheet()

  Logger.log('Configuration initialized!');
  Logger.log('IMPORTANT: Now delete the API key from this function for security.');
}

/**
 * Verify configuration is valid
 */
function verifyConfig() {
  const config = getConfig();
  const issues = [];

  if (!config.claudeApiKey || config.claudeApiKey === 'YOUR_ANTHROPIC_API_KEY_HERE') {
    issues.push('Claude API key not configured. Run initializeConfig() first.');
  }

  if (!config.spreadsheetId) {
    issues.push('Spreadsheet ID not set. Run initializeSpreadsheet() first.');
  }

  if (issues.length > 0) {
    Logger.log('Configuration issues found:');
    issues.forEach(issue => Logger.log('  - ' + issue));
    return false;
  }

  Logger.log('Configuration verified successfully!');
  return true;
}

/**
 * Update Claude API key (for key rotation)
 */
function updateClaudeApiKey(newKey) {
  const scriptProperties = PropertiesService.getScriptProperties();
  scriptProperties.setProperty('CLAUDE_API_KEY', newKey);
  Logger.log('Claude API key updated at ' + new Date().toISOString());
}

/**
 * View current config (without showing full API keys)
 */
function viewConfig() {
  const config = getConfig();

  Logger.log('=== Current Configuration ===');
  Logger.log('Claude API Key: ' + (config.claudeApiKey ? config.claudeApiKey.substring(0, 10) + '...' : 'NOT SET'));
  Logger.log('Spreadsheet ID: ' + (config.spreadsheetId || 'NOT SET'));
  Logger.log('AI Board URL: ' + config.aiBoardUrl);
  Logger.log('Summary Email: ' + config.summaryEmailRecipient);
  Logger.log('Primary Currency: ' + config.primaryCurrency);
  Logger.log('Max Emails Per Run: ' + config.maxEmailsPerRun);
  Logger.log('Sync to AI Board: ' + config.syncToAIBoard);
  Logger.log('Search Queries: ' + config.searchQueries.length + ' configured');
}
