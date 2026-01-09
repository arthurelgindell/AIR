/**
 * Code.gs - Main entry points and orchestration
 * Gmail Spending Extractor for AI Board
 *
 * This is the main file that orchestrates all extraction operations.
 *
 * QUICK START:
 * 1. Run initializeConfig() and set your Claude API key
 * 2. Run initializeSpreadsheet() to create the Google Sheet
 * 3. Run testExtraction() to verify everything works
 * 4. Run setupTriggers() to enable automatic weekly/monthly extraction
 */

/**
 * Run weekly extraction (triggered Sunday 8 PM)
 * Extracts transactions from the past week for Monday board meetings
 */
function runWeeklyExtraction() {
  Logger.log('=== Starting Weekly Extraction ===');
  const startTime = new Date();

  // Verify configuration
  if (!verifyConfig()) {
    Logger.log('Configuration verification failed. Aborting.');
    return;
  }

  const config = getConfig();

  // Calculate date range (last 7 days)
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7);
  startDate.setHours(0, 0, 0, 0);

  Logger.log('Date range: ' + startDate.toISOString() + ' to ' + endDate.toISOString());

  try {
    // Step 1: Scan emails
    Logger.log('Step 1: Scanning Gmail...');
    const emails = scanFinancialEmails(startDate, endDate);
    Logger.log('Found ' + emails.length + ' financial emails');

    // Step 2: Filter already-processed
    Logger.log('Step 2: Filtering processed emails...');
    const newEmails = filterProcessedEmails(emails);
    Logger.log(newEmails.length + ' new emails to process');

    if (newEmails.length === 0) {
      Logger.log('No new emails to process');
    } else {
      // Step 3: Extract transactions via Claude
      Logger.log('Step 3: Extracting transactions with Claude...');
      const transactions = extractTransactionsWithClaude(newEmails);
      Logger.log('Extracted ' + transactions.length + ' transactions');

      // Step 4: Write to sheets
      Logger.log('Step 4: Writing to Google Sheets...');
      writeTransactionsToSheet(transactions);
      markEmailsAsProcessed(newEmails);
    }

    // Step 5: Generate weekly summary
    Logger.log('Step 5: Generating weekly summary...');
    const summary = generateWeeklySummary(startDate, endDate);
    writeSummaryToSheet(summary, 'weekly');

    // Step 6: Update dashboard
    Logger.log('Step 6: Updating dashboard...');
    updateDashboard();

    // Step 7: Send summary email
    if (config.sendSummaryEmail) {
      Logger.log('Step 7: Sending summary email...');
      sendWeeklySummaryEmail(summary);
    }

    // Step 8: Optional sync to AI Board
    if (config.syncToAIBoard && newEmails.length > 0) {
      Logger.log('Step 8: Syncing to AI Board...');
      // syncToAIBoard(transactions);
      Logger.log('AI Board sync not implemented yet');
    }

    const duration = (new Date() - startTime) / 1000;
    Logger.log('=== Weekly Extraction Completed in ' + duration.toFixed(1) + 's ===');

  } catch (error) {
    Logger.log('ERROR in weekly extraction: ' + error.message);
    Logger.log('Stack: ' + error.stack);
    sendErrorNotification(error, 'Weekly Extraction');
  }
}

/**
 * Run monthly extraction (triggered 1st of month at 6 AM)
 * Generates comprehensive monthly summary
 */
function runMonthlyExtraction() {
  Logger.log('=== Starting Monthly Extraction ===');
  const startTime = new Date();

  // Verify configuration
  if (!verifyConfig()) {
    Logger.log('Configuration verification failed. Aborting.');
    return;
  }

  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endDate = new Date(now.getFullYear(), now.getMonth(), 0); // Last day of prev month
  endDate.setHours(23, 59, 59, 999);

  Logger.log('Processing month: ' + startDate.toLocaleString('default', { month: 'long', year: 'numeric' }));

  try {
    // Run full extraction for any missed emails
    Logger.log('Checking for any missed emails...');
    const emails = scanFinancialEmails(startDate, endDate);
    const newEmails = filterProcessedEmails(emails);

    if (newEmails.length > 0) {
      Logger.log('Processing ' + newEmails.length + ' missed emails');
      const transactions = extractTransactionsWithClaude(newEmails);
      writeTransactionsToSheet(transactions);
      markEmailsAsProcessed(newEmails);
    } else {
      Logger.log('No missed emails to process');
    }

    // Generate monthly summary from sheet data
    Logger.log('Generating monthly summary...');
    const summary = generateMonthlySummary(startDate, endDate);
    writeSummaryToSheet(summary, 'monthly');

    // Update dashboard
    Logger.log('Updating dashboard...');
    updateDashboard();

    // Send monthly summary email
    const config = getConfig();
    if (config.sendSummaryEmail) {
      sendMonthlySummaryEmail(summary);
    }

    const duration = (new Date() - startTime) / 1000;
    Logger.log('=== Monthly Extraction Completed in ' + duration.toFixed(1) + 's ===');

  } catch (error) {
    Logger.log('ERROR in monthly extraction: ' + error.message);
    sendErrorNotification(error, 'Monthly Extraction');
  }
}

/**
 * Manual extraction for a custom date range
 * @param {number} daysBack - Number of days to look back
 */
