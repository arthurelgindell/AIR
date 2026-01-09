#!/bin/bash
# State Recovery - Recover missing state files
# Sources: git history, archive, templates

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENFORCEMENT_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"
PROJECT_ROOT="/Users/arthurdell/ARTHUR"
CONTEXT_DIR="$PROJECT_ROOT/.claude/context"
ARCHIVE_DIR="$PROJECT_ROOT/.claude/context/archive"
CONFIG_FILE="$ENFORCEMENT_DIR/config/enforcement.json"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# State files and their templates
declare -A STATE_FILES
STATE_FILES["progress.md"]="$CONTEXT_DIR/progress.md"
STATE_FILES["decisions.md"]="$CONTEXT_DIR/decisions.md"
STATE_FILES["important-context.md"]="$CONTEXT_DIR/important-context.md"

# Recover from git
recover_from_git() {
    local filename="$1"
    local filepath="${STATE_FILES[$filename]}"

    if [[ ! -d "$PROJECT_ROOT/.git" ]]; then
        return 1
    fi

    # Try to restore from git
    cd "$PROJECT_ROOT"
    if git show "HEAD:.claude/context/$filename" > /dev/null 2>&1; then
        git show "HEAD:.claude/context/$filename" > "$filepath"
        echo -e "${GREEN}✅ Recovered $filename from git${NC}"
        return 0
    fi

    # Try from previous commits
    local commit=$(git log --oneline -1 --all -- ".claude/context/$filename" 2>/dev/null | cut -d' ' -f1)
    if [[ -n "$commit" ]]; then
        git show "$commit:.claude/context/$filename" > "$filepath"
        echo -e "${GREEN}✅ Recovered $filename from git commit $commit${NC}"
        return 0
    fi

    return 1
}

# Recover from archive
recover_from_archive() {
    local filename="$1"
    local filepath="${STATE_FILES[$filename]}"

    if [[ ! -d "$ARCHIVE_DIR" ]]; then
        return 1
    fi

    # Find most recent archive
    local archived=$(ls -t "$ARCHIVE_DIR/$filename"* 2>/dev/null | head -1)
    if [[ -n "$archived" && -f "$archived" ]]; then
        cp "$archived" "$filepath"
        echo -e "${GREEN}✅ Recovered $filename from archive${NC}"
        return 0
    fi

    return 1
}

# Create from template
create_from_template() {
    local filename="$1"
    local filepath="${STATE_FILES[$filename]}"

    case "$filename" in
        "progress.md")
            cat > "$filepath" << 'EOF'
# Progress Tracker

**Last Updated:** $(date '+%Y-%m-%d %H:%M')
**Session:** Recovery Session

## Current Status

State recovered - please update with actual status.

## Completed

- [x] State recovery performed

## In Progress

- [ ] Update this file with current work status

## Next Steps

- Review and update progress
- Continue with planned work

## Blockers

None currently.

---

*Update this file after each significant action to maintain session continuity.*
EOF
            ;;

        "decisions.md")
            cat > "$filepath" << 'EOF'
# Decision Log

**Purpose:** Record architectural, configuration, and significant technical decisions with rationale.

## Format

Each decision entry should include:
- **Date:** When the decision was made
- **Context:** Why a decision was needed
- **Decision:** What was decided
- **Rationale:** Why this option was chosen
- **Alternatives Considered:** Other options evaluated

---

## Decisions

### [RECOVERY] State Files Recreated

**Date:** $(date '+%Y-%m-%d')
**Context:** State files were missing and needed recovery
**Decision:** Created from template
**Rationale:** No git history or archives available
**Action:** Update with actual decisions from memory/context

---

*Add new decisions at the top of this log.*
EOF
            ;;

        "important-context.md")
            cat > "$filepath" << 'EOF'
# Important Context

**Purpose:** Critical information that must survive context resets and compaction.

---

## Project Identity

