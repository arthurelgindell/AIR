/**
 * WebSocket Handler for AI Board of Directors
 * Real-time communication for board sessions
 */

import type { ServerWebSocket } from "bun";
import { db, generateId, getNextSessionNumber } from "../lib/db";
import { callDirector, callAllDirectors, type Director, type DirectorResponse } from "../lib/ai-clients";

// Types for WebSocket messages
export interface WSMessage {
  action: string;
  [key: string]: unknown;
}

export interface WSClient {
  ws: ServerWebSocket<unknown>;
  sessionId: string | null;
}

// Connected clients
const clients = new Set<ServerWebSocket<unknown>>();

// Current active session
let activeSessionId: string | null = null;

/**
 * Broadcast message to all connected clients
 */
export function broadcast(message: object): void {
  const payload = JSON.stringify(message);
  for (const client of clients) {
    try {
      client.send(payload);
    } catch {
      clients.delete(client);
    }
  }
}

/**
 * Send message to specific client
 */
export function sendTo(ws: ServerWebSocket<unknown>, message: object): void {
  try {
    ws.send(JSON.stringify(message));
  } catch {
    clients.delete(ws);
  }
}

/**
 * Handle incoming WebSocket messages
 */
export async function handleMessage(
  ws: ServerWebSocket<unknown>,
  message: string
): Promise<void> {
  let data: WSMessage;

  try {
    data = JSON.parse(message);
  } catch {
    sendTo(ws, { type: "error", message: "Invalid JSON" });
    return;
  }

  const { action } = data;

  switch (action) {
    case "ping":
      sendTo(ws, { type: "pong", timestamp: Date.now() });
      break;

    case "start_session":
      await handleStartSession(ws);
      break;

    case "adjourn_session":
      await handleAdjournSession(ws);
      break;

    case "ask_director":
      await handleAskDirector(ws, data);
      break;

    case "ask_all":
      await handleAskAll(ws, data);
      break;

    case "create_proposal":
      await handleCreateProposal(ws, data);
      break;

    case "vote_proposal":
      await handleVoteProposal(ws, data);
      break;

    case "decide_proposal":
      await handleDecideProposal(ws, data);
      break;

    default:
      sendTo(ws, { type: "error", message: `Unknown action: ${action}` });
  }
}

/**
 * Start a new board session
 */
async function handleStartSession(ws: ServerWebSocket<unknown>): Promise<void> {
  if (activeSessionId) {
    sendTo(ws, {
      type: "error",
      message: "Session already active. Adjourn first.",
    });
    return;
  }

  const sessionNumber = getNextSessionNumber();
  const id = generateId();
  const startedAt = new Date().toISOString();

  db.query(`
    INSERT INTO sessions (id, session_number, started_at, status)
    VALUES (?, ?, ?, 'active')
  `).run(id, sessionNumber, startedAt);

  activeSessionId = id;

  broadcast({
    type: "session_started",
    session: {
      id,
      session_number: sessionNumber,
      started_at: startedAt,
      status: "active",
    },
  });

  // Log session start message
  const messageId = generateId();
  db.query(`
    INSERT INTO messages (id, session_id, speaker, content, timestamp, message_type)
    VALUES (?, ?, 'system', 'Board session called to order.', ?, 'statement')
  `).run(messageId, id, startedAt);
}

/**
 * Adjourn the current session
 */
async function handleAdjournSession(ws: ServerWebSocket<unknown>): Promise<void> {
  if (!activeSessionId) {
    sendTo(ws, { type: "error", message: "No active session to adjourn." });
    return;
  }

  const adjournedAt = new Date().toISOString();

  db.query(`
    UPDATE sessions SET status = 'adjourned', adjourned_at = ? WHERE id = ?
  `).run(adjournedAt, activeSessionId);

  // Log adjourn message
  const messageId = generateId();
  db.query(`
    INSERT INTO messages (id, session_id, speaker, content, timestamp, message_type)
    VALUES (?, ?, 'system', 'Board session adjourned.', ?, 'statement')
  `).run(messageId, activeSessionId, adjournedAt);

  // Get session summary
  const session = db.query("SELECT * FROM sessions WHERE id = ?").get(activeSessionId);
  const messageCount = db.query(
    "SELECT COUNT(*) as count FROM messages WHERE session_id = ?"
  ).get(activeSessionId) as { count: number };

  broadcast({
    type: "session_adjourned",
    session,
    messageCount: messageCount.count,
  });

  activeSessionId = null;
}

/**
 * Get conversation history for a session (for AI context)
 */
