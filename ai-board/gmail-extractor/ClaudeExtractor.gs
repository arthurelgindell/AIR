/**
 * ClaudeExtractor.gs - Claude API integration for transaction extraction
 * Gmail Spending Extractor for AI Board
 */

/**
 * Extract transactions from emails using Claude
 * @param {Array} emails - Array of email objects
 * @returns {Array} Array of transaction objects
 */
function extractTransactionsWithClaude(emails) {
  const config = getConfig();
  const allTransactions = [];

  // Process in batches to manage API usage
  const batches = chunkArray(emails, config.batchSize);

  for (var i = 0; i < batches.length; i++) {
    var batch = batches[i];
    try {
      Logger.log('Processing batch ' + (i + 1) + ' of ' + batches.length);
      const transactions = extractBatchWithClaude(batch);
      allTransactions.push.apply(allTransactions, transactions);

      // Rate limiting - pause between batches
      if (i < batches.length - 1) {
        Utilities.sleep(1000);
      }
    } catch (error) {
      Logger.log('Error extracting batch ' + (i + 1) + ': ' + error.message);
    }
  }

  return allTransactions;
}

/**
 * Extract transactions from a batch of emails
 * @param {Array} emails - Batch of email objects
 * @returns {Array} Array of transaction objects
 */
function extractBatchWithClaude(emails) {
  const config = getConfig();

  // Format emails for Claude
  var emailsText = '';
  for (var i = 0; i < emails.length; i++) {
    var email = emails[i];
    emailsText += '\n--- EMAIL ' + (i + 1) + ' ---\n';
    emailsText += 'ID: ' + email.id + '\n';
    emailsText += 'From: ' + email.from + '\n';
    emailsText += 'Subject: ' + email.subject + '\n';
    emailsText += 'Date: ' + email.date + '\n\n';
    emailsText += 'Content:\n' + cleanEmailBody(email.body) + '\n---\n';
  }

  const systemPrompt = 'You are a financial data extraction assistant. Extract transaction details from emails.\n\n' +
    'Your task:\n' +
    '1. Identify spending/income transactions in the emails\n' +
    '2. Extract: amount, currency, merchant/description, date, category\n' +
    '3. Return structured JSON\n\n' +
    'Categories to use: ' + config.categories.join(', ') + '\n\n' +
    'CRITICAL RULES:\n' +
    '- Only extract actual transactions (purchases, payments, transfers)\n' +
    '- Ignore promotional content, balance inquiries, or informational emails\n' +
    '- If no transaction found in an email, return null for that email\n' +
    '- Amounts should be numbers (no currency symbols)\n' +
    '- Dates should be ISO format (YYYY-MM-DD)\n' +
    '- Currency should be 3-letter code (AED, USD, etc.)\n' +
    '- If amount is ambiguous, use the total/final amount';

  const userPrompt = 'Extract transactions from these emails. Return a JSON array.\n\n' +
    emailsText + '\n\n' +
    'Return JSON in this exact format:\n' +
    '{\n' +
    '  "transactions": [\n' +
    '    {\n' +
    '      "email_id": "string",\n' +
    '      "amount": number,\n' +
    '      "currency": "AED",\n' +
    '      "merchant": "string",\n' +
    '      "category": "string",\n' +
    '      "date": "YYYY-MM-DD",\n' +
    '      "description": "string",\n' +
    '      "confidence": number (0-100),\n' +
    '      "type": "expense" or "income"\n' +
    '    }\n' +
    '  ]\n' +
    '}\n\n' +
    'If an email has no transaction, include: {"email_id": "...", "no_transaction": true}';

  const response = callClaudeAPI(systemPrompt, userPrompt);

  try {
    // Extract JSON from response (Claude might include extra text)
    var jsonMatch = response.match(/\{[\s\S]*"transactions"[\s\S]*\}/);
    if (!jsonMatch) {
      Logger.log('No JSON found in response');
      return [];
    }

    const result = JSON.parse(jsonMatch[0]);
    return result.transactions.filter(function(t) { return !t.no_transaction; });
  } catch (error) {
    Logger.log('Failed to parse Claude response: ' + error.message);
    Logger.log('Response was: ' + response.substring(0, 500));
    return [];
  }
}

