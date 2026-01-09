/**
 * Hono API Routes
 * REST endpoints for AI Board of Directors
 */

import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { db, getNextSessionNumber, generateId } from "../lib/db";

export const app = new Hono();

// Middleware
app.use("*", logger());
app.use("*", cors());

// Health check
app.get("/health", (c) => {
  return c.json({
    status: "healthy",
    runtime: `Bun ${Bun.version}`,
    service: "AI Board of Directors",
    timestamp: new Date().toISOString(),
  });
});

// Get current status
app.get("/api/status", (c) => {
  // Get active session
  const activeSession = db.query(`
    SELECT * FROM sessions WHERE status = 'active' ORDER BY started_at DESC LIMIT 1
  `).get();

  // Get active proposals count
  const proposalCount = db.query(`
    SELECT COUNT(*) as count FROM proposals WHERE status IN ('proposed', 'debated', 'active')
  `).get() as { count: number };

  // Get latest financial snapshot
  const latestSnapshot = db.query(`
    SELECT * FROM financial_snapshots ORDER BY date DESC LIMIT 1
  `).get();

  return c.json({
    session: activeSession,
    activeProposals: proposalCount?.count ?? 0,
    financials: latestSnapshot,
  });
});

// Sessions
app.get("/api/sessions", (c) => {
  const sessions = db.query(`
    SELECT * FROM sessions ORDER BY session_number DESC LIMIT 20
  `).all();
  return c.json({ sessions });
});

app.get("/api/sessions/:id", (c) => {
  const id = c.req.param("id");
  const session = db.query("SELECT * FROM sessions WHERE id = ?").get(id);
  if (!session) {
    return c.json({ error: "Session not found" }, 404);
  }

  const messages = db.query(`
    SELECT * FROM messages WHERE session_id = ? ORDER BY timestamp ASC
  `).all(id);

  return c.json({ session, messages });
});

// Proposals
app.get("/api/proposals", (c) => {
  const proposals = db.query(`
    SELECT * FROM proposals ORDER BY created_at DESC
  `).all();
  return c.json({ proposals });
});

app.get("/api/proposals/:id", (c) => {
  const id = c.req.param("id");
  const proposal = db.query("SELECT * FROM proposals WHERE id = ?").get(id);
  if (!proposal) {
    return c.json({ error: "Proposal not found" }, 404);
  }

  const positions = db.query(`
    SELECT * FROM director_positions WHERE proposal_id = ?
  `).all(id);

  return c.json({ proposal, positions });
});

// Director stats
app.get("/api/directors/stats", (c) => {
  const stats = db.query("SELECT * FROM director_stats").all();
  return c.json({ stats });
});

// Financials
app.get("/api/financials", (c) => {
  // Get latest cash balance
  const latestSnapshot = db.query(`
    SELECT * FROM financial_snapshots ORDER BY date DESC LIMIT 1
  `).get() as { cash_balance: number; currency: string; date: string } | null;

  // Get transactions for last 30 and 90 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

  const expenses30d = db.query(`
    SELECT COALESCE(SUM(amount), 0) as total FROM transactions
    WHERE type = 'expense' AND date >= ?
  `).get(thirtyDaysAgo) as { total: number };

  const expenses90d = db.query(`
    SELECT COALESCE(SUM(amount), 0) as total FROM transactions
    WHERE type = 'expense' AND date >= ?
  `).get(ninetyDaysAgo) as { total: number };

  const revenue30d = db.query(`
    SELECT COALESCE(SUM(amount), 0) as total FROM transactions
    WHERE type = 'income' AND date >= ?
  `).get(thirtyDaysAgo) as { total: number };

  const revenue90d = db.query(`
    SELECT COALESCE(SUM(amount), 0) as total FROM transactions
    WHERE type = 'income' AND date >= ?
  `).get(ninetyDaysAgo) as { total: number };

  // Calculate burn rate and runway
  const burnRateMonthly = expenses30d.total;
  const cashBalance = latestSnapshot?.cash_balance ?? 0;
  const runwayMonths = burnRateMonthly > 0 ? cashBalance / burnRateMonthly : Infinity;

  return c.json({
    asOfDate: new Date().toISOString(),
    cashBalance,
    currency: latestSnapshot?.currency ?? "AED",
    revenue30d: revenue30d.total,
    revenue90d: revenue90d.total,
    expenses30d: expenses30d.total,
    expenses90d: expenses90d.total,
    burnRateMonthly,
    runwayMonths: runwayMonths === Infinity ? null : Math.round(runwayMonths * 10) / 10,
  });
});

app.post("/api/cash-balance", async (c) => {
  const body = await c.req.json();
  const { cashBalance, currency = "AED" } = body;

  if (typeof cashBalance !== "number") {
    return c.json({ error: "cashBalance must be a number" }, 400);
  }

  const id = generateId();
  const date = new Date().toISOString();

  db.query(`
    INSERT INTO financial_snapshots (id, date, cash_balance, currency)
    VALUES (?, ?, ?, ?)
  `).run(id, date, cashBalance, currency);

  return c.json({ success: true, id, cashBalance, currency });
});

app.post("/api/transactions", async (c) => {
  const body = await c.req.json();
  const { type, amount, category, description, date, currency = "AED" } = body;

  if (!type || !amount || !category) {
    return c.json({ error: "type, amount, and category are required" }, 400);
  }

  const id = generateId();
  const txDate = date ?? new Date().toISOString();

  db.query(`
    INSERT INTO transactions (id, type, amount, currency, date, category, description)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, type, amount, currency, txDate, category, description ?? "");

  return c.json({ success: true, id });
});

export default app;
