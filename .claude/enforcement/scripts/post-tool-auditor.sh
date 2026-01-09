#!/bin/bash
# Post-Tool Auditor - Track modifications and queue roll-ups
# Runs after Edit/Write operations

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENFORCEMENT_DIR="$(dirname "$SCRIPT_DIR")"
ARTHUR_ROOT="$(dirname "$(dirname "$ENFORCEMENT_DIR")")"
STATE_FILE="$ENFORCEMENT_DIR/state/enforcement-state.json"
CONFIG_FILE="$ENFORCEMENT_DIR/config/enforcement.json"
MOD_LOG="$ENFORCEMENT_DIR/state/modification-log.json"
ACTIVITY_TRACKER="$ARTHUR_ROOT/.claude/lib/activity-tracker.sh"

# Colors
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Tool type passed as argument
TOOL_TYPE="${1:-unknown}"

# Read from stdin (tool output JSON)
INPUT=$(cat)

# Load config
load_config() {
    if [[ -f "$CONFIG_FILE" ]]; then
        HETA_ENABLED=$(jq -r '.enforcement.hetaRouting.enabled // true' "$CONFIG_FILE")
        ROLLUP_THRESHOLD=$(jq -r '.enforcement.hetaRouting.rollUpThreshold // 3' "$CONFIG_FILE")
        WARN_THRESHOLD=$(jq -r '.enforcement.statePersistence.warnThreshold // 5' "$CONFIG_FILE")
    else
        HETA_ENABLED=true
        ROLLUP_THRESHOLD=3
        WARN_THRESHOLD=5
    fi
}

# Check for bypass
check_bypass() {
    [[ -n "$ARTHUR_ENFORCEMENT_BYPASS" ]] && return 0

    BYPASS_FILE="$ENFORCEMENT_DIR/.bypass"
    if [[ -f "$BYPASS_FILE" ]]; then
        BYPASS_EXPIRES=$(cat "$BYPASS_FILE" 2>/dev/null || echo "0")
        [[ "$(date +%s)" -lt "$BYPASS_EXPIRES" ]] && return 0
    fi

    return 1
}

# Log modification
log_modification() {
    local file_path=$(echo "$INPUT" | jq -r '.file_path // "unknown"')
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

    # Initialize mod log if needed
    if [[ ! -f "$MOD_LOG" ]]; then
        echo '{"modifications":[]}' > "$MOD_LOG"
    fi

    # Add modification entry
    local entry="{\"timestamp\":\"$timestamp\",\"tool\":\"$TOOL_TYPE\",\"file\":\"$file_path\"}"
    jq ".modifications += [$entry]" "$MOD_LOG" > "${MOD_LOG}.tmp" && mv "${MOD_LOG}.tmp" "$MOD_LOG"
}

# Check thresholds and show reminders
check_thresholds() {
    if [[ ! -f "$STATE_FILE" ]]; then
        return 0
    fi

    local mods=$(jq -r '.fileModifications // 0' "$STATE_FILE")
    local last_update=$(jq -r '.lastProgressUpdate // "null"' "$STATE_FILE")

    # Warn at threshold
    if [[ "$mods" -ge "$WARN_THRESHOLD" && "$last_update" == "null" ]]; then
        echo -e "${YELLOW}📝 REMINDER: $mods file modifications without progress.md update${NC}" >&2
        echo -e "${YELLOW}   Run /enforcement sync or update progress.md manually${NC}" >&2
    fi

    # HETA roll-up reminder
    if [[ "$HETA_ENABLED" == "true" && "$mods" -ge "$ROLLUP_THRESHOLD" ]]; then
        echo -e "${BLUE}🌳 HETA: Consider roll-up to Master Architect (${mods} modifications)${NC}" >&2
    fi
}

# Track significant actions
track_significant_action() {
    if [[ -f "$STATE_FILE" ]]; then
        jq '.significantActions += 1' "$STATE_FILE" > "${STATE_FILE}.tmp" && mv "${STATE_FILE}.tmp" "$STATE_FILE"
    fi
}

# Track channel activity for lifecycle management
track_channel_activity() {
    local file_path=$(echo "$INPUT" | jq -r '.file_path // "unknown"')

    # Only track if activity tracker exists
    if [[ -x "$ACTIVITY_TRACKER" && "$file_path" != "unknown" ]]; then
        "$ACTIVITY_TRACKER" file "$file_path" 2>/dev/null || true
    fi
}

# Main
main() {
    load_config

    # Check for bypass
    if check_bypass; then
        exit 0
    fi

    # Log the modification
    log_modification

    # Track as significant action
    track_significant_action

    # Track channel activity
    track_channel_activity

    # Check thresholds and show reminders
    check_thresholds

    exit 0
}

main
