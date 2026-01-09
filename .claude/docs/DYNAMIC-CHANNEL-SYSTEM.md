# Dynamic Expert Channel System

## Implementation Guide

**Version:** 1.0.0
**Created:** 2026-01-08
**Status:** Active
**Portable:** Yes - deployable to any node

---

## Table of Contents

1. [Overview](#overview)
2. [Quick Start - New Node Deployment](#quick-start---new-node-deployment)
3. [Architecture](#architecture)
3. [Channel Structure](#channel-structure)
4. [Lifecycle Management](#lifecycle-management)
5. [Activity Tracking](#activity-tracking)
6. [Documentation Assimilation](#documentation-assimilation)
7. [Model Assignment](#model-assignment)
8. [Creating New Channels](#creating-new-channels)
9. [Hook Integration](#hook-integration)
10. [Commands Reference](#commands-reference)
11. [Troubleshooting](#troubleshooting)

---

## Overview

The Dynamic Expert Channel System provides domain-specialized execution contexts that:

- **Self-organize** based on folder structure with `.expert/` markers
- **Auto-prune** inactive channels after configurable thresholds
- **Assimilate documentation** from web URLs, APIs, and local commands
- **Assign models dynamically** (Opus/Sonnet/Haiku) based on channel level
- **Track activity** for lifecycle decisions and merge candidates

### Design Principles

1. **Channels, not branches** - Each domain folder is an independent channel
2. **Filesystem as truth** - All state persists to disk, survives context resets
3. **Dynamic creation** - New `.expert/` folder = new channel
4. **Automatic pruning** - Unused channels archive then prune with affinity checking
5. **Model assignment** - Opus for deep reasoning, Sonnet for speed, Haiku for lookups

---

## Quick Start - New Node Deployment

### Automated Deployment (Recommended)

Use the deployment script for one-command setup:

```bash
# From a configured node (e.g., AIR), deploy to another location
/path/to/ARTHUR/scripts/deploy-channel-system.sh /path/to/target/project

# Or via SSH to another node
ssh alpha "mkdir -p ~/ARTHUR"
scp -r scripts/deploy-channel-system.sh alpha:~/
ssh alpha "~/deploy-channel-system.sh ~/ARTHUR"
```

The script will:
- Create all directory structures
- Copy configuration files
- Install and configure scripts
- Update paths for the target location
- Initialize the activity log
- Create an example channel

### Manual Deployment

If you prefer manual setup:

### Prerequisites

- macOS with bash 3.2+ (or Linux with bash 4+)
- `jq` installed (`brew install jq` or `apt install jq`)
- `curl` for web fetching
- Claude Code CLI configured

### Step 1: Set Project Root

All scripts use `ARTHUR_ROOT` environment variable. Set it to your project directory:

```bash
export ARTHUR_ROOT="/path/to/your/project"
```

Or the scripts will auto-detect based on their location.

### Step 2: Create Directory Structure

```bash
# Create core directories
mkdir -p "$ARTHUR_ROOT/.claude/channels/state/active"
mkdir -p "$ARTHUR_ROOT/.claude/channels/state/idle"
mkdir -p "$ARTHUR_ROOT/.claude/channels/state/archived"
mkdir -p "$ARTHUR_ROOT/.claude/assimilation"
mkdir -p "$ARTHUR_ROOT/.claude/lib"
mkdir -p "$ARTHUR_ROOT/.claude/docs"
mkdir -p "$ARTHUR_ROOT/scripts"
```

### Step 3: Copy Core Files

Copy these files from a configured node:

```bash
# Configuration files
.claude/channels/lifecycle-config.json
.claude/channels/channel-registry.json
.claude/assimilation/assimilation.json
.claude/experts/discovery-config.json

# Scripts
.claude/lib/channel-lifecycle.sh
.claude/lib/activity-tracker.sh
scripts/assimilate.sh

# Documentation
.claude/docs/DYNAMIC-CHANNEL-SYSTEM.md
```

### Step 4: Update Paths in Scripts

The scripts use `ARTHUR_ROOT` which defaults to `/Users/arthurdell/ARTHUR`. Update for your node:

```bash
# In channel-lifecycle.sh and activity-tracker.sh:
ARTHUR_ROOT="${ARTHUR_ROOT:-/path/to/your/project}"

# In session-enforcer.sh:
PROJECT_ROOT="/path/to/your/project"
```

Or set the environment variable:

```bash
echo 'export ARTHUR_ROOT="/path/to/your/project"' >> ~/.zshrc
```

### Step 5: Initialize Activity Log

```bash
.claude/lib/activity-tracker.sh init
```

### Step 6: Create Your First Channel

```bash
# Create channel folder
mkdir -p my-domain-docs/.expert

# Create expert.md (see Channel Structure section)
# Create sources.json
# Create context-scope.md
# Create summary.md

# Initialize in lifecycle system
.claude/lib/channel-lifecycle.sh init my-domain my-domain-docs
```

### Step 7: Verify Installation

```bash
# Check lifecycle script
.claude/lib/channel-lifecycle.sh list

# Check activity tracker
.claude/lib/activity-tracker.sh recent

# Run assimilation
scripts/assimilate.sh status
```

### Deploying via Tailscale SSH

For nodes on your tailnet with Tailscale SSH enabled:

```bash
# Deploy to ALPHA
tailscale ssh alpha "mkdir -p ~/ARTHUR"
rsync -avz --exclude='.git' \
    .claude/channels/ \
    .claude/lib/ \
    .claude/assimilation/ \
    .claude/docs/ \
    scripts/ \
    alpha:~/ARTHUR/

tailscale ssh alpha "cd ~/ARTHUR && .claude/lib/activity-tracker.sh init"

# Deploy to BETA
tailscale ssh beta "mkdir -p ~/ARTHUR"
rsync -avz --exclude='.git' \
    .claude/channels/ \
    .claude/lib/ \
    .claude/assimilation/ \
    .claude/docs/ \
    scripts/ \
    beta:~/ARTHUR/

# Deploy to GAMMA (Linux)
tailscale ssh gamma "mkdir -p ~/ARTHUR"
rsync -avz --exclude='.git' \
    .claude/channels/ \
    .claude/lib/ \
    .claude/assimilation/ \
    .claude/docs/ \
    scripts/ \
    gamma:~/ARTHUR/
```

### Node-Specific Channels

Each node should have channels relevant to its purpose:

| Node | IP | Recommended Channels |
|------|-----|---------------------|
| AIR (command center) | 100.79.73.73 | claude-code, tailscale |
| ALPHA (M2 Max compute) | 100.76.246.64 | lm-studio, tailscale |
| BETA (M4 Max compute) | 100.117.121.73 | lm-studio, lancedb, tailscale |
| GAMMA (Linux) | 100.102.59.5 | docker, tailscale |

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ARTHUR_ROOT` | Project root directory | Auto-detect |
| `ARTHUR_ENFORCEMENT_BYPASS` | Skip enforcement hooks | unset |

---

## Architecture

```
ARTHUR/
├── .claude/
│   ├── channels/                    # Channel lifecycle management
│   │   ├── lifecycle-config.json    # Pruning thresholds
│   │   ├── channel-registry.json    # Master registry
│   │   ├── activity-log.json        # Activity events
│   │   └── state/
│   │       ├── active/              # Active channel states
│   │       ├── idle/                # Idle channel states
│   │       └── archived/            # Archived channel states
│   │
│   ├── assimilation/                # Documentation fetching
│   │   └── assimilation.json        # Master config
│   │
│   ├── lib/                         # Utility scripts
│   │   ├── channel-lifecycle.sh     # Lifecycle state machine
│   │   └── activity-tracker.sh      # Activity recording
│   │
│   └── experts/
│       └── discovery-config.json    # Channel discovery rules
│
├── {channel-name}-docs/             # Per-channel domain folders
│   ├── .expert/                     # Channel marker
│   │   ├── expert.md                # Channel definition
│   │   ├── sources.json             # Documentation sources
│   │   ├── context-scope.md         # File boundaries
│   │   └── summary.md               # Current state snapshot
│   └── *.md                         # Assimilated documentation
│
└── scripts/
    └── assimilate.sh                # Documentation fetch orchestrator
```

---

## Channel Structure

Each channel is defined by a folder containing `.expert/` with four required files:

### expert.md

The channel definition file with model assignment and activation patterns.

```markdown
# {Channel Name} Expert Channel

---
model:
  primary: opus          # Main model for this channel
  fallback: sonnet       # Fallback if primary unavailable
  lookup: haiku          # For simple fact retrieval
  inherit: true          # Inherit from parent
  override: allowed      # Can tasks override model?
---

**Domain:** {Domain description}
**ID:** {channel-id}
**Scope:** `{folder-name}/`
**Parent:** master-architect
**Level:** 1

---

## Mission

{What this channel does}

---

## Responsibilities

- {Responsibility 1}
- {Responsibility 2}

---

## Activation Patterns

### Primary (file path)
- `{folder-name}/**`

### Secondary (keywords)
- keyword1, keyword2
- phrase with spaces

---

## Escalation Criteria

Escalate to Master Architect when:
- {Condition 1}
- {Condition 2}

---

## Roll-Up Triggers

Generate summary update when:
- {Trigger 1}
- {Trigger 2}

---

## Quality Gates

Before completing any task:
- [ ] {Gate 1}
- [ ] {Gate 2}
```

### sources.json

Documentation sources to fetch and maintain.

```json
{
  "version": "1.0.0",
  "channel": "{channel-id}",
  "description": "{Channel description}",
  "lastGlobalRefresh": null,

  "sources": [
    {
      "id": "source-id",
      "type": "web",
      "name": "Human-readable name",
      "url": "https://example.com/docs",
      "outputFile": "docs.md",
      "cadence": "weekly",
      "extractor": "html-to-markdown",
      "lastFetched": null,
      "lastSuccess": null,
      "lastError": null,
      "enabled": true
    }
  ],

  "metadata": {
    "created": "2026-01-08T00:00:00Z",
    "modified": null,
    "refreshCount": 0,
    "successCount": 0,
    "errorCount": 0
  }
}
```

#### Source Types

| Type | Description | Required Fields |
|------|-------------|-----------------|
| `web` | Fetch URL, convert to markdown | `url`, `outputFile` |
| `api` | Query API endpoint | `url`, `outputFile` |
| `command` | Execute shell command | `command`, `outputFile` |

#### Cadences

| Cadence | Use Case | Example |
|---------|----------|---------|
| `hourly` | Live data, node status | `tailscale status` |
| `daily` | Config files, local state | Server configs |
| `weekly` | Official documentation | API docs, guides |

### context-scope.md

Defines file access boundaries for the channel.

```markdown
# Context Scope: {Channel Name}

## IN SCOPE (Full Access)

Files this channel owns and can modify:

\`\`\`
{folder-name}/
├── *.md
├── *.json
└── .expert/
    ├── expert.md
    ├── sources.json
    ├── context-scope.md
    └── summary.md
\`\`\`

## SHARED READ (Read-Only)

Files this channel can read but not modify:

\`\`\`
.claude/context/
├── progress.md
├── decisions.md
└── important-context.md

CLAUDE.md
\`\`\`

## OUT OF SCOPE (No Access)

Files this channel should NOT access:

\`\`\`
.claude/skills/
.claude/enforcement/
other-channel-docs/
\`\`\`

## Sibling Channels

- **sibling-1** - Description
- **sibling-2** - Description

## Context Inheritance

This channel inherits from **master-architect**:
- Model assignment
- Routing patterns
- Quality gates
```

### summary.md

Current state snapshot, updated after significant changes.

```markdown
# {Channel Name} Summary

**Last Updated:** {date}
**Status:** Active
**Model:** opus

---

## Current State

{Current configuration, endpoints, etc.}

## Capabilities

| Capability | Status |
|------------|--------|
| Feature 1 | ✅ Active |
| Feature 2 | ⏳ Pending fetch |

---

## Documentation Sources

| Source | Type | Cadence | Last Fetch |
|--------|------|---------|------------|
| source-1 | web | weekly | {date} |

---

## Recent Changes

- **{date}:** {Change description}

---

## Decisions

| Decision | Rationale | Date |
|----------|-----------|------|
| {Decision} | {Why} | {date} |

---

## Metrics

- **Documentation files:** {count}
- **Sources configured:** {count}
- **Last successful refresh:** {date}
```

---

## Lifecycle Management

### States

```
DISCOVERED → ACTIVE → IDLE → ARCHIVED → EXTENDED → PRUNED
                ↑                           ↓
                └─── activity resumes ──────┘
                                            ↓ affinity match
                                         MERGED
```

| State | Description | Threshold |
|-------|-------------|-----------|
| **ACTIVE** | Channel receiving activity | 0 days |
| **IDLE** | No activity | 30 days |
| **ARCHIVED** | Long-term inactive | 120 days |
| **EXTENDED** | No merge candidate found | +90 days |
| **PRUNED** | Removed | 210 days total |
| **MERGED** | Combined with affinity match | When archived |

### Configuration

File: `.claude/channels/lifecycle-config.json`

```json
{
  "version": "1.0.0",
  "thresholds": {
    "idleAfterDays": 30,
    "archiveAfterDays": 120,
    "extendedHoldDays": 90,
    "pruneAfterDays": 210
  },
  "affinity": {
    "mergeThreshold": 0.65,
    "keywordOverlapWeight": 0.4,
    "filePatternWeight": 0.3,
    "dependencyWeight": 0.3
  },
  "modelDefaults": {
    "level0": "opus",
    "level1": "opus",
    "level2Plus": "sonnet",
    "lookup": "haiku",
    "fallback": "sonnet"
  }
}
```

### Lifecycle Script Usage

```bash
# Initialize a new channel
.claude/lib/channel-lifecycle.sh init {channel-id} {folder-name}

# Get channel state
.claude/lib/channel-lifecycle.sh state {channel-id}

# Transition to new state
.claude/lib/channel-lifecycle.sh transition {channel-id} {new-state}

# Record activity
.claude/lib/channel-lifecycle.sh activity {channel-id} {type} [weight]

# Check all channels for transitions
.claude/lib/channel-lifecycle.sh check

# List all channels and states
.claude/lib/channel-lifecycle.sh list
```

---

## Activity Tracking

### Activity Types and Weights

| Type | Weight | Trigger |
|------|--------|---------|
| `dispatch` | 10 | Channel receives routed task |
| `file_modification` | 5 | Files in scope modified |
| `roll_up` | 3 | Summary updated |
| `explicit_reference` | 2 | User mentions channel |
| `pattern_match` | 1 | Keyword activation |

### Activity Tracker Usage

```bash
# Record activity event
.claude/lib/activity-tracker.sh record {channel} {type} [details]

# Record file modification (auto-detects channel)
.claude/lib/activity-tracker.sh file {file-path}

# Record dispatch to channel
.claude/lib/activity-tracker.sh dispatch {channel} [task-summary]

# Record summary update
.claude/lib/activity-tracker.sh rollup {channel}

# Show activity summary for channel
.claude/lib/activity-tracker.sh summary {channel} [days]

# Show recent activity
.claude/lib/activity-tracker.sh recent [count]

# Flush old events
.claude/lib/activity-tracker.sh flush [days-to-keep]

# Initialize activity log
.claude/lib/activity-tracker.sh init
```

### Activity Log Format

File: `.claude/channels/activity-log.json`

```json
{
  "version": "1.0.0",
  "events": [
    {
      "timestamp": "2026-01-08T05:00:00Z",
      "channel": "claude-code",
      "type": "dispatch",
      "weight": 10,
      "details": "Implement new feature"
    }
  ]
}
```

---

## Documentation Assimilation

### Assimilation Script Usage

```bash
# Refresh all channels
scripts/assimilate.sh refresh

# Refresh specific channel
scripts/assimilate.sh refresh {channel-id}

# Force refresh (ignore cadence)
scripts/assimilate.sh refresh --force

# List all sources
scripts/assimilate.sh list

# Check source status
scripts/assimilate.sh status
```

### How It Works

1. **Discovery**: Script finds all `*/.expert/sources.json` files
2. **Cadence Check**: Compares `lastFetched` against `cadence` threshold
3. **Fetch**: Downloads content based on source type
4. **Extract**: Converts to markdown (for web) or stores raw (for commands)
5. **Update**: Writes to `outputFile` and updates `lastFetched`

### Source Configuration Examples

**Web Documentation:**
```json
{
  "id": "api-docs",
  "type": "web",
  "name": "API Documentation",
  "url": "https://docs.example.com/api",
  "outputFile": "api-docs.md",
  "cadence": "weekly",
  "extractor": "html-to-markdown",
  "enabled": true
}
```

**API Endpoint:**
```json
{
  "id": "models-list",
  "type": "api",
  "name": "Available Models",
  "url": "https://api.example.com/v1/models",
  "outputFile": "models.json",
  "cadence": "hourly",
  "extractor": "json",
  "enabled": true
}
```

**Shell Command:**
```json
{
  "id": "node-status",
  "type": "command",
  "name": "Node Status",
  "command": "tailscale status",
  "outputFile": "node-status.txt",
  "cadence": "hourly",
  "extractor": "raw",
  "enabled": true
}
```

---

## Model Assignment

### Hierarchy

| Level | Default Model | Use Case |
|-------|---------------|----------|
| 0 (Master Architect) | opus | Complex routing, synthesis |
| 1 (Primary Channel) | opus | Deep domain expertise |
| 2+ (Sub-channel) | sonnet | Faster execution |
| Lookup queries | haiku | Simple fact retrieval |

### Per-Channel Override

In `expert.md`:

```yaml
---
model:
  primary: opus          # Main model
  fallback: sonnet       # If primary unavailable
  lookup: haiku          # For simple queries
  inherit: true          # Inherit parent settings
  override: allowed      # Allow task-level override
  taskOverrides:
    architecture-design: opus
    code-implementation: sonnet
    simple-lookup: haiku
---
```

### Dispatch Integration

When Master Architect dispatches a task:

```python
# Pseudo-code for dispatch
channel = resolve_channel(task)
model = channel.expert.model.primary

Task(
    subagent_type="general-purpose",
    model=model,
    prompt=f"""
## Expert: {channel.id}
{channel.expert_md}

## Task
{task_description}
"""
)
```

---

## Creating New Channels

### Step 1: Create Folder Structure

```bash
mkdir -p {channel-name}-docs/.expert
```

### Step 2: Create expert.md

```bash
cat > {channel-name}-docs/.expert/expert.md << 'EOF'
# {Channel Name} Expert Channel

---
model:
  primary: opus
  fallback: sonnet
  lookup: haiku
  inherit: true
  override: allowed
---

**Domain:** {Description}
**ID:** {channel-id}
**Scope:** `{channel-name}-docs/`
**Parent:** master-architect
**Level:** 1

## Mission

{What this channel does}

## Responsibilities

- {List responsibilities}

## Activation Patterns

### Primary (file path)
- `{channel-name}-docs/**`

### Secondary (keywords)
- {keywords}

## Escalation Criteria

Escalate to Master Architect when:
- {Conditions}

## Quality Gates

Before completing any task:
- [ ] {Gates}
EOF
```

### Step 3: Create sources.json

```bash
cat > {channel-name}-docs/.expert/sources.json << 'EOF'
{
  "version": "1.0.0",
  "channel": "{channel-id}",
  "description": "{Description}",
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
```

### Step 4: Create context-scope.md

```bash
cat > {channel-name}-docs/.expert/context-scope.md << 'EOF'
# Context Scope: {Channel Name}

## IN SCOPE (Full Access)

{channel-name}-docs/
├── *.md
└── .expert/*

## SHARED READ (Read-Only)

.claude/context/*
CLAUDE.md

## OUT OF SCOPE (No Access)

.claude/skills/
other-channel-docs/
EOF
```

### Step 5: Create summary.md

```bash
cat > {channel-name}-docs/.expert/summary.md << 'EOF'
# {Channel Name} Summary

**Last Updated:** $(date +%Y-%m-%d)
**Status:** Active (newly created)
**Model:** opus

## Capabilities

| Capability | Status |
|------------|--------|
| Documentation | ⏳ Pending |

## Metrics

- **Documentation files:** 0
- **Sources configured:** 0
- **Last successful refresh:** never
EOF
```

### Step 6: Initialize in Lifecycle System

```bash
.claude/lib/channel-lifecycle.sh init {channel-id} {channel-name}-docs
```

### Step 7: Verify

```bash
.claude/lib/channel-lifecycle.sh list
```

---

## Hook Integration

### Session Start (session-enforcer.sh)

On session start:
1. Flushes activity events older than 90 days
2. Runs lifecycle check for all channels
3. Reports channels approaching state transitions

### Post-Tool (post-tool-auditor.sh)

After Edit/Write operations:
1. Detects which channel owns the modified file
2. Records `file_modification` activity
3. Updates channel's `lastActivity` timestamp
4. Reactivates idle/archived channels if they receive activity

### Adding Custom Hooks

To add lifecycle tracking to other hooks:

```bash
# In your hook script
ACTIVITY_TRACKER="/Users/arthurdell/ARTHUR/.claude/lib/activity-tracker.sh"

# Record activity
if [[ -x "$ACTIVITY_TRACKER" ]]; then
    "$ACTIVITY_TRACKER" record "{channel-id}" "{activity-type}" "{details}"
fi
```

---

## Commands Reference

### Channel Lifecycle

| Command | Description |
|---------|-------------|
| `.claude/lib/channel-lifecycle.sh init {id} {folder}` | Initialize new channel |
| `.claude/lib/channel-lifecycle.sh state {id}` | Get channel state |
| `.claude/lib/channel-lifecycle.sh transition {id} {state}` | Force state transition |
| `.claude/lib/channel-lifecycle.sh activity {id} {type} [weight]` | Record activity |
| `.claude/lib/channel-lifecycle.sh check` | Check all for transitions |
| `.claude/lib/channel-lifecycle.sh list` | List all channels |

### Activity Tracker

| Command | Description |
|---------|-------------|
| `.claude/lib/activity-tracker.sh record {ch} {type} [details]` | Record event |
| `.claude/lib/activity-tracker.sh file {path}` | Record file modification |
| `.claude/lib/activity-tracker.sh dispatch {ch} [task]` | Record dispatch |
| `.claude/lib/activity-tracker.sh rollup {ch}` | Record summary update |
| `.claude/lib/activity-tracker.sh summary {ch} [days]` | Show summary |
| `.claude/lib/activity-tracker.sh recent [count]` | Show recent events |
| `.claude/lib/activity-tracker.sh flush [days]` | Remove old events |

### Documentation Assimilation

| Command | Description |
|---------|-------------|
| `scripts/assimilate.sh refresh` | Refresh all sources |
| `scripts/assimilate.sh refresh {channel}` | Refresh specific channel |
| `scripts/assimilate.sh refresh --force` | Force refresh |
| `scripts/assimilate.sh list` | List all sources |
| `scripts/assimilate.sh status` | Check source status |

---

## Troubleshooting

### Channel Not Detected

**Symptom:** File modifications not tracked to channel

**Check:**
1. Does `{folder}/.expert/expert.md` exist?
2. Does it contain `**ID:**` field?
3. Is the folder pattern matching?

**Fix:**
```bash
# Verify expert.md format
grep "^\*\*ID:\*\*" {folder}/.expert/expert.md
```

### Lifecycle Script Errors

**Symptom:** `syntax error` or `command not found`

**Check:**
1. Script has execute permission
2. Using bash 3.2+ compatible syntax

**Fix:**
```bash
chmod +x .claude/lib/channel-lifecycle.sh
bash -n .claude/lib/channel-lifecycle.sh  # Syntax check
```

### Activity Not Recording

**Symptom:** `activity-log.json` not updating

**Check:**
1. Log file exists and is valid JSON
2. Activity tracker has execute permission

**Fix:**
```bash
.claude/lib/activity-tracker.sh init
chmod +x .claude/lib/activity-tracker.sh
```

### Documentation Not Fetching

**Symptom:** `assimilate.sh` not updating files

**Check:**
1. Source URL is accessible
2. `enabled: true` in sources.json
3. Cadence threshold not met (use `--force`)

**Fix:**
```bash
# Test URL manually
curl -s "https://example.com/docs" | head -20

# Force refresh
scripts/assimilate.sh refresh --force
```

### Channel Stuck in Wrong State

**Symptom:** Channel in archived state but should be active

**Fix:**
```bash
# Force transition to active
.claude/lib/channel-lifecycle.sh transition {channel-id} active

# Or record activity to auto-reactivate
.claude/lib/activity-tracker.sh dispatch {channel-id} "Manual reactivation"
```

---

## Current Channels

| Channel | Folder | Model | Sources | Status |
|---------|--------|-------|---------|--------|
| claude-code | `claude-code-docs/` | opus | 6 | Active |
| lm-studio | `lm-studio-docs/` | opus | 4 | Active |
| tailscale | `tailscale-docs/` | opus | 6 | Active |

---

## Future Enhancements

1. **LaunchAgent for scheduled refresh** - Automate documentation fetching
2. **Affinity calculation** - Implement keyword/file overlap scoring
3. **Auto-merge** - Automatically merge archived channels with high affinity
4. **Sub-channel creation** - Allow channels to spawn specialists
5. **Cross-channel dependencies** - Track which channels depend on others

---

*This document is the authoritative guide for the Dynamic Expert Channel System.*
