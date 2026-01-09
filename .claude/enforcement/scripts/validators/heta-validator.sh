#!/bin/bash
# HETA Validator - Validate expert tree routing and context isolation
# Discovery-based routing (not hardcoded domains)
# Compatible with bash 3.2 (macOS default)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENFORCEMENT_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"
PROJECT_ROOT="/Users/arthurdell/ARTHUR"
CLAUDE_DIR="$PROJECT_ROOT/.claude"
CONFIG_FILE="$ENFORCEMENT_DIR/config/enforcement.json"
STATE_FILE="$ENFORCEMENT_DIR/state/enforcement-state.json"
DISPATCH_TRACKER="$ENFORCEMENT_DIR/state/dispatch-tracker.json"
DOMAIN_REGISTRY="$CLAUDE_DIR/experts/domain-registry.json"
DISCOVERY_SCRIPT="$CLAUDE_DIR/lib/discover-experts.sh"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Load config
load_config() {
    if [[ -f "$CONFIG_FILE" ]]; then
        HETA_ENABLED=$(jq -r '.enforcement.hetaRouting.enabled // true' "$CONFIG_FILE")
        HETA_LEVEL=$(jq -r '.enforcement.hetaRouting.level // "soft"' "$CONFIG_FILE")
        ROLLUP_THRESHOLD=$(jq -r '.enforcement.hetaRouting.rollUpThreshold // 3' "$CONFIG_FILE")
        CONTEXT_ISOLATION=$(jq -r '.enforcement.hetaRouting.contextIsolation // true' "$CONFIG_FILE")
    else
        HETA_ENABLED=true
        HETA_LEVEL="soft"
        ROLLUP_THRESHOLD=3
        CONTEXT_ISOLATION=true
    fi
}

# Initialize dispatch tracker
init_tracker() {
    if [[ ! -f "$DISPATCH_TRACKER" ]]; then
        cat > "$DISPATCH_TRACKER" << EOF
{
  "currentDomain": null,
  "dispatches": [],
  "rollUpsPending": 0,
  "lastRollUp": null
}
EOF
    fi
}

# Get discovered domains from registry
get_discovered_domains() {
    if [[ -f "$DOMAIN_REGISTRY" ]]; then
        jq -r '.experts[].id' "$DOMAIN_REGISTRY" 2>/dev/null
    fi
}

# Detect domain from file path (PRIMARY method)
detect_domain_from_path() {
    local file_path="$1"

    if [[ ! -f "$DOMAIN_REGISTRY" ]]; then
        echo "unknown"
        return
    fi

    # Check each domain's path
    local domains=$(jq -r '.experts[] | "\(.id):\(.domainPath)"' "$DOMAIN_REGISTRY" 2>/dev/null)
    for entry in $domains; do
        local domain_id=$(echo "$entry" | cut -d: -f1)
        local domain_path=$(echo "$entry" | cut -d: -f2)

        if [[ "$file_path" == *"$domain_path"* ]]; then
            echo "$domain_id"
            return
        fi
    done

    echo "unknown"
}

# Detect domain from keywords (SECONDARY method)
detect_domain_from_keywords() {
    local content="$1"
    local content_lower=$(echo "$content" | tr '[:upper:]' '[:lower:]')

    if [[ ! -f "$DOMAIN_REGISTRY" ]]; then
        echo "unknown"
        return
    fi

    local best_match="unknown"
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
    else
        echo "unknown"
    fi
}

# Get domain scope
get_domain_scope() {
    local domain_id="$1"

    if [[ -f "$DOMAIN_REGISTRY" ]]; then
        jq -r ".tree[\"$domain_id\"].domainPath // \"\"" "$DOMAIN_REGISTRY" 2>/dev/null
    fi
}

# Check context isolation (file access outside current domain)
check_context_isolation() {
    local current_domain="$1"
    local file_path="$2"

    if [[ "$CONTEXT_ISOLATION" != "true" ]]; then
        return 0
    fi

    if [[ -z "$current_domain" || "$current_domain" == "null" || "$current_domain" == "unknown" ]]; then
        return 0
    fi

    # Get current domain's scope
    local current_scope=$(get_domain_scope "$current_domain")
    if [[ -z "$current_scope" ]]; then
        return 0
    fi

    # Check if file is outside current domain's scope
    if [[ "$file_path" != *"$current_scope"* ]]; then
        # Check if it's in another domain
        local other_domain=$(detect_domain_from_path "$file_path")
        if [[ "$other_domain" != "unknown" && "$other_domain" != "$current_domain" ]]; then
            echo -e "${YELLOW}⚠️  Context isolation warning${NC}"
            echo -e "   Current domain: ${CYAN}$current_domain${NC}"
            echo -e "   File belongs to: ${CYAN}$other_domain${NC}"
            echo -e "   Consider coordinating through Master Architect"
            return 1
        fi
    fi

    return 0
}

# Track dispatch
track_dispatch() {
    local domain="$1"
    local prompt="$2"
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

    init_tracker

    # Add dispatch entry
    local entry="{\"domain\":\"$domain\",\"timestamp\":\"$timestamp\",\"prompt\":\"${prompt:0:100}\"}"
    jq ".dispatches += [$entry] | .currentDomain = \"$domain\"" "$DISPATCH_TRACKER" > "${DISPATCH_TRACKER}.tmp" && mv "${DISPATCH_TRACKER}.tmp" "$DISPATCH_TRACKER"
}

