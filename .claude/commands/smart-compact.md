---
name: smart-compact
description: Intelligent context management with filesystem persistence
aliases: [compact, compress]
---

# Smart Context Management

Intelligently manages context while preserving all important information via filesystem.

## What It Does

### Preserves (Never Lost)
- ✅ Current task context and goals
- ✅ Recent file edits (last 10 interactions)
- ✅ Error states and debugging info
- ✅ Content in `.claude/context/important-context.md`
- ✅ Important decisions made this session

### Archives to Filesystem
- 📁 Complete session transcript
- 📁 All conversation history
- 📁 Full file contents read
- 📁 Timestamped for recovery

## Usage

```bash
# Standard management (recommended)
/smart-compact

# Persist state and suggest fresh context
/smart-compact --persist
```

## When to Use

### Manual Triggers
- Before starting complex task
- After completing major milestone
- When context feels "heavy"
- Before taking a break
- Periodic maintenance (every 30-40 interactions)

## Recovery Options

### Full Recovery
```bash
/session-resume session-YYYYMMDD-HHMMSS
```

Restores:
- Complete session state
- All decisions and context
- File references

---

Smart context management keeps you in flow state by persisting state to filesystem for easy recovery.
