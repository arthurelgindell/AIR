# Context Scope: {Domain} Expert

**Purpose:** Define file boundaries for this branch expert.
**Rule:** Only read/modify files matching IN SCOPE patterns. Never touch OUT OF SCOPE.

---

## In Scope

### Directories
```
{domain}/                    # Primary domain directory
src/{domain}/                # Source code
tests/{domain}/              # Domain tests
docs/{domain}/               # Domain documentation
```

### File Patterns
```
*.{domain}.ts               # Domain-specific TypeScript
*.{domain}.js               # Domain-specific JavaScript
*.{domain}.test.*           # Domain tests
{domain}.config.*           # Domain configuration
```

### Specific Files
```
# List specific files this expert owns
```

---

## Shared (Read-Only Unless Coordinated)

These files may be read but modifications require coordination:

```
src/shared/types/           # Shared type definitions
src/shared/utils/           # Shared utilities
src/shared/constants/       # Shared constants
package.json                # Dependencies (coordinate changes)
tsconfig.json               # TypeScript config
```

---

## Out of Scope (NEVER Touch)

### Other Domains
```
src/{other-domain}/         # Sibling domain code
tests/{other-domain}/       # Sibling domain tests
```

### Configuration
```
.claude/                    # Claude Code configuration
.env*                       # Environment files
credentials*                # Credentials
secrets*                    # Secrets
```

### Infrastructure (Unless Infra Expert)
```
docker/                     # Docker files
.github/                    # GitHub Actions
kubernetes/                 # K8s manifests
terraform/                  # Terraform configs
```

---

## Context Loading Priority

### 1. Critical (Always Load)
- Files being modified in current task
- Type definitions imported by task files
- Direct dependencies

### 2. High (Load if Room)
- Related service/component files
- Existing tests for modified code
- Configuration affecting behavior

### 3. Medium (Load on Demand)
- Similar patterns for reference
- Documentation
- Examples

### 4. Low (Rarely Load)
- Historical files
- Archived code
- Unrelated examples

---

## Boundary Violations

If a task requires modifying out-of-scope files:

1. **Escalate to Master Architect** with:
   - Which files need modification
   - Why they're needed
   - Which branch owns them

2. **Master Architect** will either:
   - Coordinate with owning branch
   - Grant temporary access
   - Re-route the task

**Never silently modify out-of-scope files.**

---

*Context boundaries ensure focus. Escalation ensures coordination.*
