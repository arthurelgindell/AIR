#!/bin/bash
# Force State Update - Reset modification counters after state update
# Use after manually updating progress.md/decisions.md

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENFORCEMENT_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"
PROJECT_ROOT="/Users/arthurdell/ARTHUR"
STATE_FILE="$ENFORCEMENT_DIR/state/enforcement-state.json"
MOD_LOG="$ENFORCEMENT_DIR/state/modification-log.json"
DISPATCH_TRACKER="$ENFORCEMENT_DIR/state/dispatch-tracker.json"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Reset modification counters
reset_counters() {
    if [[ ! -f "$STATE_FILE" ]]; then
        echo -e "${YELLOW}No enforcement state found${NC}"
        return 0
    fi

    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

    # Update state file
    jq ".fileModifications = 0 | .lastProgressUpdate = \"$timestamp\" | .significantActions = 0" \
        "$STATE_FILE" > "${STATE_FILE}.tmp" && mv "${STATE_FILE}.tmp" "$STATE_FILE"

    echo -e "${GREEN}✅ Modification counter reset${NC}"
    echo -e "${GREEN}✅ Last progress update: $timestamp${NC}"
}

# Clear modification log
clear_mod_log() {
    if [[ -f "$MOD_LOG" ]]; then
        jq '.modifications = []' "$MOD_LOG" > "${MOD_LOG}.tmp" && mv "${MOD_LOG}.tmp" "$MOD_LOG"
        echo -e "${GREEN}✅ Modification log cleared${NC}"
    fi
}

# Reset HETA dispatch tracker
reset_heta() {
    if [[ -f "$DISPATCH_TRACKER" ]]; then
        jq '.rollUpsPending = 0 | .lastRollUp = now | todate' "$DISPATCH_TRACKER" > "${DISPATCH_TRACKER}.tmp" && mv "${DISPATCH_TRACKER}.tmp" "$DISPATCH_TRACKER"
        echo -e "${GREEN}✅ HETA roll-up counter reset${NC}"
    fi
}

# Touch state files to update timestamps
touch_state_files() {
    local context_dir="$PROJECT_ROOT/.claude/context"

    for file in progress.md decisions.md important-context.md; do
        if [[ -f "$context_dir/$file" ]]; then
            touch "$context_dir/$file"
        fi
    done

    echo -e "${GREEN}✅ State file timestamps updated${NC}"
}

# Show current state
show_state() {
    echo -e "\n${BLUE}ENFORCEMENT STATE${NC}"
    echo "═══════════════════════════════════════════════════════════"

    if [[ -f "$STATE_FILE" ]]; then
        echo -e "${YELLOW}Session State:${NC}"
        jq -r '"Session: \(.sessionId // "none")\nStatus: \(.status // "unknown")\nTool Calls: \(.toolCalls // 0)\nFile Modifications: \(.fileModifications // 0)\nSignificant Actions: \(.significantActions // 0)\nLast Progress Update: \(.lastProgressUpdate // "never")"' "$STATE_FILE"
    else
        echo -e "${YELLOW}No session state found${NC}"
    fi

    if [[ -f "$DISPATCH_TRACKER" ]]; then
        echo -e "\n${YELLOW}HETA State:${NC}"
        jq -r '"Current Branch: \(.currentBranch // "none")\nDispatches: \(.dispatches | length)\nRoll-ups Pending: \(.rollUpsPending // 0)"' "$DISPATCH_TRACKER"
    fi
}

# Main sync operation
sync_state() {
    echo -e "\n${GREEN}STATE SYNC${NC}"
    echo "═══════════════════════════════════════════════════════════"

    reset_counters
    clear_mod_log
    reset_heta
    touch_state_files

    echo -e "\n═══════════════════════════════════════════════════════════"
    echo -e "${GREEN}STATE SYNCHRONIZED${NC}"
    echo -e "Counters reset. Enforcement will allow new modifications."
}

# Main
main() {
    local mode="${1:-sync}"

    case "$mode" in
        sync)
            sync_state
            ;;
        reset)
            reset_counters
            ;;
        clear)
            clear_mod_log
            ;;
        heta)
            reset_heta
            ;;
        status|show)
            show_state
            ;;
        *)
            echo "Usage: $0 {sync|reset|clear|heta|status}"
            echo ""
            echo "  sync   - Full state synchronization (default)"
            echo "  reset  - Reset modification counters only"
            echo "  clear  - Clear modification log"
            echo "  heta   - Reset HETA roll-up counter"
            echo "  status - Show current state"
            exit 1
            ;;
    esac
}

main "$@"
