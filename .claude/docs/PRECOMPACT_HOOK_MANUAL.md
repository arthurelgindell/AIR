# PreCompact State Capture - Implementation Manual

**Version:** 1.0.0
**Purpose:** Preserve critical state before Claude Code context compaction
**Philosophy:** Filesystem-first - trust disk over memory for recovery

---

## Overview

The PreCompact hook runs automatically before Claude Code compresses the conversation context. It captures all critical state to the filesystem, ensuring information survives compaction and can be recovered.

### What It Does

1. **Archives state files** to timestamped folder
2. **Marks compaction** in progress.md with session stats
3. **Logs event** to decisions.md
4. **Validates** state file health
5. **Outputs recovery instructions** visible after compaction

---

## Prerequisites

- bash 3.2+ (macOS default)
- jq (JSON processor)
- Claude Code with hooks support

```bash
# Install jq
brew install jq  # macOS
apt-get install jq  # Linux
```

---

## File Structure

```
{PROJECT_ROOT}/
├── .claude/
│   ├── settings.json          # Hook configuration
│   ├── context/
│   │   ├── progress.md        # Session progress (preserved)
│   │   ├── decisions.md       # Decision log (preserved)
│   │   ├── important-context.md  # Recovery info (preserved)
│   │   ├── session-state.json    # Session metadata (preserved)
│   │   ├── cognitive-dna/        # Learned patterns (preserved)
│   │   │   └── {user}-dna-profile.json
│   │   └── archive/              # Compaction archives
│   │       └── compact-{timestamp}/
│   ├── enforcement/
│   │   └── state/
│   │       └── enforcement-state.json  # Counters (preserved)
│   └── lib/
│       └── pre-compact-capture.sh  # THE HOOK SCRIPT
```

---

## Implementation

### Step 1: Create the Script

Create `.claude/lib/pre-compact-capture.sh`:

```bash
#!/bin/bash
# Pre-Compact State Capture
# Runs before context compaction to preserve critical state
# Node-agnostic - uses PROJECT_ROOT environment variable or auto-detects

set -e

# Auto-detect project root or use environment variable
PROJECT_ROOT="${PROJECT_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
CONTEXT_DIR="$PROJECT_ROOT/.claude/context"
ENFORCEMENT_DIR="$PROJECT_ROOT/.claude/enforcement"
ARCHIVE_BASE="$CONTEXT_DIR/archive"
DNA_DIR="$CONTEXT_DIR/cognitive-dna"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DATE_READABLE=$(date +"%Y-%m-%d %H:%M:%S")
ARCHIVE_DIR="$ARCHIVE_BASE/compact-$TIMESTAMP"

# Colors (optional - for terminal output)
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}PRE-COMPACT STATE CAPTURE${NC}"
echo -e "${BLUE}Timestamp: ${CYAN}$DATE_READABLE${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# ============================================================
# STEP 1: Create Archive Directory
# ============================================================
echo -e "\n${GREEN}[1/6] Creating archive snapshot...${NC}"
mkdir -p "$ARCHIVE_DIR"

# ============================================================
# STEP 2: Archive State Files
# ============================================================
echo -e "${GREEN}[2/6] Archiving state files...${NC}"

# Core state files
for file in progress.md decisions.md important-context.md session-state.json; do
    if [[ -f "$CONTEXT_DIR/$file" ]]; then
        cp "$CONTEXT_DIR/$file" "$ARCHIVE_DIR/"
        echo "  Archived: $file"
    fi
done

# Cognitive DNA (if exists)
if [[ -d "$DNA_DIR" ]]; then
    mkdir -p "$ARCHIVE_DIR/cognitive-dna"
    cp "$DNA_DIR"/*.json "$ARCHIVE_DIR/cognitive-dna/" 2>/dev/null || true
    echo "  Archived: cognitive-dna/"
fi

# Enforcement state (if exists)
if [[ -f "$ENFORCEMENT_DIR/state/enforcement-state.json" ]]; then
    cp "$ENFORCEMENT_DIR/state/enforcement-state.json" "$ARCHIVE_DIR/"
    echo "  Archived: enforcement-state.json"
fi

# ============================================================
# STEP 3: Collect Session Statistics
# ============================================================
echo -e "\n${GREEN}[3/6] Collecting session statistics...${NC}"
TOOL_CALLS=0
FILE_MODS=0
ACTIONS=0

if [[ -f "$ENFORCEMENT_DIR/state/enforcement-state.json" ]]; then
    TOOL_CALLS=$(jq -r '.toolCalls // 0' "$ENFORCEMENT_DIR/state/enforcement-state.json" 2>/dev/null || echo "0")
    FILE_MODS=$(jq -r '.fileModifications // 0' "$ENFORCEMENT_DIR/state/enforcement-state.json" 2>/dev/null || echo "0")
    ACTIONS=$(jq -r '.significantActions // 0' "$ENFORCEMENT_DIR/state/enforcement-state.json" 2>/dev/null || echo "0")
fi

echo "  Tool calls: $TOOL_CALLS"
echo "  File modifications: $FILE_MODS"
echo "  Significant actions: $ACTIONS"

# ============================================================
# STEP 4: Mark Compaction in progress.md
# ============================================================
echo -e "\n${GREEN}[4/6] Marking compaction in progress.md...${NC}"
if [[ -f "$CONTEXT_DIR/progress.md" ]]; then
    cat >> "$CONTEXT_DIR/progress.md" << EOF

---

## Compaction Event: $DATE_READABLE

**Session Statistics:**
- Tool calls: $TOOL_CALLS
- File modifications: $FILE_MODS
- Significant actions: $ACTIONS

**Archive Location:** \`$ARCHIVE_DIR\`

---
EOF
    echo "  Added compaction marker to progress.md"
fi

# ============================================================
# STEP 5: Log to decisions.md
# ============================================================
echo -e "\n${GREEN}[5/6] Logging to decisions.md...${NC}"
if [[ -f "$CONTEXT_DIR/decisions.md" ]]; then
    cat >> "$CONTEXT_DIR/decisions.md" << EOF

### Compaction: $DATE_READABLE

**Context compacted.** State preserved to archive.
- Tool calls: $TOOL_CALLS
- Modifications: $FILE_MODS
- Archive: compact-$TIMESTAMP

EOF
    echo "  Added compaction entry to decisions.md"
fi

# ============================================================
# STEP 6: Validate State Files (Optional)
# ============================================================
echo -e "\n${GREEN}[6/6] Validating state files...${NC}"
VALIDATOR="$ENFORCEMENT_DIR/scripts/validators/state-validator.sh"
if [[ -x "$VALIDATOR" ]]; then
    if "$VALIDATOR" validate 2>/dev/null; then
        echo -e "  ${GREEN}State files valid${NC}"
    else
        echo -e "  Warning: State validation returned non-zero"
    fi
else
    echo "  Validator not found, skipping"
fi

# ============================================================
# OUTPUT: Recovery Instructions (SURVIVES IN COMPACTED CONTEXT)
# ============================================================
echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}COMPACTION COMPLETE${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${CYAN}State preserved to:${NC}"
echo "  $ARCHIVE_DIR"
echo ""
echo -e "${CYAN}Recovery after compaction:${NC}"
echo "  1. Read .claude/context/progress.md"
echo "  2. Read .claude/context/decisions.md"
echo "  3. Check .claude/context/important-context.md"
echo ""
echo -e "${CYAN}Session stats:${NC}"
echo "  Tools: $TOOL_CALLS | Mods: $FILE_MODS | Actions: $ACTIONS"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
```