/**
 * Call Claude API
 * @param {string} systemPrompt - System prompt
 * @param {string} userPrompt - User prompt
 * @returns {string} Claude's response text
 */
function callClaudeAPI(systemPrompt, userPrompt) {
  const config = getConfig();

  if (!config.claudeApiKey || config.claudeApiKey === 'YOUR_ANTHROPIC_API_KEY_HERE') {
    throw new Error('Claude API key not configured. Run initializeConfig() first.');
  }

  const url = 'https://api.anthropic.com/v1/messages';

  const payload = {
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: systemPrompt,
    messages: [
      { role: 'user', content: userPrompt }
    ]
  };

  const options = {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.claudeApiKey,
      'anthropic-version': '2023-06-01'
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  const responseCode = response.getResponseCode();
  const responseBody = response.getContentText();

  if (responseCode !== 200) {
    Logger.log('Claude API error ' + responseCode + ': ' + responseBody);
    throw new Error('Claude API error ' + responseCode);
  }

  const result = JSON.parse(responseBody);
  return result.content[0].text;
}

/**
 * Clean email body for processing
 * @param {string} body - Raw email body
 * @returns {string} Cleaned body
 */
function cleanEmailBody(body) {
  return body
    // Remove separator lines
    .replace(/[-=]{3,}/g, '')
    // Collapse excessive whitespace
    .replace(/\s{3,}/g, '\n')
    // Remove URLs (keep privacy)
    .replace(/http\S+/g, '[link]')
    // Remove HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    // Limit length
    .substring(0, 5000);
}

/**
 * Scrub sensitive data from email content
 * @param {string} text - Text to scrub
 * @returns {string} Scrubbed text
 */
function scrubSensitiveData(text) {
  return text
    // Remove full card numbers (keep last 4)
    .replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?(\d{4})\b/g, '****-****-****-$1')
    // Remove account numbers (keep last 4)
    .replace(/\b(account|acct)[\s#:]*\d{4,}(\d{4})\b/gi, '$1 ****$2')
    // Remove CVV
    .replace(/\b(cvv|cvc|security code)[\s:]*\d{3,4}\b/gi, '$1 ***');
}

/**
 * Split array into chunks
 * @param {Array} array - Array to split
 * @param {number} size - Chunk size
 * @returns {Array} Array of chunks
 */
function chunkArray(array, size) {
  const chunks = [];
  for (var i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Test Claude API connection
 */
function testClaudeAPI() {
  try {
    const response = callClaudeAPI(
      'You are a helpful assistant.',
      'Reply with exactly: "Claude API working!"'
    );
    Logger.log('Claude API test response: ' + response);

    if (response.indexOf('Claude API working') !== -1) {
      Logger.log('SUCCESS: Claude API is configured correctly!');
      return true;
    } else {
      Logger.log('WARNING: Unexpected response from Claude API');
      return false;
    }
  } catch (error) {
    Logger.log('FAILED: Claude API test failed: ' + error.message);
    return false;
  }
}

/**
 * Test extraction with a sample email
 */
function testExtraction() {
  // Create a sample email for testing
  const sampleEmail = {
    id: 'test-001',
    from: 'alerts@emiratesnbd.com',
    subject: 'Transaction Alert: Purchase at Carrefour',
    date: new Date().toISOString(),
    body: 'Dear Customer,\n\nA transaction has been made on your card ending 1234.\n\nDetails:\nMerchant: Carrefour Hypermarket\nAmount: AED 285.50\nDate: ' + new Date().toDateString() + '\nLocation: Dubai\n\nIf you did not authorize this transaction, please contact us immediately.\n\nRegards,\nEmirates NBD'
  };

  Logger.log('Testing extraction with sample email...');
  const transactions = extractTransactionsWithClaude([sampleEmail]);

  if (transactions.length > 0) {
    Logger.log('SUCCESS! Extracted transaction:');
    Logger.log(JSON.stringify(transactions[0], null, 2));
  } else {
    Logger.log('No transactions extracted from sample email');
  }

  return transactions;
}
