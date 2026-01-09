import type { Session } from "../types";

interface HeaderProps {
  connected: boolean;
  sessionActive: boolean;
  currentSession: Session | null;
  onStartSession: () => void;
  onAdjournSession: () => void;
}

export function Header({
  connected,
  sessionActive,
  currentSession,
  onStartSession,
  onAdjournSession,
}: HeaderProps) {
  return (
    <header className="bg-board-secondary border-b border-board-elevated px-8 py-5 flex items-center justify-between">
      {/* Logo and Title */}
      <div className="flex items-center gap-5">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold/30 to-gold/10 flex items-center justify-center border border-gold/30 shadow-gold-glow">
          <span className="text-gold text-2xl font-heading font-bold">A</span>
        </div>
        <div>
          <h1 className="text-xl font-heading font-semibold text-text-primary tracking-wide">
            AI Board of Directors
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">Strategic Governance Platform</p>
        </div>
      </div>

      {/* Session Status & Controls */}
      <div className="flex items-center gap-8">
        {/* Connection Status */}
        <div className="flex items-center gap-2.5">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              connected ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"
            }`}
          />
          <span className="text-sm text-text-secondary font-medium">
            {connected ? "Connected" : "Disconnected"}
          </span>
        </div>

        {/* Session Info */}
        {sessionActive && currentSession ? (
          <div className="flex items-center gap-6">
            {/* Session Badge */}
            <div className="px-5 py-2.5 rounded-xl bg-gold/10 border border-gold/30">
              <div className="text-base font-data text-gold font-semibold">
                Session #{currentSession.session_number}
              </div>
              <div className="text-xs text-text-muted mt-0.5">
                Started {new Date(currentSession.started_at).toLocaleTimeString()}
              </div>
            </div>

            {/* Adjourn Button */}
            <button
              onClick={onAdjournSession}
              className="px-5 py-2.5 bg-red-900/40 hover:bg-red-900/60 text-red-200 rounded-xl text-sm font-semibold transition-all border border-red-800/50 hover:border-red-700/50"
            >
              Adjourn Session
            </button>
          </div>
        ) : (
          <button
            onClick={onStartSession}
            disabled={!connected}
            className="px-6 py-3 bg-gold hover:bg-gold-light text-board-bg rounded-xl text-base font-semibold shadow-board hover:shadow-gold-glow transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
          >
            Call to Order
          </button>
        )}
      </div>
    </header>
  );
}
