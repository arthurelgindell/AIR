import { useState, useEffect } from "react";
import { useWebSocket } from "../hooks/useWebSocket";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { Conversation } from "./Conversation";
import { InputArea } from "./InputArea";
import { RightPanel } from "./RightPanel";
import type { FinancialPosition, Proposal } from "../types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export function Boardroom() {
  const ws = useWebSocket();
  const [financials, setFinancials] = useState<FinancialPosition | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch financials
        const finRes = await fetch(`${API_URL}/api/financials`);
        if (finRes.ok) {
          const finData = await finRes.json();
          setFinancials(finData);
        }

        // Fetch proposals
        const propRes = await fetch(`${API_URL}/api/proposals`);
        if (propRes.ok) {
          const propData = await propRes.json();
          setProposals(propData.proposals ?? []);
        }
      } catch (error) {
        console.error("Failed to fetch initial data:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="h-screen flex flex-col bg-board-bg">
      {/* Header */}
      <Header
        connected={ws.connected}
        sessionActive={ws.sessionActive}
        currentSession={ws.currentSession}
        onStartSession={ws.startSession}
        onAdjournSession={ws.adjournSession}
      />

      {/* Main Content - Three Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Board Members */}
        <Sidebar
          typingDirector={ws.typingDirector}
          allDirectorsTyping={ws.allDirectorsTyping}
        />

        {/* Center - Conversation Area */}
        <main className="flex-1 flex flex-col overflow-hidden bg-gradient-to-b from-board-bg via-board-bg to-board-secondary/50">
          <Conversation
            messages={ws.messages}
            typingDirector={ws.typingDirector}
            allDirectorsTyping={ws.allDirectorsTyping}
            sessionActive={ws.sessionActive}
          />
          <InputArea
            sessionActive={ws.sessionActive}
            onAskDirector={ws.askDirector}
            onAskAll={ws.askAll}
          />
        </main>

        {/* Right Panel - Dashboard Widgets */}
        <RightPanel financials={financials} proposals={proposals} />
      </div>
    </div>
  );
}