### Step 2: Make Executable

```bash
chmod +x .claude/lib/pre-compact-capture.sh
```

### Step 3: Configure Hook in settings.json

Add or update the `PreCompact` hook in `.claude/settings.json`:

```json
{
  "hooks": {
    "PreCompact": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "{PROJECT_ROOT}/.claude/lib/pre-compact-capture.sh"
          }
        ]
      }
    ]
  }
}
```

**Important:** Replace `{PROJECT_ROOT}` with the absolute path to your project.

### Step 4: Create Required Directories

```bash
mkdir -p .claude/context/archive
mkdir -p .claude/context/cognitive-dna
```

### Step 5: Test the Hook

```bash
# Run manually to test
.claude/lib/pre-compact-capture.sh

# Verify archive was created
ls -la .claude/context/archive/
```

---

## Configuration Options

### Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `PROJECT_ROOT` | Auto-detected | Override project root path |

### Customization Points

**Archive Location:**
```bash
# Change in script
ARCHIVE_BASE="$CONTEXT_DIR/archive"  # Default
ARCHIVE_BASE="/custom/archive/path"  # Custom
```

**State Files to Archive:**
```bash
# Add more files to the archive loop
for file in progress.md decisions.md important-context.md session-state.json custom-file.md; do
```

**Retention Policy:**
```bash
# Add cleanup of old archives (e.g., keep last 10)
ls -dt "$ARCHIVE_BASE"/compact-* | tail -n +11 | xargs rm -rf
```

---

## What Gets Preserved

### Critical Files (Always Archived)

| File | Contents | Priority |
|------|----------|----------|
| `progress.md` | Current tasks, next steps, blockers | Critical |
| `decisions.md` | Architectural decisions with rationale | Critical |
| `important-context.md` | Recovery instructions, project identity | Critical |

### Optional Files (If Present)

| File | Contents | Priority |
|------|----------|----------|
| `session-state.json` | Session metadata, timestamps | Medium |
| `cognitive-dna/*.json` | Learned patterns, preferences | High |
| `enforcement-state.json` | Tool call counters, modifications | Medium |

---

## Archive Structure

Each compaction creates a timestamped archive:

```
.claude/context/archive/
└── compact-20260107_080000/
    ├── progress.md
    ├── decisions.md
    ├── important-context.md
    ├── session-state.json
    ├── enforcement-state.json
    └── cognitive-dna/
        └── {user}-dna-profile.json
```

