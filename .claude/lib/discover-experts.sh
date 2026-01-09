#!/bin/bash
# Expert Discovery Engine
# Scans project structure for .expert/ folders and extracts expert metadata
# Compatible with bash 3.2 (macOS default)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLAUDE_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$CLAUDE_DIR")"
CONFIG_FILE="$CLAUDE_DIR/experts/discovery-config.json"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Load config
load_config() {
    if [[ -f "$CONFIG_FILE" ]]; then
        MARKER_FOLDER=$(jq -r '.discovery.markerFolder // ".expert"' "$CONFIG_FILE")
        SCAN_DEPTH=$(jq -r '.discovery.scanDepth // 5' "$CONFIG_FILE")
        SCAN_ROOT=$(jq -r '.discovery.scanRoot // "."' "$CONFIG_FILE")
    else
        MARKER_FOLDER=".expert"
        SCAN_DEPTH=5
        SCAN_ROOT="$PROJECT_ROOT"
    fi
}

# Get exclude patterns as find arguments
get_exclude_args() {
    local excludes=""
    if [[ -f "$CONFIG_FILE" ]]; then
        local paths=$(jq -r '.excludePaths[]' "$CONFIG_FILE" 2>/dev/null)
        for path in $paths; do
            excludes="$excludes -not -path \"*/$path/*\""
        done
    else
        excludes="-not -path \"*/node_modules/*\" -not -path \"*/.git/*\" -not -path \"*/__pycache__/*\""
    fi
    echo "$excludes"
}

# Extract expert ID from folder path
get_expert_id() {
    local expert_path="$1"
    # Get parent folder name (the domain folder)
    local domain_folder=$(dirname "$expert_path")
    local domain_name=$(basename "$domain_folder")
    # Convert to ID format (lowercase, hyphens)
    echo "$domain_name" | tr '[:upper:]' '[:lower:]' | tr '_' '-'
}

# Extract field from expert.md
extract_field() {
    local file="$1"
    local field="$2"
    grep -i "^\*\*$field:\*\*" "$file" 2>/dev/null | sed "s/.*\*\*$field:\*\* *//" | tr -d '\r' || echo ""
}

# Extract activation patterns from expert.md
extract_patterns() {
    local file="$1"
    # Find the Secondary (keywords) section and extract patterns
    local in_patterns=false
    local patterns=""

    while IFS= read -r line; do
        if echo "$line" | grep -qi "secondary.*keyword"; then
            in_patterns=true
            continue
        fi
        if [[ "$in_patterns" == true ]]; then
            if echo "$line" | grep -q "^#\|^\*\*\|^---"; then
                break
            fi
            if echo "$line" | grep -q "^-"; then
                local pattern=$(echo "$line" | sed 's/^- *//' | tr -d '\r')
                if [[ -n "$pattern" ]]; then
                    if [[ -n "$patterns" ]]; then
                        patterns="$patterns, $pattern"
                    else
                        patterns="$pattern"
                    fi
                fi
            fi
        fi
    done < "$file"

    echo "$patterns"
}

# Scan for expert folders
discover_experts() {
    local experts_json="["
    local first=true
    local exclude_args=$(get_exclude_args)

    # Find all .expert folders
    local find_cmd="find \"$SCAN_ROOT\" -maxdepth $SCAN_DEPTH -type d -name \"$MARKER_FOLDER\" $exclude_args 2>/dev/null"

    while IFS= read -r expert_path; do
        if [[ -z "$expert_path" ]]; then
            continue
        fi

        local expert_md="$expert_path/expert.md"
        if [[ ! -f "$expert_md" ]]; then
            continue
        fi

        # Extract metadata
        local domain_path=$(dirname "$expert_path")
        local domain_rel_path="${domain_path#$PROJECT_ROOT/}"
        local expert_id=$(get_expert_id "$expert_path")
        local domain_name=$(extract_field "$expert_md" "Domain")
        local scope=$(extract_field "$expert_md" "Scope")
        local parent=$(extract_field "$expert_md" "Parent")
        local level=$(extract_field "$expert_md" "Level")
        local budget=$(extract_field "$expert_md" "Context Budget" | grep -o '[0-9,]*' | tr -d ',')
        local patterns=$(extract_patterns "$expert_md")

        # Default values
        [[ -z "$parent" ]] && parent="master-architect"
        [[ -z "$level" ]] && level="1"
        [[ -z "$budget" ]] && budget="30000"
        [[ -z "$scope" ]] && scope="$domain_rel_path/"

        # Build JSON entry
        if [[ "$first" == true ]]; then
            first=false
        else
            experts_json="$experts_json,"
        fi

        experts_json="$experts_json
    {
      \"id\": \"$expert_id\",
      \"name\": \"$domain_name\",
      \"path\": \"$domain_rel_path/.expert/\",
      \"domainPath\": \"$domain_rel_path/\",
      \"scope\": \"$scope\",
      \"parent\": \"$parent\",
      \"level\": $level,
      \"contextBudget\": $budget,
      \"activationPatterns\": \"$patterns\",
      \"hasContextScope\": $([ -f "$expert_path/context-scope.md" ] && echo "true" || echo "false"),
      \"hasSummary\": $([ -f "$expert_path/summary.md" ] && echo "true" || echo "false")
    }"

    done < <(eval $find_cmd)

    experts_json="$experts_json
  ]"

    echo "$experts_json"
}

# Main output
main() {
    local mode="${1:-json}"

    load_config

    case "$mode" in
        json)
            # Output just the discovered experts array
            discover_experts
            ;;
        full)
            # Output with metadata
            local discovered=$(discover_experts)
            local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
            local count=$(echo "$discovered" | grep -c '"id"' || echo "0")

            cat << EOF
{
  "discoveryTime": "$timestamp",
  "scanRoot": "$SCAN_ROOT",
  "markerFolder": "$MARKER_FOLDER",
  "expertsFound": $count,
  "experts": $discovered
}
EOF
            ;;
        summary)
            # Human-readable summary
            echo -e "${GREEN}EXPERT DISCOVERY${NC}"
            echo "═══════════════════════════════════════════════════════════"
            echo -e "Scan root: ${BLUE}$SCAN_ROOT${NC}"
            echo -e "Marker: ${BLUE}$MARKER_FOLDER${NC}"
            echo ""

            local discovered=$(discover_experts)
            local count=$(echo "$discovered" | grep -c '"id"' || echo "0")

            echo -e "Found ${GREEN}$count${NC} domain expert(s):"
            echo ""

            echo "$discovered" | jq -r '.[] | "  • \(.id) (\(.domainPath))"' 2>/dev/null || echo "  (none)"
            ;;
        *)
            echo "Usage: $0 {json|full|summary}"
            exit 1
            ;;
    esac
}

main "$@"
