# AI Board of Directors

A production-grade governance tool featuring three AI directors (Claude, Gemini, Grok) for strategic decision-making with voice I/O, proposal tracking, and accountability scoring.

## The Board

| Director | Role | Expertise |
|----------|------|-----------|
| **Claude** | Chief Strategy Officer | Strategy, business models, second-order consequences |
| **Gemini** | Chief Intelligence Officer | Market intelligence, competitive analysis, evidence |
| **Grok** | Chief Contrarian Officer | Risk assessment, failure modes, cognitive bias |

## Quick Start

### Prerequisites

- [Bun](https://bun.sh/) 1.3+
- API Keys: ANTHROPIC_API_KEY, GOOGLE_API_KEY, XAI_API_KEY

### Setup

```bash
# Backend
cd backend
cp .env.example .env
# Edit .env with your API keys
bun install
bun run dev

# Frontend (new terminal)
cd frontend
bun install
bun run dev
```

### Access

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000
- **WebSocket:** ws://localhost:8000/ws

## Project Structure

```
ai-board/
├── backend/
│   ├── src/
│   │   ├── index.ts           # Bun.serve entry point
│   │   ├── api/
│   │   │   ├── routes.ts      # Hono REST endpoints
│   │   │   └── websocket.ts   # WebSocket handlers
│   │   ├── lib/
│   │   │   ├── db.ts          # SQLite database
│   │   │   └── ai-clients.ts  # AI API wrappers (Phase 2)
│   │   └── personas/          # Director persona files
│   └── data/                  # SQLite database
│
├── frontend/
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── hooks/             # Custom hooks
│   │   └── types/             # TypeScript types
│   └── dist/                  # Production build
│
└── README.md
```

## API Endpoints

### REST

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Service health check |
| `/api/status` | GET | Current session and financial status |
| `/api/sessions` | GET | List past sessions |
| `/api/sessions/:id` | GET | Get session with transcript |
| `/api/proposals` | GET | List all proposals |
| `/api/proposals/:id` | GET | Get proposal with director positions |
| `/api/directors/stats` | GET | Director performance stats |
| `/api/financials` | GET | Current financial position |
| `/api/cash-balance` | POST | Update cash balance |
| `/api/transactions` | POST | Add transaction |

### WebSocket Messages

**Client → Server:**
```json
{"action": "start_session"}
{"action": "adjourn_session"}
{"action": "ask_director", "director": "claude", "message": "..."}
{"action": "ask_all", "message": "..."}
{"action": "create_proposal", "title": "...", "description": "..."}
{"action": "vote_proposal", "proposalId": "..."}
{"action": "decide_proposal", "proposalId": "...", "decision": "approved", "rationale": "..."}
```

**Server → Client:**
```json
{"type": "connected", "sessionActive": false}
{"type": "session_started", "session": {...}}
{"type": "director_typing", "director": "claude"}
{"type": "director_response", "director": "claude", "content": "..."}
{"type": "proposal_created", "proposal": {...}}
{"type": "voting_complete", "proposalId": "..."}
```

## Service Management

```bash
# Start backend as daemon
./backend/service.sh start

# Check status
./backend/service.sh status

# View logs
./backend/service.sh logs

# Stop
./backend/service.sh stop
```

## Implementation Status

### Phase 1: Core Infrastructure ✅
- [x] Backend with Bun/Hono + WebSocket
- [x] Frontend with React/Vite + Tailwind
- [x] SQLite database
- [x] 3-column boardroom layout
- [x] WebSocket connection

### Phase 2: Director Integration 🔄
- [ ] Anthropic API integration
- [ ] Google AI API integration
- [ ] xAI API integration
- [ ] Persona loading

### Phase 3: Voice System ⏳
- [ ] Speech recognition
- [ ] Speech synthesis with director voices

### Phase 4-8: Remaining Features ⏳
- Session management
- Financial tracking
- Proposal system
- Accountability scoring
- Polish & deployment

## Tech Stack

- **Backend:** Bun, Hono, SQLite
- **Frontend:** React 19, TypeScript, Tailwind CSS 4, Vite 7
- **Real-time:** Bun native WebSocket
- **AI APIs:** Anthropic, Google AI, xAI

## License

Private - ARTHUR Project
