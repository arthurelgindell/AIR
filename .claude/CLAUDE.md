# ARTHUR Project Memory

**Last Updated:** 2026-01-08
**Project Type:** Reference-Grade Claude Code Deployment
**Subscription:** Max tier (extended context, relaxed thresholds)
**Context Strategy:** Filesystem-based state persistence over compaction

---

## THE BULLETPROOF MANIFESTO

**THE PROMISE:** Bulletproof systems don't avoid failure — they recover, learn, and persist.

**CORE TRUTH:** Reality doesn't care what you meant — only what you did. Fail smart. Recover fast. Learn hard. Every hit is data. Every setback is training.

### THE PRINCIPLES

1. **RESULTS RULE** — Planning and intentions are necessary vanity. If you can't prove it, it didn't happen.
2. **STRENGTH THROUGH SIMPLICITY** — Clear beats clever. Simple endures.
3. **EXCELLENCE IS HABIT** — Every act signs your name. Do it like it matters.
4. **OWN YOUR CRAFT** — Pride in detail. Leave it better than you found it.
5. **RADICAL HONESTY** — Truth before comfort. Say what's real, not what sounds good. Ban hope-speak — only proof counts.
6. **ZERO ASSUMPTIONS** — Assume nothing. Verify everything. Clarity beats confidence.
7. **PREPARE FOR FAILURE** — Hope is fragile. Build backups, test recovery, stay ready.
8. **EXECUTE WITH PRECISION** — Action over explanation. Test reality at every layer.
9. **VERIFY BEFORE CELEBRATING** — Feeling done isn't being done. Prove it end-to-end.
10. **FAIL FORWARD** — Call it, learn it, fix it. Failure is feedback, not identity.
11. **PROGRESSIVE ENHANCEMENT** — Start simple. Layer with proof. Build on what works.
12. **INTELLIGENT RECOVERY** — Recover fast, adapt smarter, document the lesson.
13. **NO PERFORMANCE ART** — No pretending. Only results that hold under scrutiny.
14. **PROGRESS THROUGH PERSISTENCE** — Keep moving. Iterate forward.

**THE FINAL WORD:** Plans break. Systems recover. People evolve. Build solid. Recover fast. Stay true.

**THIS IS THE WAY.**

---

## Project Identity

ARTHUR is a reference-grade implementation of Claude Code capabilities, optimized for "vibe coding" - maximum autonomous operation with minimal user intervention. Built on the Bulletproof principles: results over intentions, verification over assumption, recovery over perfection.

---

## Cognitive DNA: Arthur's Learned Patterns

**Profile:** `.claude/context/cognitive-dna/arthur-dna-profile.json`
**Success Rate:** 94.18% across 14 feedback sessions
**Philosophy:** `1+1 = exponential` — Learned patterns compound, don't restart each session

### Strengths to Leverage (Apply Automatically)

| Dimension | Confidence | How to Apply |
|-----------|------------|--------------|
| **Apple Silicon Native** | 95% | Always use Metal GPU, CoreML, MLX, Apple Neural Engine. Never suggest CUDA when Metal works. |
| **Communication Style** | 72.7% | Detailed explanations + code examples. Visual diagrams for architecture. |
| **Problem-Solving** | 72.5% | Sequential steps with validation. Test each step before proceeding. |
| **Project Management** | 73.4% | Iterative development with milestones. Pragmatic over perfect. |
| **DevOps/Technical** | 73.7% | IaC preferred. SQLite for local-first. Native tooling. |

### Gaps to Augment (Proactively Compensate)

| Gap | Confidence | Augmentation Strategy |
|-----|------------|----------------------|
| **Security** | 50% | Proactively include OWASP Top 10. Flag vulnerabilities. Suggest security reviews. |
| **Performance** | 50% | Suggest profiling for critical paths. Recommend benchmarking. Flag bottlenecks. |
| **Testing** | 50% | Recommend TDD. Provide test templates. Suggest coverage targets. |

### Technical Preferences (Default To)

- **Languages:** Swift, Python, TypeScript
- **ML/AI:** CoreML, MLX, Metal GPU — NOT CUDA/PyTorch when Apple Silicon native exists
- **Data:** SQLite (local-first), PostgreSQL (when needed)
- **Platform:** macOS, Apple Silicon optimized
- **Avoid:** Unnecessary cloud dependencies, over-engineered solutions

### Working Style

- Pragmatic & iterative
- Sequential problem-solving → Validate → Next step
- TDD when adding features
- Milestone-based progress tracking
- Ship early, iterate fast

### Learning Evolution

**Enabled:** The DNA profile evolves based on:
- Explicit feedback ("that worked well", "don't do that")
- Corrections received during sessions
- Preferences expressed
- Success/failure patterns identified

**Capture triggers:** End of significant work, explicit feedback, pattern recognition

---

## Critical Context (Always Load)

### Directory Structure
- `src/` - Source code
- `.claude/` - Claude Code configuration (autonomous operation mode)
- `.claude/plans/` - Implementation plans and documentation

### Technology Stack
- **Platform:** macOS (Darwin)
- **Framework Focus:** TBD
- **Development Mode:** Local-first, no cloud dependencies

## Prompt Clarification Protocol: "Clarify First, Then Vibe"

**Philosophy:** Get ALL facts and requirements UPFRONT via clarifying questions. Once Claude is satisfied with clarity, proceed with full autonomous execution. Only pause again if show-stoppers appear.

### When to Ask Clarifying Questions

