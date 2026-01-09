#!/bin/bash
# Documentation Assimilation Orchestrator
# Usage: assimilate.sh [channel|all] [--force] [--cadence=hourly|daily|weekly]

set -e

PROJECT_ROOT="/Users/arthurdell/ARTHUR"
CONFIG_FILE="$PROJECT_ROOT/.claude/assimilation/assimilation.json"
LOG_DIR="$PROJECT_ROOT/logs"
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
ISO_TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Parse arguments
CHANNEL="${1:-all}"
FORCE=false
CADENCE_FILTER=""

for arg in "$@"; do
    case $arg in
        --force) FORCE=true ;;
        --cadence=*) CADENCE_FILTER="${arg#*=}" ;;
    esac
done

log() {
    echo "[$TIMESTAMP] $1" | tee -a "$LOG_DIR/assimilation.log"
}

log_error() {
    echo "[$TIMESTAMP] ERROR: $1" | tee -a "$LOG_DIR/assimilation.error.log" >&2
}

# Check if source needs refresh based on cadence
needs_refresh() {
    local last_fetched="$1"
    local cadence="$2"

    if [ "$FORCE" = true ]; then
        return 0
    fi

    if [ -z "$last_fetched" ] || [ "$last_fetched" = "null" ]; then
        return 0
    fi

    # Calculate age in seconds (macOS compatible)
    local now=$(date +%s)
    local last=$(date -j -f "%Y-%m-%dT%H:%M:%SZ" "$last_fetched" +%s 2>/dev/null || echo 0)
    local age=$((now - last))

    case "$cadence" in
        hourly)  [ $age -gt 3600 ] ;;
        daily)   [ $age -gt 86400 ] ;;
        weekly)  [ $age -gt 604800 ] ;;
        *)       [ $age -gt 604800 ] ;;
    esac
}

# Fetch web content
fetch_web() {
    local url="$1"
    local output="$2"
    local extractor="$3"

    local temp_file=$(mktemp)

    if curl -sS --connect-timeout 30 -L -A "ARTHUR-Docs-Assimilation/1.0" "$url" -o "$temp_file" 2>/dev/null; then
        case "$extractor" in
            html-to-markdown)
                # Check if pandoc is available
                if command -v pandoc &> /dev/null; then
                    pandoc -f html -t markdown "$temp_file" -o "$output" 2>/dev/null || cat "$temp_file" > "$output"
                else
                    # Fallback: basic HTML tag stripping
                    sed 's/<[^>]*>//g' "$temp_file" > "$output"
                fi
                ;;
            raw|*)
                mv "$temp_file" "$output"
                return 0
                ;;
        esac
        rm -f "$temp_file"
        return 0
    else
        rm -f "$temp_file"
        return 1
    fi
}

# Fetch API content
fetch_api() {
    local url="$1"
    local output="$2"
    local timeout="${3:-30}"
    local offline_value="${4:-unavailable}"

    local response
    response=$(curl -sS --connect-timeout "$timeout" "$url" 2>/dev/null) || {
        echo "$offline_value" > "$output"
        return 1
    }

    echo "$response" > "$output"
    return 0
}

# Execute command and capture output
fetch_command() {
    local cmd="$1"
    local output="$2"

    eval "$cmd" > "$output" 2>/dev/null || {
        echo "Command failed: $cmd" > "$output"
        return 1
    }
    return 0
}

