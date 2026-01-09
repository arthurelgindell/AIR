/**
 * Scheduler.gs - Time-based trigger management
 * Gmail Spending Extractor for AI Board
 */

/**
 * Set up all required triggers - RUN THIS ONCE
 */
function setupTriggers() {
  // Remove existing triggers to avoid duplicates
  removeAllTriggers();

  // Weekly trigger: Every Sunday at 8 PM
  // This runs before Monday board meetings
  ScriptApp.newTrigger('runWeeklyExtraction')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.SUNDAY)
    .atHour(20)
    .create();

  Logger.log('Created weekly trigger: Sundays at 8 PM');

  // Monthly trigger: 1st of each month at 6 AM
  ScriptApp.newTrigger('runMonthlyExtraction')
    .timeBased()
    .onMonthDay(1)
    .atHour(6)
    .create();

  Logger.log('Created monthly trigger: 1st of month at 6 AM');

  // Daily cleanup trigger: Every day at 3 AM
  ScriptApp.newTrigger('dailyCleanup')
    .timeBased()
    .everyDays(1)
    .atHour(3)
    .create();

  Logger.log('Created daily cleanup trigger: 3 AM');

  Logger.log('All triggers configured successfully!');
  Logger.log('');
  Logger.log('Schedule:');
  Logger.log('  - Weekly extraction: Sundays at 8 PM');
  Logger.log('  - Monthly extraction: 1st of each month at 6 AM');
  Logger.log('  - Daily cleanup: 3 AM');
}

/**
 * Remove all existing triggers
 */
function removeAllTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    ScriptApp.deleteTrigger(triggers[i]);
  }
  Logger.log('Removed ' + triggers.length + ' existing triggers');
}

/**
 * View all current triggers
 */
function viewTriggers() {
  const triggers = ScriptApp.getProjectTriggers();

  if (triggers.length === 0) {
    Logger.log('No triggers configured. Run setupTriggers() to set them up.');
    return;
  }

  Logger.log('=== Current Triggers ===');
  for (var i = 0; i < triggers.length; i++) {
    var trigger = triggers[i];
    Logger.log('');
    Logger.log('Trigger ' + (i + 1) + ':');
    Logger.log('  Function: ' + trigger.getHandlerFunction());
    Logger.log('  Type: ' + trigger.getEventType());
    Logger.log('  Source: ' + trigger.getTriggerSource());
  }
}

/**
 * Daily cleanup tasks
 */
function dailyCleanup() {
  Logger.log('Starting daily cleanup...');

  try {
    // Clean up old processed email records (older than 90 days)
    cleanupOldProcessedEmails(90);

    // Verify data integrity
    verifyDataIntegrity();

    Logger.log('Daily cleanup completed successfully');
  } catch (error) {
    Logger.log('Daily cleanup error: ' + error.message);
    sendErrorNotification(error, 'Daily Cleanup');
  }
}

/**
 * Clean up old processed email records
 * @param {number} daysToKeep - Number of days to keep records
 */
function cleanupOldProcessedEmails(daysToKeep) {
  const sheet = getProcessedEmailsSheet();
  if (!sheet) return;

  const data = sheet.getDataRange().getValues();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  var rowsToDelete = [];
  for (var i = data.length - 1; i > 0; i--) { // Reverse order, skip header
    var processedDate = new Date(data[i][2]);
    if (processedDate < cutoffDate) {
      rowsToDelete.push(i + 1); // 1-indexed
    }
  }

  // Delete rows in reverse order to maintain indices
  for (var j = 0; j < rowsToDelete.length; j++) {
    sheet.deleteRow(rowsToDelete[j]);
  }

  if (rowsToDelete.length > 0) {
    Logger.log('Cleaned up ' + rowsToDelete.length + ' old processed email records');
  }
}

/**
 * Verify data integrity in sheets
 * @returns {Array} Array of issues found
 */
function verifyDataIntegrity() {
  const sheet = getTransactionsSheet();
  if (!sheet) return [];

  const data = sheet.getDataRange().getValues();
  var issues = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];

    // Check for missing required fields
    if (!row[2]) issues.push('Row ' + (i + 1) + ': Missing date');
    if (!row[4] && row[4] !== 0) issues.push('Row ' + (i + 1) + ': Missing amount');
    if (!row[6]) issues.push('Row ' + (i + 1) + ': Missing category');

    // Check for invalid amounts
    if (isNaN(parseFloat(row[4]))) {
      issues.push('Row ' + (i + 1) + ': Invalid amount: ' + row[4]);
    }
  }

  if (issues.length > 0) {
    Logger.log('Data integrity issues found:');
    for (var j = 0; j < issues.length; j++) {
      Logger.log('  - ' + issues[j]);
    }
  } else {
    Logger.log('Data integrity check passed');
  }

  return issues;
}

/**
 * Apply data retention policy
 */
function applyRetentionPolicy() {
  Logger.log('Applying data retention policy...');

  // Clean processed emails older than 90 days
  cleanupOldProcessedEmails(90);

  // Note: Transactions are kept indefinitely for financial records
  // Note: Weekly summaries older than 2 years could be archived if needed

  Logger.log('Retention policy applied');
}

/**
 * Create a one-time trigger for testing (runs in 1 minute)
 * @param {string} functionName - Name of function to trigger
 */
function createTestTrigger(functionName) {
  const triggerTime = new Date();
  triggerTime.setMinutes(triggerTime.getMinutes() + 1);

  ScriptApp.newTrigger(functionName)
    .timeBased()
    .at(triggerTime)
    .create();

  Logger.log('Created one-time test trigger for ' + functionName);
  Logger.log('Will run at: ' + triggerTime.toLocaleString());
}

/**
 * Manually trigger a specific extraction
 * @param {string} type - 'weekly' or 'monthly'
 */
function manualTrigger(type) {
  if (type === 'weekly') {
    runWeeklyExtraction();
  } else if (type === 'monthly') {
    runMonthlyExtraction();
  } else {
    Logger.log('Unknown trigger type: ' + type);
    Logger.log('Use "weekly" or "monthly"');
  }
}