function getConversationHistory(sessionId: string): Array<{ role: "user" | "assistant"; content: string }> {
  const messages = db.query(`
    SELECT speaker, content FROM messages
    WHERE session_id = ? AND message_type IN ('question', 'statement')
    ORDER BY timestamp ASC
    LIMIT 20
  `).all(sessionId) as Array<{ speaker: string; content: string }>;

  return messages.map((msg) => ({
    role: msg.speaker === "chairman" ? "user" : "assistant",
    content: msg.content,
  }));
}

/**
 * Ask a specific director
 */
async function handleAskDirector(
  ws: ServerWebSocket<unknown>,
  data: WSMessage
): Promise<void> {
  const { director, message } = data as { director: string; message: string };

  if (!activeSessionId) {
    sendTo(ws, { type: "error", message: "No active session. Start session first." });
    return;
  }

  if (!["claude", "gemini", "grok"].includes(director)) {
    sendTo(ws, { type: "error", message: "Invalid director. Use: claude, gemini, or grok" });
    return;
  }

  if (!message) {
    sendTo(ws, { type: "error", message: "Message is required" });
    return;
  }

  // Log user message
  const userMsgId = generateId();
  const timestamp = new Date().toISOString();
  db.query(`
    INSERT INTO messages (id, session_id, speaker, content, timestamp, message_type)
    VALUES (?, ?, 'chairman', ?, ?, 'question')
  `).run(userMsgId, activeSessionId, message, timestamp);

  // Broadcast user message
  broadcast({
    type: "user_message",
    speaker: "chairman",
    content: message,
    timestamp,
  });

  // Show typing indicator
  broadcast({
    type: "director_typing",
    director,
  });

  // Get conversation history for context
  const history = getConversationHistory(activeSessionId);

  // Call the real AI director
  const response: DirectorResponse = await callDirector(
    director as Director,
    message,
    history
  );

  // Log director response
  const dirMsgId = generateId();
  const respTimestamp = response.timestamp;
  db.query(`
    INSERT INTO messages (id, session_id, speaker, content, timestamp, message_type)
    VALUES (?, ?, ?, ?, ?, 'statement')
  `).run(dirMsgId, activeSessionId, director, response.content, respTimestamp);

  // Broadcast director response
  broadcast({
    type: "director_response",
    director,
    content: response.content,
    timestamp: respTimestamp,
    tokensUsed: response.tokensUsed,
    error: response.error,
  });
}

/**
 * Ask all directors in parallel
 */
async function handleAskAll(
  ws: ServerWebSocket<unknown>,
  data: WSMessage
): Promise<void> {
  const { message } = data as { message: string };

  if (!activeSessionId) {
    sendTo(ws, { type: "error", message: "No active session. Start session first." });
    return;
  }

  if (!message) {
    sendTo(ws, { type: "error", message: "Message is required" });
    return;
  }

  // Log user message
  const userMsgId = generateId();
  const timestamp = new Date().toISOString();
  db.query(`
    INSERT INTO messages (id, session_id, speaker, content, timestamp, message_type)
    VALUES (?, ?, 'chairman', ?, ?, 'question')
  `).run(userMsgId, activeSessionId, message, timestamp);

  broadcast({
    type: "user_message",
    speaker: "chairman",
    content: message,
    timestamp,
  });

  // Show all directors typing
  broadcast({ type: "all_directors_typing" });

  // Get conversation history for context
  const history = getConversationHistory(activeSessionId);

  // Call all directors in parallel
  const responses = await callAllDirectors(message, history);

  // Process each response
  for (const response of responses) {
    const dirMsgId = generateId();
    db.query(`
      INSERT INTO messages (id, session_id, speaker, content, timestamp, message_type)
      VALUES (?, ?, ?, ?, ?, 'statement')
    `).run(dirMsgId, activeSessionId, response.director, response.content, response.timestamp);

    broadcast({
      type: "director_response",
      director: response.director,
      content: response.content,
      timestamp: response.timestamp,
      tokensUsed: response.tokensUsed,
      error: response.error,
    });
  }
}

/**
 * Create a new proposal
 */
async function handleCreateProposal(
  ws: ServerWebSocket<unknown>,
  data: WSMessage
): Promise<void> {
  const { title, description } = data as { title: string; description: string };

  if (!title || !description) {
    sendTo(ws, { type: "error", message: "Title and description required" });
    return;
  }

  const id = generateId();
  const createdAt = new Date().toISOString();

  db.query(`
    INSERT INTO proposals (id, title, description, created_at, session_id, status)
    VALUES (?, ?, ?, ?, ?, 'proposed')
  `).run(id, title, description, createdAt, activeSessionId);

  broadcast({
    type: "proposal_created",
    proposal: {
      id,
      title,
      description,
      created_at: createdAt,
      session_id: activeSessionId,
      status: "proposed",
    },
  });
}