# Process a single channel
process_channel() {
    local channel_name="$1"
    local docs_dir="$2"
    local sources_file="$PROJECT_ROOT/$docs_dir/.expert/sources.json"

    if [ ! -f "$sources_file" ]; then
        log "  No sources.json for $channel_name, skipping"
        return 0
    fi

    log "Processing channel: $channel_name"

    local success_count=0
    local error_count=0
    local total_count=0

    # Read sources using jq
    local sources=$(jq -c '.sources[] | select(.enabled == true)' "$sources_file" 2>/dev/null)

    while IFS= read -r source; do
        [ -z "$source" ] && continue

        local id=$(echo "$source" | jq -r '.id')
        local type=$(echo "$source" | jq -r '.type')
        local name=$(echo "$source" | jq -r '.name')
        local cadence=$(echo "$source" | jq -r '.cadence // "weekly"')
        local last_fetched=$(echo "$source" | jq -r '.lastFetched // empty')

        # Apply cadence filter if specified
        if [ -n "$CADENCE_FILTER" ] && [ "$cadence" != "$CADENCE_FILTER" ]; then
            continue
        fi

        # Check if refresh needed
        if ! needs_refresh "$last_fetched" "$cadence"; then
            log "  [$id] Skipping (fresh)"
            continue
        fi

        total_count=$((total_count + 1))
        log "  [$id] Fetching: $name"

        local output_file=$(echo "$source" | jq -r '.outputFile // empty')
        local output_path="$PROJECT_ROOT/$docs_dir/$output_file"
        local fetch_result=0

        # Ensure output directory exists
        mkdir -p "$(dirname "$output_path")"

        case "$type" in
            web)
                local url=$(echo "$source" | jq -r '.url')
                local extractor=$(echo "$source" | jq -r '.extractor // "raw"')
                fetch_web "$url" "$output_path" "$extractor" || fetch_result=1
                ;;
            api)
                local url=$(echo "$source" | jq -r '.url')
                local timeout=$(echo "$source" | jq -r '.timeout // 30')
                local offline_value=$(echo "$source" | jq -r '.offlineValue // "unavailable"')
                fetch_api "$url" "$output_path" "$timeout" "$offline_value" || fetch_result=1
                ;;
            command)
                local cmd=$(echo "$source" | jq -r '.command')
                fetch_command "$cmd" "$output_path" || fetch_result=1
                ;;
        esac

        # Update source metadata in sources.json
        if [ $fetch_result -eq 0 ]; then
            success_count=$((success_count + 1))
            log "    Success: $output_file"
            # Update lastFetched and lastSuccess
            jq --arg id "$id" --arg ts "$ISO_TIMESTAMP" \
                '(.sources[] | select(.id == $id)) |= . + {lastFetched: $ts, lastSuccess: $ts}' \
                "$sources_file" > "$sources_file.tmp" && mv "$sources_file.tmp" "$sources_file"
        else
            error_count=$((error_count + 1))
            log_error "    Failed to fetch $id"
            # Update lastFetched and lastError
            jq --arg id "$id" --arg ts "$ISO_TIMESTAMP" \
                '(.sources[] | select(.id == $id)) |= . + {lastFetched: $ts, lastError: $ts}' \
                "$sources_file" > "$sources_file.tmp" && mv "$sources_file.tmp" "$sources_file"
        fi
    done <<< "$sources"

    # Update channel .last-refresh
    cat > "$PROJECT_ROOT/$docs_dir/.last-refresh" << EOF
Last refreshed: $TIMESTAMP
Sources: $success_count/$total_count successful
Errors: $error_count
EOF

    log "  Channel complete: $success_count/$total_count sources refreshed"
}

# Update global freshness index
update_freshness_index() {
    local freshness_file="$PROJECT_ROOT/.claude/assimilation/freshness.json"

    # Create basic freshness summary
    cat > "$freshness_file" << EOF
{
  "lastRun": "$ISO_TIMESTAMP",
  "status": "completed"
}
EOF
}

# Main execution
main() {
    log "=== Documentation Assimilation Started ==="
    log "Channel: $CHANNEL, Force: $FORCE, Cadence: ${CADENCE_FILTER:-all}"

    mkdir -p "$LOG_DIR"

    if [ "$CHANNEL" = "all" ]; then
        # Process all enabled channels from config
        local channels=$(jq -r '.channels | to_entries[] | select(.value.enabled == true) | "\(.key):\(.value.docsDir)"' "$CONFIG_FILE" 2>/dev/null)
        while IFS=: read -r name dir; do
            [ -z "$name" ] && continue
            process_channel "$name" "$dir"
        done <<< "$channels"
    else
        # Process single channel
        local docs_dir=$(jq -r --arg ch "$CHANNEL" '.channels[$ch].docsDir // empty' "$CONFIG_FILE" 2>/dev/null)
        if [ -n "$docs_dir" ]; then
            process_channel "$CHANNEL" "$docs_dir"
        else
            log_error "Unknown channel: $CHANNEL"
            exit 1
        fi
    fi

    # Update global freshness index
    update_freshness_index

    log "=== Assimilation Complete ==="
}

main "$@"