function runManualExtraction(daysBack) {
  daysBack = daysBack || 7;

  Logger.log('=== Starting Manual Extraction (' + daysBack + ' days) ===');

  // Verify configuration
  if (!verifyConfig()) {
    Logger.log('Configuration verification failed. Aborting.');
    return;
  }

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);
  startDate.setHours(0, 0, 0, 0);

  try {
    const emails = scanFinancialEmails(startDate, endDate);
    const newEmails = filterProcessedEmails(emails);

    Logger.log('Found ' + emails.length + ' emails (' + newEmails.length + ' new)');

    if (newEmails.length > 0) {
      const transactions = extractTransactionsWithClaude(newEmails);
      writeTransactionsToSheet(transactions);
      markEmailsAsProcessed(newEmails);
      Logger.log('Processed ' + transactions.length + ' transactions');
    }

    updateDashboard();
    Logger.log('=== Manual Extraction Completed ===');

  } catch (error) {
    Logger.log('ERROR: ' + error.message);
  }
}

/**
 * Quick test - scan and extract from last 3 days
 */
function quickTest() {
  Logger.log('=== Quick Test (Last 3 Days) ===');

  // Verify configuration first
  if (!verifyConfig()) {
    Logger.log('');
    Logger.log('SETUP REQUIRED:');
    Logger.log('1. Run initializeConfig() and set your Claude API key');
    Logger.log('2. Run initializeSpreadsheet() to create the Google Sheet');
    Logger.log('3. Then run quickTest() again');
    return;
  }

  // Test email scanning
  Logger.log('');
  Logger.log('1. Testing email scanning...');
  const emails = scanLastNDays(3);
  Logger.log('   Found ' + emails.length + ' financial emails');

  if (emails.length === 0) {
    Logger.log('   No financial emails found in last 3 days.');
    Logger.log('   This is normal if you have no recent transactions.');
    return;
  }

  // Show sample
  Logger.log('');
  Logger.log('   Sample email:');
  Logger.log('   From: ' + emails[0].from);
  Logger.log('   Subject: ' + emails[0].subject);

  // Test extraction (just first email)
  Logger.log('');
  Logger.log('2. Testing Claude extraction...');
  const transactions = extractTransactionsWithClaude([emails[0]]);

  if (transactions.length > 0) {
    Logger.log('   SUCCESS! Extracted:');
    Logger.log('   Amount: ' + transactions[0].currency + ' ' + transactions[0].amount);
    Logger.log('   Merchant: ' + transactions[0].merchant);
    Logger.log('   Category: ' + transactions[0].category);
  } else {
    Logger.log('   No transaction found in email (might be informational)');
  }

  Logger.log('');
  Logger.log('=== Quick Test Complete ===');
  Logger.log('');
  Logger.log('Next steps:');
  Logger.log('- Run runManualExtraction(7) to process last 7 days');
  Logger.log('- Run setupTriggers() to enable automatic weekly/monthly extraction');
}

/**
 * Complete setup wizard
 */
function setup() {
  Logger.log('=== Gmail Spending Extractor Setup ===');
  Logger.log('');

  // Step 1: Check config
  Logger.log('Step 1: Checking configuration...');
  const config = getConfig();

  if (!config.claudeApiKey || config.claudeApiKey === 'YOUR_ANTHROPIC_API_KEY_HERE') {
    Logger.log('');
    Logger.log('ACTION REQUIRED: Set your Claude API key');
    Logger.log('');
    Logger.log('1. Open Config.gs');
    Logger.log('2. Find initializeConfig() function');
    Logger.log('3. Replace YOUR_ANTHROPIC_API_KEY_HERE with your actual key');
    Logger.log('4. Run initializeConfig()');
    Logger.log('5. Delete the key from the code (for security)');
    Logger.log('6. Run setup() again');
    return;
  }
  Logger.log('   Claude API key: Configured');

  // Step 2: Initialize spreadsheet
  Logger.log('');
  Logger.log('Step 2: Setting up Google Sheets...');
  const spreadsheet = initializeSpreadsheet();
  Logger.log('   Spreadsheet URL: ' + spreadsheet.getUrl());

  // Step 3: Test Claude API
  Logger.log('');
  Logger.log('Step 3: Testing Claude API connection...');
  if (testClaudeAPI()) {
    Logger.log('   Claude API: Working');
  } else {
    Logger.log('   Claude API: FAILED - Check your API key');
    return;
  }

  // Step 4: Test email access
  Logger.log('');
  Logger.log('Step 4: Testing Gmail access...');
  try {
    const emails = scanLastNDays(1);
    Logger.log('   Gmail access: Working (' + emails.length + ' emails found)');
  } catch (error) {
    Logger.log('   Gmail access: FAILED - ' + error.message);
    return;
  }

  // Step 5: Setup complete
  Logger.log('');
  Logger.log('=== Setup Complete! ===');
  Logger.log('');
  Logger.log('Your spreadsheet is ready at:');
  Logger.log(spreadsheet.getUrl());
  Logger.log('');
  Logger.log('Next steps:');
  Logger.log('1. Run quickTest() to verify extraction works');
  Logger.log('2. Run runManualExtraction(30) to process last 30 days');
  Logger.log('3. Run setupTriggers() to enable automatic extraction');
}
