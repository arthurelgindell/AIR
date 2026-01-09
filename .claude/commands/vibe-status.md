---
name: vibe-status
description: Comprehensive system health and agent status dashboard
aliases: [status, health]
---

# Vibe Coding Status Dashboard

Comprehensive overview of your entire Claude Code system health.

## What It Shows

### 1. Flow State Score
Overall system optimization for deep work (0-100 scale)

### 2. Context Health
Token usage, efficiency, and filesystem state status

### 3. Agent Activity
Which agents are active, their status, and recent actions

### 4. Permission Mode
Current permission level and friction points

### 5. Session Statistics
Duration, interactions, operations performed

### 6. System Recommendations
Proactive suggestions for optimization

## Usage

```bash
/vibe-status
/status
/health
```

## Flow State Score Breakdown

### Score Components:
- Context Efficiency (40 pts) - How well tokens are used
- Response Time (20 pts) - Agent and tool responsiveness
- Interruption Rate (20 pts) - Permission prompts frequency
- Token Headroom (20 pts) - Distance from limits

### Score Interpretation:
- 90-100: 🟢 Optimal - Perfect for deep work
- 75-89: 🟡 Good - Minor optimizations available
- 60-74: 🟠 Moderate - Consider adjustments
- < 60: 🔴 Poor - Immediate optimization needed

---

/vibe-status is your central dashboard for maintaining optimal flow state.