/**
 * Vote on a proposal (directors provide positions)
 */
async function handleVoteProposal(
  ws: ServerWebSocket<unknown>,
  data: WSMessage
): Promise<void> {
  const { proposalId } = data as { proposalId: string };

  if (!proposalId) {
    sendTo(ws, { type: "error", message: "proposalId required" });
    return;
  }

  const proposal = db.query("SELECT * FROM proposals WHERE id = ?").get(proposalId) as {
    id: string;
    title: string;
    description: string;
  } | null;
  if (!proposal) {
    sendTo(ws, { type: "error", message: "Proposal not found" });
    return;
  }

  broadcast({
    type: "voting_started",
    proposalId,
  });

  // Update proposal status
  db.query("UPDATE proposals SET status = 'debated' WHERE id = ?").run(proposalId);

  // Build the voting prompt
  const votingPrompt = `You are being asked to vote on the following proposal:

**Title:** ${proposal.title}
**Description:** ${proposal.description}

Please provide your position on this proposal. Your response MUST be in exactly this JSON format (no markdown, no extra text):
{
  "stance": "support" | "oppose" | "abstain",
  "confidence": <number 0-100>,
  "reasoning": "<your detailed reasoning>",
  "predicted_outcome": "<what you predict will happen if this is approved>"
}`;

  // Get each director's position in parallel
  const responses = await callAllDirectors(votingPrompt, []);

  // Process each response
  for (const response of responses) {
    let stance = "abstain";
    let confidence = 50;
    let reasoning = response.content;
    let predictedOutcome = "Unable to determine";

    // Try to parse JSON response
    try {
      // Extract JSON from response (may have markdown code blocks)
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        stance = parsed.stance || "abstain";
        confidence = Math.min(100, Math.max(0, parseInt(parsed.confidence) || 50));
        reasoning = parsed.reasoning || response.content;
        predictedOutcome = parsed.predicted_outcome || "No prediction provided";
      }
    } catch {
      // If JSON parsing fails, use the raw response as reasoning
      // and try to infer stance from text
      const lowerContent = response.content.toLowerCase();
      if (lowerContent.includes("support") && !lowerContent.includes("not support") && !lowerContent.includes("don't support")) {
        stance = "support";
      } else if (lowerContent.includes("oppose") || lowerContent.includes("against") || lowerContent.includes("reject")) {
        stance = "oppose";
      }
    }

    const id = generateId();

    db.query(`
      INSERT OR REPLACE INTO director_positions
      (id, proposal_id, director, stance, confidence, reasoning, predicted_outcome)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      proposalId,
      response.director,
      stance,
      confidence,
      reasoning,
      predictedOutcome
    );

    broadcast({
      type: "director_vote",
      director: response.director,
      position: {
        stance,
        confidence,
        reasoning,
        predictedOutcome,
      },
      error: response.error,
    });
  }

  broadcast({
    type: "voting_complete",
    proposalId,
  });
}

/**
 * Chairman decides on a proposal
 */
async function handleDecideProposal(
  ws: ServerWebSocket<unknown>,
  data: WSMessage
): Promise<void> {
  const { proposalId, decision, rationale, reviewDate } = data as {
    proposalId: string;
    decision: "approved" | "rejected" | "tabled";
    rationale: string;
    reviewDate?: string;
  };

  if (!proposalId || !decision || !rationale) {
    sendTo(ws, { type: "error", message: "proposalId, decision, and rationale required" });
    return;
  }

  const newStatus = decision === "approved" ? "active" : decision;

  db.query(`
    UPDATE proposals
    SET status = ?, decision = ?, decision_rationale = ?, review_date = ?
    WHERE id = ?
  `).run(newStatus, decision, rationale, reviewDate ?? null, proposalId);

  const proposal = db.query("SELECT * FROM proposals WHERE id = ?").get(proposalId);

  broadcast({
    type: "proposal_decided",
    proposal,
  });
}

/**
 * Handle new WebSocket connection
 */
export function handleOpen(ws: ServerWebSocket<unknown>): void {
  clients.add(ws);

  // Send connection confirmation with current state
  sendTo(ws, {
    type: "connected",
    sessionActive: activeSessionId !== null,
    sessionId: activeSessionId,
    timestamp: Date.now(),
  });
}

/**
 * Handle WebSocket close
 */
export function handleClose(ws: ServerWebSocket<unknown>): void {
  clients.delete(ws);
}
