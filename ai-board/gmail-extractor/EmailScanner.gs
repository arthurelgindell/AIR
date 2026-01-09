/**
 * EmailScanner.gs - Gmail search and filtering
 * Gmail Spending Extractor for AI Board
 */

/**
 * Scan Gmail for financial emails within date range
 * @param {Date} startDate - Start of date range
 * @param {Date} endDate - End of date range
 * @returns {Array} Array of email objects
 */
function scanFinancialEmails(startDate, endDate) {
  const config = getConfig();
  const allEmails = [];

  // Format dates for Gmail search
  const afterDate = Utilities.formatDate(startDate, Session.getScriptTimeZone(), 'yyyy/MM/dd');
  const beforeDate = Utilities.formatDate(endDate, Session.getScriptTimeZone(), 'yyyy/MM/dd');

  Logger.log('Scanning emails from ' + afterDate + ' to ' + beforeDate);

  for (const baseQuery of config.searchQueries) {
    const fullQuery = baseQuery + ' after:' + afterDate + ' before:' + beforeDate;

    try {
      const threads = GmailApp.search(fullQuery, 0, config.maxEmailsPerRun);

      for (const thread of threads) {
        const messages = thread.getMessages();

        for (const message of messages) {
          const messageDate = message.getDate();

          // Verify date range (Gmail search can be imprecise)
          if (messageDate >= startDate && messageDate <= endDate) {
            allEmails.push({
              id: message.getId(),
              threadId: thread.getId(),
              from: message.getFrom(),
              subject: message.getSubject(),
              date: messageDate.toISOString(),
              body: message.getPlainBody().substring(0, 10000), // Limit size
              labels: thread.getLabels().map(function(l) { return l.getName(); }),
            });
          }
        }
      }
    } catch (error) {
      Logger.log('Error searching "' + baseQuery + '": ' + error.message);
    }
  }

  // Deduplicate by message ID
  const uniqueEmails = deduplicateEmails(allEmails);
  Logger.log('Found ' + uniqueEmails.length + ' unique financial emails');

  return uniqueEmails;
}

/**
 * Remove duplicate emails (same email might match multiple queries)
 * @param {Array} emails - Array of email objects
 * @returns {Array} Deduplicated array
 */
function deduplicateEmails(emails) {
  const seen = {};
  return emails.filter(function(email) {
    if (seen[email.id]) return false;
    seen[email.id] = true;
    return true;
  });
}

/**
 * Filter out already-processed emails
 * @param {Array} emails - Array of email objects
 * @returns {Array} Emails not yet processed
 */
function filterProcessedEmails(emails) {
  const sheet = getProcessedEmailsSheet();
  const processedIds = {};

  if (sheet) {
    const data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) { // Skip header
      processedIds[data[i][0]] = true; // Column A = email ID
    }
  }

  return emails.filter(function(email) {
    return !processedIds[email.id];
  });
}

/**
 * Mark emails as processed to avoid reprocessing
 * @param {Array} emails - Array of email objects to mark
 */
function markEmailsAsProcessed(emails) {
  const sheet = getProcessedEmailsSheet();
  const timestamp = new Date().toISOString();

  const rows = emails.map(function(email) {
    return [
      email.id,
      email.date,
      timestamp // Processed timestamp
    ];
  });

  if (rows.length > 0) {
    const startRow = sheet.getLastRow() + 1;
    sheet.getRange(startRow, 1, rows.length, 3).setValues(rows);
  }
}

/**
 * Scan emails from last N days
 * @param {number} days - Number of days to look back
 * @returns {Array} Array of email objects
 */
function scanLastNDays(days) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  return scanFinancialEmails(startDate, endDate);
}

/**
 * Scan emails from last week (Sunday to Saturday)
 * @returns {Array} Array of email objects
 */
function scanLastWeek() {
  const endDate = getLastSaturday();
  endDate.setHours(23, 59, 59, 999);

  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 6);
  startDate.setHours(0, 0, 0, 0);

  return scanFinancialEmails(startDate, endDate);
}

/**
 * Scan emails from last month
 * @returns {Array} Array of email objects
 */
function scanLastMonth() {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endDate = new Date(now.getFullYear(), now.getMonth(), 0); // Last day of prev month
  endDate.setHours(23, 59, 59, 999);

  return scanFinancialEmails(startDate, endDate);
}

/**
 * Check if email looks like a financial email (pre-filter before Claude)
 * @param {Object} email - Email object
 * @returns {boolean} True if likely financial
 */
function isLikelyFinancialEmail(email) {
  const content = (email.subject + ' ' + email.body).toLowerCase();

  // Financial keywords
  const financialKeywords = [
    'transaction', 'payment', 'purchase', 'debit', 'credit',
    'amount', 'balance', 'transfer', 'receipt', 'invoice',
    'bill', 'charge', 'aed', 'usd', 'eur', 'gbp'
  ];

  // Check for financial keywords
  var hasKeyword = financialKeywords.some(function(keyword) {
    return content.indexOf(keyword) !== -1;
  });

  // Check for amount patterns
  var hasAmount = /(?:aed|usd|\$|€|£)\s*[\d,]+\.?\d*/i.test(content) ||
                  /[\d,]+\.?\d*\s*(?:aed|usd|eur|gbp)/i.test(content);

  return hasKeyword && hasAmount;
}

/**
 * Extract sender domain from email address
 * @param {string} from - From field
 * @returns {string} Domain
 */
function extractSenderDomain(from) {
  var match = from.match(/@([a-zA-Z0-9.-]+)/);
  return match ? match[1].toLowerCase() : '';
}

/**
 * Categorize email by sender
 * @param {Object} email - Email object
 * @returns {string} Category hint
 */
function categorizeEmailBySender(email) {
  const domain = extractSenderDomain(email.from);

  // Bank domains
  if (/emiratesnbd|adcb|fab|mashreq|rakbank|chase|citi|hsbc|bankofamerica/.test(domain)) {
    return 'Bank Transaction';
  }

  // Subscriptions
  if (/apple|google|microsoft|adobe|netflix|spotify|notion|dropbox/.test(domain)) {
    return 'Subscription';
  }

  // Utilities
  if (/dewa\.gov\.ae|du\.ae|etisalat\.ae|sewa\.gov\.ae/.test(domain)) {
    return 'Utilities';
  }

  // E-commerce
  if (/amazon|noon|namshi|carrefour|talabat|deliveroo|zomato/.test(domain)) {
    return 'Shopping';
  }

  return 'Unknown';
}

/**
 * Get processed emails sheet
 * @returns {Sheet} The processed emails sheet
 */
function getProcessedEmailsSheet() {
  const spreadsheet = getSpreadsheet();
  return spreadsheet.getSheetByName('Processed Emails');
}
