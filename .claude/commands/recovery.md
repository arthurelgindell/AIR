# /recovery - State File Recovery

Recover missing or corrupted state files from git history, archives, or templates.

## Usage

```
/recovery [target]
```

## Targets

| Target | Description |
|--------|-------------|
| `all` | Recover all state files (default) |
| `progress` | Recover progress.md only |
| `decisions` | Recover decisions.md only |
| `important-context` | Recover important-context.md only |
| `archive` | Archive current state before changes |

## Recovery Sources (Priority Order)

1. **Git History** - Most recent committed version
2. **Archive** - From `.claude/context/archive/`
3. **Template** - Fresh file with standard structure

## State Files

| File | Purpose |
|------|---------|
| `progress.md` | Current status, completed items, next steps |
| `decisions.md` | Architectural and configuration decisions |
| `important-context.md` | Critical info that must survive resets |

## Examples

### Recover All State Files
```
/recovery
```
or
```
/recovery all
```

### Recover Progress Only
```
/recovery progress
```

### Archive Current State
```
/recovery archive
```

---

When invoked, execute the recovery script:

**all:** `$PROJECT/.claude/enforcement/scripts/recovery/state-recovery.sh all`

**progress:** `$PROJECT/.claude/enforcement/scripts/recovery/state-recovery.sh progress`

**decisions:** `$PROJECT/.claude/enforcement/scripts/recovery/state-recovery.sh decisions`

**important-context:** `$PROJECT/.claude/enforcement/scripts/recovery/state-recovery.sh important-context`

**archive:** `$PROJECT/.claude/enforcement/scripts/recovery/state-recovery.sh archive`

---

Recovery ensures sessions can always continue even if state files are lost.
