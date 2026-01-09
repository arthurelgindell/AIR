#!/bin/bash
# Session Enforcer - Hard enforcement for Claude Code sessions
# Validates state on start, persists on stop

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENFORCEMENT_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="/Users/arthurdell/ARTHUR"
CONTEXT_DIR="$PROJECT_ROOT/.claude/context"
STATE_FILE="$ENFORCEMENT_DIR/state/enforcement-state.json"
CONFIG_FILE="$ENFORCEMENT_DIR/config/enforcement.json"
LIFECYCLE_SCRIPT="$PROJECT_ROOT/.claude/lib/channel-lifecycle.sh"
ACTIVITY_TRACKER="$PROJECT_ROOT/.claude/lib/activity-tracker.sh"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Required state files
REQUIRED_FILES=(
    "$CONTEXT_DIR/progress.md"
    "$CONTEXT_DIR/decisions.md"
    "$CONTEXT_DIR/important-context.md"
)

# Load config
load_config() {
    if [[ -f "$CONFIG_FILE" ]]; then
        ENFORCEMENT_ENABLED=$(jq -r '.enabled // true' "$CONFIG_FILE")
        STATE_PERSISTENCE_LEVEL=$(jq -r '.enforcement.statePersistence.level // "hard"' "$CONFIG_FILE")
        BLOCK_ON_STALE=$(jq -r '.enforcement.statePersistence.blockOnStale // true' "$CONFIG_FILE")
    else
        ENFORCEMENT_ENABLED=true
        STATE_PERSISTENCE_LEVEL="hard"
        BLOCK_ON_STALE=true
    fi
}

# Check for bypass
check_bypass() {
    # Environment variable bypass
    if [[ -n "$ARTHUR_ENFORCEMENT_BYPASS" ]]; then
        echo -e "${YELLOW}⚠️  Enforcement bypassed via environment variable${NC}"
        return 0
    fi

    # Bypass file check
    BYPASS_FILE="$ENFORCEMENT_DIR/.bypass"
    if [[ -f "$BYPASS_FILE" ]]; then
        BYPASS_EXPIRES=$(cat "$BYPASS_FILE" 2>/dev/null || echo "0")
        CURRENT_TIME=$(date +%s)
        if [[ "$CURRENT_TIME" -lt "$BYPASS_EXPIRES" ]]; then
            REMAINING=$((BYPASS_EXPIRES - CURRENT_TIME))
            echo -e "${YELLOW}⚠️  Enforcement bypassed (${REMAINING}s remaining)${NC}"
            return 0
        else
            rm -f "$BYPASS_FILE"
        fi
    fi

    return 1
}

