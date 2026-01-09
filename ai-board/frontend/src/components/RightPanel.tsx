import type { FinancialPosition, Proposal } from "../types";

interface RightPanelProps {
  financials: FinancialPosition | null;
  proposals: Proposal[];
}

export function RightPanel({ financials, proposals }: RightPanelProps) {
  const formatCurrency = (amount: number, currency = "AED") => {
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <aside className="w-96 bg-board-secondary border-l border-board-elevated p-6 flex flex-col gap-8 overflow-y-auto">
      {/* Financial Overview */}
      <div>
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
          Financial Position
        </h2>
        <div className="bg-board-tertiary rounded-xl p-5 shadow-board">
          {financials ? (
            <>
              {/* Cash Balance - Hero Number */}
              <div className="pb-5 mb-5 border-b border-board-elevated">
                <div className="text-sm text-text-secondary mb-2">Cash Balance</div>
                <div className="text-4xl font-heading font-semibold text-gold">
                  {formatCurrency(financials.cashBalance, financials.currency)}
                </div>
              </div>

              {/* Key Metrics - Single Column for Clarity */}
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-board-elevated/50">
                  <span className="text-sm text-text-secondary">Monthly Burn Rate</span>
                  <span className="text-base font-data text-red-400">
                    {formatCurrency(financials.burnRateMonthly, financials.currency)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-board-elevated/50">
                  <span className="text-sm text-text-secondary">Runway</span>
                  <span className="text-base font-data text-green-400 font-semibold">
                    {financials.runwayMonths
                      ? `${financials.runwayMonths} months`
                      : "∞"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-board-elevated/50">
                  <span className="text-sm text-text-secondary">Revenue (30d)</span>
                  <span className="text-base font-data text-text-primary">
                    {formatCurrency(financials.revenue30d, financials.currency)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-text-secondary">Expenses (30d)</span>
                  <span className="text-base font-data text-text-primary">
                    {formatCurrency(financials.expenses30d, financials.currency)}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-6">
              <div className="text-text-muted text-base mb-3">
                No financial data yet
              </div>
              <button className="px-4 py-2 text-sm text-gold hover:text-gold-light border border-gold/30 hover:border-gold/50 rounded-lg transition-colors">
                + Add cash balance
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Active Proposals */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
            Active Proposals
          </h2>
          <span className="text-sm text-gold font-data font-semibold bg-gold/10 px-2.5 py-1 rounded-lg">
            {proposals.length}
          </span>
        </div>

        {proposals.length > 0 ? (
          <div className="space-y-3">
            {proposals.slice(0, 5).map((proposal) => (
              <div
                key={proposal.id}
                className="bg-board-tertiary rounded-xl p-4 shadow-board card-hover"
              >
                <div className="font-medium text-base text-text-primary mb-2">
                  {proposal.title}
                </div>
                <div className="flex items-center justify-between">
                  <span
                    className={`text-sm font-medium px-3 py-1 rounded-lg ${
                      proposal.status === "approved"
                        ? "bg-green-900/40 text-green-300 border border-green-800/50"
                        : proposal.status === "rejected"
                        ? "bg-red-900/40 text-red-300 border border-red-800/50"
                        : "bg-gold/15 text-gold border border-gold/30"
                    }`}
                  >
                    {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                  </span>
                  <span className="text-sm text-text-muted">
                    {new Date(proposal.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-board-tertiary rounded-xl p-6 shadow-board text-center">
            <div className="text-text-muted text-base mb-3">No active proposals</div>
            <button className="px-4 py-2 text-sm text-gold hover:text-gold-light border border-gold/30 hover:border-gold/50 rounded-lg transition-colors">
              + Create proposal
            </button>
          </div>
        )}
      </div>

      {/* Voice Controls */}
      <div>
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
          Voice Settings
        </h2>
        <div className="bg-board-tertiary rounded-xl p-4 shadow-board space-y-4">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm text-text-secondary">Voice Output</span>
            <input
              type="checkbox"
              defaultChecked
              className="w-5 h-5 accent-gold rounded cursor-pointer"
            />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm text-text-secondary">Auto-play Responses</span>
            <input
              type="checkbox"
              defaultChecked
              className="w-5 h-5 accent-gold rounded cursor-pointer"
            />
          </label>
        </div>
      </div>

      {/* Session History Button */}
      <div className="mt-auto">
        <button className="w-full px-4 py-3 bg-board-tertiary hover:bg-board-elevated text-text-secondary hover:text-text-primary rounded-xl text-sm font-medium text-center transition-all border border-transparent hover:border-board-elevated">
          View Session History
        </button>
      </div>
    </aside>
  );
}
