#!/bin/bash
#
# Activity Tracker for Channel System
# Records and analyzes channel activity for lifecycle management
#

set -e

ARTHUR_ROOT="${ARTHUR_ROOT:-/Users/arthurdell/ARTHUR}"
CHANNELS_DIR="$ARTHUR_ROOT/.claude/channels"
ACTIVITY_LOG="$CHANNELS_DIR/activity-log.json"
LIFECYCLE_SCRIPT="$ARTHUR_ROOT/.claude/lib/channel-lifecycle.sh"

# Get activity weight by type
get_weight() {
    local activity_type="$1"
    case "$activity_type" in
        dispatch) echo 10 ;;
        file_modification) echo 5 ;;
        roll_up) echo 3 ;;
        explicit_reference) echo 2 ;;
        pattern_match) echo 1 ;;
        *) echo 1 ;;
    esac
}

# Initialize activity log if it doesn't exist
init_log() {
    if [[ ! -f "$ACTIVITY_LOG" ]]; then
        echo '{"version":"1.0.0","events":[]}' > "$ACTIVITY_LOG"
    fi
}

# Record an activity event
record() {
    local channel_id="$1"
    local activity_type="$2"
    local details="${3:-}"
    local now=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    local weight=$(get_weight "$activity_type")
    
    init_log
    
    # Add event to log
    local event=$(jq -n \
        --arg ts "$now" \
        --arg ch "$channel_id" \
        --arg type "$activity_type" \
        --argjson w "$weight" \
        --arg det "$details" \
        '{timestamp: $ts, channel: $ch, type: $type, weight: $w, details: $det}')
    
    jq --argjson evt "$event" '.events += [$evt]' "$ACTIVITY_LOG" > "$ACTIVITY_LOG.tmp"
    mv "$ACTIVITY_LOG.tmp" "$ACTIVITY_LOG"
    
    # Update channel lifecycle state
    if [[ -x "$LIFECYCLE_SCRIPT" ]]; then
        "$LIFECYCLE_SCRIPT" activity "$channel_id" "$activity_type" "$weight" 2>/dev/null || true
    fi
    
    echo "Recorded: $channel_id - $activity_type (weight: $weight)"
}

# Detect channel from file path
detect_channel() {
    local file_path="$1"
    
    # Check each known channel folder
    for channel_folder in "$ARTHUR_ROOT"/*/; do
        if [[ -d "$channel_folder/.expert" ]]; then
            local folder_name=$(basename "$channel_folder")
            if [[ "$file_path" == *"$folder_name"* ]]; then
                # Get channel ID from expert.md
                local expert_file="$channel_folder/.expert/expert.md"
                if [[ -f "$expert_file" ]]; then
                    local channel_id=$(grep -E "^\*\*ID:\*\*" "$expert_file" | sed 's/.*\*\*ID:\*\* //' | tr -d '[:space:]')
                    if [[ -n "$channel_id" ]]; then
                        echo "$channel_id"
                        return
                    fi
                fi
                # Fallback to folder name
                echo "$folder_name" | sed 's/-docs$//'
                return
            fi
        fi
    done
    
    echo ""
}

# Record file modification activity
file_modified() {
    local file_path="$1"
    local channel_id=$(detect_channel "$file_path")
    
    if [[ -n "$channel_id" ]]; then
        record "$channel_id" "file_modification" "$file_path"
    else
        echo "No channel found for: $file_path"
    fi
}

# Record dispatch to channel
dispatch() {
    local channel_id="$1"
    local task_summary="${2:-}"
    record "$channel_id" "dispatch" "$task_summary"
}

# Record roll-up/summary update
roll_up() {
    local channel_id="$1"
    record "$channel_id" "roll_up" "Summary updated"
}

# Record explicit user reference
reference() {
    local channel_id="$1"
    record "$channel_id" "explicit_reference" "User mentioned channel"
}

# Record pattern match activation
pattern() {
    local channel_id="$1"
    local pattern="${2:-}"
    record "$channel_id" "pattern_match" "$pattern"
}

# Get activity summary for a channel
summary() {
    local channel_id="$1"
    local days="${2:-30}"
    local cutoff=$(date -v-${days}d -u +"%Y-%m-%dT%H:%M:%SZ")
    
    init_log
    
    echo "=== Activity Summary: $channel_id (last $days days) ==="
    
    jq --arg ch "$channel_id" --arg cutoff "$cutoff" '
        .events 
        | map(select(.channel == $ch and .timestamp >= $cutoff))
        | group_by(.type)
        | map({type: .[0].type, count: length, totalWeight: (map(.weight) | add)})
    ' "$ACTIVITY_LOG"
}

# Get all recent activity
recent() {
    local count="${1:-20}"
    
    init_log
    
    echo "=== Recent Activity (last $count events) ==="
    jq --argjson n "$count" '.events | .[-$n:]' "$ACTIVITY_LOG"
}

# Flush old events (keep last N days)
flush() {
    local keep_days="${1:-90}"
    local cutoff=$(date -v-${keep_days}d -u +"%Y-%m-%dT%H:%M:%SZ")
    
    init_log
    
    local before=$(jq '.events | length' "$ACTIVITY_LOG")
    
    jq --arg cutoff "$cutoff" '
        .events |= map(select(.timestamp >= $cutoff))
    ' "$ACTIVITY_LOG" > "$ACTIVITY_LOG.tmp"
    mv "$ACTIVITY_LOG.tmp" "$ACTIVITY_LOG"
    
    local after=$(jq '.events | length' "$ACTIVITY_LOG")
    local removed=$((before - after))
    
    echo "Flushed $removed events older than $keep_days days"
}

# Main command handler
case "${1:-}" in
    record)
        record "$2" "$3" "${4:-}"
        ;;
    file)
        file_modified "$2"
        ;;
    dispatch)
        dispatch "$2" "${3:-}"
        ;;
    rollup)
        roll_up "$2"
        ;;
    reference)
        reference "$2"
        ;;
    pattern)
        pattern "$2" "${3:-}"
        ;;
    summary)
        summary "$2" "${3:-30}"
        ;;
    recent)
        recent "${2:-20}"
        ;;
    flush)
        flush "${2:-90}"
        ;;
    init)
        init_log
        echo "Activity log initialized"
        ;;
    *)
        echo "Usage: $0 {record|file|dispatch|rollup|reference|pattern|summary|recent|flush|init}"
        echo ""
        echo "Commands:"
        echo "  record <channel> <type> [details]  Record activity event"
        echo "  file <path>                        Record file modification"
        echo "  dispatch <channel> [task]          Record dispatch to channel"
        echo "  rollup <channel>                   Record summary update"
        echo "  reference <channel>                Record user reference"
        echo "  pattern <channel> [pattern]        Record pattern match"
        echo "  summary <channel> [days]           Show activity summary"
        echo "  recent [count]                     Show recent events"
        echo "  flush [days]                       Remove old events"
        echo "  init                               Initialize activity log"
        echo ""
        echo "Activity Types & Weights:"
        echo "  dispatch           10"
        echo "  file_modification   5"
        echo "  roll_up             3"
        echo "  explicit_reference  2"
        echo "  pattern_match       1"
        ;;
esac
