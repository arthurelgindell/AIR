#!/bin/bash
#
# Deploy Dynamic Expert Channel System to a new node
# Usage: ./deploy-channel-system.sh [target-directory]
#

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Source directory (where this script lives)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_ROOT="$(dirname "$SCRIPT_DIR")"

# Target directory (argument or current directory)
TARGET_ROOT="${1:-$(pwd)}"

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Dynamic Expert Channel System - Deployment Script${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "Source: ${GREEN}$SOURCE_ROOT${NC}"
echo -e "Target: ${GREEN}$TARGET_ROOT${NC}"
echo ""

# Check prerequisites
check_prerequisites() {
    echo -e "${YELLOW}Checking prerequisites...${NC}"
    
    local missing=()
    
    command -v jq >/dev/null 2>&1 || missing+=("jq")
    command -v curl >/dev/null 2>&1 || missing+=("curl")
    command -v bash >/dev/null 2>&1 || missing+=("bash")
    
    if [[ ${#missing[@]} -gt 0 ]]; then
        echo -e "${RED}Missing required tools: ${missing[*]}${NC}"
        echo -e "Install with: ${GREEN}brew install ${missing[*]}${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ All prerequisites met${NC}"
}

# Create directory structure
create_directories() {
    echo -e "\n${YELLOW}Creating directory structure...${NC}"
    
    mkdir -p "$TARGET_ROOT/.claude/channels/state/active"
    mkdir -p "$TARGET_ROOT/.claude/channels/state/idle"
    mkdir -p "$TARGET_ROOT/.claude/channels/state/archived"
    mkdir -p "$TARGET_ROOT/.claude/assimilation"
    mkdir -p "$TARGET_ROOT/.claude/lib"
    mkdir -p "$TARGET_ROOT/.claude/docs"
    mkdir -p "$TARGET_ROOT/.claude/experts"
    mkdir -p "$TARGET_ROOT/scripts"
    
    echo -e "${GREEN}✓ Directories created${NC}"
}

# Copy configuration files
copy_configs() {
    echo -e "\n${YELLOW}Copying configuration files...${NC}"
    
    # Lifecycle config
    if [[ -f "$SOURCE_ROOT/.claude/channels/lifecycle-config.json" ]]; then
        cp "$SOURCE_ROOT/.claude/channels/lifecycle-config.json" "$TARGET_ROOT/.claude/channels/"
        echo -e "  ${GREEN}✓${NC} lifecycle-config.json"
    fi
    
    # Channel registry
    if [[ -f "$SOURCE_ROOT/.claude/channels/channel-registry.json" ]]; then
        cp "$SOURCE_ROOT/.claude/channels/channel-registry.json" "$TARGET_ROOT/.claude/channels/"
        echo -e "  ${GREEN}✓${NC} channel-registry.json"
    fi
    
    # Assimilation config
    if [[ -f "$SOURCE_ROOT/.claude/assimilation/assimilation.json" ]]; then
        cp "$SOURCE_ROOT/.claude/assimilation/assimilation.json" "$TARGET_ROOT/.claude/assimilation/"
        echo -e "  ${GREEN}✓${NC} assimilation.json"
    fi
    
    # Discovery config
    if [[ -f "$SOURCE_ROOT/.claude/experts/discovery-config.json" ]]; then
        cp "$SOURCE_ROOT/.claude/experts/discovery-config.json" "$TARGET_ROOT/.claude/experts/"
        echo -e "  ${GREEN}✓${NC} discovery-config.json"
    fi
}

# Copy and update scripts
copy_scripts() {
    echo -e "\n${YELLOW}Copying scripts...${NC}"
    
    # Channel lifecycle script
    if [[ -f "$SOURCE_ROOT/.claude/lib/channel-lifecycle.sh" ]]; then
        cp "$SOURCE_ROOT/.claude/lib/channel-lifecycle.sh" "$TARGET_ROOT/.claude/lib/"
        chmod +x "$TARGET_ROOT/.claude/lib/channel-lifecycle.sh"
        # Update default path
        sed -i '' "s|/Users/arthurdell/ARTHUR|$TARGET_ROOT|g" "$TARGET_ROOT/.claude/lib/channel-lifecycle.sh" 2>/dev/null || true
        echo -e "  ${GREEN}✓${NC} channel-lifecycle.sh"
    fi
    
    # Activity tracker script
    if [[ -f "$SOURCE_ROOT/.claude/lib/activity-tracker.sh" ]]; then
        cp "$SOURCE_ROOT/.claude/lib/activity-tracker.sh" "$TARGET_ROOT/.claude/lib/"
        chmod +x "$TARGET_ROOT/.claude/lib/activity-tracker.sh"
        # Update default path
        sed -i '' "s|/Users/arthurdell/ARTHUR|$TARGET_ROOT|g" "$TARGET_ROOT/.claude/lib/activity-tracker.sh" 2>/dev/null || true
        echo -e "  ${GREEN}✓${NC} activity-tracker.sh"
    fi
    
    # Assimilate script
    if [[ -f "$SOURCE_ROOT/scripts/assimilate.sh" ]]; then
        cp "$SOURCE_ROOT/scripts/assimilate.sh" "$TARGET_ROOT/scripts/"
        chmod +x "$TARGET_ROOT/scripts/assimilate.sh"
        # Update default path
        sed -i '' "s|/Users/arthurdell/ARTHUR|$TARGET_ROOT|g" "$TARGET_ROOT/scripts/assimilate.sh" 2>/dev/null || true
        echo -e "  ${GREEN}✓${NC} assimilate.sh"
    fi
}

# Copy documentation
copy_docs() {
    echo -e "\n${YELLOW}Copying documentation...${NC}"
    
    if [[ -f "$SOURCE_ROOT/.claude/docs/DYNAMIC-CHANNEL-SYSTEM.md" ]]; then
        cp "$SOURCE_ROOT/.claude/docs/DYNAMIC-CHANNEL-SYSTEM.md" "$TARGET_ROOT/.claude/docs/"
        echo -e "  ${GREEN}✓${NC} DYNAMIC-CHANNEL-SYSTEM.md"
    fi
}

# Initialize system
initialize_system() {
    echo -e "\n${YELLOW}Initializing system...${NC}"
    
    # Initialize activity log
    if [[ -x "$TARGET_ROOT/.claude/lib/activity-tracker.sh" ]]; then
        cd "$TARGET_ROOT"
        .claude/lib/activity-tracker.sh init
        echo -e "  ${GREEN}✓${NC} Activity log initialized"
    fi
}

# Create example channel
create_example_channel() {
    local channel_name="example"
    local channel_folder="$TARGET_ROOT/${channel_name}-docs"
    
    echo -e "\n${YELLOW}Creating example channel...${NC}"
    
    mkdir -p "$channel_folder/.expert"
    
    # Create expert.md
    cat > "$channel_folder/.expert/expert.md" << EOF
# Example Expert Channel

---
model:
  primary: opus
  fallback: sonnet
  lookup: haiku
  inherit: true
  override: allowed
---

**Domain:** Example Domain
**ID:** example
**Scope:** \`example-docs/\`
**Parent:** master-architect
**Level:** 1

---

## Mission

This is an example channel. Replace with your domain-specific content.

---

## Responsibilities

- Example responsibility 1
- Example responsibility 2

---

## Activation Patterns

### Primary (file path)
- \`example-docs/**\`

### Secondary (keywords)
- example, demo, sample

---

## Escalation Criteria

Escalate to Master Architect when:
- Complex decisions needed
- Cross-domain coordination required

---

## Quality Gates

Before completing any task:
- [ ] Verify changes are in scope
- [ ] Test functionality
EOF
    echo -e "  ${GREEN}✓${NC} expert.md"
    
    # Create sources.json
    cat > "$channel_folder/.expert/sources.json" << EOF
{
  "version": "1.0.0",
  "channel": "example",
  "description": "Example channel sources",
  "lastGlobalRefresh": null,
  "sources": [],
  "metadata": {
    "created": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "modified": null,
    "refreshCount": 0,
    "successCount": 0,
    "errorCount": 0
  }
}
EOF
    echo -e "  ${GREEN}✓${NC} sources.json"
    
    # Create context-scope.md
    cat > "$channel_folder/.expert/context-scope.md" << EOF
# Context Scope: Example Channel

## IN SCOPE (Full Access)

\`\`\`
example-docs/
├── *.md
└── .expert/*
\`\`\`

## SHARED READ (Read-Only)

\`\`\`
.claude/context/*
CLAUDE.md
\`\`\`

## OUT OF SCOPE (No Access)

\`\`\`
.claude/skills/
other-channel-docs/
\`\`\`
EOF
    echo -e "  ${GREEN}✓${NC} context-scope.md"
    
    # Create summary.md
    cat > "$channel_folder/.expert/summary.md" << EOF
# Example Channel Summary

**Last Updated:** $(date +%Y-%m-%d)
**Status:** Active (newly created)
**Model:** opus

---

## Capabilities

| Capability | Status |
|------------|--------|
| Example feature | ⏳ Pending |

---

## Metrics

- **Documentation files:** 0
- **Sources configured:** 0
- **Last successful refresh:** never
EOF
    echo -e "  ${GREEN}✓${NC} summary.md"
    
    # Initialize in lifecycle
    if [[ -x "$TARGET_ROOT/.claude/lib/channel-lifecycle.sh" ]]; then
        cd "$TARGET_ROOT"
        .claude/lib/channel-lifecycle.sh init example example-docs
    fi
}

# Show summary
show_summary() {
    echo -e "\n${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}  Deployment Complete!${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "Target: ${GREEN}$TARGET_ROOT${NC}"
    echo ""
    echo -e "${YELLOW}Next Steps:${NC}"
    echo -e "  1. Set environment variable:"
    echo -e "     ${GREEN}export ARTHUR_ROOT=\"$TARGET_ROOT\"${NC}"
    echo ""
    echo -e "  2. Verify installation:"
    echo -e "     ${GREEN}cd $TARGET_ROOT${NC}"
    echo -e "     ${GREEN}.claude/lib/channel-lifecycle.sh list${NC}"
    echo ""
    echo -e "  3. Create your own channels:"
    echo -e "     ${GREEN}mkdir -p my-domain-docs/.expert${NC}"
    echo -e "     (copy and edit example-docs/.expert/* files)"
    echo -e "     ${GREEN}.claude/lib/channel-lifecycle.sh init my-domain my-domain-docs${NC}"
    echo ""
    echo -e "  4. Read the documentation:"
    echo -e "     ${GREEN}$TARGET_ROOT/.claude/docs/DYNAMIC-CHANNEL-SYSTEM.md${NC}"
    echo ""
}

# Main
main() {
    check_prerequisites
    create_directories
    copy_configs
    copy_scripts
    copy_docs
    initialize_system
    create_example_channel
    show_summary
}

main
