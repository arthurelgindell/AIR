# ARTHUR Implementation Manual

**Version:** 1.0.0
**Architecture:** Reference-Grade Claude Code Deployment
**Philosophy:** Filesystem-first state persistence, maximum autonomy with safety guardrails

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Directory Structure](#directory-structure)
4. [Core Configuration](#core-configuration)
5. [Enforcement System](#enforcement-system)
6. [State Persistence](#state-persistence)
7. [Cognitive DNA](#cognitive-dna)
8. [Expert Tree Architecture (HETA)](#expert-tree-architecture-heta)
9. [Daily Summary Notifications](#daily-summary-notifications)
10. [PreCompact State Capture](#precompact-state-capture)
11. [Deployment Checklist](#deployment-checklist)
12. [Customization Guide](#customization-guide)

---

## Overview

ARTHUR (Autonomous Runtime Through Unified Resources) is a reference implementation of Claude Code optimized for "vibe coding" - maximum autonomous operation with minimal user intervention.

### Core Principles

1. **Filesystem-First** - Trust disk over memory for state recovery
2. **Hard Enforcement** - Block operations that violate safety constraints
3. **Soft Guidance** - Suggest best practices without blocking
4. **Discovery-Based** - Systems adapt to project structure automatically
5. **Compounding Learning** - Cognitive DNA evolves across sessions

### Key Components

| Component | Purpose |
|-----------|---------|
| Enforcement Hooks | Pre/post tool validation and tracking |
| State Persistence | Continuous filesystem state updates |
| Cognitive DNA | Learned patterns that compound over time |
| HETA | Hierarchical expert routing based on file structure |
| Daily Summary | Automated reporting via Postmark |
| PreCompact Capture | State preservation before context compression |

---

## Prerequisites

### System Requirements

- macOS (Darwin) or Linux
- bash 3.2+ (macOS default compatible)
- jq (JSON processor)
- Python 3.8+
- Git

### Install Dependencies

```bash
# macOS
brew install jq

# Linux (Debian/Ubuntu)
sudo apt-get install jq
```

### Postmark Account (Optional)

For daily summary emails:
1. Create account at https://postmarkapp.com
2. Create a server
3. Verify sender email address
4. Obtain Server API Token

---

## Directory Structure

```
{PROJECT_ROOT}/
├── .claude/
│   ├── CLAUDE.md                    # Project memory (critical)
│   ├── settings.json                # Main configuration
│   ├── context/
│   │   ├── progress.md              # Current session progress
│   │   ├── decisions.md             # Architectural decisions log
│   │   ├── important-context.md     # Recovery survival info
│   │   ├── session-state.json       # Session metadata
│   │   ├── cognitive-dna/
│   │   │   ├── {user}-dna-profile.json
│   │   │   └── snapshots/
│   │   └── archive/                 # State file archives
│   ├── enforcement/
│   │   ├── config/
│   │   │   └── enforcement.json     # Enforcement rules
│   │   ├── state/
│   │   │   ├── enforcement-state.json
│   │   │   ├── modification-log.json
│   │   │   ├── violation-log.json
│   │   │   └── dispatch-tracker.json
│   │   └── scripts/
│   │       ├── session-enforcer.sh
│   │       ├── pre-tool-gate.sh
│   │       ├── post-tool-auditor.sh
│   │       ├── pre-prompt-validator.sh
│   │       ├── validators/
│   │       │   ├── state-validator.sh
│   │       │   ├── dna-validator.sh
│   │       │   └── heta-validator.sh
│   │       └── recovery/
│   │           ├── state-recovery.sh
│   │           ├── force-state-update.sh
│   │           └── reset-enforcement.sh
│   ├── experts/
│   │   ├── master-architect.md      # Root orchestrator
│   │   ├── discovery-config.json    # Expert discovery rules
│   │   └── domain-registry.json     # Auto-generated
│   ├── lib/
│   │   ├── discover-experts.sh      # Expert discovery engine
│   │   ├── build-registry.sh        # Registry builder
│   │   └── pre-compact-capture.sh   # State capture before compaction
│   ├── skills/
│   │   └── master-architect/
│   │       └── SKILL.md
│   └── plans/                       # Plan mode storage
├── {module}/
│   └── .expert/                     # Domain expert (optional)
│       ├── expert.md
│       ├── context-scope.md
│       └── summary.md
├── arthur/                          # Python module
│   ├── __init__.py
│   ├── config.py
│   └── notifications/
│       ├── __init__.py
│       ├── postmark.py
│       └── daily_summary.py
├── scripts/
│   ├── send_daily_summary.py
│   └── com.arthur.{node}.daily-summary.plist
└── logs/
```

---

## Core Configuration

### settings.json

Create `.claude/settings.json`:

```json
{
  "project": "{PROJECT_NAME}",
  "version": "1.0.0",
  "description": "Claude Code deployment with enforcement and state persistence",

  "permissions": {
    "defaultMode": "bypassPermissions",
    "sandboxEnabled": true,
    "safeCommands": [
      "ls", "cat", "head", "tail", "grep", "find",
      "git status", "git log", "git diff", "git show",
      "python --version", "node --version", "npm --version",
      "echo", "pwd", "which", "whoami", "date",
      "tree", "wc", "sort", "uniq"
    ],

    "policies": {
      "Bash": {
        "default": "auto-accept",
        "blocked": [
          "rm -rf /",
          "sudo rm -rf",
          "dd if=/dev/zero",
          "mkfs",
          ":(){ :|:& };:"
        ],
        "requireConfirmation": [
          "rm -rf",
          "sudo",
          "git push --force"
        ]
      },
      "Edit": { "default": "auto-accept" },
      "Write": { "default": "auto-accept" },
      "Read": { "default": "auto-accept" },
      "Glob": { "default": "auto-accept" },
      "Grep": { "default": "auto-accept" }
    }
  },

  "context": {
    "maxTokens": 200000,
    "warningThreshold": 120000,
    "compactThreshold": 160000,
    "autoCompact": false,
    "preferFreshContext": true,
    "stateFiles": {
      "progress": ".claude/context/progress.md",
      "decisions": ".claude/context/decisions.md",
      "importantContext": ".claude/context/important-context.md",
      "sessionState": ".claude/context/session-state.json"
    }
  },

  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "{PROJECT_ROOT}/.claude/enforcement/scripts/session-enforcer.sh start"
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Edit",
        "hooks": [
          {
            "type": "command",
            "command": "{PROJECT_ROOT}/.claude/enforcement/scripts/pre-tool-gate.sh edit"
          }
        ]
      },
      {
        "matcher": "Write",
        "hooks": [
          {
            "type": "command",
            "command": "{PROJECT_ROOT}/.claude/enforcement/scripts/pre-tool-gate.sh write"
          }
        ]
      },
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "{PROJECT_ROOT}/.claude/enforcement/scripts/pre-tool-gate.sh bash"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit",
        "hooks": [
          {
            "type": "command",
            "command": "{PROJECT_ROOT}/.claude/enforcement/scripts/post-tool-auditor.sh edit"
          }
        ]
      },
      {
        "matcher": "Write",
        "hooks": [
          {
            "type": "command",
            "command": "{PROJECT_ROOT}/.claude/enforcement/scripts/post-tool-auditor.sh write"
          }
        ]
      }
    ],
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "{PROJECT_ROOT}/.claude/enforcement/scripts/pre-prompt-validator.sh"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "{PROJECT_ROOT}/.claude/enforcement/scripts/session-enforcer.sh stop"
          }
        ]
      }
    ],
    "PreCompact": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "{PROJECT_ROOT}/.claude/lib/pre-compact-capture.sh"
          }
        ]
      }
    ]
  },

  "hierarchy": {
    "enabled": true,
    "discoveryBased": true,
    "markerFolder": ".expert",
    "discoveryConfig": ".claude/experts/discovery-config.json",
    "domainRegistry": ".claude/experts/domain-registry.json"
  },

  "cognitiveDNA": {
    "enabled": true,
    "profilePath": ".claude/context/cognitive-dna/{user}-dna-profile.json",
    "evolutionEnabled": true
  }
}
```

**Note:** Replace `{PROJECT_ROOT}`, `{PROJECT_NAME}`, and `{user}` with actual values.

---

## Enforcement System

### enforcement.json

Create `.claude/enforcement/config/enforcement.json`:

```json
{
  "enforcement": {
    "enabled": true,
    "mode": "active",

    "statePersistence": {
      "enabled": true,
      "level": "hard",
      "requiredFiles": ["progress.md", "decisions.md", "important-context.md"],
      "staleThreshold": 3600
    },

    "cognitiveDNA": {
      "enabled": true,
      "level": "hard",
      "profilePath": ".claude/context/cognitive-dna/{user}-dna-profile.json"
    },

    "hetaRouting": {
      "enabled": true,
      "level": "soft",
      "rollUpThreshold": 3,
      "contextIsolation": true
    },

    "thresholds": {
      "modificationWarning": 5,
      "modificationBlock": 10
    }
  }
}
```

### session-enforcer.sh

Create `.claude/enforcement/scripts/session-enforcer.sh`:

```bash
#!/bin/bash
# Session Enforcer - Start/Stop hooks
set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
ENFORCEMENT_DIR="$PROJECT_ROOT/.claude/enforcement"
CONTEXT_DIR="$PROJECT_ROOT/.claude/context"
STATE_FILE="$ENFORCEMENT_DIR/state/enforcement-state.json"

MODE="${1:-start}"

case "$MODE" in
    start)
        # Validate required state files exist
        for file in progress.md decisions.md important-context.md; do
            if [[ ! -f "$CONTEXT_DIR/$file" ]]; then
                echo "ERROR: Required state file missing: $file" >&2
                exit 1
            fi
        done

        # Initialize enforcement state
        mkdir -p "$ENFORCEMENT_DIR/state"
        cat > "$STATE_FILE" << EOF
{
  "sessionId": "session_$(date +%Y%m%d_%H%M%S)",
  "startTime": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "toolCalls": 0,
  "fileModifications": 0,
  "significantActions": 0,
  "violations": []
}
EOF
        echo "Session initialized"
        ;;

    stop)
        # Archive session state
        if [[ -f "$STATE_FILE" ]]; then
            SESSION_ID=$(jq -r '.sessionId' "$STATE_FILE")
            mkdir -p "$ENFORCEMENT_DIR/state/archive"
            cp "$STATE_FILE" "$ENFORCEMENT_DIR/state/archive/${SESSION_ID}.json"
        fi
        echo "Session finalized"
        ;;
esac
```

### pre-tool-gate.sh

Create `.claude/enforcement/scripts/pre-tool-gate.sh`:

```bash
#!/bin/bash
# Pre-Tool Gate - Validates before tool execution
set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
ENFORCEMENT_DIR="$PROJECT_ROOT/.claude/enforcement"
STATE_FILE="$ENFORCEMENT_DIR/state/enforcement-state.json"
CONFIG_FILE="$ENFORCEMENT_DIR/config/enforcement.json"

TOOL_TYPE="${1:-unknown}"

# Skip read-only tools
case "$TOOL_TYPE" in
    read|glob|grep) exit 0 ;;
esac

# Check modification threshold
if [[ -f "$STATE_FILE" && -f "$CONFIG_FILE" ]]; then
    MODS=$(jq -r '.fileModifications // 0' "$STATE_FILE")
    WARN_THRESHOLD=$(jq -r '.enforcement.thresholds.modificationWarning // 5' "$CONFIG_FILE")
    BLOCK_THRESHOLD=$(jq -r '.enforcement.thresholds.modificationBlock // 10' "$CONFIG_FILE")

    if [[ "$MODS" -ge "$BLOCK_THRESHOLD" ]]; then
        echo "BLOCKED: $MODS modifications without progress.md update" >&2
        echo "Run: force-state-update.sh to reset counter" >&2
        exit 1
    elif [[ "$MODS" -ge "$WARN_THRESHOLD" ]]; then
        echo "WARNING: $MODS modifications - update progress.md soon" >&2
    fi
fi

# Increment tool call counter
if [[ -f "$STATE_FILE" ]]; then
    jq '.toolCalls += 1' "$STATE_FILE" > "${STATE_FILE}.tmp" && mv "${STATE_FILE}.tmp" "$STATE_FILE"
fi
```

### post-tool-auditor.sh

Create `.claude/enforcement/scripts/post-tool-auditor.sh`:

```bash
#!/bin/bash
# Post-Tool Auditor - Logs modifications after tool execution
set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
ENFORCEMENT_DIR="$PROJECT_ROOT/.claude/enforcement"
STATE_FILE="$ENFORCEMENT_DIR/state/enforcement-state.json"
MOD_LOG="$ENFORCEMENT_DIR/state/modification-log.json"

TOOL_TYPE="${1:-unknown}"

# Initialize modification log if needed
if [[ ! -f "$MOD_LOG" ]]; then
    echo '{"modifications":[]}' > "$MOD_LOG"
fi

# Log modification
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
jq ".modifications += [{\"timestamp\":\"$TIMESTAMP\",\"tool\":\"$TOOL_TYPE\"}]" "$MOD_LOG" > "${MOD_LOG}.tmp" && mv "${MOD_LOG}.tmp" "$MOD_LOG"

# Increment modification counter
if [[ -f "$STATE_FILE" ]]; then
    jq '.fileModifications += 1' "$STATE_FILE" > "${STATE_FILE}.tmp" && mv "${STATE_FILE}.tmp" "$STATE_FILE"
fi
```

### state-validator.sh

Create `.claude/enforcement/scripts/validators/state-validator.sh`:

```bash
#!/bin/bash
# State Validator - Validates state file existence and freshness
set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}}")/../../../.." && pwd)"
CONTEXT_DIR="$PROJECT_ROOT/.claude/context"
STALE_THRESHOLD=${STALE_THRESHOLD:-3600}  # 1 hour default

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "\n${GREEN}STATE VALIDATION${NC}"
echo "═══════════════════════════════════════════════════════════"

EXIT_CODE=0

# Check file existence
echo -e "\n${GREEN}File Existence:${NC}"
for file in progress.md decisions.md important-context.md; do
    if [[ -f "$CONTEXT_DIR/$file" ]]; then
        echo -e "${GREEN}✅ $file exists${NC}"
    else
        echo -e "${RED}❌ $file MISSING${NC}"
        EXIT_CODE=1
    fi
done

# Check freshness
echo -e "\n${GREEN}File Freshness:${NC}"
CURRENT_TIME=$(date +%s)

for file in progress.md decisions.md important-context.md; do
    if [[ -f "$CONTEXT_DIR/$file" ]]; then
        MOD_TIME=$(stat -f %m "$CONTEXT_DIR/$file" 2>/dev/null || stat -c %Y "$CONTEXT_DIR/$file" 2>/dev/null)
        AGE=$((CURRENT_TIME - MOD_TIME))

        if [[ "$AGE" -lt "$STALE_THRESHOLD" ]]; then
            echo -e "${GREEN}✅ $file is fresh${NC}"
        else
            HOURS=$((AGE / 3600))
            MINS=$(((AGE % 3600) / 60))
            echo -e "${YELLOW}⚠️  $file is stale (${HOURS}h ${MINS}m old)${NC}"
            EXIT_CODE=2
        fi
    fi
done

exit $EXIT_CODE
```

---

## State Persistence

### progress.md Template

Create `.claude/context/progress.md`:

```markdown
# Session Progress

**Last Updated:** {timestamp}
**Session ID:** {session_id}

## Current Status

{status description}

## Completed This Session

- [ ] {task 1}
- [ ] {task 2}

## In Progress

- [ ] {current task}

## Next Steps

1. {next step}

## Blockers

- None

---

*Update this file after significant actions*
```

### decisions.md Template

Create `.claude/context/decisions.md`:

```markdown
# Decision Log

Architectural and configuration decisions with rationale.

---

## {Date}: {Decision Title}

**Decision:** {what was decided}

**Rationale:** {why}

**Alternatives Considered:**
- {alternative 1}
- {alternative 2}

**Impact:** {what this affects}

---

*Append new decisions - do not overwrite*
```

### important-context.md Template

Create `.claude/context/important-context.md`:

```markdown
# Important Context

Critical information that must survive context resets.

## Project Identity

- **Name:** {project name}
- **Type:** {project type}
- **Root:** {project root path}

## Recovery Instructions

After context reset:
1. Read this file first
2. Read progress.md for current status
3. Read decisions.md for architectural context
4. Check git log for recent changes

## Critical Paths

- Configuration: .claude/settings.json
- State: .claude/context/
- Enforcement: .claude/enforcement/

## Key Constraints

- {constraint 1}
- {constraint 2}
```

---

## Cognitive DNA

### DNA Profile Template

Create `.claude/context/cognitive-dna/{user}-dna-profile.json`:

```json
{
  "version": "1.0.0",
  "user": "{user}",
  "created": "{timestamp}",
  "lastUpdated": "{timestamp}",

  "feedbackHistory": {
    "totalSessions": 0,
    "successfulInteractions": 0,
    "correctionsReceived": 0,
    "successRate": 0
  },

  "strengths": {
    "technical": [],
    "communication": [],
    "problemSolving": []
  },

  "limitations": {
    "known": [],
    "augmentationStrategies": {}
  },

  "preferences": {
    "platform": [],
    "languages": [],
    "tools": [],
    "workflow": []
  },

  "patterns": {
    "successful": [],
    "toAvoid": []
  }
}
```

### dna-validator.sh

Create `.claude/enforcement/scripts/validators/dna-validator.sh`:

```bash
#!/bin/bash
# DNA Validator - Enforces learned patterns
set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}}")/../../../.." && pwd)"
DNA_PROFILE="$PROJECT_ROOT/.claude/context/cognitive-dna"

# Find DNA profile
DNA_FILE=$(find "$DNA_PROFILE" -name "*-dna-profile.json" -type f 2>/dev/null | head -1)

if [[ -z "$DNA_FILE" || ! -f "$DNA_FILE" ]]; then
    echo "No DNA profile found"
    exit 0
fi

# Load patterns to avoid
PATTERNS_TO_AVOID=$(jq -r '.patterns.toAvoid[]?' "$DNA_FILE" 2>/dev/null)

# Check content passed via stdin or argument
CONTENT="${1:-$(cat)}"

for pattern in $PATTERNS_TO_AVOID; do
    if echo "$CONTENT" | grep -qi "$pattern"; then
        echo "DNA VIOLATION: Pattern '$pattern' should be avoided" >&2
        exit 1
    fi
done

exit 0
```

---

## Expert Tree Architecture (HETA)

### discovery-config.json

Create `.claude/experts/discovery-config.json`:

```json
{
  "discovery": {
    "markerFolder": ".expert",
    "requiredFiles": ["expert.md"],
    "scanDepth": 5,
    "cacheRegistry": true
  },
  "excludePaths": [
    "node_modules",
    "__pycache__",
    ".git",
    "venv",
    ".venv",
    "build",
    "dist"
  ],
  "routing": {
    "primaryMethod": "file-path",
    "secondaryMethod": "keywords",
    "ambiguityThreshold": 0.4
  }
}
```

### discover-experts.sh

Create `.claude/lib/discover-experts.sh`:

```bash
#!/bin/bash
# Expert Discovery Engine
set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CONFIG_FILE="$PROJECT_ROOT/.claude/experts/discovery-config.json"

MARKER_FOLDER=".expert"
SCAN_DEPTH=5

# Get expert ID from folder name
get_expert_id() {
    local folder_name="$1"
    echo "$folder_name" | tr '_' '-' | tr '[:upper:]' '[:lower:]'
}

# Discover all experts
discover_experts() {
    echo "["
    local first=true

    while IFS= read -r expert_dir; do
        local domain_path=$(dirname "$expert_dir")
        local domain_name=$(basename "$domain_path")
        local expert_id=$(get_expert_id "$domain_name")
        local relative_path="${domain_path#$PROJECT_ROOT/}"

        if [[ "$first" != "true" ]]; then
            echo ","
        fi
        first=false

        cat << EOF
  {
    "id": "$expert_id",
    "name": "$domain_name",
    "domainPath": "$relative_path",
    "expertPath": "$relative_path/.expert"
  }
EOF
    done < <(find "$PROJECT_ROOT" -maxdepth "$SCAN_DEPTH" -type d -name "$MARKER_FOLDER" 2>/dev/null | grep -v node_modules | grep -v __pycache__)

    echo "]"
}

# Main
case "${1:-list}" in
    list|summary)
        echo "EXPERT DISCOVERY"
        echo "Scan root: $PROJECT_ROOT"
        discover_experts | jq -r '.[] | "  • \(.id) (\(.domainPath))"'
        ;;
    json)
        discover_experts
        ;;
esac
```

### Domain Expert Template

Create `{module}/.expert/expert.md`:

```markdown
# {Module Name} Expert

**Domain:** {description}
**ID:** {module-id}
**Scope:** {module}/
**Parent:** master-architect
**Level:** 1

## Responsibilities

- {responsibility 1}
- {responsibility 2}

## Activation Patterns

**Primary (file path):**
- `{module}/**`

**Secondary (keywords):**
- {keyword1}, {keyword2}, {keyword3}

## Context Budget

30,000 tokens

## Dependencies

**Provides:**
- {what this domain offers}

**Requires:**
- {what this domain needs}
```

---

## Daily Summary Notifications

### config.py

Create `arthur/config.py`:

```python
import os
from dataclasses import dataclass, field
from pathlib import Path

@dataclass
class PostmarkConfig:
    server_token: str = field(default_factory=lambda: os.getenv("POSTMARK_SERVER_TOKEN", ""))
    default_sender: str = "{sender}@{domain}"
    default_recipient: str = "{recipient}@{domain}"
    message_stream: str = "outbound"

@dataclass
class ProjectConfig:
    root: Path = Path("{PROJECT_ROOT}")
    context_dir: Path = field(default_factory=lambda: Path("{PROJECT_ROOT}/.claude/context"))
    logs_dir: Path = field(default_factory=lambda: Path("{PROJECT_ROOT}/logs"))

POSTMARK = PostmarkConfig()
PROJECT = ProjectConfig()
```

### postmark.py

Create `arthur/notifications/postmark.py`:

```python
"""Postmark Email Client"""

import os
import json
import logging
from dataclasses import dataclass
from typing import Optional
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

logger = logging.getLogger(__name__)

@dataclass
class EmailResult:
    success: bool
    message_id: Optional[str] = None
    error: Optional[str] = None
    to: Optional[str] = None

class PostmarkNotifier:
    API_URL = "https://api.postmarkapp.com/email"

    def __init__(self, server_token: Optional[str] = None):
        self.server_token = server_token or os.getenv("POSTMARK_SERVER_TOKEN", "")

    def send(self, to: str, subject: str, body: str,
             from_addr: Optional[str] = None, tag: Optional[str] = None) -> EmailResult:
        if not self.server_token:
            return EmailResult(success=False, error="No server token", to=to)

        payload = {
            "From": from_addr or to,
            "To": to,
            "Subject": subject,
            "TextBody": body,
            "MessageStream": "outbound"
        }
        if tag:
            payload["Tag"] = tag

        try:
            request = Request(
                self.API_URL,
                data=json.dumps(payload).encode("utf-8"),
                headers={
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                    "X-Postmark-Server-Token": self.server_token
                },
                method="POST"
            )
            with urlopen(request, timeout=30) as response:
                result = json.loads(response.read().decode("utf-8"))
                return EmailResult(success=True, message_id=result.get("MessageID"), to=to)
        except (HTTPError, URLError) as e:
            return EmailResult(success=False, error=str(e), to=to)

    def send_daily_summary(self, to: str, subject: str, body: str,
                           from_addr: Optional[str] = None) -> EmailResult:
        return self.send(to=to, subject=subject, body=body, from_addr=from_addr, tag="daily-summary")
```

### daily_summary.py

Create `arthur/notifications/daily_summary.py`:

```python
"""Daily Summary Generator - Node Agnostic"""

import os
import re
import subprocess
import socket
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional
import logging

logger = logging.getLogger(__name__)

# Configure these for your deployment
NODE_ID = os.getenv("NODE_ID", socket.gethostname().split('.')[0].upper())
NODE_ROLE = os.getenv("NODE_ROLE", "Automation Node")
PROJECT_ROOT = Path(os.getenv("PROJECT_ROOT", os.getcwd()))
CONTEXT_DIR = PROJECT_ROOT / ".claude" / "context"

@dataclass
class DailySummary:
    date: datetime
    node_id: str = NODE_ID
    images_created: int = 0
    videos_created: int = 0
    tasks_completed: list[str] = field(default_factory=list)
    decisions_made: list[str] = field(default_factory=list)
    infrastructure_status: dict[str, str] = field(default_factory=dict)
    commits: list[str] = field(default_factory=list)
    commit_count: int = 0
    uptime_hours: float = 0.0
    disk_free_gb: float = 0.0

def _parse_progress_file() -> list[str]:
    progress_file = CONTEXT_DIR / "progress.md"
    if not progress_file.exists():
        return []
    tasks = []
    try:
        content = progress_file.read_text()
        for match in re.finditer(r'-\s*\[x\]\s*(.+)', content, re.IGNORECASE):
            task = match.group(1).strip()
            if task and len(task) > 3:
                tasks.append(task[:100])
    except Exception as e:
        logger.warning(f"Error parsing progress.md: {e}")
    return tasks[:10]

def _get_git_commits() -> tuple[list[str], int]:
    commits = []
    count = 0
    try:
        result = subprocess.run(
            ["git", "log", "--since=24 hours ago", "--oneline", "--no-merges"],
            cwd=PROJECT_ROOT, capture_output=True, text=True, timeout=10
        )
        if result.returncode == 0 and result.stdout.strip():
            lines = result.stdout.strip().split('\n')
            count = len(lines)
            for line in lines[:5]:
                parts = line.split(' ', 1)
                if len(parts) > 1:
                    commits.append(parts[1][:60])
    except Exception as e:
        logger.warning(f"Error getting git commits: {e}")
    return commits, count

def generate_daily_summary(lookback_hours: int = 24) -> DailySummary:
    summary = DailySummary(date=datetime.now(), node_id=NODE_ID)
    summary.tasks_completed = _parse_progress_file()
    summary.commits, summary.commit_count = _get_git_commits()
    return summary

def format_email_body(summary: DailySummary) -> str:
    date_str = summary.date.strftime("%Y-%m-%d")
    time_str = summary.date.strftime("%H:%M")

    lines = [
        f"[{summary.node_id}] Daily Summary - {date_str}",
        "=" * 50,
        "",
        f"Node: {summary.node_id}",
        "",
    ]

    if summary.tasks_completed:
        lines.append("COMPLETED:")
        for task in summary.tasks_completed[:5]:
            lines.append(f"  [x] {task}")
        lines.append("")

    if summary.commit_count > 0:
        lines.append(f"COMMITS: {summary.commit_count}")
        for commit in summary.commits[:3]:
            lines.append(f"  - {commit}")
        lines.append("")

    lines.append(f"Generated at {time_str}")
    return "\n".join(lines)

def format_email_subject(summary: DailySummary) -> str:
    date_str = summary.date.strftime("%Y-%m-%d")
    return f"[{summary.node_id}] Daily Summary - {date_str}"
```

### send_daily_summary.py

Create `scripts/send_daily_summary.py`:

```python
#!/usr/bin/env python3
"""Daily Summary Email - Node Agnostic Entry Point"""

import os
import sys
import argparse
import logging
from datetime import datetime

PROJECT_ROOT = os.getenv("PROJECT_ROOT", os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, PROJECT_ROOT)

from arthur.notifications.daily_summary import generate_daily_summary, format_email_body, format_email_subject
from arthur.notifications.postmark import PostmarkNotifier
from arthur.config import POSTMARK

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

def main():
    parser = argparse.ArgumentParser(description="Send daily summary email")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--to", type=str, default=POSTMARK.default_recipient)
    parser.add_argument("--hours", type=int, default=24)
    args = parser.parse_args()

    summary = generate_daily_summary(lookback_hours=args.hours)
    subject = format_email_subject(summary)
    body = format_email_body(summary)

    print(f"\nSubject: {subject}\n")
    print(body)

    if args.dry_run:
        logger.info("DRY RUN - Email not sent")
        return

    server_token = os.getenv("POSTMARK_SERVER_TOKEN", "")
    if not server_token:
        logger.error("POSTMARK_SERVER_TOKEN not set")
        sys.exit(1)

    notifier = PostmarkNotifier(server_token=server_token)
    result = notifier.send_daily_summary(
        to=args.to, subject=subject, body=body, from_addr=POSTMARK.default_sender
    )

    if result.success:
        logger.info(f"Email sent: {result.message_id}")
    else:
        logger.error(f"Failed: {result.error}")
        sys.exit(1)

if __name__ == "__main__":
    main()
```

### launchd plist Template (macOS)

Create `scripts/com.{project}.{node}.daily-summary.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.{project}.{node}.daily-summary</string>

    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/python3</string>
        <string>{PROJECT_ROOT}/scripts/send_daily_summary.py</string>
    </array>

    <key>StartCalendarInterval</key>
    <dict>
        <key>Hour</key>
        <integer>8</integer>
        <key>Minute</key>
        <integer>0</integer>
    </dict>

    <key>EnvironmentVariables</key>
    <dict>
        <key>POSTMARK_SERVER_TOKEN</key>
        <string>{your-token}</string>
        <key>PROJECT_ROOT</key>
        <string>{PROJECT_ROOT}</string>
        <key>NODE_ID</key>
        <string>{NODE}</string>
    </dict>

    <key>WorkingDirectory</key>
    <string>{PROJECT_ROOT}</string>

    <key>StandardOutPath</key>
    <string>{PROJECT_ROOT}/logs/{node}-daily-summary.log</string>

    <key>StandardErrorPath</key>
    <string>{PROJECT_ROOT}/logs/{node}-daily-summary.err</string>
</dict>
</plist>
```

---

## PreCompact State Capture

### pre-compact-capture.sh

Create `.claude/lib/pre-compact-capture.sh`:

```bash
#!/bin/bash
# Pre-Compact State Capture - Node Agnostic
set -e

PROJECT_ROOT="${PROJECT_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
CONTEXT_DIR="$PROJECT_ROOT/.claude/context"
ENFORCEMENT_DIR="$PROJECT_ROOT/.claude/enforcement"
ARCHIVE_BASE="$CONTEXT_DIR/archive"
DNA_DIR="$CONTEXT_DIR/cognitive-dna"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DATE_READABLE=$(date +"%Y-%m-%d %H:%M:%S")
ARCHIVE_DIR="$ARCHIVE_BASE/compact-$TIMESTAMP"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PRE-COMPACT STATE CAPTURE"
echo "Timestamp: $DATE_READABLE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Create archive
mkdir -p "$ARCHIVE_DIR"

# Archive state files
for file in progress.md decisions.md important-context.md session-state.json; do
    [[ -f "$CONTEXT_DIR/$file" ]] && cp "$CONTEXT_DIR/$file" "$ARCHIVE_DIR/"
done

# Archive DNA
if [[ -d "$DNA_DIR" ]]; then
    mkdir -p "$ARCHIVE_DIR/cognitive-dna"
    cp "$DNA_DIR"/*.json "$ARCHIVE_DIR/cognitive-dna/" 2>/dev/null || true
fi

# Archive enforcement state
[[ -f "$ENFORCEMENT_DIR/state/enforcement-state.json" ]] && \
    cp "$ENFORCEMENT_DIR/state/enforcement-state.json" "$ARCHIVE_DIR/"

# Get session stats
TOOL_CALLS=0
FILE_MODS=0
if [[ -f "$ENFORCEMENT_DIR/state/enforcement-state.json" ]]; then
    TOOL_CALLS=$(jq -r '.toolCalls // 0' "$ENFORCEMENT_DIR/state/enforcement-state.json" 2>/dev/null || echo "0")
    FILE_MODS=$(jq -r '.fileModifications // 0' "$ENFORCEMENT_DIR/state/enforcement-state.json" 2>/dev/null || echo "0")
fi

# Mark compaction in progress.md
if [[ -f "$CONTEXT_DIR/progress.md" ]]; then
    cat >> "$CONTEXT_DIR/progress.md" << EOF

---
## Compaction: $DATE_READABLE
Tools: $TOOL_CALLS | Mods: $FILE_MODS | Archive: compact-$TIMESTAMP
---
EOF
fi

# Output recovery instructions
echo ""
echo "COMPACTION COMPLETE"
echo "Archive: $ARCHIVE_DIR"
echo ""
echo "Recovery:"
echo "  1. Read .claude/context/progress.md"
echo "  2. Read .claude/context/decisions.md"
echo ""
echo "Stats: Tools=$TOOL_CALLS Mods=$FILE_MODS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
```

---

## Deployment Checklist

### Initial Setup

```bash
# 1. Set project root
export PROJECT_ROOT="/path/to/your/project"
cd "$PROJECT_ROOT"

# 2. Create directory structure
mkdir -p .claude/{context,enforcement/{config,state,scripts/{validators,recovery}},experts,lib,skills,plans}
mkdir -p .claude/context/{cognitive-dna/snapshots,archive}
mkdir -p arthur/notifications scripts logs

# 3. Create __init__.py files
touch arthur/__init__.py
touch arthur/notifications/__init__.py

# 4. Make scripts executable
chmod +x .claude/enforcement/scripts/*.sh
chmod +x .claude/enforcement/scripts/validators/*.sh
chmod +x .claude/enforcement/scripts/recovery/*.sh
chmod +x .claude/lib/*.sh
chmod +x scripts/*.py

# 5. Initialize state files
touch .claude/context/progress.md
touch .claude/context/decisions.md
touch .claude/context/important-context.md

# 6. Test enforcement
.claude/enforcement/scripts/session-enforcer.sh start
.claude/enforcement/scripts/validators/state-validator.sh

# 7. Test daily summary (dry run)
python3 scripts/send_daily_summary.py --dry-run

# 8. Install launchd service (macOS)
cp scripts/com.*.plist ~/Library/LaunchAgents/
launchctl load ~/Library/LaunchAgents/com.*.daily-summary.plist
```

### Verification Commands

```bash
# Check enforcement state
cat .claude/enforcement/state/enforcement-state.json | jq

# Validate state files
.claude/enforcement/scripts/validators/state-validator.sh

# Discover experts
.claude/lib/discover-experts.sh summary

# Test PreCompact
.claude/lib/pre-compact-capture.sh

# Check launchd service
launchctl list | grep daily-summary
```

---

## Customization Guide

### Adding Platform-Specific Constraints

Edit `.claude/enforcement/scripts/validators/dna-validator.sh`:

```bash
# Example: Block CUDA on Apple Silicon
BLOCKED_PATTERNS="torch.cuda .cuda() cuda:0 CUDA cudnn nvidia"
REQUIRED_ALTERNATIVES="mps CoreML MLX Metal"
```

### Adding New Enforcement Rules

Edit `.claude/enforcement/config/enforcement.json`:

```json
{
  "enforcement": {
    "customRules": {
      "blockPatterns": ["pattern1", "pattern2"],
      "requirePatterns": ["required1", "required2"],
      "warnPatterns": ["warn1", "warn2"]
    }
  }
}
```

### Adding New Domain Experts

```bash
# Create expert folder
mkdir -p {module}/.expert

# Create expert.md with required fields
cat > {module}/.expert/expert.md << 'EOF'
# {Module} Expert

**Domain:** {description}
**ID:** {module-id}
**Scope:** {module}/

## Activation Patterns
- {keyword1}, {keyword2}
EOF

# Rebuild registry
.claude/lib/build-registry.sh build
```

### Multi-Node Deployment

For each node:

1. Clone the repository
2. Set `NODE_ID` environment variable
3. Configure node-specific paths in `config.py`
4. Install node-specific launchd/cron jobs
5. Use same Postmark account with different tags per node

```bash
# Node-specific environment
export NODE_ID="ALPHA"
export PROJECT_ROOT="/data/arthur"
export POSTMARK_SERVER_TOKEN="xxx"
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Hook not running | Check file permissions: `chmod +x script.sh` |
| State validation failing | Run: `state-recovery.sh` |
| DNA profile not found | Create template in `cognitive-dna/` |
| Email not sending | Verify `POSTMARK_SERVER_TOKEN` is set |
| Expert not discovered | Ensure `.expert/expert.md` exists |
| launchd not running | Check: `launchctl list \| grep {label}` |

---

## Support

- **Issues:** Report at project repository
- **Logs:** Check `logs/` directory
- **State:** Inspect `.claude/enforcement/state/`

---

*ARTHUR - Autonomous Runtime Through Unified Resources*
