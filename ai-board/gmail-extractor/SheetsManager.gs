/**
 * SheetsManager.gs - Google Sheets operations
 * Gmail Spending Extractor for AI Board
 */

/**
 * Sheet configurations
 */
var SHEETS = {
  TRANSACTIONS: {
    name: 'Transactions',
    headers: ['ID', 'Email ID', 'Date', 'Merchant', 'Amount', 'Currency',
              'Category', 'Type', 'Description', 'Confidence', 'Verified', 'Created At']
  },
  PROCESSED_EMAILS: {
    name: 'Processed Emails',
    headers: ['Email ID', 'Email Date', 'Processed At']
  },
  WEEKLY_SUMMARY: {
    name: 'Weekly Summaries',
    headers: ['Week Starting', 'Week Ending', 'Total Expenses', 'Total Income',
              'Net Change', 'Transaction Count', 'Top Category', 'Notes', 'Generated At']
  },
  MONTHLY_SUMMARY: {
    name: 'Monthly Summaries',
    headers: ['Month', 'Year', 'Total Expenses', 'Total Income', 'Net Change',
              'Expense Count', 'Income Count', 'Top 3 Categories', 'Avg Transaction', 'Generated At']
  },
  DASHBOARD: {
    name: 'Dashboard',
    headers: [] // Custom layout
  }
};

/**
 * Initialize spreadsheet with all required sheets
 * @returns {Spreadsheet} The initialized spreadsheet
 */
function initializeSpreadsheet() {
  const config = getConfig();
  var spreadsheet;

  if (config.spreadsheetId) {
    try {
      spreadsheet = SpreadsheetApp.openById(config.spreadsheetId);
      Logger.log('Opened existing spreadsheet: ' + spreadsheet.getName());
    } catch (e) {
      Logger.log('Could not open spreadsheet with ID: ' + config.spreadsheetId);
      spreadsheet = null;
    }
  }

  if (!spreadsheet) {
    spreadsheet = SpreadsheetApp.create('Gmail Spending Tracker');
    // Save the ID for future use
    PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', spreadsheet.getId());
    Logger.log('Created new spreadsheet: ' + spreadsheet.getUrl());
  }

  // Create each sheet if it doesn't exist
  for (var key in SHEETS) {
    var sheetConfig = SHEETS[key];
    var sheet = spreadsheet.getSheetByName(sheetConfig.name);

    if (!sheet) {
      sheet = spreadsheet.insertSheet(sheetConfig.name);

      // Add headers if defined
      if (sheetConfig.headers.length > 0) {
        sheet.getRange(1, 1, 1, sheetConfig.headers.length)
          .setValues([sheetConfig.headers])
          .setFontWeight('bold')
          .setBackground('#4285f4')
          .setFontColor('white');

        // Freeze header row
        sheet.setFrozenRows(1);
      }

      Logger.log('Created sheet: ' + sheetConfig.name);
    }
  }

  // Remove default Sheet1 if it exists and is empty
  var defaultSheet = spreadsheet.getSheetByName('Sheet1');
  if (defaultSheet && defaultSheet.getLastRow() === 0) {
    spreadsheet.deleteSheet(defaultSheet);
  }

  Logger.log('Spreadsheet initialized! URL: ' + spreadsheet.getUrl());
  return spreadsheet;
}

/**
 * Get spreadsheet instance
 * @returns {Spreadsheet} The spreadsheet
 */
function getSpreadsheet() {
  const config = getConfig();
  if (!config.spreadsheetId) {
    return initializeSpreadsheet();
  }
  return SpreadsheetApp.openById(config.spreadsheetId);
}

/**
 * Get transactions sheet
 * @returns {Sheet} The transactions sheet
 */
function getTransactionsSheet() {
  return getSpreadsheet().getSheetByName(SHEETS.TRANSACTIONS.name);
}

/**
 * Write transactions to the sheet
 * @param {Array} transactions - Array of transaction objects
 */
function writeTransactionsToSheet(transactions) {
  if (transactions.length === 0) {
    Logger.log('No transactions to write');
    return;
  }

  const sheet = getTransactionsSheet();
  const timestamp = new Date().toISOString();

  const rows = transactions.map(function(tx) {
    return [
      Utilities.getUuid(),           // ID
      tx.email_id,                   // Email ID
      tx.date,                       // Date
      tx.merchant,                   // Merchant
      tx.amount,                     // Amount
      tx.currency || 'AED',          // Currency
      tx.category,                   // Category
      tx.type || 'expense',          // Type
      tx.description || '',          // Description
      tx.confidence || 0,            // Confidence
      false,                         // Verified (manual)
      timestamp                      // Created At
    ];
  });

  const startRow = sheet.getLastRow() + 1;
  sheet.getRange(startRow, 1, rows.length, rows[0].length).setValues(rows);

  Logger.log('Wrote ' + rows.length + ' transactions to sheet');
}

