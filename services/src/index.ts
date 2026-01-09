/**
 * ARTHUR Services - Main Entry Point
 *
 * TypeScript/Bun runtime for all ARTHUR services:
 * - Expert Channel API (Hono)
 * - Tailscale Automation
 * - Midjourney Automation
 */

import { app as expertApi } from "./api/expert-api";

const PORT = parseInt(process.env.PORT ?? "8080");

console.log(`
╔═══════════════════════════════════════════════════════╗
║           ARTHUR Services - Bun Runtime               ║
╠═══════════════════════════════════════════════════════╣
║  Runtime:  Bun ${Bun.version.padEnd(42)}║
║  Port:     ${String(PORT).padEnd(45)}║
║  API:      http://localhost:${PORT.toString().padEnd(26)}║
║  Docs:     http://localhost:${PORT}/docs${"".padEnd(21)}║
╚═══════════════════════════════════════════════════════╝
`);

export default {
  port: PORT,
  fetch: expertApi.fetch,
};
