import { useState, useEffect, useCallback, useRef } from "react";
import type { WSMessage, Message, Session, Director } from "../types";

const WS_URL = import.meta.env.VITE_WS_URL ?? "ws://localhost:8000/ws";

export interface WebSocketState {
  connected: boolean;
  sessionActive: boolean;
  currentSession: Session | null;
  messages: Message[];
  typingDirector: Director | null;
  allDirectorsTyping: boolean;
}

export interface WebSocketActions {
  connect: () => void;
  disconnect: () => void;
  send: (message: object) => void;
  startSession: () => void;
  adjournSession: () => void;
  askDirector: (director: Director, message: string) => void;
  askAll: (message: string) => void;
  createProposal: (title: string, description: string) => void;
  voteProposal: (proposalId: string) => void;
  decideProposal: (
    proposalId: string,
    decision: "approved" | "rejected" | "tabled",
    rationale: string,
    reviewDate?: string
  ) => void;
}

export function useWebSocket(): WebSocketState & WebSocketActions {
  const [connected, setConnected] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingDirector, setTypingDirector] = useState<Director | null>(null);
  const [allDirectorsTyping, setAllDirectorsTyping] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      console.log("WebSocket connected");
      setConnected(true);
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
      setConnected(false);
      // Reconnect after 3 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 3000);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.onmessage = (event) => {
      try {
        const data: WSMessage = JSON.parse(event.data);
        handleMessage(data);
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    };

    wsRef.current = ws;
  }, []);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    wsRef.current?.close();
    wsRef.current = null;
    setConnected(false);
  }, []);

  const send = useCallback((message: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn("WebSocket not connected");
    }
  }, []);

  const handleMessage = useCallback((data: WSMessage) => {
    switch (data.type) {
      case "connected":
        setSessionActive(data.sessionActive as boolean);
        break;

      case "session_started":
        setSessionActive(true);
        setCurrentSession(data.session as Session);
        setMessages([]);
        break;

      case "session_adjourned":
        setSessionActive(false);
        setCurrentSession(null);
        break;

      case "user_message":
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            session_id: "",
            speaker: data.speaker as "chairman",
            content: data.content as string,
            timestamp: data.timestamp as string,
            message_type: "statement",
          },
        ]);
        break;

      case "director_typing":
        setTypingDirector(data.director as Director);
        setAllDirectorsTyping(false);
        break;

      case "all_directors_typing":
        setAllDirectorsTyping(true);
        setTypingDirector(null);
        break;

      case "director_response":
        setTypingDirector(null);
        setAllDirectorsTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            session_id: "",
            speaker: data.director as Director,
            content: data.content as string,
            timestamp: data.timestamp as string,
            message_type: "statement",
          },
        ]);
        break;

      case "proposal_created":
        // Could dispatch to a proposals state
        console.log("Proposal created:", data.proposal);
        break;

      case "voting_started":
        console.log("Voting started for proposal:", data.proposalId);
        break;

      case "director_vote":
        console.log("Director vote:", data.director, data.position);
        break;

      case "voting_complete":
        console.log("Voting complete for proposal:", data.proposalId);
        break;

      case "proposal_decided":
        console.log("Proposal decided:", data.proposal);
        break;

      case "error":
        console.error("Server error:", data.message);
        break;

      case "pong":
        // Heartbeat response
        break;

      default:
        console.log("Unknown message type:", data.type);
    }
  }, []);

  // Actions
  const startSession = useCallback(() => {
    send({ action: "start_session" });
  }, [send]);

  const adjournSession = useCallback(() => {
    send({ action: "adjourn_session" });
  }, [send]);

  const askDirector = useCallback(
    (director: Director, message: string) => {
      send({ action: "ask_director", director, message });
    },
    [send]
  );

  const askAll = useCallback(
    (message: string) => {
      send({ action: "ask_all", message });
    },
    [send]
  );

  const createProposal = useCallback(
    (title: string, description: string) => {
      send({ action: "create_proposal", title, description });
    },
    [send]
  );

  const voteProposal = useCallback(
    (proposalId: string) => {
      send({ action: "vote_proposal", proposalId });
    },
    [send]
  );

  const decideProposal = useCallback(
    (
      proposalId: string,
      decision: "approved" | "rejected" | "tabled",
      rationale: string,
      reviewDate?: string
    ) => {
      send({ action: "decide_proposal", proposalId, decision, rationale, reviewDate });
    },
    [send]
  );

  // Connect on mount
  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Heartbeat
  useEffect(() => {
    const interval = setInterval(() => {
      if (connected) {
        send({ action: "ping" });
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [connected, send]);

  return {
    // State
    connected,
    sessionActive,
    currentSession,
    messages,
    typingDirector,
    allDirectorsTyping,
    // Actions
    connect,
    disconnect,
    send,
    startSession,
    adjournSession,
    askDirector,
    askAll,
    createProposal,
    voteProposal,
    decideProposal,
  };
}
