#!/bin/bash
# State Validator - Check state file freshness and completeness
# Used by session-enforcer.sh and /enforcement command

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENFORCEMENT_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"
PROJECT_ROOT="/Users/arthurdell/ARTHUR"
CONTEXT_DIR="$PROJECT_ROOT/.claude/context"
CONFIG_FILE="$ENFORCEMENT_DIR/config/enforcement.json"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Required state files
REQUIRED_FILES=(
    "$CONTEXT_DIR/progress.md"
    "$CONTEXT_DIR/decisions.md"
    "$CONTEXT_DIR/important-context.md"
)

# Load config
load_config() {
    if [[ -f "$CONFIG_FILE" ]]; then
        STALE_THRESHOLD=$(jq -r '.enforcement.statePersistence.staleThreshold // 3600' "$CONFIG_FILE")
    else
        STALE_THRESHOLD=3600  # 1 hour default
    fi
}

# Check file exists
check_file_exists() {
    local file="$1"
    local name=$(basename "$file")

    if [[ -f "$file" ]]; then
        echo -e "${GREEN}✅ $name exists${NC}"
        return 0
    else
        echo -e "${RED}❌ $name MISSING${NC}"
        return 1
    fi
}

# Check file freshness
check_file_freshness() {
    local file="$1"
    local name=$(basename "$file")

    if [[ ! -f "$file" ]]; then
        return 1
    fi

    local mod_time=$(stat -f %m "$file" 2>/dev/null || stat -c %Y "$file" 2>/dev/null)
    local current_time=$(date +%s)
    local age=$((current_time - mod_time))

    if [[ "$age" -gt "$STALE_THRESHOLD" ]]; then
        local hours=$((age / 3600))
        local mins=$(((age % 3600) / 60))
        echo -e "${YELLOW}⚠️  $name is stale (${hours}h ${mins}m old)${NC}"
        return 2  # Stale but exists
    else
        echo -e "${GREEN}✅ $name is fresh${NC}"
        return 0
    fi
}

# Check file has content
check_file_content() {
    local file="$1"
    local name=$(basename "$file")

    if [[ ! -f "$file" ]]; then
        return 1
    fi

    local lines=$(wc -l < "$file" | tr -d ' ')
    if [[ "$lines" -lt 5 ]]; then
        echo -e "${YELLOW}⚠️  $name has minimal content ($lines lines)${NC}"
        return 2
    fi

    return 0
}

# Validate progress.md structure
validate_progress() {
    local file="$CONTEXT_DIR/progress.md"

    if [[ ! -f "$file" ]]; then
        return 1
    fi

    # Check for required sections
    local has_status=$(grep -c "## Current Status\|## Status\|Current Status" "$file" || echo "0")
    local has_completed=$(grep -c "## Completed\|## Done" "$file" || echo "0")
    local has_progress=$(grep -c "## In Progress\|## Current\|## Working" "$file" || echo "0")

    if [[ "$has_status" -eq 0 && "$has_completed" -eq 0 && "$has_progress" -eq 0 ]]; then
        echo -e "${YELLOW}⚠️  progress.md missing standard sections${NC}"
    fi

    return 0
}

# Main validation
main() {
    local mode="${1:-full}"
    local errors=0
    local warnings=0

    load_config

    echo -e "\n${GREEN}STATE VALIDATION${NC}"
    echo "═══════════════════════════════════════════════════════════"

    # Check each required file
    echo -e "\n${GREEN}File Existence:${NC}"
    for file in "${REQUIRED_FILES[@]}"; do
        if ! check_file_exists "$file"; then
            ((errors++))
        fi
    done

    # Check freshness
    echo -e "\n${GREEN}File Freshness:${NC}"
    for file in "${REQUIRED_FILES[@]}"; do
        local result
        check_file_freshness "$file"
        result=$?
        if [[ $result -eq 1 ]]; then
            ((errors++))
        elif [[ $result -eq 2 ]]; then
            ((warnings++))
        fi
    done

    # Validate progress.md structure
    echo -e "\n${GREEN}Progress Structure:${NC}"
    validate_progress

    # Summary
    echo -e "\n═══════════════════════════════════════════════════════════"
    if [[ $errors -gt 0 ]]; then
        echo -e "${RED}VALIDATION FAILED: $errors errors, $warnings warnings${NC}"
        exit 1
    elif [[ $warnings -gt 0 ]]; then
        echo -e "${YELLOW}VALIDATION PASSED WITH WARNINGS: $warnings warnings${NC}"
        exit 0
    else
        echo -e "${GREEN}VALIDATION PASSED: All checks passed${NC}"
        exit 0
    fi
}

main "$@"
