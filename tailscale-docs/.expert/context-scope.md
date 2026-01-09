# Context Scope: Tailscale Channel

## IN SCOPE (Full Access)

Files this channel owns and can modify:

```
tailscale-docs/
├── *.md                    # All documentation files
├── *.txt                   # Command output files
└── .expert/               # Channel metadata
    ├── expert.md
    ├── sources.json
    ├── context-scope.md
    └── summary.md
```

## SHARED READ (Read-Only)

Files this channel can read but not modify:

```
.claude/context/
├── progress.md             # Current session state
├── decisions.md            # Architectural decisions
├── important-context.md    # Critical recovery info
└── cognitive-dna/          # DNA profile patterns

.claude/settings.json       # Claude Code configuration reference
CLAUDE.md                   # Project memory reference
```

## OUT OF SCOPE (No Access)

Files this channel should NOT access:

```
.claude/skills/             # Skill definitions (Master Architect domain)
.claude/enforcement/        # Enforcement scripts
.claude/experts/            # Expert registry (Master Architect domain)
.claude/channels/           # Channel lifecycle (system domain)

mj_automation/              # MJ Automation channel domain
lm-studio-docs/             # LM Studio channel domain
claude-code-docs/           # Claude Code channel domain
```

## Sibling Channels

- **claude-code** - Anthropic documentation, Claude API, prompt engineering
- **lm-studio** - Local model inference, API integration

## Context Inheritance

This channel inherits from **master-architect**:
- Model assignment (opus, can override)
- Routing patterns
- Quality gates

Plus applies **Cognitive DNA** patterns:
- Apple Silicon Native (95%) - Use Metal/CoreML examples
- Communication (72.7%) - Detailed explanations with code
- Problem-Solving (72.5%) - Sequential validation steps
