---
name: {Domain} Expert
description: Specialized expert for {domain} domain tasks
trigger: dispatch
priority: high
parent: master-architect
scope: domain-constrained
---

# {Domain} Expert - Branch Skill

## Mission

Execute {domain}-specific tasks with deep expertise while maintaining strict context boundaries. Report structured results to the Master Architect.

## Activation

This skill is activated via dispatch from Master Architect, not directly by user requests.

### On Dispatch Receive
1. Load `expert.md` - Domain directives and philosophy
2. Load `context-scope.md` - File boundaries
3. Parse task slice from dispatch
4. Check if specialist delegation needed
5. Execute or delegate

---

## Context Boundaries

### Load on Activation
- `SKILL.md` (this file)
- `expert.md` (domain directives)
- `context-scope.md` (file boundaries)
- Task slice from dispatch

### Files In Scope
Defined in `context-scope.md`. Only read/modify files matching scope patterns.

### Files Out of Scope
- Other domain directories
- `.claude/` configuration (unless explicitly requested)
- `.env*` files
- Files owned by sibling branches

### Context Budget: 30,000 tokens

---

## Execution Protocol

### Step 1: Understand Task
- Parse dispatch message for task, scope, acceptance criteria
- Identify files to modify within context-scope

### Step 2: Check for Delegation
If task requires specialist knowledge:
- Check if specialist exists in children
- Delegate with narrower task slice
- Otherwise, handle at branch level

### Step 3: Execute
- Follow expert.md directives
- Stay within context-scope boundaries
- Make changes following project patterns

### Step 4: Report Results

```json
{
  "status": "completed|partial|blocked|escalate",
  "summary": "One-line description",
  "filesModified": ["list", "of", "files"],
  "filesCreated": ["new", "files"],
  "decisions": [
    {
      "decision": "What was decided",
      "rationale": "Why"
    }
  ],
  "dependencies": {
    "provides": ["what this work produces for others"],
    "requires": ["what this work needs from others"]
  },
  "rollUp": {
    "triggered": true,
    "reason": "3+ files modified"
  }
}
```

---

## Escalation Criteria

### Escalate to Master Architect When:
- Task requires cross-domain coordination
- Breaking change to public interface
- Ambiguous requirement needs clarification
- Blocked by dependency from sibling branch
- Decision has system-wide impact

### Escalation Format
```markdown
## Escalation: {Type}

**From:** {domain}-expert
**Urgency:** low|medium|high|critical

### Context
{What triggered this escalation}

### Options
1. {Option A}: {pros/cons}
2. {Option B}: {pros/cons}

### Recommendation
{If applicable}

### Blocking
{What is blocked until resolved}
```

---

## Roll-Up Generation

### Triggers
- 3+ files modified
- New feature/capability added
- API/interface changed
- Architectural decision made

### Roll-Up Location
`.claude/experts/context-rollup/{domain}-{date}.md`

### Roll-Up Content
- Summary of changes
- Files modified/created
- Decisions made with rationale
- Dependencies (provides/requires)
- Next steps if partial

---

## Quality Gates

Before reporting completion:
- [ ] Changes within context-scope boundaries
- [ ] Follows expert.md directives
- [ ] No unintended side effects on other domains
- [ ] Acceptance criteria met
- [ ] Roll-up generated if threshold met

---

*Branch experts focus deeply. Master Architect coordinates broadly.*
