/**
 * SQLite Database Setup
 * Uses Bun's native SQLite support
 */

import { Database } from "bun:sqlite";

const DATABASE_PATH = process.env.DATABASE_PATH ?? "./data/board.db";

// Create database connection
export const db = new Database(DATABASE_PATH, { create: true });

// Enable WAL mode for better concurrent performance
db.exec("PRAGMA journal_mode = WAL;");

/**
 * Initialize database schema
 */
export function initDatabase(): void {
  // Sessions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      session_number INTEGER NOT NULL,
      started_at TEXT NOT NULL,
      adjourned_at TEXT,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'adjourned'))
    );
  `);

  // Messages/transcript table
  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      speaker TEXT NOT NULL,
      content TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      message_type TEXT DEFAULT 'statement' CHECK(message_type IN ('statement', 'question', 'vote', 'decision', 'action')),
      FOREIGN KEY (session_id) REFERENCES sessions(id)
    );
  `);

  // Proposals table
  db.exec(`
    CREATE TABLE IF NOT EXISTS proposals (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      created_at TEXT NOT NULL,
      session_id TEXT,
      status TEXT DEFAULT 'proposed' CHECK(status IN ('proposed', 'debated', 'approved', 'rejected', 'tabled', 'active', 'measured', 'reviewed')),
      decision TEXT CHECK(decision IN ('approved', 'rejected', 'tabled')),
      decision_rationale TEXT,
      review_date TEXT,
      outcome_rating TEXT CHECK(outcome_rating IN ('success', 'failure', 'partial')),
      financial_impact REAL,
      lessons_learned TEXT,
      FOREIGN KEY (session_id) REFERENCES sessions(id)
    );
  `);

  // Director positions on proposals
  db.exec(`
    CREATE TABLE IF NOT EXISTS director_positions (
      id TEXT PRIMARY KEY,
      proposal_id TEXT NOT NULL,
      director TEXT NOT NULL CHECK(director IN ('claude', 'gemini', 'grok')),
      stance TEXT NOT NULL CHECK(stance IN ('support', 'oppose', 'abstain')),
      confidence INTEGER NOT NULL CHECK(confidence >= 0 AND confidence <= 100),
      reasoning TEXT NOT NULL,
      risks_identified TEXT,
      predicted_outcome TEXT,
      FOREIGN KEY (proposal_id) REFERENCES proposals(id),
      UNIQUE(proposal_id, director)
    );
  `);

  // Director performance stats
  db.exec(`
    CREATE TABLE IF NOT EXISTS director_stats (
      director TEXT PRIMARY KEY CHECK(director IN ('claude', 'gemini', 'grok')),
      proposals_supported INTEGER DEFAULT 0,
      proposals_opposed INTEGER DEFAULT 0,
      support_correct INTEGER DEFAULT 0,
      oppose_correct INTEGER DEFAULT 0,
      avg_confidence_correct REAL,
      avg_confidence_wrong REAL,
      best_call TEXT,
      worst_call TEXT
    );
  `);

  // Initialize director stats if not exists
  const directors = ["claude", "gemini", "grok"];
  const insertStats = db.prepare(`
    INSERT OR IGNORE INTO director_stats (director) VALUES (?)
  `);
  for (const director of directors) {
    insertStats.run(director);
  }

  // Transactions table for financials
  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'AED',
      date TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      verified INTEGER DEFAULT 0
    );
  `);

  // Financial snapshots (cash balance)
  db.exec(`
    CREATE TABLE IF NOT EXISTS financial_snapshots (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      cash_balance REAL NOT NULL,
      currency TEXT DEFAULT 'AED'
    );
  `);

  console.log("Database initialized successfully");
}

/**
 * Get next session number
 */
export function getNextSessionNumber(): number {
  const result = db.query("SELECT MAX(session_number) as max FROM sessions").get() as { max: number | null };
  return (result?.max ?? 0) + 1;
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return crypto.randomUUID();
}