# Validate state files exist
validate_state_files() {
    local missing=()

    for file in "${REQUIRED_FILES[@]}"; do
        if [[ ! -f "$file" ]]; then
            missing+=("$file")
        fi
    done

    if [[ ${#missing[@]} -gt 0 ]]; then
        echo -e "${RED}❌ ENFORCEMENT BLOCK: Missing required state files${NC}"
        for file in "${missing[@]}"; do
            echo -e "   ${RED}• $file${NC}"
        done

        # Attempt recovery
        echo -e "\n${YELLOW}Attempting recovery...${NC}"
        if "$SCRIPT_DIR/recovery/state-recovery.sh" 2>/dev/null; then
            echo -e "${GREEN}✅ Recovery successful${NC}"
            return 0
        fi

        if [[ "$STATE_PERSISTENCE_LEVEL" == "hard" ]]; then
            echo -e "\n${RED}BLOCKED: Run /recovery to restore state files${NC}"
            return 1
        else
            echo -e "\n${YELLOW}WARNING: State files missing (soft enforcement)${NC}"
            return 0
        fi
    fi

    return 0
}

# Initialize enforcement state for session
initialize_session() {
    local session_id="session_$(date +%Y%m%d_%H%M%S)"
    local start_time=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

    cat > "$STATE_FILE" << EOF
{
  "sessionId": "$session_id",
  "startTime": "$start_time",
  "toolCalls": 0,
  "fileModifications": 0,
  "significantActions": 0,
  "lastProgressUpdate": null,
  "lastDecisionUpdate": null,
  "hetaDispatches": [],
  "violations": [],
  "status": "active"
}
EOF

    echo -e "${GREEN}✅ Session initialized: $session_id${NC}"
}

# Display DNA reminder
display_dna_reminder() {
    local dna_file="$CONTEXT_DIR/cognitive-dna/arthur-dna-profile.json"

    if [[ -f "$dna_file" ]]; then
        echo -e "\n${BLUE}═══════════════════════════════════════════════════════════${NC}"
        echo -e "${BLUE}COGNITIVE DNA ACTIVE${NC}"
        echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"

        local success_rate=$(jq -r '.profile.successRate // "N/A"' "$dna_file")
        echo -e "Success Rate: ${GREEN}${success_rate}%${NC}"

        echo -e "\n${GREEN}Strengths:${NC}"
        echo -e "  • Apple Silicon Native (95% confidence)"
        echo -e "  • Use Metal/CoreML/MLX for ML workloads"
        echo -e "  • Use mps device for PyTorch"

        echo -e "\n${YELLOW}Gap Augmentation Active:${NC}"
        echo -e "  • Security patterns → Extra validation"
        echo -e "  • Performance patterns → Optimization reminders"
        echo -e "  • Testing patterns → Test coverage prompts"

        echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}\n"
    fi
}

# Display HETA routing reminder
display_heta_reminder() {
    echo -e "${BLUE}HETA ROUTING ACTIVE${NC}"
    echo -e "Implementation tasks route through Master Architect:"
    echo -e "  • Backend Expert: API, database, services"
    echo -e "  • Frontend Expert: UI, components, React"
    echo -e "  • Infrastructure Expert: Deploy, CI/CD, config"
    echo -e "Use ${GREEN}/dispatch${NC} for manual routing\n"
}

# Check channel lifecycle states
check_channel_lifecycle() {
    if [[ -x "$LIFECYCLE_SCRIPT" ]]; then
        echo -e "${BLUE}CHANNEL LIFECYCLE CHECK${NC}"
        "$LIFECYCLE_SCRIPT" check 2>/dev/null | grep -v "^===" | head -10 || true
        echo ""
    fi
}

# Flush old activity events on session start
flush_old_activity() {
    if [[ -x "$ACTIVITY_TRACKER" ]]; then
        "$ACTIVITY_TRACKER" flush 90 2>/dev/null | grep -v "^$" || true
    fi
}

# Finalize session
finalize_session() {
    if [[ ! -f "$STATE_FILE" ]]; then
        echo -e "${YELLOW}No active session to finalize${NC}"
        return 0
    fi

    local mods=$(jq -r '.fileModifications // 0' "$STATE_FILE")
    local last_progress=$(jq -r '.lastProgressUpdate // "never"' "$STATE_FILE")

    if [[ "$mods" -gt 0 && "$last_progress" == "null" ]]; then
        echo -e "${YELLOW}⚠️  Session had $mods modifications without progress update${NC}"
        echo -e "${YELLOW}   Consider updating progress.md before ending session${NC}"

        # Force progress update reminder
        if [[ "$STATE_PERSISTENCE_LEVEL" == "hard" && "$mods" -ge 5 ]]; then
            echo -e "\n${RED}REMINDER: Update progress.md with session changes${NC}"
        fi
    fi

    # Update session state
    jq '.status = "completed" | .endTime = now | todate' "$STATE_FILE" > "${STATE_FILE}.tmp" && mv "${STATE_FILE}.tmp" "$STATE_FILE" 2>/dev/null || true

    # Archive session state
    local archive_dir="$ENFORCEMENT_DIR/state/archive"
    mkdir -p "$archive_dir"
    local session_id=$(jq -r '.sessionId // "unknown"' "$STATE_FILE")
    cp "$STATE_FILE" "$archive_dir/${session_id}.json" 2>/dev/null || true

    echo -e "${GREEN}✅ Session finalized${NC}"
}

# Detect remote execution environment (Claude Code web)
detect_remote_mode() {
    REMOTE_MODE="${CLAUDE_CODE_REMOTE:-false}"
    if [[ "$REMOTE_MODE" == "true" ]]; then
        echo -e "${BLUE}[REMOTE] Running in Claude Code web environment${NC}"
        # Adjust enforcement for remote - skip certain local-only checks
        return 0
    fi
    return 1
}

# Main execution
main() {
    local action="${1:-start}"

    load_config

    # Detect if running in remote environment
    if detect_remote_mode; then
        echo -e "${YELLOW}Remote mode: Some local enforcement checks adjusted${NC}"
    fi

    # Check if enforcement is enabled
    if [[ "$ENFORCEMENT_ENABLED" != "true" ]]; then
        echo -e "${YELLOW}Enforcement disabled${NC}"
        exit 0
    fi

    # Check for bypass
    if check_bypass; then
        exit 0
    fi

    case "$action" in
        start)
            echo -e "\n${BLUE}🔒 CLAUDE CODE ENFORCEMENT - SESSION START${NC}\n"

            # Validate state files
            if ! validate_state_files; then
                exit 1
            fi

            # Initialize session
            initialize_session

            # Display reminders
            display_dna_reminder
            display_heta_reminder

            # Channel lifecycle maintenance
            flush_old_activity
            check_channel_lifecycle

            echo -e "${GREEN}✅ Enforcement checks passed - session ready${NC}\n"
            ;;

        stop)
            echo -e "\n${BLUE}🔒 CLAUDE CODE ENFORCEMENT - SESSION STOP${NC}\n"
            finalize_session
            ;;

        *)
            echo "Usage: $0 {start|stop}"
            exit 1
            ;;
    esac
}

main "$@"
