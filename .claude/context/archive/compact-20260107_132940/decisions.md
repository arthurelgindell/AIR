# Architectural Decisions Log

**Project:** ARTHUR
**Started:** 2026-01-06

---

## Decision Log

### 2026-01-06: Initial Claude Code Configuration

**Context:** Setting up project for vibe coding with maximum autonomous operation.

**Decision:** Implemented reference-grade Claude Code configuration with:
- Filesystem-based state persistence (trust disk over compaction)
- CLEAR framework for prompt clarification
- Maximum autonomy mode with safety guardrails
- Auto-accept for most file operations
- Confirmation required for destructive operations

**Rationale:** This approach optimizes for flow state while maintaining safety through smart defaults and filesystem persistence for context recovery.

**Consequences:**
- Lower friction during development
- State persists across context resets
- Recovery is straightforward via filesystem

---

### 2026-01-06: Adopted Bulletproof Manifesto

**Context:** Establishing core operating philosophy for the project and collaboration.

**Decision:** Integrated the Bulletproof Manifesto as the foundational philosophy:
- Results over intentions
- Verification over assumption
- Recovery over perfection
- Honesty over comfort
- Simplicity over cleverness

**Rationale:** These principles align with building robust, recoverable systems. They establish clear expectations: no hope-speak, no performance art, only results that hold under scrutiny.

**Consequences:**
- All work measured by provable results
- Failures treated as feedback, not identity
- End-to-end verification before declaring "done"
- Truth delivered directly, even when uncomfortable

**THIS IS THE WAY.**

---

### 2026-01-06: Implemented Hierarchical Expert Tree Architecture (HETA)

**Context:** Need a system for routing tasks to domain-specific experts with context isolation and roll-up summaries.

**Decision:** Implemented HETA with:
- Master Architect as root orchestrator
- Three branch experts: Backend, Frontend, Infrastructure
- Skill-based routing with auto-classification
- Context isolation via scope files
- Auto-generated roll-up summaries

**Key Design Choices:**
- Branch experts activated via dispatch from Master Architect
- Context budgets: Master 40k, Branch 30k, Specialist 20k tokens
- Roll-up triggered on 3+ file changes or significant events
- Cross-branch coordination flows through Master Architect only

**File Structure:**
```
.claude/
├── experts/                 # Expert tree management
│   ├── master-architect.md  # Root directives
│   ├── branch-registry.json # Tree registry
│   └── context-rollup/      # Roll-up summaries
├── skills/
│   ├── master-architect/    # Routing skill
│   └── branches/            # Domain experts
│       ├── _template/       # Reusable template
│       ├── backend/         # Backend expert
│       ├── frontend/        # Frontend expert
│       └── infrastructure/  # Infra expert
├── commands/
│   ├── dispatch.md          # Manual routing
│   └── tree-status.md       # Hierarchy view
└── rules/
    └── hierarchy-protocol.md # Protocol rules
```

**Consequences:**
- Tasks automatically route to correct domain expert
- Branch experts focus deeply without context pollution
- Cross-domain work requires explicit coordination
- Scalable pattern for adding new branches/specialists

---

### 2026-01-06: Integrated Cognitive DNA System

**Context:** Establishing continuous learning and pattern evolution across sessions.

**Decision:** Integrated Cognitive DNA from SPHERE teleport package:
- Copied arthur-dna-profile.json (94.18% success rate, 14 feedback sessions)
- Created dna-evolution skill for continuous learning
- Created /dna-feedback and /dna-status commands
- Integrated DNA patterns into all HETA branch experts
- Added cognitiveDNA configuration section to settings.json

**Key DNA Patterns Applied:**
| Strength | Confidence | Application |
|----------|------------|-------------|
| Apple Silicon Native | 95% | Always Metal, CoreML, MLX - never CUDA |
| DevOps | 73.7% | IaC, native tooling, SQLite local-first |
| Communication | 72.7% | Code examples + detailed explanations |
| Problem-Solving | 72.5% | Sequential steps with validation |

**Gap Augmentation Strategy:**
- Security (50%): Proactive OWASP Top 10 inclusion
- Performance (50%): Suggest profiling and benchmarks
- Testing (50%): Recommend TDD, provide templates

**Rationale:** Pattern learning compounds across sessions. Each interaction improves future interactions. 1+1 = exponential.

**Consequences:**
- Branch experts now apply DNA-informed behavior automatically
- Gaps are proactively augmented without user asking
- Platform preferences (M3 Ultra, Metal, CoreML) applied by default
- Learning evolves through feedback capture

---

### 2026-01-06: Removed Docker from Toolchain

**Context:** User preference to use native tooling over containerization.

**Decision:** Struck Docker references from all configuration:
- Removed from infrastructure expert technology stack
- Replaced with native process management (launchd/systemd)
- Updated DevOps references to "native tooling"

**Rationale:** Aligns with local-first, Apple Silicon native philosophy. Native tooling provides better performance and integration on M3 Ultra platform.

**Consequences:**
- Infrastructure expert now focuses on native service management
- No container overhead for local development
- Better Metal GPU and CoreML integration without container barriers

---

*Append new decisions chronologically. Never delete entries.*

### Compaction: 2026-01-07 00:06:25

**Context compacted.** State preserved to archive.
- Tool calls: 0
- Modifications: 0
- Archive: compact-20260107_000625

