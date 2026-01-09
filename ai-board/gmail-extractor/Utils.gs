/**
 * Utils.gs - Helper functions
 * Gmail Spending Extractor for AI Board
 */

/**
 * Get date of last Sunday
 * @returns {Date} Last Sunday
 */
function getLastSunday() {
  const date = new Date();
  const day = date.getDay();
  date.setDate(date.getDate() - day - 7);
  date.setHours(0, 0, 0, 0);
  return date;
}

/**
 * Get date of last Saturday
 * @returns {Date} Last Saturday
 */
function getLastSaturday() {
  const date = new Date();
  const day = date.getDay();
  const diff = day === 0 ? 1 : 7 - day + 1;
  date.setDate(date.getDate() - diff);
  return date;
}

/**
 * Get first day of last month
 * @returns {Date} First day of last month
 */
function getFirstDayOfLastMonth() {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth() - 1, 1);
}

/**
 * Get last day of last month
 * @returns {Date} Last day of last month
 */
function getLastDayOfLastMonth() {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth(), 0);
}

/**
 * Send error notification email
 * @param {Error} error - The error object
 * @param {string} context - Where the error occurred
 */
function sendErrorNotification(error, context) {
  const config = getConfig();

  if (!config.sendSummaryEmail || !config.summaryEmailRecipient) {
    Logger.log('Error notifications disabled or no email configured');
    return;
  }

  const subject = '[Gmail Spending Extractor] Error in ' + context;
  const body = 'An error occurred in the Gmail Spending Extractor.\n\n' +
    'Context: ' + context + '\n' +
    'Time: ' + new Date().toISOString() + '\n' +
    'Error: ' + error.message + '\n\n' +
    'Please check the Apps Script logs for more details.\n\n' +
    'Logs: https://script.google.com/home/executions';

  try {
    GmailApp.sendEmail(config.summaryEmailRecipient, subject, body);
    Logger.log('Error notification sent to ' + config.summaryEmailRecipient);
  } catch (e) {
    Logger.log('Failed to send error notification: ' + e.message);
  }
}

/**
 * Send weekly summary email
 * @param {Object} summary - Weekly summary object
 */
function sendWeeklySummaryEmail(summary) {
  const config = getConfig();

  if (!config.sendSummaryEmail || !config.summaryEmailRecipient) return;

  const spreadsheet = getSpreadsheet();

  const subject = '[Spending Summary] Week of ' + summary.weekStart;
  const body = 'Weekly Spending Summary\n' +
    '=======================\n\n' +
    'Period: ' + summary.weekStart + ' to ' + summary.weekEnd + '\n\n' +
    'Total Expenses: ' + formatCurrency(summary.totalExpenses) + '\n' +
    'Total Income: ' + formatCurrency(summary.totalIncome) + '\n' +
    'Net Change: ' + formatCurrency(summary.netChange) + '\n\n' +
    'Transactions: ' + summary.transactionCount + '\n' +
    'Top Category: ' + summary.topCategory + '\n\n' +
    'Notes: ' + summary.notes + '\n\n' +
    'View full details: ' + spreadsheet.getUrl();

  try {
    GmailApp.sendEmail(config.summaryEmailRecipient, subject, body);
    Logger.log('Weekly summary email sent');
  } catch (error) {
    Logger.log('Failed to send weekly summary email: ' + error.message);
  }
}

/**
 * Send monthly summary email
 * @param {Object} summary - Monthly summary object
 */
function sendMonthlySummaryEmail(summary) {
  const config = getConfig();

  if (!config.sendSummaryEmail || !config.summaryEmailRecipient) return;

  const spreadsheet = getSpreadsheet();

  const subject = '[Monthly Spending Report] ' + summary.month + ' ' + summary.year;
  const body = 'Monthly Spending Report\n' +
    '========================\n\n' +
    'Month: ' + summary.month + ' ' + summary.year + '\n\n' +
    'SUMMARY\n' +
    '-------\n' +
    'Total Expenses: ' + formatCurrency(summary.totalExpenses) + '\n' +
    'Total Income: ' + formatCurrency(summary.totalIncome) + '\n' +
    'Net Change: ' + formatCurrency(summary.netChange) + '\n\n' +
    'Transactions: ' + summary.expenseCount + ' expenses, ' + summary.incomeCount + ' income\n' +
    'Average Transaction: ' + formatCurrency(summary.avgTransaction) + '\n\n' +
    'TOP CATEGORIES\n' +
    '--------------\n' +
    summary.topCategories.join('\n') + '\n\n' +
    'View full details: ' + spreadsheet.getUrl();

  try {
    GmailApp.sendEmail(config.summaryEmailRecipient, subject, body);
    Logger.log('Monthly summary email sent');
  } catch (error) {
    Logger.log('Failed to send monthly summary email: ' + error.message);
  }
}

/**
 * Generate UUID (for transaction IDs)
 * Note: Utilities.getUuid() is available in Apps Script
 */
function generateUuid() {
  return Utilities.getUuid();
}

/**
 * Log audit event
 * @param {string} event - Event type
 * @param {Object|string} details - Event details
 */
