#!/bin/bash
# Registry Builder
# Takes discovery output and generates domain-registry.json
# Compatible with bash 3.2 (macOS default)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLAUDE_DIR="$(dirname "$SCRIPT_DIR")"
DISCOVERY_SCRIPT="$SCRIPT_DIR/discover-experts.sh"
REGISTRY_FILE="$CLAUDE_DIR/experts/domain-registry.json"
CONFIG_FILE="$CLAUDE_DIR/experts/discovery-config.json"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Load config
load_config() {
    if [[ -f "$CONFIG_FILE" ]]; then
        ROOT_EXPERT=$(jq -r '.hierarchy.rootExpert // "master-architect"' "$CONFIG_FILE")
    else
        ROOT_EXPERT="master-architect"
    fi
}

# Run discovery
run_discovery() {
    if [[ ! -x "$DISCOVERY_SCRIPT" ]]; then
        echo "Error: Discovery script not found or not executable" >&2
        exit 1
    fi

    "$DISCOVERY_SCRIPT" json
}

# Build tree structure from discovered experts
build_tree() {
    local experts_json="$1"
    local tree_json="{"

    # Add root expert
    tree_json="$tree_json
    \"$ROOT_EXPERT\": {
      \"id\": \"$ROOT_EXPERT\",
      \"type\": \"root\",
      \"level\": 0,
      \"children\": ["

    # Get all level-1 experts (direct children of root)
    local children=$(echo "$experts_json" | jq -r '.[] | select(.level == 1) | .id' 2>/dev/null)
    local first=true
    for child in $children; do
        if [[ "$first" == true ]]; then
            first=false
        else
            tree_json="$tree_json,"
        fi
        tree_json="$tree_json\"$child\""
    done

    tree_json="$tree_json]
    }"

    # Add each discovered expert to tree
    echo "$experts_json" | jq -c '.[]' 2>/dev/null | while read -r expert; do
        local id=$(echo "$expert" | jq -r '.id')
        local level=$(echo "$expert" | jq -r '.level')
        local parent=$(echo "$expert" | jq -r '.parent')
        local path=$(echo "$expert" | jq -r '.path')
        local domain_path=$(echo "$expert" | jq -r '.domainPath')
        local scope=$(echo "$expert" | jq -r '.scope')
        local budget=$(echo "$expert" | jq -r '.contextBudget')
        local patterns=$(echo "$expert" | jq -r '.activationPatterns')

        # Find children of this expert (experts whose parent is this id)
        local my_children=$(echo "$experts_json" | jq -r ".[] | select(.parent == \"$id\") | .id" 2>/dev/null)
        local children_array="["
        local first_child=true
        for c in $my_children; do
            if [[ "$first_child" == true ]]; then
                first_child=false
            else
                children_array="$children_array,"
            fi
            children_array="$children_array\"$c\""
        done
        children_array="$children_array]"

        echo ",
    \"$id\": {
      \"id\": \"$id\",
      \"type\": \"branch\",
      \"level\": $level,
      \"path\": \"$path\",
      \"domainPath\": \"$domain_path\",
      \"scope\": \"$scope\",
      \"parent\": \"$parent\",
      \"children\": $children_array,
      \"contextBudget\": $budget,
      \"activationPatterns\": $(echo "$patterns" | jq -R 'split(", ")' 2>/dev/null || echo "[]")
    }"
    done

    tree_json="$tree_json
  }"

    echo "$tree_json"
}

# Generate full registry
generate_registry() {
    local experts_json=$(run_discovery)
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    local count=$(echo "$experts_json" | grep -c '"id"' 2>/dev/null || echo "0")

    # Build tree (complex, do in jq)
    # For simplicity, we'll generate a flat structure with parent/child refs

    cat << EOF
{
  "metadata": {
    "version": "2.0.0",
    "generated": "$timestamp",
    "source": "discovery-scan",
    "rootExpert": "$ROOT_EXPERT",
    "totalExperts": $((count + 1)),
    "discoveryBased": true
  },

  "tree": {
    "$ROOT_EXPERT": {
      "id": "$ROOT_EXPERT",
      "type": "root",
      "level": 0,
      "path": ".claude/experts/master-architect.md",
      "children": $(echo "$experts_json" | jq '[.[] | select(.level == 1) | .id]' 2>/dev/null || echo "[]"),
      "contextBudget": 40000
    }$(echo "$experts_json" | jq -r '.[] | ",\n    \"\(.id)\": {\n      \"id\": \"\(.id)\",\n      \"type\": \"branch\",\n      \"level\": \(.level),\n      \"path\": \"\(.path)\",\n      \"domainPath\": \"\(.domainPath)\",\n      \"scope\": \"\(.scope)\",\n      \"parent\": \"\(.parent)\",\n      \"children\": [],\n      \"contextBudget\": \(.contextBudget),\n      \"activationPatterns\": \(.activationPatterns | split(", ") | @json)\n    }"' 2>/dev/null || echo "")
  },

  "experts": $experts_json,

  "routing": {
    "primaryMethod": "file-path",
    "secondaryMethod": "keywords",
    "pathMappings": $(echo "$experts_json" | jq '[.[] | {key: .domainPath, value: .id}] | from_entries' 2>/dev/null || echo "{}"),
    "keywordMappings": $(echo "$experts_json" | jq '[.[] | {id: .id, patterns: (.activationPatterns | split(", "))}]' 2>/dev/null || echo "[]")
  }
}
EOF
}

# Main
main() {
    local mode="${1:-build}"

    load_config

    case "$mode" in
        build)
            echo -e "${GREEN}Building domain registry...${NC}" >&2

            local registry=$(generate_registry)

            # Write to file
            echo "$registry" > "$REGISTRY_FILE"

            echo -e "${GREEN}Registry saved to: $REGISTRY_FILE${NC}" >&2

            local count=$(echo "$registry" | jq '.metadata.totalExperts' 2>/dev/null || echo "?")
            echo -e "Total experts: ${BLUE}$count${NC}" >&2
            ;;

        show)
            # Just output the registry without saving
            generate_registry
            ;;

        validate)
            echo -e "${GREEN}Validating registry...${NC}" >&2

            if [[ ! -f "$REGISTRY_FILE" ]]; then
                echo -e "${YELLOW}Registry file not found. Run 'build' first.${NC}" >&2
                exit 1
            fi

            # Validate JSON
            if jq empty "$REGISTRY_FILE" 2>/dev/null; then
                echo -e "${GREEN}✅ Registry is valid JSON${NC}" >&2
            else
                echo -e "${YELLOW}❌ Registry has invalid JSON${NC}" >&2
                exit 1
            fi

            # Show summary
            jq -r '"Experts: \(.metadata.totalExperts)\nGenerated: \(.metadata.generated)"' "$REGISTRY_FILE"
            ;;

        *)
            echo "Usage: $0 {build|show|validate}"
            exit 1
            ;;
    esac
}

main "$@"
