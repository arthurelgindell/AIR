---
name: flow
description: Enter maximum autonomy flow state - minimal interruptions
aliases: [vibe, zone, yolo]
---

# Flow State Mode

Activates **maximum autonomy configuration** for uninterrupted "vibe coding":

## What Flow Mode Does

### 1. Permission System
- ✅ **Enable auto-accept** for all edits and safe commands
- ✅ **Suppress permission prompts** except for dangerous operations
- ✅ **Streamline workflow** - only block truly dangerous ops

### 2. Agent Configuration
- ✅ **Activate all autonomous agents**
- ✅ **Code reviewer → silent mode** (critical issues only)
- ✅ **All agents → maximum autonomy**

### 3. Context Management
- ✅ **Enable monitoring** at thresholds
- ✅ **Preserve flow state** through filesystem persistence
- ✅ **Session auto-save** every 10 interactions

### 4. Notification Filtering
- ✅ **Suppress non-critical notifications**
- ✅ **Show only errors and critical warnings**

## Usage

```bash
# Standard flow mode (recommended)
/flow

# Strict mode (slightly safer)
/flow strict

# YOLO mode (maximum autonomy - use carefully!)
/flow yolo

# Exit flow mode
/flow off
```

## Modes Explained

### Standard Mode (/flow)
- Auto-accept: Read, Edit, Write, Glob, Grep
- Require confirmation: rm -rf, sudo, force push
- Block: Truly dangerous operations
- Code review: Silent (critical only)

### Strict Mode (/flow strict)
- Auto-accept: Read, Glob, Grep
- Require confirmation: Edit, Write, important files
- Code review: Standard (all issues)

### YOLO Mode (/flow yolo)
- Auto-accept: Almost everything
- Require confirmation: Only destructive operations
- ⚠️  Use only when confident

## Safety Guardrails

Even in YOLO mode, these are ALWAYS blocked:
- `rm -rf /` (root deletion)
- `sudo rm -rf /` (root deletion with sudo)
- `dd if=/dev/zero` (disk wiping)
- `mkfs` (filesystem formatting)
- `:(){ :|:& };:` (fork bomb)
- Force push to main/master branch

## Exit Flow Mode

```bash
/flow off
```

---

Flow mode is your key to uninterrupted, high-productivity coding sessions.
