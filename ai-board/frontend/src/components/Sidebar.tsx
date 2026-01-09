import { DIRECTORS, type Director } from "../types";

interface SidebarProps {
  typingDirector: Director | null;
  allDirectorsTyping: boolean;
}

export function Sidebar({ typingDirector, allDirectorsTyping }: SidebarProps) {
  return (
    <aside className="w-72 bg-board-secondary border-r border-board-elevated p-6 flex flex-col gap-8">
      {/* Directors Section */}
      <div>
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
          Board Members
        </h2>
        <div className="space-y-3">
          {DIRECTORS.map((director) => {
            const isTyping =
              typingDirector === director.id || allDirectorsTyping;
            return (
              <div
                key={director.id}
                className="bg-board-tertiary rounded-xl p-4 border-l-4 shadow-board card-hover"
                style={{ borderLeftColor: director.color }}
              >
                <div className="flex items-center justify-between mb-1">
                  <div
                    className="font-semibold text-base"
                    style={{ color: director.color }}
                  >
                    {director.name}
                  </div>
                  {isTyping ? (
                    <div className="flex gap-1.5">
                      <span className="typing-dot w-2 h-2 rounded-full bg-current" style={{ color: director.color }} />
                      <span className="typing-dot w-2 h-2 rounded-full bg-current" style={{ color: director.color }} />
                      <span className="typing-dot w-2 h-2 rounded-full bg-current" style={{ color: director.color }} />
                    </div>
                  ) : (
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.5)]" />
                  )}
                </div>
                <div className="text-sm text-text-secondary">
                  {director.role}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chairman Section */}
      <div>
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
          Chairman
        </h2>
        <div className="bg-board-tertiary rounded-xl p-4 border-l-4 border-gold shadow-board">
          <div className="font-semibold text-base text-gold mb-1">You</div>
          <div className="text-sm text-text-secondary">Chairman & CEO</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-auto">
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
          Quick Actions
        </h2>
        <div className="space-y-2">
          <button className="w-full px-4 py-3 bg-board-tertiary hover:bg-board-elevated text-text-secondary hover:text-text-primary rounded-xl text-sm font-medium text-left transition-all border border-transparent hover:border-board-elevated">
            <span className="mr-2">📋</span> New Proposal
          </button>
          <button className="w-full px-4 py-3 bg-board-tertiary hover:bg-board-elevated text-text-secondary hover:text-text-primary rounded-xl text-sm font-medium text-left transition-all border border-transparent hover:border-board-elevated">
            <span className="mr-2">📊</span> View Financials
          </button>
          <button className="w-full px-4 py-3 bg-board-tertiary hover:bg-board-elevated text-text-secondary hover:text-text-primary rounded-xl text-sm font-medium text-left transition-all border border-transparent hover:border-board-elevated">
            <span className="mr-2">📈</span> Director Stats
          </button>
        </div>
      </div>
    </aside>
  );
}
