---
name: Enforcement Manager
description: Ensure Claude Code foundation protocols are followed
context: fork
trigger: auto
priority: critical
alwaysActive: true
---

# Enforcement Manager Skill

**Type:** Always Active (Background)
**Priority:** Critical
**Purpose:** Ensure Claude Code foundation protocols are followed

---

## Overview

The Enforcement Manager is a background skill that ensures the Claude Code foundation (HETA, Cognitive DNA, State Persistence) cannot be ignored. It operates through hooks and provides commands for manual control.

## Enforcement Layers

### 1. Session Lifecycle (SessionStart/Stop Hooks)

**On Session Start:**
- Validate state files exist (progress.md, decisions.md, important-context.md)
- Block session if files missing (attempt recovery first)
- Initialize enforcement state tracking
- Display DNA and HETA reminders

**On Session Stop:**
- Check for pending modifications
- Remind to update progress.md if needed
- Archive session state

### 2. Tool Gate (PreToolUse Hook)

**Before Edit/Write/Bash:**
- Check modification count against threshold
- Block if 10+ modifications without progress update
- Scan for CUDA patterns (DNA enforcement)
- Block Apple Silicon incompatible code

### 3. Tool Auditor (PostToolUse Hook)

**After Edit/Write:**
- Log modification
- Check thresholds and show reminders
- Suggest HETA roll-up if needed

### 4. Prompt Validator (UserPromptSubmit Hook)

**On User Prompt:**
- Detect HETA routing triggers
- Suggest appropriate branch expert
- Check state freshness
- Identify gap patterns needing augmentation

## Enforcement Rules

### Hard Enforcement (exit 1 = BLOCK)

| Rule | Trigger | Action |
|------|---------|--------|
| State Missing | Session start without state files | BLOCK until recovered |
| Modification Threshold | 10+ file mods without progress update | BLOCK until synced |
| CUDA Patterns | torch.cuda, .cuda(), nvidia, etc. | BLOCK - use mps/Metal |

### Soft Enforcement (Warnings)

| Rule | Trigger | Action |
|------|---------|--------|
| HETA Triggers | "implement", "build", "create" | Routing suggestion |
| State Freshness | progress.md > 1 hour old | Update reminder |
| Gap Patterns | Security/performance/testing topics | Augmentation reminder |
| Roll-up Needed | 3+ file modifications | Roll-up suggestion |

## DNA Compliance

**Blocked Patterns:**
```
torch.cuda
.cuda()
cuda:0, cuda:1
torch.device('cuda')
CUDA
cudnn
nvidia
nccl
```

**Required Alternatives:**
- PyTorch: `torch.device('mps')`
- ML Training: MLX
- Inference: CoreML
- GPU Compute: Metal Performance Shaders

## Commands

| Command | Description |
|---------|-------------|
| `/enforcement status` | Current enforcement state |
| `/enforcement check` | Run all validators |
| `/enforcement sync` | Reset counters after progress update |
| `/enforcement bypass N` | Temporary N-minute bypass |
| `/recovery` | Recover missing state files |

## Bypass Mechanism

For emergencies only:

1. **Environment:** `ARTHUR_ENFORCEMENT_BYPASS=1`
2. **File:** Create `.claude/enforcement/.bypass`
3. **Command:** `/enforcement bypass 30`

Bypasses auto-expire (max 60 minutes).

## State Tracking

**Location:** `.claude/enforcement/state/`

| File | Purpose |
|------|---------|
| `enforcement-state.json` | Session tracking |
| `modification-log.json` | File modification history |
| `dispatch-tracker.json` | HETA dispatch tracking |
| `violation-log.json` | Enforcement violations |

## Integration Points

- **settings.json hooks:** All 5 hook types configured
- **Cognitive DNA:** Profile at `.claude/context/cognitive-dna/`
- **HETA:** Branch registry at `.claude/experts/`
- **State Files:** Context at `.claude/context/`

## Recovery Procedures

### Missing State Files
```
/recovery all
```

### DNA Violation
Replace CUDA patterns with Apple Silicon alternatives.

### Modification Threshold
```
# Update progress.md first, then:
/enforcement sync
```

### Enforcement Corrupted
```
/enforcement reset
```

---

**This skill ensures the Claude Code foundation cannot be ignored.**
