#!/bin/bash
#
# Channel Lifecycle State Machine
# Manages channel states: ACTIVE → IDLE → ARCHIVED → EXTENDED → PRUNED
#

set -e

ARTHUR_ROOT="${ARTHUR_ROOT:-/Users/arthurdell/ARTHUR}"
CHANNELS_DIR="$ARTHUR_ROOT/.claude/channels"
STATE_DIR="$CHANNELS_DIR/state"
CONFIG_FILE="$CHANNELS_DIR/lifecycle-config.json"
ACTIVITY_LOG="$CHANNELS_DIR/activity-log.json"

# Ensure directories exist
mkdir -p "$STATE_DIR/active" "$STATE_DIR/idle" "$STATE_DIR/archived"

# Load configuration
load_config() {
    if [[ -f "$CONFIG_FILE" ]]; then
        IDLE_DAYS=$(jq -r '.thresholds.idleAfterDays' "$CONFIG_FILE")
        ARCHIVE_DAYS=$(jq -r '.thresholds.archiveAfterDays' "$CONFIG_FILE")
        EXTENDED_DAYS=$(jq -r '.thresholds.extendedHoldDays' "$CONFIG_FILE")
        PRUNE_DAYS=$(jq -r '.thresholds.pruneAfterDays' "$CONFIG_FILE")
        MERGE_THRESHOLD=$(jq -r '.affinity.mergeThreshold' "$CONFIG_FILE")
    else
        IDLE_DAYS=30
        ARCHIVE_DAYS=120
        EXTENDED_DAYS=90
        PRUNE_DAYS=210
        MERGE_THRESHOLD=0.65
    fi
}

# Get current state of a channel
get_state() {
    local channel_id="$1"
    
    if [[ -f "$STATE_DIR/active/$channel_id.json" ]]; then
        echo "active"
    elif [[ -f "$STATE_DIR/idle/$channel_id.json" ]]; then
        echo "idle"
    elif [[ -f "$STATE_DIR/archived/$channel_id.json" ]]; then
        echo "archived"
    else
        echo "unknown"
    fi
}

# Calculate days since last activity
days_since_activity() {
    local channel_id="$1"
    local state=$(get_state "$channel_id")
    local state_file="$STATE_DIR/$state/$channel_id.json"
    
    if [[ ! -f "$state_file" ]]; then
        echo "0"
        return
    fi
    
    local last_activity=$(jq -r '.lastActivity // .created' "$state_file")
    if [[ "$last_activity" == "null" || -z "$last_activity" ]]; then
        echo "0"
        return
    fi
    
    local last_ts=$(date -j -f "%Y-%m-%dT%H:%M:%SZ" "$last_activity" "+%s" 2>/dev/null || echo "0")
    local now_ts=$(date "+%s")
    local diff=$(( (now_ts - last_ts) / 86400 ))
    echo "$diff"
}

# Initialize a new channel
init_channel() {
    local channel_id="$1"
    local folder="$2"
    local now=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    
    cat > "$STATE_DIR/active/$channel_id.json" << EOF
{
  "channelId": "$channel_id",
  "folder": "$folder",
  "state": "active",
  "created": "$now",
  "lastActivity": "$now",
  "activityScore": 0,
  "stateHistory": [
    {"state": "discovered", "timestamp": "$now"},
    {"state": "active", "timestamp": "$now"}
  ]
}
EOF
    echo "Channel $channel_id initialized as active"
}

# Transition channel to new state
transition() {
    local channel_id="$1"
    local new_state="$2"
    local current_state=$(get_state "$channel_id")
    local now=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    
    if [[ "$current_state" == "unknown" ]]; then
        echo "Error: Channel $channel_id not found"
        return 1
    fi
    
    if [[ "$current_state" == "$new_state" ]]; then
        echo "Channel $channel_id already in state $new_state"
        return 0
    fi
    
    local state_file="$STATE_DIR/$current_state/$channel_id.json"
    local new_file="$STATE_DIR/$new_state/$channel_id.json"
    
    # Update state in JSON and move file
    jq --arg state "$new_state" --arg ts "$now" '
        .state = $state |
        .stateHistory += [{"state": $state, "timestamp": $ts}]
    ' "$state_file" > "$new_file"
    
    rm "$state_file"
    echo "Channel $channel_id: $current_state → $new_state"
}

# Record activity for a channel
record_activity() {
    local channel_id="$1"
    local activity_type="$2"
    local weight="${3:-1}"
    local now=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    local state=$(get_state "$channel_id")
    
    if [[ "$state" == "unknown" ]]; then
        echo "Error: Channel $channel_id not found"
        return 1
    fi
    
    local state_file="$STATE_DIR/$state/$channel_id.json"
    
    # Update last activity and score
    jq --arg ts "$now" --argjson w "$weight" '
        .lastActivity = $ts |
        .activityScore = (.activityScore + $w)
    ' "$state_file" > "$state_file.tmp" && mv "$state_file.tmp" "$state_file"
    
    # If channel was idle/archived, transition back to active
    if [[ "$state" != "active" ]]; then
        transition "$channel_id" "active"
    fi
    
    echo "Recorded activity: $channel_id ($activity_type, weight: $weight)"
}