/**
 * Write summary to appropriate sheet
 * @param {Object} summary - Summary object
 * @param {string} type - 'weekly' or 'monthly'
 */
function writeSummaryToSheet(summary, type) {
  const sheetConfig = type === 'weekly' ? SHEETS.WEEKLY_SUMMARY : SHEETS.MONTHLY_SUMMARY;
  const spreadsheet = getSpreadsheet();
  const sheet = spreadsheet.getSheetByName(sheetConfig.name);

  var row;
  if (type === 'weekly') {
    row = [
      summary.weekStart,
      summary.weekEnd,
      summary.totalExpenses,
      summary.totalIncome,
      summary.netChange,
      summary.transactionCount,
      summary.topCategory,
      summary.notes || '',
      new Date().toISOString()
    ];
  } else {
    row = [
      summary.month,
      summary.year,
      summary.totalExpenses,
      summary.totalIncome,
      summary.netChange,
      summary.expenseCount,
      summary.incomeCount,
      summary.topCategories.join(', '),
      summary.avgTransaction,
      new Date().toISOString()
    ];
  }

  sheet.appendRow(row);
  Logger.log('Wrote ' + type + ' summary to sheet');
}

/**
 * Generate weekly summary from transactions
 * @param {Date} startDate - Week start date
 * @param {Date} endDate - Week end date
 * @returns {Object} Summary object
 */
function generateWeeklySummary(startDate, endDate) {
  const sheet = getTransactionsSheet();
  const data = sheet.getDataRange().getValues();

  // Filter transactions in date range
  var weekTransactions = [];
  for (var i = 1; i < data.length; i++) { // Skip header
    var rowDate = new Date(data[i][2]);
    if (rowDate >= startDate && rowDate <= endDate) {
      weekTransactions.push(data[i]);
    }
  }

  // Calculate totals
  var totalExpenses = 0;
  var totalIncome = 0;
  var categoryTotals = {};

  for (var j = 0; j < weekTransactions.length; j++) {
    var row = weekTransactions[j];
    var amount = parseFloat(row[4]) || 0;
    var type = row[7];
    var category = row[6];

    if (type === 'expense') {
      totalExpenses += amount;
      categoryTotals[category] = (categoryTotals[category] || 0) + amount;
    } else {
      totalIncome += amount;
    }
  }

  // Find top category
  var topCategory = 'N/A';
  var maxAmount = 0;
  for (var cat in categoryTotals) {
    if (categoryTotals[cat] > maxAmount) {
      maxAmount = categoryTotals[cat];
      topCategory = cat + ' (' + formatCurrency(categoryTotals[cat]) + ')';
    }
  }

  return {
    weekStart: formatDate(startDate),
    weekEnd: formatDate(endDate),
    totalExpenses: totalExpenses,
    totalIncome: totalIncome,
    netChange: totalIncome - totalExpenses,
    transactionCount: weekTransactions.length,
    topCategory: topCategory,
    notes: generateWeeklyNotes(weekTransactions, categoryTotals)
  };
}

/**
 * Generate monthly summary from transactions
 * @param {Date} startDate - Month start date
 * @param {Date} endDate - Month end date
 * @returns {Object} Summary object
 */
function generateMonthlySummary(startDate, endDate) {
  const sheet = getTransactionsSheet();
  const data = sheet.getDataRange().getValues();

  // Filter transactions in date range
  var monthTransactions = [];
  for (var i = 1; i < data.length; i++) {
    var rowDate = new Date(data[i][2]);
    if (rowDate >= startDate && rowDate <= endDate) {
      monthTransactions.push(data[i]);
    }
  }

  // Calculate totals
  var expenses = [];
  var income = [];
  var categoryTotals = {};

  for (var j = 0; j < monthTransactions.length; j++) {
    var row = monthTransactions[j];
    var amount = parseFloat(row[4]) || 0;
    var type = row[7];
    var category = row[6];

    if (type === 'expense') {
      expenses.push(amount);
      categoryTotals[category] = (categoryTotals[category] || 0) + amount;
    } else {
      income.push(amount);
    }
  }

  var totalExpenses = expenses.reduce(function(a, b) { return a + b; }, 0);
  var totalIncome = income.reduce(function(a, b) { return a + b; }, 0);

  // Get top 3 categories
  var sortedCategories = Object.keys(categoryTotals).sort(function(a, b) {
    return categoryTotals[b] - categoryTotals[a];
  });

  var topCategories = sortedCategories.slice(0, 3).map(function(cat) {
    return cat + ': ' + formatCurrency(categoryTotals[cat]);
  });

  return {
    month: startDate.toLocaleString('default', { month: 'long' }),
    year: startDate.getFullYear(),
    totalExpenses: totalExpenses,
    totalIncome: totalIncome,
    netChange: totalIncome - totalExpenses,
    expenseCount: expenses.length,
    incomeCount: income.length,
    topCategories: topCategories,
    avgTransaction: expenses.length > 0 ? totalExpenses / expenses.length : 0
  };
}

