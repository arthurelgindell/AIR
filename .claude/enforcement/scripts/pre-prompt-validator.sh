#!/bin/bash
# Pre-Prompt Validator - HETA routing and state freshness checks
# Discovery-based routing (not hardcoded domains)
# Runs on UserPromptSubmit

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENFORCEMENT_DIR="$(dirname "$SCRIPT_DIR")"
STATE_FILE="$ENFORCEMENT_DIR/state/enforcement-state.json"
CONFIG_FILE="$ENFORCEMENT_DIR/config/enforcement.json"
PROJECT_ROOT="/Users/arthurdell/ARTHUR"
CONTEXT_DIR="$PROJECT_ROOT/.claude/context"
DOMAIN_REGISTRY="$PROJECT_ROOT/.claude/experts/domain-registry.json"

# Colors
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

# Read user prompt from stdin
USER_PROMPT=$(cat)

# Load config
load_config() {
    if [[ -f "$CONFIG_FILE" ]]; then
        HETA_ENABLED=$(jq -r '.enforcement.hetaRouting.enabled // true' "$CONFIG_FILE")
        HETA_LEVEL=$(jq -r '.enforcement.hetaRouting.level // "soft"' "$CONFIG_FILE")
    else
        HETA_ENABLED=true
        HETA_LEVEL="soft"
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

# Get discovered domains from registry
get_discovered_domains() {
    if [[ -f "$DOMAIN_REGISTRY" ]]; then
        jq -r '.experts[].id' "$DOMAIN_REGISTRY" 2>/dev/null
    fi
}

# Detect domain from keywords (discovery-based)
detect_domain_from_keywords() {
    local content="$1"
    local content_lower=$(echo "$content" | tr '[:upper:]' '[:lower:]')

    if [[ ! -f "$DOMAIN_REGISTRY" ]]; then
        return
    fi

    local best_match=""
    local best_score=0

    # Check each domain's activation patterns
    while IFS= read -r line; do
        local domain_id=$(echo "$line" | jq -r '.id')
        local patterns=$(echo "$line" | jq -r '.patterns[]' 2>/dev/null)

        local score=0
        for pattern in $patterns; do
            if echo "$content_lower" | grep -qi "$pattern"; then
                score=$((score + 1))
            fi
        done

        if [[ $score -gt $best_score ]]; then
            best_score=$score
            best_match="$domain_id"
        fi
    done < <(jq -c '.routing.keywordMappings[]' "$DOMAIN_REGISTRY" 2>/dev/null)

    if [[ $best_score -gt 0 ]]; then
        echo "$best_match"
    fi
}

# Check for HETA routing triggers
check_heta_routing() {
    if [[ "$HETA_ENABLED" != "true" ]]; then
        return 0
    fi

    local prompt_lower=$(echo "$USER_PROMPT" | tr '[:upper:]' '[:lower:]')

    # Master Architect triggers
    local triggered=false
    for trigger in implement build create "add feature" "add endpoint" refactor migrate; do
        if echo "$prompt_lower" | grep -q "$trigger"; then
            triggered=true
            echo -e "${BLUE}🌳 HETA ROUTING DETECTED${NC}" >&2
            echo -e "${BLUE}   Trigger: \"$trigger\"${NC}" >&2
            echo -e "${BLUE}   Consider using /master-architect for structured implementation${NC}" >&2
            break
        fi
    done

    if [[ "$triggered" == "true" ]]; then
        # Discovery-based domain detection
        local detected_domain=$(detect_domain_from_keywords "$USER_PROMPT")

        if [[ -n "$detected_domain" ]]; then
            echo -e "${GREEN}   Suggested domain: ${detected_domain} expert${NC}" >&2

            # Get domain path from registry
            local domain_path=$(jq -r ".tree[\"$detected_domain\"].domainPath // \"\"" "$DOMAIN_REGISTRY" 2>/dev/null)
            if [[ -n "$domain_path" ]]; then
                echo -e "${GREEN}   Scope: ${domain_path}${NC}" >&2
            fi
        else
            echo -e "${YELLOW}   No specific domain detected - Master Architect will route${NC}" >&2
        fi

        echo "" >&2
    fi

    return 0
}

# Check state freshness
check_state_freshness() {
    local progress_file="$CONTEXT_DIR/progress.md"

    if [[ -f "$progress_file" ]]; then
        # Get file modification time
        local mod_time=$(stat -f %m "$progress_file" 2>/dev/null || stat -c %Y "$progress_file" 2>/dev/null)
        local current_time=$(date +%s)
        local age=$((current_time - mod_time))

        # Warn if progress.md is older than 1 hour (3600 seconds)
        if [[ "$age" -gt 3600 ]]; then
            local hours=$((age / 3600))
            echo -e "${YELLOW}📋 Progress.md is ${hours}h old - consider updating${NC}" >&2
        fi
    fi

    return 0
}

# Check for gap patterns that need augmentation
check_gap_patterns() {
    local prompt_lower=$(echo "$USER_PROMPT" | tr '[:upper:]' '[:lower:]')

    # Security patterns
    if echo "$prompt_lower" | grep -qE "(auth|password|token|api_key|credential|secret)"; then
        echo -e "${YELLOW}🔐 Security pattern detected - extra validation recommended${NC}" >&2
    fi

    # Performance patterns
    if echo "$prompt_lower" | grep -qE "(loop|query|batch|iterate|performance|optimize)"; then
        echo -e "${YELLOW}⚡ Performance pattern detected - consider profiling${NC}" >&2
    fi

    # Testing patterns
    if echo "$prompt_lower" | grep -qE "(feature|fix|refactor|implement|add)"; then
        echo -e "${YELLOW}🧪 Testing recommended for this change${NC}" >&2
    fi

    return 0
}

# Main
main() {
    load_config

    # Check for bypass
    if check_bypass; then
        exit 0
    fi

    # Run checks (soft enforcement - warnings only, no blocking)
    check_heta_routing
    check_state_freshness
    check_gap_patterns

    # Always pass - this hook is for awareness, not blocking
    exit 0
}

main
