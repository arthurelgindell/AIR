---
name: tree-status
description: View current expert hierarchy and routing status
aliases: [hierarchy, branches, experts]
---

# Tree Status Command

Display the current status of the expert hierarchy, including active branches, recent dispatches, and roll-up summaries.

## Usage

```bash
/tree-status          # Full hierarchy view
/tree-status --brief  # Compact summary
/tree-status backend  # Specific branch details
```

## Output

### Full Hierarchy View

```
╔══════════════════════════════════════════════════════════════╗
║                    EXPERT TREE STATUS                        ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  ┌─ Master Architect ────────────────────────────────────┐  ║
║  │ Status: Active                                         │  ║
║  │ Last Activity: 2026-01-06 10:30:00                    │  ║
║  │ Tasks Routed: 12 today                                 │  ║
║  └────────────────────────────────────────────────────────┘  ║
║      │                                                       ║
║      ├─┬─ Backend Expert ────────────────────────────────┐  ║
║      │ │ Status: Active                                   │  ║
║      │ │ Context: 15k/30k tokens                         │  ║
║      │ │ Last Roll-up: 2026-01-06 10:25:00              │  ║
║      │ │ Files in Scope: src/backend/**                  │  ║
║      │ └──────────────────────────────────────────────────┘  ║
║      │                                                       ║
║      ├─┬─ Frontend Expert ───────────────────────────────┐  ║
║      │ │ Status: Active                                   │  ║
║      │ │ Context: 8k/30k tokens                          │  ║
║      │ │ Last Roll-up: 2026-01-06 10:20:00              │  ║
║      │ │ Files in Scope: src/frontend/**                 │  ║
║      │ └──────────────────────────────────────────────────┘  ║
║      │                                                       ║
║      └─┬─ Infrastructure Expert ─────────────────────────┐  ║
║        │ Status: Standby                                  │  ║
║        │ Context: 2k/30k tokens                          │  ║
║        │ Last Roll-up: 2026-01-05 16:00:00              │  ║
║        │ Files in Scope: infrastructure/**, docker/**    │  ║
║        └──────────────────────────────────────────────────┘  ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║ Recent Dispatches:                                           ║
║ • backend: "Add user preferences API" (completed)            ║
║ • frontend: "Build settings page" (in_progress)              ║
╠══════════════════════════════════════════════════════════════╣
║ Pending Escalations: 0                                       ║
║ Tree Health: Healthy                                         ║
╚══════════════════════════════════════════════════════════════╝
```

### Brief Summary

```bash
/tree-status --brief
```

```
Expert Tree: 4 experts (1 root, 3 branches)
├── master-architect: Active
├── backend-expert: Active (15k/30k tokens)
├── frontend-expert: Active (8k/30k tokens)
└── infrastructure-expert: Standby (2k/30k tokens)

Health: Healthy | Escalations: 0 | Today's dispatches: 12
```

### Branch Details

```bash
/tree-status backend
```

```
╔══════════════════════════════════════════════════════════════╗
║                    BACKEND EXPERT DETAILS                    ║
╠══════════════════════════════════════════════════════════════╣
║ Status: Active                                               ║
║ Context Budget: 15,000 / 30,000 tokens (50%)                ║
║ Parent: master-architect                                     ║
║ Children: None                                               ║
╠══════════════════════════════════════════════════════════════╣
║ Activation Patterns:                                         ║
║   api, backend, server, database, service, endpoint          ║
╠══════════════════════════════════════════════════════════════╣
║ Files in Scope:                                              ║
║   src/backend/**, src/api/**, src/services/**               ║
║   database/**, tests/backend/**                              ║
╠══════════════════════════════════════════════════════════════╣
║ Recent Tasks:                                                ║
║   • "Add user preferences API" - completed (10:25)           ║
║   • "Fix auth middleware bug" - completed (09:15)            ║
╠══════════════════════════════════════════════════════════════╣
║ Latest Roll-up: .claude/experts/context-rollup/backend.md    ║
║ Last Updated: 2026-01-06 10:25:00                           ║
╚══════════════════════════════════════════════════════════════╝
```

## Information Displayed

### Per Expert
- **Status:** Active, Standby, or Offline
- **Context:** Current token usage vs. budget
- **Last Roll-up:** When summary was last generated
- **Files in Scope:** What directories this expert owns

### Tree-Wide
- **Recent Dispatches:** Last few routed tasks
- **Pending Escalations:** Unresolved escalations
- **Tree Health:** Overall system status

## Related Commands

- `/dispatch {branch}` - Route task to specific branch
- `/context-check` - Overall context health (includes tree)
- `/vibe-status` - Full system dashboard

---

*Quick visibility into your expert hierarchy.*
