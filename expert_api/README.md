# ARTHUR Expert Channel API

HTTP API for triggering Claude Code expert channels via Tailscale.

## Overview

This API exposes three expert channels as HTTP endpoints:
- **claude-code** - Claude API, prompt engineering, tool design
- **lm-studio** - Local LLM inference, model management
- **tailscale** - Network configuration, ACLs, serve management

## Architecture

```
External Request
       ↓
Tailscale HTTPS (air.tail5f2bae.ts.net)
       ↓
FastAPI Server (port 8080)
       ↓
Claude Code Headless (`claude -p`)
       ↓
Expert Channel Routing
       ↓
JSON Response
```

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Start the service
./service.sh start

# Check status
./service.sh status

# View logs
./service.sh logs
```

## API Endpoints

### Submit Task (Async)

```bash
POST /{channel}/task
Content-Type: application/json

{
  "task": "Your task description",
  "context": {},
  "timeout": 300
}
```

**Response:**
```json
{
  "task_id": "a1b2c3d4",
  "channel": "claude-code",
  "status": "pending",
  "poll_url": "/status/a1b2c3d4"
}
```

### Poll for Results

```bash
GET /status/{task_id}
```

**Response (when complete):**
```json
{
  "task_id": "a1b2c3d4",
  "channel": "claude-code",
  "status": "completed",
  "result": "...",
  "duration": 12.5,
  "submitted_by": "arthur@example.com"
}
```

### Other Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/channels` | GET | List available channels |
| `/{channel}/recent` | GET | Recent tasks for channel |
| `/docs` | GET | Interactive API docs (Swagger) |

## Usage Examples

### Claude Code Expert

```bash
# Review a prompt
curl -X POST https://air.tail5f2bae.ts.net/claude-code/task \
  -H "Content-Type: application/json" \
  -d '{"task": "Review this prompt for best practices: Write a poem about coding"}'

# Design a tool schema
curl -X POST https://air.tail5f2bae.ts.net/claude-code/task \
  -H "Content-Type: application/json" \
  -d '{"task": "Design a Claude tool schema for a weather API"}'
```

### LM Studio Expert

```bash
# List available models
curl -X POST https://air.tail5f2bae.ts.net/lm-studio/task \
  -H "Content-Type: application/json" \
  -d '{"task": "List available models on ALPHA and BETA nodes"}'

# Check model status
curl -X POST https://air.tail5f2bae.ts.net/lm-studio/task \
  -H "Content-Type: application/json" \
  -d '{"task": "What models are currently loaded?"}'
```

### Tailscale Expert

```bash
# Check serve status
curl -X POST https://air.tail5f2bae.ts.net/tailscale/task \
  -H "Content-Type: application/json" \
  -d '{"task": "Show current tailscale serve status on all nodes"}'

# List nodes
curl -X POST https://air.tail5f2bae.ts.net/tailscale/task \
  -H "Content-Type: application/json" \
  -d '{"task": "List all nodes in the tailnet with their IPs"}'
```

## Service Management

```bash
# Start service (FastAPI + Tailscale serve)
./service.sh start

# Stop service
./service.sh stop

# Restart
./service.sh restart

# View status
./service.sh status

# Tail logs
./service.sh logs
```

## Security

- **Tailscale Identity**: All requests include `Tailscale-User-Login` header
- **Internal Only**: Accessible only within the tailnet (no public exposure)
- **Sandboxed**: Claude Code runs with existing ARTHUR permission policies
- **Timeouts**: 5-minute default prevents runaway tasks

## Files

| File | Purpose |
|------|---------|
| `server.py` | FastAPI application |
| `service.sh` | Service management script |
| `requirements.txt` | Python dependencies |
| `api.log` | Runtime logs |
| `api.pid` | Process ID file |

## Troubleshooting

### API not responding
```bash
# Check if running
./service.sh status

# Check logs
./service.sh logs

# Restart
./service.sh restart
```

### Tailscale serve not working
```bash
# Check Tailscale status
tailscale status

# Check serve configuration
tailscale serve status

# Reconfigure
tailscale serve --bg 8080
```

### Tasks timing out
- Increase timeout in request: `{"task": "...", "timeout": 600}`
- Check Claude Code is installed and accessible
- Verify PROJECT_ROOT in server.py
