---
name: session-save
description: Save current session state for later resumption
aliases: [save, checkpoint]
---

# Save Session State

Create a complete checkpoint of your current session for later resumption.

## Usage

```bash
# Save with auto-generated ID
/session-save

# Save with descriptive name
/session-save "feature-implementation"
```

## What Gets Saved

- ✅ Current task and goals
- ✅ Important decisions made
- ✅ Files being worked on
- ✅ Session metadata

## Saved Location

```
.claude/context/sessions/session-YYYYMMDD-HHMMSS-[name].json
```

## Resume With

```bash
/session-resume session-YYYYMMDD-HHMMSS
/session-resume latest
```

---

Save before breaks, major tasks, or context resets for easy resumption.