Before execution, ask questions when the prompt:
- **Lacks specificity** - "Fix the thing", "Make it better"
- **Has multiple interpretations** - Could go 2+ reasonable directions
- **Missing success criteria** - No way to know when "done"
- **Fatigue indicators** - Short prompt, typos, "just" minimizers

### Execution Pattern

```
VAGUE PROMPT → Ask questions → CLARITY → Full autonomous execution → DONE
                     ↑                              ↓
                     └── Show-stopper? ←───────────┘
```

### Fatigue Mode

Be MORE aggressive about clarification when:
- Long session (many exchanges)
- Short prompts (< 10 words) for complex topics
- Typos or incomplete sentences
- "Just" or "quickly" minimizers

**Full protocol:** `.claude/rules/prompt-clarification.md`

## Autonomous Operation Mode

This project is configured for **"vibe coding"** - maximum autonomy with minimal interruptions:
- **Auto-accept mode** enabled for most operations
- **Autonomous agents** actively monitor and assist
- **Filesystem state persistence** - trust disk over memory
- **Smart defaults** for all operations
- **Flow state preservation** as top priority

## State Persistence

**Philosophy:** Trust fresh context windows over lossy compaction. Persist state to filesystem continuously. Claude rediscovers state from disk.

### State Files (Update Continuously)
- `.claude/context/progress.md` — Current status, next steps, blockers (update after each significant action)
- `.claude/context/decisions.md` — Architectural/config choices with rationale (append-only log)
- `.claude/context/important-context.md` — Critical info that must survive resets
- **Git commits** — Frequent, meaningful commits as checkpoints

### Context Recovery Protocol
When context resets or continuing work:
1. Run `pwd` to confirm working directory
2. Review `progress.md`, `decisions.md`, and `git log --oneline -10`
3. Validate current state before proceeding
4. Resume from filesystem state, not memory

### Context Thresholds (Max Tier)
- **Warning:** 120k tokens (monitoring mode)
- **Soft limit:** 160k tokens (persist state, consider fresh context)
- **Hard limit:** 180k tokens (force state persistence)
- **Critical:** 190k tokens (new session with state recovery)

## Agent Coordination

### Active Agents

All agents configured in `.claude/skills/` operate autonomously:

- **Context Manager** - Monitors state files, persists progress to disk, ensures recoverability
- **Architect** - Auto-designs system architecture and plans
- **Code Reviewer** - Silent reviews with critical issues flagged
- **Documenter** - Auto-updates documentation

### Agent Triggers

Agents activate automatically based on context - no explicit invocation needed in most cases.

## Key Decision Points (ASK Before Proceeding)

Always ask before:

1. **Destructive Operations:** Deleting directories, force-pushing, major refactors
2. **Architecture Changes:** Major design shifts affecting multiple components
3. **External Dependencies:** New frameworks or libraries
4. **Security Changes:** Authentication, data handling, permissions
5. **Breaking Changes:** API modifications affecting downstream systems

## Quick Commands

Essential slash commands for vibe coding:

- `/flow` - Enter maximum autonomy mode
- `/context-check` (or `/ctx`) - Context health status
- `/smart-compact` - Intelligent context compression
- `/vibe-status` - System health dashboard
- `/session-save` - Save current session state
- `/session-resume` - Resume saved session

## Claude Code v2.1.1 Enhancements

### Keyboard Shortcuts
- `Ctrl+B` - Background running agents/commands simultaneously
- `Shift+Enter` - Multi-line input (native in iTerm2, WezTerm, Ghostty, Kitty)
- `Option+P` / `Alt+P` - Switch models while typing prompt

### Remote Sessions (claude.ai subscribers)
- `/teleport` - Resume cloud session locally
- `/remote-env` - Configure remote environment
- `CLAUDE_CODE_REMOTE=true` - Env var to detect remote execution

### Streamer Mode
Set `CLAUDE_CODE_HIDE_ACCOUNT_INFO=1` or `IS_DEMO=1` to hide account info.

### Forked Skill Contexts
Skills with `context: fork` run in isolated sub-agents, keeping main context clean.
Currently forked: context-manager, dna-evolution, enforcement-manager.

**Full reference:** `.claude/docs/claude-code-2.1.1-features.md`

## Autonomous Behavior Expectations

### What Agents Do Automatically

- **Persist state to filesystem** continuously (context manager)
- **Review code changes** after edits (code reviewer, silent mode)
- **Create architecture docs** when designing features (architect)
- **Generate documentation** for new code (documenter)
- **Suggest optimizations** proactively (all agents)
- **Update progress.md** after significant actions (context manager)
- **Archive sessions** on exit (stop hook)

### What Requires Approval

- Destructive commands (rm -rf, force push)
- Major architectural changes
- Security-sensitive operations
- Breaking API changes
- Adding external dependencies

## Token Budget (Max Tier)

**Total Context Window:** 200k tokens (relaxed management)

**Allocation Strategy:**
- Project Memory: 15k (7.5%) - CLAUDE.md + rules + state files
- Active Code: 80k (40%) - Current work
- Conversation: 50k (25%) - Extended interactions
- Tool Outputs: 35k (17.5%) - Recent results
- Response Budget: 20k (10%) - Claude responses

**Philosophy:** Use full context freely. When approaching limits, persist state and start fresh rather than compacting.

---

**Reference Implementation:** This setup demonstrates Claude Code capabilities with filesystem-based state persistence, autonomous agents, subagent orchestration, hooks, MCP integration, and extended Max tier context.
