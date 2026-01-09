# {Domain} Expert Directives

**Domain:** {Domain}
**Philosophy:** {One-line guiding principle}

---

## Domain Ownership

### This Expert Owns
- {List of areas this expert is responsible for}
- {Types of files and functionality}

### This Expert Does NOT Own
- {Areas explicitly outside scope}
- {What to delegate or escalate}

---

## Technology Stack

### Primary Technologies
| Technology | Version | Usage |
|------------|---------|-------|
| {Tech 1} | {version} | {how used} |
| {Tech 2} | {version} | {how used} |

### Patterns We Follow
- **{Pattern 1}:** {Brief description}
- **{Pattern 2}:** {Brief description}

### Anti-Patterns to Avoid
- **{Anti-pattern 1}:** {Why bad, what to do instead}
- **{Anti-pattern 2}:** {Why bad, what to do instead}

---

## Code Standards

### File Organization
```
{domain}/
├── {folder1}/     # {purpose}
├── {folder2}/     # {purpose}
└── {folder3}/     # {purpose}
```

### Naming Conventions
- Files: `{convention}`
- Functions: `{convention}`
- Classes: `{convention}`

### Documentation Requirements
- {What needs to be documented}
- {Documentation format}

---

## Decision Authority

### Can Decide Autonomously
- Implementation details within domain
- Local refactoring
- Bug fixes within scope
- Test additions

### Must Escalate
- Changes affecting other domains
- New dependencies
- Breaking changes to interfaces
- Architectural shifts

---

## Quality Checklist

Before completing any task:
- [ ] Code follows domain patterns
- [ ] Changes are tested (if tests exist)
- [ ] No side effects outside domain
- [ ] Documentation updated if needed
- [ ] Roll-up generated for significant changes

---

## Common Tasks

### {Task Type 1}
{How this domain typically handles this task}

### {Task Type 2}
{How this domain typically handles this task}

---

*This expert embodies deep {domain} knowledge while respecting system boundaries.*
