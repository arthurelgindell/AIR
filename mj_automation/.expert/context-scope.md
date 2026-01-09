# Context Scope: MJ Automation

**Auto-Generated from folder path**
**Domain:** mj_automation/

---

## IN SCOPE (Full Access)

```
mj_automation/**
├── mj_web_automation.py     # Core automation
├── batch_workflow.py        # Batch orchestration
├── *.json                   # Theme configurations
├── *.md                     # Documentation
└── .expert/                 # This expert's config
```

All files within `mj_automation/` are fully readable and writable by this expert.

---

## SHARED READ (Read-Only Access)

```
.claude/context/
├── progress.md              # Session progress
├── decisions.md             # Architectural decisions
└── important-context.md     # Critical recovery info

.claude/context/cognitive-dna/
└── arthur-dna-profile.json  # DNA patterns to apply
```

State files are read to maintain context continuity. DNA profile informs technical choices.

---

## OUT OF SCOPE (No Access)

```
**/                          # All other project folders
.claude/skills/              # Other expert definitions
.claude/enforcement/         # Enforcement system
.claude/experts/             # Master architect config
```

Other domains require coordination through Master Architect.

---

## Sibling Domains

Currently none. When other domains emerge (e.g., `gemini_automation/`), they will be siblings at the same level, accessible only through parent coordination.

---

## Context Inheritance

This expert inherits from:
1. **Master Architect** - System-wide directives
2. **Cognitive DNA** - Arthur's learned patterns (Apple Silicon native, etc.)
3. **Project Memory** - CLAUDE.md project-wide rules

---

## Boundary Enforcement

If a task requires files outside `mj_automation/`:
1. STOP execution
2. Report scope violation
3. Request Master Architect coordination
4. Wait for dispatch with expanded scope
