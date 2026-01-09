import { useEffect, useRef } from "react";
import { Message, TypingIndicator } from "./Message";
import type { Message as MessageType, Director } from "../types";

interface ConversationProps {
  messages: MessageType[];
  typingDirector: Director | null;
  allDirectorsTyping: boolean;
  sessionActive: boolean;
}

export function Conversation({
  messages,
  typingDirector,
  allDirectorsTyping,
  sessionActive,
}: ConversationProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingDirector, allDirectorsTyping]);

  if (!sessionActive) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-board-bg to-board-secondary">
        <div className="text-center max-w-lg px-8">
          {/* Premium Icon */}
          <div className="w-24 h-24 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center border border-gold/20 shadow-gold-glow">
            <svg className="w-12 h-12 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>

          <h2 className="text-2xl font-heading font-semibold text-text-primary mb-3">
            Board Session Not Active
          </h2>
          <p className="text-base text-text-secondary leading-relaxed">
            Click <span className="text-gold font-semibold">"Call to Order"</span> to convene the AI Board of Directors and begin
            strategic discussions with Claude, Gemini, and Grok.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-8">
      {messages.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-6 rounded-xl bg-board-tertiary flex items-center justify-center">
            <svg className="w-8 h-8 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="text-lg text-text-secondary mb-4">
            Session started. Address the board to begin.
          </p>
          <div className="flex items-center justify-center gap-4 text-sm">
            <span className="px-3 py-1.5 rounded-lg bg-director-claude/10 text-director-claude font-medium">@claude</span>
            <span className="px-3 py-1.5 rounded-lg bg-director-gemini/10 text-director-gemini font-medium">@gemini</span>
            <span className="px-3 py-1.5 rounded-lg bg-director-grok/10 text-director-grok font-medium">@grok</span>
            <span className="px-3 py-1.5 rounded-lg bg-gold/10 text-gold font-medium">@all</span>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {messages.map((message) => (
            <Message key={message.id} message={message} />
          ))}

          {/* Typing indicators */}
          {typingDirector && !allDirectorsTyping && (
            <TypingIndicator director={typingDirector} />
          )}
          {allDirectorsTyping && (
            <div className="space-y-3">
              <TypingIndicator director="claude" />
              <TypingIndicator director="gemini" />
              <TypingIndicator director="grok" />
            </div>
          )}
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
