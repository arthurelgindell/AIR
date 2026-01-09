# Claude Code Foundation Enforcement System

Hard enforcement that makes the Claude Code foundation impossible to ignore.

## Directory Structure

```
enforcement/
├── config/
│   └── enforcement.json      # Master configuration
├── scripts/
│   ├── session-enforcer.sh   # SessionStart/Stop hooks
│   ├── pre-tool-gate.sh      # PreToolUse hook
│   ├── post-tool-auditor.sh  # PostToolUse hook
│   ├── pre-prompt-validator.sh # UserPromptSubmit hook
│   ├── validators/
│   │   ├── state-validator.sh  # State file checks
│   │   ├── dna-validator.sh    # DNA compliance
│   │   └── heta-validator.sh   # HETA routing
│   └── recovery/
│       ├── state-recovery.sh   # Recover state files
│       ├── force-state-update.sh # Reset counters
│       └── reset-enforcement.sh  # Full reset
├── state/
│   ├── enforcement-state.json  # Current session
│   ├── modification-log.json   # File changes
│   ├── dispatch-tracker.json   # HETA tracking
│   └── violation-log.json      # Violations
└── README.md
```

## What Gets Enforced

### Hard Enforcement (Operations BLOCKED)

1. **State Persistence**
   - Session blocked if `progress.md`, `decisions.md`, `important-context.md` missing
   - Operations blocked after 10 file modifications without progress update

2. **Cognitive DNA (Apple Silicon)**
   - CUDA patterns blocked: `torch.cuda`, `.cuda()`, `CUDA`, `nvidia`
   - Must use: `mps`, `CoreML`, `MLX`, `Metal`

### Soft Enforcement (Warnings Only)

3. **HETA Routing**
   - Implementation task reminders
   - Branch expert suggestions
   - Roll-up recommendations after 3+ modifications

## Commands

```
/enforcement status   # Show state
/enforcement check    # Run validators
/enforcement sync     # Reset counters
/enforcement bypass N # N-minute bypass
/recovery             # Recover state files
```

## Bypass

For emergencies:
- Environment: `ARTHUR_ENFORCEMENT_BYPASS=1`
- File: Create `.bypass` in this directory
- Command: `/enforcement bypass 30`

Bypasses auto-expire (max 60 minutes).

## Hook Configuration

Hooks configured in `.claude/settings.json`:
- `SessionStart` → session-enforcer.sh start
- `PreToolUse` → pre-tool-gate.sh (Edit, Write, Bash)
- `PostToolUse` → post-tool-auditor.sh (Edit, Write)
- `UserPromptSubmit` → pre-prompt-validator.sh
- `Stop` → session-enforcer.sh stop

## Testing

```bash
# Test session enforcement
./scripts/session-enforcer.sh start

# Test DNA compliance
./scripts/validators/dna-validator.sh scan /path/to/code

# Test state validation
./scripts/validators/state-validator.sh

# Test HETA routing
./scripts/validators/heta-validator.sh status
```

---

**This system ensures the Claude Code foundation cannot be ignored.**
