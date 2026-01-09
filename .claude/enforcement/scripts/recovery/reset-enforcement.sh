#!/bin/bash
# Reset Enforcement - Full reset of enforcement state
# Use when enforcement state becomes corrupted or needs fresh start

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENFORCEMENT_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"
STATE_DIR="$ENFORCEMENT_DIR/state"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Confirm reset
confirm_reset() {
    if [[ "$1" != "--force" ]]; then
        echo -e "${YELLOW}This will reset all enforcement state.${NC}"
        echo -e "Use --force to skip confirmation."
        read -p "Continue? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "Cancelled."
            exit 0
        fi
    fi
}

# Reset enforcement state
reset_enforcement_state() {
    cat > "$STATE_DIR/enforcement-state.json" << 'EOF'
{
  "sessionId": null,
  "startTime": null,
  "toolCalls": 0,
  "fileModifications": 0,
  "significantActions": 0,
  "lastProgressUpdate": null,
  "lastDecisionUpdate": null,
  "hetaDispatches": [],
  "violations": [],
  "status": "inactive"
}
EOF
    echo -e "${GREEN}✅ Reset enforcement-state.json${NC}"
}

# Reset modification log
reset_mod_log() {
    cat > "$STATE_DIR/modification-log.json" << 'EOF'
{
  "modifications": []
}
EOF
    echo -e "${GREEN}✅ Reset modification-log.json${NC}"
}

# Reset violation log
reset_violation_log() {
    cat > "$STATE_DIR/violation-log.json" << 'EOF'
{
  "violations": []
}
EOF
    echo -e "${GREEN}✅ Reset violation-log.json${NC}"
}

# Reset dispatch tracker
reset_dispatch_tracker() {
    cat > "$STATE_DIR/dispatch-tracker.json" << 'EOF'
{
  "currentBranch": null,
  "dispatches": [],
  "rollUpsPending": 0,
  "lastRollUp": null
}
EOF
    echo -e "${GREEN}✅ Reset dispatch-tracker.json${NC}"
}

# Remove bypass file
remove_bypass() {
    if [[ -f "$ENFORCEMENT_DIR/.bypass" ]]; then
        rm "$ENFORCEMENT_DIR/.bypass"
        echo -e "${GREEN}✅ Removed bypass file${NC}"
    fi
}

# Main
main() {
    local force="$1"

    echo -e "\n${RED}ENFORCEMENT RESET${NC}"
    echo "═══════════════════════════════════════════════════════════"

    confirm_reset "$force"

    # Ensure state directory exists
    mkdir -p "$STATE_DIR"

    # Reset all state files
    reset_enforcement_state
    reset_mod_log
    reset_violation_log
    reset_dispatch_tracker
    remove_bypass

    echo -e "\n═══════════════════════════════════════════════════════════"
    echo -e "${GREEN}ENFORCEMENT RESET COMPLETE${NC}"
    echo -e "All state cleared. Next session will start fresh."
}

main "$@"
