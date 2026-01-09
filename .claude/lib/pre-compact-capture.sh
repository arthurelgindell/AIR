#!/bin/bash
# Pre-Compact State Capture
# Runs before context compaction to preserve critical state
# Compatible with bash 3.2 (macOS default)

set -e

PROJECT_ROOT="/Users/arthurdell/ARTHUR"
CONTEXT_DIR="$PROJECT_ROOT/.claude/context"
ENFORCEMENT_DIR="$PROJECT_ROOT/.claude/enforcement"
ARCHIVE_BASE="$CONTEXT_DIR/archive"
DNA_DIR="$CONTEXT_DIR/cognitive-dna"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DATE_READABLE=$(date +"%Y-%m-%d %H:%M:%S")
ARCHIVE_DIR="$ARCHIVE_BASE/compact-$TIMESTAMP"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}PRE-COMPACT STATE CAPTURE${NC}"
echo -e "${BLUE}Timestamp: ${CYAN}$DATE_READABLE${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# 1. Create archive directory
echo -e "\n${GREEN}[1/6] Creating archive snapshot...${NC}"
mkdir -p "$ARCHIVE_DIR"

# 2. Archive state files
echo -e "${GREEN}[2/6] Archiving state files...${NC}"

# Core state files
if [[ -f "$CONTEXT_DIR/progress.md" ]]; then
    cp "$CONTEXT_DIR/progress.md" "$ARCHIVE_DIR/"
    echo "  Archived: progress.md"
fi

if [[ -f "$CONTEXT_DIR/decisions.md" ]]; then
    cp "$CONTEXT_DIR/decisions.md" "$ARCHIVE_DIR/"
    echo "  Archived: decisions.md"
fi

if [[ -f "$CONTEXT_DIR/important-context.md" ]]; then
    cp "$CONTEXT_DIR/important-context.md" "$ARCHIVE_DIR/"
    echo "  Archived: important-context.md"
fi

if [[ -f "$CONTEXT_DIR/session-state.json" ]]; then
    cp "$CONTEXT_DIR/session-state.json" "$ARCHIVE_DIR/"
    echo "  Archived: session-state.json"
fi

# Cognitive DNA
if [[ -d "$DNA_DIR" ]]; then
    mkdir -p "$ARCHIVE_DIR/cognitive-dna"
    cp "$DNA_DIR"/*.json "$ARCHIVE_DIR/cognitive-dna/" 2>/dev/null || true
    echo "  Archived: cognitive-dna/"
fi

# Enforcement state
if [[ -f "$ENFORCEMENT_DIR/state/enforcement-state.json" ]]; then
    cp "$ENFORCEMENT_DIR/state/enforcement-state.json" "$ARCHIVE_DIR/"
    echo "  Archived: enforcement-state.json"
fi

# 3. Get session statistics from enforcement state
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

# 4. Append compaction marker to progress.md
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

# 5. Log compaction to decisions.md
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

# 6. Validate state files
echo -e "\n${GREEN}[6/6] Validating state files...${NC}"
VALIDATOR="$ENFORCEMENT_DIR/scripts/validators/state-validator.sh"
if [[ -x "$VALIDATOR" ]]; then
    if "$VALIDATOR" validate 2>/dev/null; then
        echo -e "  ${GREEN}State files valid${NC}"
    else
        echo -e "  ${YELLOW}Warning: State validation returned non-zero${NC}"
    fi
else
    echo "  Validator not found, skipping"
fi

# Output recovery instructions
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
