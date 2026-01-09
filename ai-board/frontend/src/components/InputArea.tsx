import { useState, useCallback, type KeyboardEvent } from "react";
import type { Director } from "../types";

interface InputAreaProps {
  sessionActive: boolean;
  onAskDirector: (director: Director, message: string) => void;
  onAskAll: (message: string) => void;
}

export function InputArea({
  sessionActive,
  onAskDirector,
  onAskAll,
}: InputAreaProps) {
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);

  const handleSubmit = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || !sessionActive) return;

    // Parse @mentions
    const claudeMatch = trimmed.match(/^@claude\s+(.+)/i);
    const geminiMatch = trimmed.match(/^@gemini\s+(.+)/i);
    const grokMatch = trimmed.match(/^@grok\s+(.+)/i);
    const allMatch = trimmed.match(/^@all\s+(.+)/i);

    if (claudeMatch?.[1]) {
      onAskDirector("claude", claudeMatch[1]);
    } else if (geminiMatch?.[1]) {
      onAskDirector("gemini", geminiMatch[1]);
    } else if (grokMatch?.[1]) {
      onAskDirector("grok", grokMatch[1]);
    } else if (allMatch?.[1]) {
      onAskAll(allMatch[1]);
    } else {
      // Default to asking all
      onAskAll(trimmed);
    }

    setInput("");
  }, [input, sessionActive, onAskDirector, onAskAll]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // TODO: Implement voice recognition in Phase 3
  };

  return (
    <div className="border-t border-board-elevated bg-board-secondary p-6">
      {/* Director Quick Access - Premium styled */}
      <div className="flex items-center gap-4 mb-4">
        <span className="text-sm text-text-muted font-medium">Address:</span>
        <div className="flex gap-3">
          <button
            onClick={() => setInput("@claude ")}
            className="px-3 py-1.5 text-sm font-medium rounded-lg bg-director-claude/10 text-director-claude hover:bg-director-claude/20 transition-colors"
          >
            @claude
          </button>
          <button
            onClick={() => setInput("@gemini ")}
            className="px-3 py-1.5 text-sm font-medium rounded-lg bg-director-gemini/10 text-director-gemini hover:bg-director-gemini/20 transition-colors"
          >
            @gemini
          </button>
          <button
            onClick={() => setInput("@grok ")}
            className="px-3 py-1.5 text-sm font-medium rounded-lg bg-director-grok/10 text-director-grok hover:bg-director-grok/20 transition-colors"
          >
            @grok
          </button>
          <button
            onClick={() => setInput("@all ")}
            className="px-3 py-1.5 text-sm font-medium rounded-lg bg-gold/10 text-gold hover:bg-gold/20 transition-colors"
          >
            @all directors
          </button>
        </div>
      </div>

      {/* Main Input Area - Premium Command Center */}
      <div className="flex gap-4 items-end">
        {/* Voice Button - Prominent */}
        <button
          onClick={toggleRecording}
          disabled={!sessionActive}
          className={`flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center transition-all shadow-board ${
            isRecording
              ? "bg-red-600 hover:bg-red-700 shadow-red-900/50 gold-pulse"
              : "bg-board-tertiary hover:bg-board-elevated border border-board-elevated"
          } disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none`}
        >
          {isRecording ? (
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" rx="1" />
            </svg>
          ) : (
            <svg className="w-6 h-6 text-text-secondary" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
            </svg>
          )}
        </button>

        {/* Text Input - Executive Command Area */}
        <div className="flex-1">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!sessionActive}
            placeholder={
              sessionActive
                ? "Address the board... (Enter to send, Shift+Enter for new line)"
                : "Start a session to address the board..."
            }
            className="w-full min-h-[100px] max-h-[200px] px-5 py-4 bg-board-tertiary text-text-primary text-base leading-relaxed rounded-xl border border-board-elevated resize-y premium-focus disabled:opacity-40 disabled:cursor-not-allowed placeholder:text-text-muted/60"
          />
        </div>

        {/* Send Button - Premium CTA */}
        <button
          onClick={handleSubmit}
          disabled={!sessionActive || !input.trim()}
          className="flex-shrink-0 px-8 py-4 bg-gold hover:bg-gold-light text-board-bg text-base font-semibold rounded-xl shadow-board hover:shadow-board-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:bg-gold"
        >
          Send
        </button>
      </div>

      {/* Input Hint */}
      {sessionActive && (
        <div className="mt-3 text-sm text-text-muted">
          <span className="opacity-60">Tip: Use </span>
          <kbd className="px-1.5 py-0.5 bg-board-tertiary rounded text-text-secondary text-xs mx-1">Enter</kbd>
          <span className="opacity-60"> to send, </span>
          <kbd className="px-1.5 py-0.5 bg-board-tertiary rounded text-text-secondary text-xs mx-1">Shift+Enter</kbd>
          <span className="opacity-60"> for new line</span>
        </div>
      )}
    </div>
  );
}