# Calculate affinity between two channels
calculate_affinity() {
    local channel_a="$1"
    local channel_b="$2"
    
    # Placeholder - returns 0.5 for now
    # Full implementation would analyze:
    # - Keyword overlap from expert.md
    # - File pattern proximity
    # - Dependency relationships
    echo "0.5"
}

# Find best merge candidate for archived channel
find_merge_candidate() {
    local channel_id="$1"
    local best_match=""
    local best_score=0
    
    for state_file in "$STATE_DIR/active"/*.json; do
        [[ -f "$state_file" ]] || continue
        local candidate=$(jq -r '.channelId' "$state_file")
        [[ "$candidate" == "$channel_id" ]] && continue
        
        local affinity=$(calculate_affinity "$channel_id" "$candidate")
        if (( $(echo "$affinity > $best_score" | bc -l) )); then
            best_score="$affinity"
            best_match="$candidate"
        fi
    done
    
    if (( $(echo "$best_score >= $MERGE_THRESHOLD" | bc -l) )); then
        echo "$best_match"
    else
        echo ""
    fi
}

# Check all channels and apply transitions
check_all() {
    load_config
    local now=$(date "+%s")
    
    echo "=== Channel Lifecycle Check ==="
    echo "Thresholds: idle=$IDLE_DAYS, archive=$ARCHIVE_DAYS, prune=$PRUNE_DAYS"
    echo ""
    
    # Check active channels for idle transition
    for state_file in "$STATE_DIR/active"/*.json; do
        [[ -f "$state_file" ]] || continue
        local channel_id=$(jq -r '.channelId' "$state_file")
        local days=$(days_since_activity "$channel_id")
        
        echo "[$channel_id] active, $days days since activity"
        
        if (( days >= IDLE_DAYS )); then
            transition "$channel_id" "idle"
        fi
    done
    
    # Check idle channels for archive transition
    for state_file in "$STATE_DIR/idle"/*.json; do
        [[ -f "$state_file" ]] || continue
        local channel_id=$(jq -r '.channelId' "$state_file")
        local days=$(days_since_activity "$channel_id")
        
        echo "[$channel_id] idle, $days days since activity"
        
        if (( days >= ARCHIVE_DAYS )); then
            transition "$channel_id" "archived"
        fi
    done
    
    # Check archived channels for merge or prune
    for state_file in "$STATE_DIR/archived"/*.json; do
        [[ -f "$state_file" ]] || continue
        local channel_id=$(jq -r '.channelId' "$state_file")
        local days=$(days_since_activity "$channel_id")
        
        echo "[$channel_id] archived, $days days since activity"
        
        if (( days >= PRUNE_DAYS )); then
            local merge_target=$(find_merge_candidate "$channel_id")
            if [[ -n "$merge_target" ]]; then
                echo "  → Merge candidate: $merge_target"
                # Merge would be implemented here
            else
                echo "  → No merge candidate, prune recommended"
            fi
        fi
    done
}

# List all channels and their states
list_channels() {
    echo "=== Channel States ==="
    
    echo ""
    echo "ACTIVE:"
    shopt -s nullglob
    for f in "$STATE_DIR/active"/*.json; do
        [[ -f "$f" ]] || continue
        local id=$(jq -r '.channelId' "$f")
        local days=$(days_since_activity "$id")
        echo "  $id ($days days)"
    done

    echo ""
    echo "IDLE:"
    for f in "$STATE_DIR/idle"/*.json; do
        [[ -f "$f" ]] || continue
        local id=$(jq -r '.channelId' "$f")
        local days=$(days_since_activity "$id")
        echo "  $id ($days days)"
    done

    echo ""
    echo "ARCHIVED:"
    for f in "$STATE_DIR/archived"/*.json; do
        [[ -f "$f" ]] || continue
        local id=$(jq -r '.channelId' "$f")
        local days=$(days_since_activity "$id")
        echo "  $id ($days days)"
    done
    shopt -u nullglob
}

# Main command handler
case "${1:-}" in
    init)
        init_channel "$2" "$3"
        ;;
    state)
        get_state "$2"
        ;;
    transition)
        transition "$2" "$3"
        ;;
    activity)
        record_activity "$2" "$3" "${4:-1}"
        ;;
    check)
        check_all
        ;;
    list)
        list_channels
        ;;
    *)
        echo "Usage: $0 {init|state|transition|activity|check|list}"
        echo ""
        echo "Commands:"
        echo "  init <id> <folder>     Initialize new channel"
        echo "  state <id>             Get channel state"
        echo "  transition <id> <state> Transition to new state"
        echo "  activity <id> <type> [weight] Record activity"
        echo "  check                  Check all channels for transitions"
        echo "  list                   List all channels and states"
        ;;
esac
