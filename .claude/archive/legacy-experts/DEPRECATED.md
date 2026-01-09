# DEPRECATED: Legacy Branch Experts

**Archived:** 2026-01-06
**Reason:** Replaced by discovery-based domain experts

---

## What Was Here

These were hardcoded "functional pillar" experts:
- `backend/` - Server, API, database
- `frontend/` - UI, components, React
- `infrastructure/` - DevOps, deployment, CI/CD

## Why Deprecated

1. **Hardcoded** - Didn't match actual project structure
2. **Centralized** - Lived in `.claude/` instead of with code
3. **Static** - Required manual registry updates
4. **Not Scalable** - Only 3 pillars, couldn't grow

## New Architecture

Experts now live **inside their domain folders** as `.expert/`:

```
mj_automation/
├── .expert/
│   ├── expert.md        ← Expert definition
│   ├── context-scope.md ← Boundaries
│   └── summary.md       ← Roll-up
└── (code files)
```

## Discovery-Based Routing

- Discovery script finds all `.expert/` folders
- Registry auto-generated from project structure
- New domains emerge by creating `.expert/` folder
- No manual configuration needed

## Reference

These files are kept for reference. The patterns in `_template/` can guide creation of new domain experts.

---

*Do not move these back. Use the new discovery-based system.*
