#!/bin/bash
# Pre-Tool Gate - Hard enforcement before Edit/Write/Bash operations
# Blocks operations if enforcement rules violated

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENFORCEMENT_DIR="$(dirname "$SCRIPT_DIR")"
STATE_FILE="$ENFORCEMENT_DIR/state/enforcement-state.json"
CONFIG_FILE="$ENFORCEMENT_DIR/config/enforcement.json"

# Colors
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Tool type passed as argument
TOOL_TYPE="${1:-unknown}"

# Read from stdin (tool input JSON)
INPUT=$(cat)

# Load config
load_config() {
    if [[ -f "$CONFIG_FILE" ]]; then
        ENFORCEMENT_ENABLED=$(jq -r '.enabled // true' "$CONFIG_FILE")
        DNA_LEVEL=$(jq -r '.enforcement.cognitiveDNA.level // "hard"' "$CONFIG_FILE")
        STATE_LEVEL=$(jq -r '.enforcement.statePersistence.level // "hard"' "$CONFIG_FILE")
        WARN_THRESHOLD=$(jq -r '.enforcement.statePersistence.warnThreshold // 5' "$CONFIG_FILE")
        BLOCK_THRESHOLD=$(jq -r '.enforcement.statePersistence.blockThreshold // 10' "$CONFIG_FILE")
    else
        ENFORCEMENT_ENABLED=true
        DNA_LEVEL="hard"
        STATE_LEVEL="hard"
        WARN_THRESHOLD=5
        BLOCK_THRESHOLD=10
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

# Check modification threshold
check_modification_threshold() {
    if [[ ! -f "$STATE_FILE" ]]; then
        return 0
    fi

    local mods=$(jq -r '.fileModifications // 0' "$STATE_FILE")
    local last_update=$(jq -r '.lastProgressUpdate // "null"' "$STATE_FILE")

    if [[ "$last_update" == "null" ]]; then
        if [[ "$mods" -ge "$BLOCK_THRESHOLD" && "$STATE_LEVEL" == "hard" ]]; then
            echo -e "${RED}❌ ENFORCEMENT BLOCK: $mods modifications without progress update${NC}" >&2
            echo -e "${RED}   Update progress.md or run /enforcement sync${NC}" >&2
            return 1
        elif [[ "$mods" -ge "$WARN_THRESHOLD" ]]; then
            echo -e "${YELLOW}⚠️  Warning: $mods modifications without progress update${NC}" >&2
        fi
    fi

    return 0
}

# Check for CUDA patterns (DNA enforcement)
check_dna_compliance() {
    # Extract content to check based on tool type
    local content=""

    case "$TOOL_TYPE" in
        edit)
            content=$(echo "$INPUT" | jq -r '.new_string // ""')
            ;;
        write)
            content=$(echo "$INPUT" | jq -r '.content // ""')
            ;;
        bash)
            content=$(echo "$INPUT" | jq -r '.command // ""')
            ;;
    esac

    if [[ -z "$content" ]]; then
        return 0
    fi

    # CUDA patterns to block
    local cuda_patterns=(
        "torch.cuda"
        "\.cuda()"
        "cuda:0"
        "cuda:1"
        "\"cuda\""
        "'cuda'"
        "CUDA"
        "cudnn"
        "nvidia"
        "nccl"
    )

    for pattern in "${cuda_patterns[@]}"; do
        if echo "$content" | grep -qE "$pattern"; then
            echo -e "${RED}❌ DNA VIOLATION: CUDA pattern detected: $pattern${NC}" >&2
            echo -e "${RED}   Apple Silicon requires: mps (PyTorch), CoreML, MLX, or Metal${NC}" >&2

            # Log violation
            if [[ -f "$STATE_FILE" ]]; then
                local violation="{\"type\":\"cuda_pattern\",\"pattern\":\"$pattern\",\"tool\":\"$TOOL_TYPE\",\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}"
                jq ".violations += [$violation]" "$STATE_FILE" > "${STATE_FILE}.tmp" && mv "${STATE_FILE}.tmp" "$STATE_FILE"
            fi

            if [[ "$DNA_LEVEL" == "hard" ]]; then
                return 1
            else
                echo -e "${YELLOW}   (soft enforcement - allowing operation)${NC}" >&2
            fi
        fi
    done

    return 0
}

# Increment tool call counter
increment_counters() {
    if [[ -f "$STATE_FILE" ]]; then
        jq '.toolCalls += 1' "$STATE_FILE" > "${STATE_FILE}.tmp" && mv "${STATE_FILE}.tmp" "$STATE_FILE"

        # For write operations, also increment file modifications
        if [[ "$TOOL_TYPE" == "edit" || "$TOOL_TYPE" == "write" ]]; then
            jq '.fileModifications += 1' "$STATE_FILE" > "${STATE_FILE}.tmp" && mv "${STATE_FILE}.tmp" "$STATE_FILE"
        fi
    fi
}

# Main
main() {
    load_config

    # Check if enforcement is enabled
    if [[ "$ENFORCEMENT_ENABLED" != "true" ]]; then
        exit 0
    fi

    # Check for bypass
    if check_bypass; then
        exit 0
    fi

    # Skip read-only tools
    if [[ "$TOOL_TYPE" == "read" || "$TOOL_TYPE" == "glob" || "$TOOL_TYPE" == "grep" ]]; then
        exit 0
    fi

    # Run enforcement checks
    if ! check_modification_threshold; then
        exit 1
    fi

    if ! check_dna_compliance; then
        exit 1
    fi

    # Passed all checks - increment counters
    increment_counters

    exit 0
}

main
