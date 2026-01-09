// Director types
export type Director = "claude" | "gemini" | "grok";
export type Speaker = Director | "chairman" | "system";

// Session types
export interface Session {
  id: string;
  session_number: number;
  started_at: string;
  adjourned_at: string | null;
  status: "active" | "adjourned";
}

// Message types
export interface Message {
  id: string;
  session_id: string;
  speaker: Speaker;
  content: string;
  timestamp: string;
  message_type: "statement" | "question" | "vote" | "decision" | "action";
}

// Proposal types
export interface Proposal {
  id: string;
  title: string;
  description: string;
  created_at: string;
  session_id: string | null;
  status: "proposed" | "debated" | "approved" | "rejected" | "tabled" | "active" | "measured" | "reviewed";
  decision: "approved" | "rejected" | "tabled" | null;
  decision_rationale: string | null;
  review_date: string | null;
  outcome_rating: "success" | "failure" | "partial" | null;
  financial_impact: number | null;
}

export interface DirectorPosition {
  id: string;
  proposal_id: string;
  director: Director;
  stance: "support" | "oppose" | "abstain";
  confidence: number;
  reasoning: string;
  risks_identified: string | null;
  predicted_outcome: string | null;
}

// Financial types
export interface FinancialPosition {
  asOfDate: string;
  cashBalance: number;
  currency: string;
  revenue30d: number;
  revenue90d: number;
  expenses30d: number;
  expenses90d: number;
  burnRateMonthly: number;
  runwayMonths: number | null;
}

export interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  currency: string;
  date: string;
  category: string;
  description: string;
  verified: boolean;
}

// WebSocket message types
export interface WSMessage {
  type: string;
  [key: string]: unknown;
}

// Director stats
export interface DirectorStats {
  director: Director;
  proposals_supported: number;
  proposals_opposed: number;
  support_correct: number;
  oppose_correct: number;
  avg_confidence_correct: number | null;
  avg_confidence_wrong: number | null;
  best_call: string | null;
  worst_call: string | null;
}

// Director config for UI
export interface DirectorConfig {
  id: Director;
  name: string;
  role: string;
  color: string;
  colorClass: string;
}

export const DIRECTORS: DirectorConfig[] = [
  {
    id: "claude",
    name: "Claude",
    role: "Chief Strategy Officer",
    color: "#d4a574",
    colorClass: "text-director-claude",
  },
  {
    id: "gemini",
    name: "Gemini",
    role: "Chief Intelligence Officer",
    color: "#74b4d4",
    colorClass: "text-director-gemini",
  },
  {
    id: "grok",
    name: "Grok",
    role: "Chief Contrarian Officer",
    color: "#d47474",
    colorClass: "text-director-grok",
  },
];