# Check if roll-up needed
check_rollup() {
    init_tracker

    if [[ ! -f "$STATE_FILE" ]]; then
        return 0
    fi

    local mods=$(jq -r '.fileModifications // 0' "$STATE_FILE")
    local actions=$(jq -r '.significantActions // 0' "$STATE_FILE")

    if [[ "$mods" -ge "$ROLLUP_THRESHOLD" || "$actions" -ge "$ROLLUP_THRESHOLD" ]]; then
        echo -e "${BLUE}🌳 HETA ROLL-UP RECOMMENDED${NC}"
        echo -e "   Modifications: $mods"
        echo -e "   Significant actions: $actions"
        echo -e "   Update your domain's .expert/summary.md"

        # Update tracker
        jq ".rollUpsPending += 1" "$DISPATCH_TRACKER" > "${DISPATCH_TRACKER}.tmp" && mv "${DISPATCH_TRACKER}.tmp" "$DISPATCH_TRACKER"
    fi
}

# Show current routing status (discovery-based)
show_status() {
    init_tracker

    echo -e "\n${GREEN}HETA ROUTING STATUS (Discovery-Based)${NC}"
    echo "═══════════════════════════════════════════════════════════"

    if [[ -f "$DISPATCH_TRACKER" ]]; then
        local current=$(jq -r '.currentDomain // "none"' "$DISPATCH_TRACKER")
        local dispatch_count=$(jq -r '.dispatches | length' "$DISPATCH_TRACKER")
        local rollups=$(jq -r '.rollUpsPending // 0' "$DISPATCH_TRACKER")

        echo -e "Current Domain: ${CYAN}$current${NC}"
        echo -e "Total Dispatches: $dispatch_count"
        echo -e "Roll-ups Pending: $rollups"
    fi

    echo -e "\n${YELLOW}Discovered Domain Experts:${NC}"
    if [[ -f "$DOMAIN_REGISTRY" ]]; then
        jq -r '.experts[] | "  • \(.id) (\(.domainPath))"' "$DOMAIN_REGISTRY" 2>/dev/null || echo "  (none found)"
    else
        echo "  (registry not found - run build-registry.sh)"
    fi

    echo -e "\n${BLUE}Adding New Domains:${NC}"
    echo "  Create {folder}/.expert/expert.md"
    echo "  Run: .claude/lib/build-registry.sh build"

    echo -e "\n${GREEN}Commands:${NC}"
    echo "  /dispatch <domain>  - Route to specific expert"
    echo "  /tree-status        - View expert hierarchy"
    echo "  /master-architect   - Invoke routing orchestrator"
}

# Validate prompt for routing
validate_prompt() {
    local prompt="$1"
    local prompt_lower=$(echo "$prompt" | tr '[:upper:]' '[:lower:]')

    # Check for Master Architect triggers
    local triggered=false
    for trigger in implement build create "add feature" "add endpoint" refactor migrate; do
        if echo "$prompt_lower" | grep -q "$trigger"; then
            triggered=true
            break
        fi
    done

    if [[ "$triggered" == "true" ]]; then
        local domain=$(detect_domain_from_keywords "$prompt")
        echo -e "${BLUE}🌳 HETA Routing Analysis${NC}"
        echo -e "   Detected domain: ${CYAN}$domain${NC}"

        if [[ "$domain" != "unknown" ]]; then
            local scope=$(get_domain_scope "$domain")
            echo -e "   ${GREEN}Recommendation: Route to $domain expert${NC}"
            echo -e "   Scope: $scope"
        else
            echo -e "   ${YELLOW}Recommendation: Use Master Architect for routing${NC}"
        fi
    fi
}

# Refresh registry
refresh_registry() {
    if [[ -x "$DISCOVERY_SCRIPT" ]]; then
        echo -e "${BLUE}Refreshing domain registry...${NC}"
        "$CLAUDE_DIR/lib/build-registry.sh" build
    else
        echo -e "${YELLOW}Discovery script not found${NC}"
    fi
}

# Main
main() {
    local mode="${1:-status}"

    load_config

    if [[ "$HETA_ENABLED" != "true" ]]; then
        echo -e "${YELLOW}HETA routing disabled${NC}"
        exit 0
    fi

    case "$mode" in
        status)
            show_status
            ;;
        validate)
            validate_prompt "$2"
            ;;
        detect-path)
            detect_domain_from_path "$2"
            ;;
        detect-keywords)
            detect_domain_from_keywords "$2"
            ;;
        dispatch)
            track_dispatch "$2" "$3"
            echo -e "${GREEN}✅ Dispatched to $2 domain${NC}"
            ;;
        rollup)
            check_rollup
            ;;
        isolation)
            check_context_isolation "$2" "$3"
            ;;
        refresh)
            refresh_registry
            ;;
        *)
            echo "Usage: $0 {status|validate|detect-path|detect-keywords|dispatch|rollup|isolation|refresh} [args]"
            exit 1
            ;;
    esac
}

main "$@"
