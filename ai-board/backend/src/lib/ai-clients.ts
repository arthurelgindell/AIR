/**
 * AI Director Clients
 * Integrations with Anthropic (Claude), Google AI (Gemini), and xAI (Grok)
 */

import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { readFileSync } from "fs";
import { join } from "path";

// Types
export type Director = "claude" | "gemini" | "grok";

export interface DirectorResponse {
  director: Director;
  content: string;
  timestamp: string;
  tokensUsed?: number;
  error?: string;
}

// Load personas
const personasDir = join(import.meta.dir, "..", "personas");

function loadPersona(director: Director): string {
  try {
    const filePath = join(personasDir, `${director === "claude" ? "claude_cso" : director === "gemini" ? "gemini_cio" : "grok_cro"}.md`);
    return readFileSync(filePath, "utf-8");
  } catch (error) {
    console.error(`Failed to load persona for ${director}:`, error);
    return `You are ${director}, a board director.`;
  }
}

// Cached personas
const personas: Record<Director, string> = {
  claude: loadPersona("claude"),
  gemini: loadPersona("gemini"),
  grok: loadPersona("grok"),
};

// Initialize API clients
const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

const googleAI = process.env.GOOGLE_API_KEY
  ? new GoogleGenerativeAI(process.env.GOOGLE_API_KEY)
  : null;

/**
 * Call Claude (Anthropic API)
 */
export async function callClaude(
  userMessage: string,
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }> = []
): Promise<DirectorResponse> {
  if (!anthropic) {
    return {
      director: "claude",
      content: "[Claude unavailable - ANTHROPIC_API_KEY not configured]",
      timestamp: new Date().toISOString(),
      error: "API key not configured",
    };
  }

  try {
    const messages = [
      ...conversationHistory.map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
      { role: "user" as const, content: userMessage },
    ];

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: personas.claude,
      messages,
    });

    const content = response.content[0]?.type === "text"
      ? response.content[0].text
      : "[No response]";

    return {
      director: "claude",
      content,
      timestamp: new Date().toISOString(),
      tokensUsed: response.usage?.output_tokens,
    };
  } catch (error) {
    console.error("Claude API error:", error);
    return {
      director: "claude",
      content: `[Claude error: ${error instanceof Error ? error.message : "Unknown error"}]`,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Call Gemini (Google AI API)
 */
export async function callGemini(
  userMessage: string,
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }> = []
): Promise<DirectorResponse> {
  if (!googleAI) {
    return {
      director: "gemini",
      content: "[Gemini unavailable - GOOGLE_API_KEY not configured]",
      timestamp: new Date().toISOString(),
      error: "API key not configured",
    };
  }

  try {
    const model = googleAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      systemInstruction: personas.gemini,
    });

    // Build conversation history for Gemini
    // Gemini requires history to start with 'user' role and alternate
    let history = conversationHistory.map((msg) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

    // Ensure history starts with user message (Gemini requirement)
    // Skip any leading model messages
    while (history.length > 0 && history[0].role === "model") {
      history = history.slice(1);
    }

    const chat = model.startChat({ history });
    const result = await chat.sendMessage(userMessage);
    const response = result.response;
    const content = response.text();

    return {
      director: "gemini",
      content,
      timestamp: new Date().toISOString(),
      tokensUsed: response.usageMetadata?.candidatesTokenCount,
    };
  } catch (error) {
    console.error("Gemini API error:", error);
    return {
      director: "gemini",
      content: `[Gemini error: ${error instanceof Error ? error.message : "Unknown error"}]`,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Call Grok (xAI API)
 * Uses OpenAI-compatible endpoint
 */
export async function callGrok(
  userMessage: string,
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }> = []
): Promise<DirectorResponse> {
  const apiKey = process.env.XAI_API_KEY;

  if (!apiKey) {
    return {
      director: "grok",
      content: "[Grok unavailable - XAI_API_KEY not configured. Provide your xAI API key to enable the Chief Contrarian Officer.]",
      timestamp: new Date().toISOString(),
      error: "API key not configured",
    };
  }

  try {
    const messages = [
      { role: "system", content: personas.grok },
      ...conversationHistory.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      { role: "user", content: userMessage },
    ];

    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4-latest",
        messages,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      throw new Error(`xAI API returned ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? "[No response]";

    return {
      director: "grok",
      content,
      timestamp: new Date().toISOString(),
      tokensUsed: data.usage?.completion_tokens,
    };
  } catch (error) {
    console.error("Grok API error:", error);
    return {
      director: "grok",
      content: `[Grok error: ${error instanceof Error ? error.message : "Unknown error"}]`,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Call a specific director
 */
export async function callDirector(
  director: Director,
  message: string,
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }> = []
): Promise<DirectorResponse> {
  switch (director) {
    case "claude":
      return callClaude(message, conversationHistory);
    case "gemini":
      return callGemini(message, conversationHistory);
    case "grok":
      return callGrok(message, conversationHistory);
    default:
      return {
        director,
        content: `[Unknown director: ${director}]`,
        timestamp: new Date().toISOString(),
        error: "Unknown director",
      };
  }
}

/**
 * Call all directors in parallel
 */
export async function callAllDirectors(
  message: string,
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }> = []
): Promise<DirectorResponse[]> {
  const directors: Director[] = ["claude", "gemini", "grok"];

  const responses = await Promise.all(
    directors.map((director) => callDirector(director, message, conversationHistory))
  );

  return responses;
}

/**
 * Check which directors are available
 */
export function getAvailableDirectors(): { director: Director; available: boolean }[] {
  return [
    { director: "claude", available: !!process.env.ANTHROPIC_API_KEY },
    { director: "gemini", available: !!process.env.GOOGLE_API_KEY },
    { director: "grok", available: !!process.env.XAI_API_KEY },
  ];
}
