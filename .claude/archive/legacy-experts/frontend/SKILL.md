---
name: Frontend Expert
description: Specialized expert for UI, components, and client-side tasks
trigger: dispatch
priority: high
parent: master-architect
scope: domain-constrained
---

# Frontend Expert - Branch Skill

## Mission

Execute frontend-specific tasks including UI components, client-side logic, styling, and state management. Maintain strict boundaries around client-side code.

## Activation

Activated via dispatch from Master Architect when task involves:
- UI components and pages
- Styling and layout
- Client-side state management
- Form handling and validation
- User interactions and events

---

## Context Boundaries

### Load on Activation
- This SKILL.md
- `expert.md` (frontend directives)
- `context-scope.md` (file boundaries)
- Task slice from dispatch

### Context Budget: 30,000 tokens

---

## Execution Protocol

### Step 1: Understand Task
Parse dispatch for:
- Components to create/modify
- Styling requirements
- State management needs
- API integration points

### Step 2: Execute Within Scope
- Follow frontend patterns from expert.md
- Stay within context-scope boundaries
- Create/modify only frontend files

### Step 3: Report Results

```json
{
  "status": "completed",
  "summary": "Created UserProfile component with edit form",
  "filesModified": ["src/frontend/pages/Profile.tsx"],
  "filesCreated": [
    "src/frontend/components/UserProfile.tsx",
    "src/frontend/components/UserProfile.css"
  ],
  "decisions": [
    {
      "decision": "Used controlled form inputs",
      "rationale": "Better validation control, React best practice"
    }
  ],
  "dependencies": {
    "provides": ["UserProfile component", "Edit profile page"],
    "requires": ["GET /api/users/:id", "PUT /api/users/:id from Backend"]
  }
}
```

---

## Escalation Criteria

Escalate to Master Architect when:
- Need new API endpoint from backend
- Shared types need modification
- Authentication flow changes
- Component library architecture decision
- Breaking change to shared components

---

## Roll-Up Triggers

Generate summary when:
- New page/route created
- Component architecture decision
- 3+ files modified
- State management pattern added

---

## Quality Gates

Before completion:
- [ ] Components follow established patterns
- [ ] Styling is consistent with design system
- [ ] Accessibility basics covered (aria labels, keyboard nav)
- [ ] No backend file modifications
- [ ] Forms have client-side validation