---

## Recovery After Compaction

When Claude Code compacts the context, the hook outputs recovery instructions that survive in the summary. After compaction:

### Automatic Recovery (Instructions in Context)

The hook outputs these instructions which appear in the compacted context:
```
Recovery after compaction:
  1. Read .claude/context/progress.md
  2. Read .claude/context/decisions.md
  3. Check .claude/context/important-context.md
```

### Manual Recovery

```bash
# Find latest archive
ls -lt .claude/context/archive/ | head -5

# Restore from archive if needed
LATEST=$(ls -dt .claude/context/archive/compact-* | head -1)
cp "$LATEST"/* .claude/context/
```

### Progress.md Markers

Compaction events are logged in progress.md:
```markdown
---

## Compaction Event: 2026-01-07 08:00:00

**Session Statistics:**
- Tool calls: 47
- File modifications: 12
- Significant actions: 5

**Archive Location:** `.claude/context/archive/compact-20260107_080000`

---
```

---

## Integration with Other Hooks

### Recommended Hook Chain

```json
{
  "hooks": {
    "SessionStart": [
      {"hooks": [{"type": "command", "command": "session-enforcer.sh start"}]}
    ],
    "PreToolUse": [
      {"matcher": "Edit", "hooks": [{"type": "command", "command": "pre-tool-gate.sh edit"}]},
      {"matcher": "Write", "hooks": [{"type": "command", "command": "pre-tool-gate.sh write"}]}
    ],
    "PostToolUse": [
      {"matcher": "Edit", "hooks": [{"type": "command", "command": "post-tool-auditor.sh edit"}]},
      {"matcher": "Write", "hooks": [{"type": "command", "command": "post-tool-auditor.sh write"}]}
    ],
    "PreCompact": [
      {"hooks": [{"type": "command", "command": "pre-compact-capture.sh"}]}
    ],
    "Stop": [
      {"hooks": [{"type": "command", "command": "session-enforcer.sh stop"}]}
    ]
  }
}
```

### Data Flow

```
SessionStart → PreToolUse → PostToolUse → ... → PreCompact → (compaction) → (new context)
     │              │             │                  │
     │              │             │                  ├── Archive state
     │              │             │                  ├── Mark progress.md
     │              │             └── Log modifications
     │              └── Validate before changes
     └── Initialize enforcement state
```

---

## Troubleshooting

### Hook Not Running

```bash
# Check file permissions
ls -la .claude/lib/pre-compact-capture.sh

# Should show: -rwxr-xr-x
# Fix with:
chmod +x .claude/lib/pre-compact-capture.sh
```

### Archive Not Created

```bash
# Check archive directory exists
mkdir -p .claude/context/archive

# Check disk space
df -h .

# Run script manually to see errors
.claude/lib/pre-compact-capture.sh
```

### State Files Missing

```bash
# Create minimal state files
touch .claude/context/progress.md
touch .claude/context/decisions.md
touch .claude/context/important-context.md
```

### jq Not Found

```bash
# Install jq
brew install jq      # macOS
apt install jq       # Debian/Ubuntu
yum install jq       # RHEL/CentOS
```

---

## Minimal Implementation

For a simpler setup without enforcement integration:

```bash
#!/bin/bash
# Minimal Pre-Compact Capture

PROJECT_ROOT="${PROJECT_ROOT:-$(pwd)}"
ARCHIVE_DIR="$PROJECT_ROOT/.claude/context/archive/compact-$(date +%Y%m%d_%H%M%S)"

mkdir -p "$ARCHIVE_DIR"
cp "$PROJECT_ROOT/.claude/context"/*.md "$ARCHIVE_DIR/" 2>/dev/null || true

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "State archived to: $ARCHIVE_DIR"
echo "Recovery: Read .claude/context/progress.md"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
```

---

## Best Practices

1. **Keep state files updated** - The hook preserves what exists; stale files = stale archives

2. **Review archives periodically** - Delete old archives to save space

3. **Test before relying** - Run the hook manually before trusting automatic execution

4. **Use absolute paths** - In settings.json, always use full paths for hook commands

5. **Check permissions** - Scripts must be executable (`chmod +x`)

6. **Monitor disk space** - Archives accumulate; implement retention policy if needed

---

## Quick Reference

### Install
```bash
# Create script
cat > .claude/lib/pre-compact-capture.sh << 'EOF'
# ... (script contents)
EOF

# Make executable
chmod +x .claude/lib/pre-compact-capture.sh

# Create directories
mkdir -p .claude/context/archive
```

### Configure
```json
// In .claude/settings.json
"PreCompact": [{"hooks": [{"type": "command", "command": "/path/to/pre-compact-capture.sh"}]}]
```

### Test
```bash
.claude/lib/pre-compact-capture.sh
```

### Verify
```bash
ls -la .claude/context/archive/
```

---

*PreCompact State Capture - Ensuring continuity across context compaction*
