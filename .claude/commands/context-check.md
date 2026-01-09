---
name: context-check
description: Quick health check of context window and session state
aliases: [ctx, cc]
---

# Context Health Check

Quick diagnostic of your current context window usage and session health.

## What It Shows

### 1. Token Usage
- Current tokens used vs. total available
- Percentage utilization
- Visual progress bar

### 2. Context Efficiency
- Score from 0-100%
- Recommendations for optimization

### 3. Session Information
- Duration of current session
- Number of interactions
- Files currently in context

### 4. Filesystem State
- Last update to progress.md
- State file health

## Usage

```bash
/context-check
/ctx
/cc
```

## Score Interpretation

### Token Usage
- < 50%: Healthy - Plenty of headroom
- 50-70%: Moderate - Monitor occasionally
- 70-85%: High - Consider persisting state
- > 85%: Very High - Fresh context recommended

### Flow State Score
- 90-100: 🟢 Optimal - Perfect flow state
- 75-89: 🟡 Good - Minor optimization possible
- 60-74: 🟠 Moderate - Consider fresh context
- < 60: 🔴 Poor - Action needed

---

Use /context-check regularly to maintain optimal flow state.
