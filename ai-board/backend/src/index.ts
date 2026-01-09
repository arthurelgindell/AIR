/**
 * AI Board of Directors - Backend Server
 * Bun + Hono + WebSocket
 */

import { app } from "./api/routes";
import { initDatabase } from "./lib/db";
import { handleOpen, handleClose, handleMessage } from "./api/websocket";

const PORT = parseInt(process.env.PORT ?? "8000");

// Initialize database
initDatabase();

// ASCII art banner
console.log(`
╔═══════════════════════════════════════════════════════════╗
║           AI BOARD OF DIRECTORS                           ║
╠═══════════════════════════════════════════════════════════╣
║  Runtime:     Bun ${Bun.version.padEnd(40)}║
║  Port:        ${String(PORT).padEnd(44)}║
║  API:         http://localhost:${PORT.toString().padEnd(27)}║
║  WebSocket:   ws://localhost:${PORT}/ws${" ".repeat(24)}║
╚═══════════════════════════════════════════════════════════╝
`);

// Bun.serve with HTTP and WebSocket support
export default {
  port: PORT,

  // HTTP request handler (Hono)
  fetch(req: Request, server: { upgrade: (req: Request) => boolean }) {
    const url = new URL(req.url);

    // Handle WebSocket upgrade
    if (url.pathname === "/ws") {
      const success = server.upgrade(req);
      if (success) {
        return undefined; // Upgrade handled
      }
      return new Response("WebSocket upgrade failed", { status: 500 });
    }

    // Handle HTTP requests with Hono
    return app.fetch(req);
  },

  // WebSocket handlers
  websocket: {
    open: handleOpen,
    close: handleClose,
    message: handleMessage,
  },
};
