# Hierarchy Protocol Rules

**Purpose:** Define the rules governing task dispatch, escalation, and coordination in the Hierarchical Expert Tree Architecture.

---

## Core Principles

### 1. Single Responsibility
Each branch expert owns a specific domain. Tasks are routed to the expert who owns the relevant files and functionality.

### 2. Context Isolation
Branch experts only see files within their defined scope. Cross-domain visibility requires explicit coordination through the Master Architect.

### 3. Results Flow Up
Work products and summaries propagate up the tree. Branch experts report to Master Architect, who synthesizes for the user.

### 4. Tasks Flow Down
User requests enter at the root (Master Architect) and are dispatched downward to appropriate branches.

---

## Dispatch Rules

### When Master Architect Routes Directly

| Condition | Action |
|-----------|--------|
| Single domain clearly identified | Dispatch to that branch |
| Task mentions specific files | Dispatch to owning branch |
| Keywords match one branch strongly | Dispatch to that branch |

### When Master Architect Coordinates

| Condition | Action |
|-----------|--------|
| Task spans multiple domains | Sequential or parallel dispatch |
| Dependencies between branches | Respect dependency order |
| Ambiguous domain ownership | Clarify with user |

### Dispatch Message Contents

Every dispatch must include:
1. **Task description** - What needs to be done
2. **Scope constraint** - Files/patterns to focus on
3. **Acceptance criteria** - How to verify completion
4. **Coordination notes** - What other branches are doing (if cross-domain)

---

## Context Scope Rules

### Strict Boundaries

Branch experts MUST:
- Only read files matching their `context-scope.md` IN SCOPE patterns
- Only modify files matching their IN SCOPE patterns
- Treat SHARED files as read-only unless explicitly coordinated
- NEVER touch OUT OF SCOPE files

### Boundary Violations

If a task requires out-of-scope files:
1. **Stop execution** - Do not modify out-of-scope files
2. **Escalate to Master Architect** - Explain what files are needed
3. **Wait for coordination** - Master Architect will involve correct branch
4. **Resume when cleared** - Continue after coordination complete

---

## Escalation Rules

### Branch Expert → Master Architect

Escalate when:
- Task requires cross-domain coordination
- Breaking change to public interface
- Ambiguous requirement needs clarification
- Blocked by dependency from sibling branch
- Decision has system-wide impact
- Security-sensitive operation

### Master Architect → User

Escalate when:
- Destructive operation required
- Architecture decision with multiple valid approaches
- Cost implications for resources
- Security policy decisions
- Information missing that only user can provide

### Escalation Format

```markdown
## Escalation: {Type}

**From:** {expert-id}
**To:** {parent-id or user}
**Urgency:** low|medium|high|critical

### Context
{What triggered this escalation}

### Options (if applicable)
1. {Option A}: {pros/cons}
2. {Option B}: {pros/cons}

### Recommendation
{Expert's recommendation if any}

### Blocking
{What is blocked until resolved}
```

---

## Roll-Up Rules

### Significance Thresholds

Generate roll-up summary when:
- 3+ files modified
- New feature or capability added
- API or interface changed
- Database schema changed
- Configuration changed
- Architectural decision made

### Do NOT Generate Roll-Up For

- Typo fixes (< 5 characters)
- Comment-only changes
- Formatting-only changes
- Single-line non-functional changes

### Roll-Up Contents

Every roll-up must include:
1. **Summary** - One paragraph describing what changed
2. **Files** - List of files created/modified/deleted
3. **Decisions** - Key decisions with rationale
4. **Dependencies** - What this provides/requires
5. **Next steps** - If work is partial

### Roll-Up Location

```
.claude/experts/context-rollup/{branch}-{date}.md
```

### Roll-Up Propagation

1. Specialist → Branch expert summary
2. Branch → Master Architect summary
3. Master → Aggregated project summary

---

## Cross-Branch Coordination

### Communication Path

Branches do NOT communicate directly. All coordination flows through Master Architect:

```
Branch A ──escalate──▶ Master Architect ◀──escalate── Branch B
                              │
                              ▼
                        Coordination
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
              Branch A              Branch B
              (directive)           (directive)
```

### Dependency Order

When tasks have dependencies:
1. **Identify producer** - Branch that creates interface/data
2. **Identify consumer** - Branch that uses interface/data
3. **Execute producer first** - Complete and verify
4. **Pass outputs to consumer** - Include in dispatch
5. **Execute consumer** - With producer outputs available

### Conflict Resolution

When branches report conflicting changes:
1. Master Architect identifies conflict point
2. Determines which branch owns the decision
3. Directs other branch to adapt
4. Or escalates to user if architectural

---

## Context Budget Management

### Budget Limits

| Level | Max Tokens | Purpose |
|-------|------------|---------|
| Master Architect | 40,000 | Routing, coordination, synthesis |
| Branch Expert | 30,000 | Domain-specific execution |
| Specialist | 20,000 | Narrow specialized work |

### Budget Enforcement

When approaching limit:
1. **Generate roll-up** - Capture important state
2. **Persist to filesystem** - Write summaries
3. **Report to parent** - Note context pressure
4. **Suggest fresh context** - If critical

---

## Quality Gates

### Before Completing Any Task

Branch experts must verify:
- [ ] Changes within context-scope boundaries
- [ ] Follows expert.md directives
- [ ] No unintended side effects
- [ ] Acceptance criteria met
- [ ] Roll-up generated if threshold met
- [ ] No out-of-scope modifications

### Before Dispatch

Master Architect must verify:
- [ ] Domain correctly identified
- [ ] Task slice well-defined
- [ ] Dependencies identified
- [ ] Coordination notes complete (if cross-domain)

---

## Error Handling

### Recoverable Errors (Handle Locally)
- File not found → Create if appropriate
- Syntax error → Fix and continue
- Test failure → Debug and fix

### Non-Recoverable Errors (Escalate)
- Permission denied → Escalate for access
- Missing dependency → Escalate to coordinate
- Conflicting requirements → Escalate for decision

---

*These protocols ensure the expert tree operates smoothly with clear boundaries and coordination.*
