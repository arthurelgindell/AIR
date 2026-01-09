---
name: dispatch
description: Manually route a task to a specific branch expert
aliases: [route, send]
---

# Dispatch Command

Manually route a task to a specific branch expert, bypassing automatic routing.

## Usage

```bash
/dispatch {branch} {task description}
```

## Available Branches

| Branch | Domain | Keywords |
|--------|--------|----------|
| `backend` | Server, API, Database | api, server, database, service |
| `frontend` | UI, Components, Styling | ui, component, page, style |
| `infrastructure` | DevOps, Deployment | docker, deploy, ci/cd, config |

## Examples

```bash
# Backend tasks
/dispatch backend Create REST endpoint for user preferences
/dispatch backend Add database migration for new field
/dispatch backend Implement JWT refresh token logic

# Frontend tasks
/dispatch frontend Build settings page component
/dispatch frontend Add dark mode toggle to header
/dispatch frontend Create form validation for signup

# Infrastructure tasks
/dispatch infrastructure Set up Docker development environment
/dispatch infrastructure Add GitHub Actions workflow for tests
/dispatch infrastructure Configure nginx reverse proxy
```

## Flags

```bash
--priority {critical|high|normal|low}  # Set task priority
--no-rollup                            # Skip roll-up generation
--sync                                 # Wait for completion (default: async)
```

## Behavior

1. **Validates branch** - Checks branch exists in registry
2. **Loads branch expert** - Activates branch SKILL.md
3. **Constrains context** - Applies context-scope.md boundaries
4. **Executes task** - Branch expert handles the work
5. **Reports results** - Returns structured completion report
6. **Generates roll-up** - If significance threshold met

## When to Use

- **Override routing:** When you know exactly which branch should handle a task
- **Direct assignment:** Skip Master Architect analysis for simple tasks
- **Testing:** Validate branch expert behavior directly

## When NOT to Use

- **Cross-domain tasks:** Let Master Architect coordinate
- **Ambiguous scope:** Let routing engine classify
- **Multi-branch work:** Use normal flow for coordination

---

*Direct dispatch for when you know exactly where work belongs.*