function logAuditEvent(event, details) {
  const spreadsheet = getSpreadsheet();
  var auditSheet = spreadsheet.getSheetByName('Audit Log');

  if (!auditSheet) {
    auditSheet = spreadsheet.insertSheet('Audit Log');
    auditSheet.getRange(1, 1, 1, 4).setValues([
      ['Timestamp', 'Event', 'Details', 'User']
    ]).setFontWeight('bold');
    auditSheet.setFrozenRows(1);
  }

  var detailsStr = typeof details === 'object' ? JSON.stringify(details) : details;

  auditSheet.appendRow([
    new Date().toISOString(),
    event,
    detailsStr,
    Session.getActiveUser().getEmail()
  ]);
}

/**
 * Get spending by category for a date range
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Object} Category totals
 */
function getSpendingByCategory(startDate, endDate) {
  const sheet = getTransactionsSheet();
  const data = sheet.getDataRange().getValues();

  var categoryTotals = {};

  for (var i = 1; i < data.length; i++) {
    var rowDate = new Date(data[i][2]);
    if (rowDate >= startDate && rowDate <= endDate) {
      var amount = parseFloat(data[i][4]) || 0;
      var type = data[i][7];
      var category = data[i][6];

      if (type === 'expense') {
        categoryTotals[category] = (categoryTotals[category] || 0) + amount;
      }
    }
  }

  return categoryTotals;
}

/**
 * Get top merchants by spending
 * @param {number} limit - Number of merchants to return
 * @returns {Array} Array of {merchant, total} objects
 */
function getTopMerchants(limit) {
  limit = limit || 10;

  const sheet = getTransactionsSheet();
  const data = sheet.getDataRange().getValues();

  var merchantTotals = {};

  for (var i = 1; i < data.length; i++) {
    var amount = parseFloat(data[i][4]) || 0;
    var type = data[i][7];
    var merchant = data[i][3];

    if (type === 'expense' && merchant) {
      merchantTotals[merchant] = (merchantTotals[merchant] || 0) + amount;
    }
  }

  // Convert to array and sort
  var sorted = Object.keys(merchantTotals).map(function(merchant) {
    return { merchant: merchant, total: merchantTotals[merchant] };
  }).sort(function(a, b) {
    return b.total - a.total;
  });

  return sorted.slice(0, limit);
}

/**
 * Calculate monthly burn rate (average monthly expenses)
 * @param {number} months - Number of months to average
 * @returns {number} Average monthly expenses
 */
function calculateBurnRate(months) {
  months = months || 3;

  const sheet = getTransactionsSheet();
  const data = sheet.getDataRange().getValues();

  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - months);

  var totalExpenses = 0;

  for (var i = 1; i < data.length; i++) {
    var rowDate = new Date(data[i][2]);
    if (rowDate >= cutoffDate) {
      var amount = parseFloat(data[i][4]) || 0;
      var type = data[i][7];

      if (type === 'expense') {
        totalExpenses += amount;
      }
    }
  }

  return totalExpenses / months;
}

/**
 * Export transactions to CSV
 * @returns {string} CSV content
 */
function exportToCSV() {
  const sheet = getTransactionsSheet();
  const data = sheet.getDataRange().getValues();

  var csv = data.map(function(row) {
    return row.map(function(cell) {
      // Escape quotes and wrap in quotes if contains comma
      var str = String(cell);
      if (str.indexOf(',') !== -1 || str.indexOf('"') !== -1) {
        str = '"' + str.replace(/"/g, '""') + '"';
      }
      return str;
    }).join(',');
  }).join('\n');

  return csv;
}

/**
 * Get statistics summary
 * @returns {Object} Statistics object
 */
function getStatistics() {
  const transactions = getAllTransactions();

  var totalExpenses = 0;
  var totalIncome = 0;
  var expenseCount = 0;
  var incomeCount = 0;
  var categories = {};

  for (var i = 0; i < transactions.length; i++) {
    var tx = transactions[i];
    var amount = parseFloat(tx.amount) || 0;

    if (tx.type === 'expense') {
      totalExpenses += amount;
      expenseCount++;
      categories[tx.category] = (categories[tx.category] || 0) + 1;
    } else {
      totalIncome += amount;
      incomeCount++;
    }
  }

  return {
    totalTransactions: transactions.length,
    totalExpenses: totalExpenses,
    totalIncome: totalIncome,
    netChange: totalIncome - totalExpenses,
    expenseCount: expenseCount,
    incomeCount: incomeCount,
    avgExpense: expenseCount > 0 ? totalExpenses / expenseCount : 0,
    categoriesUsed: Object.keys(categories).length,
    topCategory: Object.keys(categories).sort(function(a, b) {
      return categories[b] - categories[a];
    })[0] || 'N/A'
  };
}

/**
 * Show statistics in log
 */
function showStatistics() {
  const stats = getStatistics();

  Logger.log('=== Spending Statistics ===');
  Logger.log('');
  Logger.log('Total Transactions: ' + stats.totalTransactions);
  Logger.log('  Expenses: ' + stats.expenseCount);
  Logger.log('  Income: ' + stats.incomeCount);
  Logger.log('');
  Logger.log('Totals:');
  Logger.log('  Total Expenses: ' + formatCurrency(stats.totalExpenses));
  Logger.log('  Total Income: ' + formatCurrency(stats.totalIncome));
  Logger.log('  Net Change: ' + formatCurrency(stats.netChange));
  Logger.log('');
  Logger.log('Averages:');
  Logger.log('  Avg Expense: ' + formatCurrency(stats.avgExpense));
  Logger.log('');
  Logger.log('Categories:');
  Logger.log('  Categories Used: ' + stats.categoriesUsed);
  Logger.log('  Top Category: ' + stats.topCategory);
}
