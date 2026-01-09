# /enforcement - Claude Code Foundation Enforcement Control

Manage the hard enforcement system that ensures Claude Code foundation protocols are followed.

## Usage

```
/enforcement [subcommand]
```

## Subcommands

| Command | Description |
|---------|-------------|
| `status` | Show current enforcement state (default) |
| `check` | Run all validators |
| `sync` | Force state update, reset counters |
| `bypass [minutes]` | Temporary bypass (max 60 min) |
| `on` | Enable enforcement |
| `off` | Disable enforcement |
| `reset` | Full enforcement state reset |

## What Gets Enforced

### Hard Enforcement (Blocks Operations)

1. **State Persistence**
   - Operations blocked after 10+ modifications without progress.md update
   - Session blocked if state files missing

2. **Cognitive DNA (Apple Silicon)**
   - CUDA patterns blocked: `torch.cuda`, `.cuda()`, `cuda:0`, `CUDA`, `nvidia`
   - Required alternatives: `mps`, `CoreML`, `MLX`, `Metal`

### Soft Enforcement (Warnings Only)

3. **HETA Routing**
   - Implementation task reminders
   - Branch suggestions
   - Roll-up recommendations

## Examples

### Check Current Status
```
/enforcement status
```

### Run All Validators
```
/enforcement check
```

### Sync After Manual Progress Update
```
/enforcement sync
```

### Temporary Bypass (30 minutes)
```
/enforcement bypass 30
```

---

When invoked, execute the appropriate enforcement script:

**status:** `$PROJECT/.claude/enforcement/scripts/recovery/force-state-update.sh status`

**check:** Run all validators:
```bash
$PROJECT/.claude/enforcement/scripts/validators/state-validator.sh
$PROJECT/.claude/enforcement/scripts/validators/dna-validator.sh scan $PROJECT
$PROJECT/.claude/enforcement/scripts/validators/heta-validator.sh status
```

**sync:** `$PROJECT/.claude/enforcement/scripts/recovery/force-state-update.sh sync`

**bypass [N]:** Create bypass file with expiration
```bash
echo $(($(date +%s) + ${N:-30} * 60)) > $PROJECT/.claude/enforcement/.bypass
```

**on:** Remove bypass file and set enabled=true in config

**off:** Set enabled=false in enforcement.json

**reset:** `$PROJECT/.claude/enforcement/scripts/recovery/reset-enforcement.sh --force`

---

The enforcement system ensures the Claude Code foundation (HETA, Cognitive DNA, State Persistence) cannot be ignored.