- **Project:** ARTHUR
- **Location:** /Users/arthurdell/ARTHUR
- **Type:** Reference-Grade Claude Code Deployment

## Key Configurations

- **Claude Config:** .claude/settings.json
- **Cognitive DNA:** .claude/context/cognitive-dna/arthur-dna-profile.json
- **Expert Tree:** .claude/experts/branch-registry.json

## Active Capabilities

### Cognitive DNA (94.18% Success Rate)
- Apple Silicon Native (95% confidence)
- DevOps/Technical (73.7% confidence)
- Communication (72.7% confidence)

### Gap Augmentation
- Security: 50% → Extra validation
- Performance: 50% → Profiling reminders
- Testing: 50% → Coverage prompts

### HETA Expert Tree
- Master Architect: Routes implementation tasks
- Backend Expert: API, database, services
- Frontend Expert: UI, components, React
- Infrastructure Expert: Deploy, CI/CD, config

## Recovery Information

This file was recovered from template. Update with actual context.

---

*Keep this file updated with critical information.*
EOF
            ;;
    esac

    # Replace date placeholders
    sed -i '' "s/\$(date '+%Y-%m-%d %H:%M')/$(date '+%Y-%m-%d %H:%M')/g" "$filepath" 2>/dev/null || true
    sed -i '' "s/\$(date '+%Y-%m-%d')/$(date '+%Y-%m-%d')/g" "$filepath" 2>/dev/null || true

    echo -e "${YELLOW}📝 Created $filename from template${NC}"
    return 0
}

# Recover single file
recover_file() {
    local filename="$1"
    local filepath="${STATE_FILES[$filename]}"

    echo -e "\n${BLUE}Recovering: $filename${NC}"

    # Check if file already exists
    if [[ -f "$filepath" ]]; then
        echo -e "${GREEN}✅ $filename already exists${NC}"
        return 0
    fi

    # Ensure directory exists
    mkdir -p "$(dirname "$filepath")"

    # Try recovery sources in order
    if recover_from_git "$filename"; then
        return 0
    fi

    if recover_from_archive "$filename"; then
        return 0
    fi

    # Fall back to template
    create_from_template "$filename"
    return 0
}

# Recover all state files
recover_all() {
    echo -e "\n${GREEN}STATE RECOVERY${NC}"
    echo "═══════════════════════════════════════════════════════════"

    local recovered=0
    local failed=0

    for filename in "${!STATE_FILES[@]}"; do
        if recover_file "$filename"; then
            ((recovered++))
        else
            ((failed++))
        fi
    done

    echo -e "\n═══════════════════════════════════════════════════════════"
    if [[ $failed -eq 0 ]]; then
        echo -e "${GREEN}RECOVERY COMPLETE: $recovered files recovered${NC}"
        return 0
    else
        echo -e "${RED}RECOVERY INCOMPLETE: $failed files failed${NC}"
        return 1
    fi
}

# Archive current state
archive_state() {
    echo -e "\n${BLUE}Archiving current state...${NC}"

    mkdir -p "$ARCHIVE_DIR"
    local timestamp=$(date +%Y%m%d_%H%M%S)

    for filename in "${!STATE_FILES[@]}"; do
        local filepath="${STATE_FILES[$filename]}"
        if [[ -f "$filepath" ]]; then
            cp "$filepath" "$ARCHIVE_DIR/${filename%.md}_${timestamp}.md"
            echo -e "${GREEN}✅ Archived $filename${NC}"
        fi
    done
}

# Main
main() {
    local mode="${1:-all}"
    local target="$2"

    case "$mode" in
        all)
            recover_all
            ;;
        progress|decisions|important-context)
            recover_file "${mode}.md"
            ;;
        archive)
            archive_state
            ;;
        *)
            echo "Usage: $0 {all|progress|decisions|important-context|archive}"
            exit 1
            ;;
    esac
}

main "$@"