/**
 * Update the dashboard sheet with current data
 */
function updateDashboard() {
  const spreadsheet = getSpreadsheet();
  const dashboard = spreadsheet.getSheetByName(SHEETS.DASHBOARD.name);
  const transactionsSheet = getTransactionsSheet();

  // Clear existing content
  dashboard.clear();

  // Get transaction data
  const data = transactionsSheet.getDataRange().getValues();

  // Calculate current month stats
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  var currentMonthExpenses = 0;
  var currentMonthIncome = 0;
  var categoryTotals = {};
  var transactionCount = 0;

  for (var i = 1; i < data.length; i++) {
    var date = new Date(data[i][2]);
    if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
      var amount = parseFloat(data[i][4]) || 0;
      var type = data[i][7];
      var category = data[i][6];

      transactionCount++;

      if (type === 'expense') {
        currentMonthExpenses += amount;
        categoryTotals[category] = (categoryTotals[category] || 0) + amount;
      } else {
        currentMonthIncome += amount;
      }
    }
  }

  // Build dashboard layout
  var dashboardData = [
    ['SPENDING DASHBOARD', '', '', '', now.toLocaleDateString()],
    [''],
    ['CURRENT MONTH SUMMARY (' + now.toLocaleString('default', { month: 'long' }) + ' ' + currentYear + ')'],
    ['Total Expenses', formatCurrency(currentMonthExpenses)],
    ['Total Income', formatCurrency(currentMonthIncome)],
    ['Net Change', formatCurrency(currentMonthIncome - currentMonthExpenses)],
    ['Transaction Count', transactionCount],
    [''],
    ['SPENDING BY CATEGORY']
  ];

  // Add category breakdown (sorted by amount)
  var sortedCategories = Object.keys(categoryTotals).sort(function(a, b) {
    return categoryTotals[b] - categoryTotals[a];
  });

  for (var j = 0; j < sortedCategories.length; j++) {
    var cat = sortedCategories[j];
    dashboardData.push([cat, formatCurrency(categoryTotals[cat])]);
  }

  // Write dashboard
  var maxCols = 5;
  var formattedData = dashboardData.map(function(row) {
    var newRow = row.slice();
    while (newRow.length < maxCols) newRow.push('');
    return newRow;
  });

  dashboard.getRange(1, 1, formattedData.length, maxCols).setValues(formattedData);

  // Format dashboard
  dashboard.getRange('A1').setFontSize(18).setFontWeight('bold');
  dashboard.getRange('A3').setFontSize(14).setFontWeight('bold');
  dashboard.getRange('A9').setFontSize(14).setFontWeight('bold');

  // Set column widths
  dashboard.setColumnWidth(1, 200);
  dashboard.setColumnWidth(2, 150);

  Logger.log('Dashboard updated');
}

/**
 * Generate notes about unusual spending
 * @param {Array} transactions - Transaction rows
 * @param {Object} categoryTotals - Category totals
 * @returns {string} Notes string
 */
function generateWeeklyNotes(transactions, categoryTotals) {
  var notes = [];

  // Flag large transactions (> AED 1000)
  var largeCount = 0;
  for (var i = 0; i < transactions.length; i++) {
    if (parseFloat(transactions[i][4]) > 1000) largeCount++;
  }
  if (largeCount > 0) {
    notes.push(largeCount + ' large transactions (>AED 1000)');
  }

  // Flag unusual categories
  var unusualCategories = ['Entertainment', 'Travel', 'Shopping'];
  for (var j = 0; j < unusualCategories.length; j++) {
    var cat = unusualCategories[j];
    if (categoryTotals[cat] > 500) {
      notes.push('High ' + cat + ': ' + formatCurrency(categoryTotals[cat]));
    }
  }

  return notes.join('; ') || 'No unusual activity';
}

/**
 * Format currency for display
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: AED)
 * @returns {string} Formatted currency string
 */
function formatCurrency(amount, currency) {
  currency = currency || 'AED';
  return currency + ' ' + amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Format date for display
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string
 */
function formatDate(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

/**
 * Get all transactions from sheet
 * @returns {Array} Array of transaction objects
 */
function getAllTransactions() {
  const sheet = getTransactionsSheet();
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  return data.slice(1).map(function(row) {
    var obj = {};
    for (var i = 0; i < headers.length; i++) {
      obj[headers[i].toLowerCase().replace(/ /g, '_')] = row[i];
    }
    return obj;
  });
}
