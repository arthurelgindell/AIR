# Prompt Clarification Protocol: CLEAR

**Philosophy:** "Clarify First, Then Vibe"

Get ALL facts and requirements BEFORE execution. Once Claude is satisfied with clarity, proceed with full autonomous execution until completion. Only pause again if show-stoppers appear mid-task.

---

## The CLEAR Framework

**C**ontext • **L**imits • **E**xpected outcome • **A**mbiguity check • **R**eadiness

---

## Execution Flow

```
USER PROMPT RECEIVED
        ↓
┌───────────────────────────────────────┐
│  VAGUENESS CHECK                      │
│  • Missing context/scope/success?     │
│  • Multiple valid interpretations?    │
│  • Fatigue indicators detected?       │
└───────────────────────────────────────┘
        ↓
   ┌────┴────┐
   │  Vague? │
   └────┬────┘
    Yes │ No
        ↓   ↓
┌───────────────┐    ┌──────────────────────────┐
│ ASK QUESTIONS │    │ FULL AUTONOMOUS EXECUTION │
│ (up to 4)     │    │ • Proceed without pause   │
│ • Context     │    │ • Complete entire task    │
│ • Scope       │    │ • Only stop for blockers  │
│ • Success     │    └──────────────────────────┘
│ • Constraints │
└───────┬───────┘
        ↓
   Satisfied?
    Yes → FULL AUTONOMOUS EXECUTION
    No  → ASK MORE QUESTIONS
```

---

## Vagueness Triggers

Ask clarifying questions BEFORE execution when the prompt:

### 1. Lacks Specificity
- "Fix the thing"
- "Make it better"
- "Add a feature"
- Any request without a clear target

### 2. Has Multiple Valid Interpretations
- Request could go 2+ reasonable directions
- Implementation approach unclear
- Technology choice ambiguous

### 3. Missing Success Criteria
- No way to know when "done"
- No validation method specified
- Expected outcome unclear

### 4. Involves Irreversible Actions
- File creation/deletion
- Architectural changes
- Database schema changes

### 5. Affects Multiple Systems
- Cross-cutting concerns
- Changes span multiple components
- Breaking changes possible

### 6. Fatigue Indicators Detected
- Prompt < 10 words for complex topic
- Multiple typos or incomplete sentences
- "Just" or "quickly" minimizers for complex tasks

---

## Fatigue Mode (Escalated Clarification)

Be MORE aggressive about asking questions when:

| Indicator | Action |
|-----------|--------|
| Long session (many exchanges) | Lower threshold for asking |
| Short prompt (< 10 words) | Always ask for complex topics |
| Typos/incomplete sentences | Flag and clarify intent |
| "Just do X" for complex X | Ask about scope and constraints |
| Rapid-fire requests | Slow down, confirm understanding |

---

## Clarification Questions Framework

Ask up to 4 targeted questions using AskUserQuestion tool:

### Context Questions
- "What problem are you trying to solve?"
- "What triggered this request?"

### Scope Questions
- "Should this affect X, Y, or both?"
- "Just this file or project-wide?"

### Success Questions
- "What does 'done' look like?"
- "How will you validate this works?"

### Constraint Questions
- "Any approaches to avoid?"
- "Must integrate with existing X?"

---

## Show-Stopper Triggers (Mid-Execution Pause)

Once executing autonomously, ONLY pause for:

### Discovered Ambiguity
- New information reveals multiple valid paths
- Assumption made earlier now appears wrong

### Missing Prerequisites
- Dependency not installed
- File/resource doesn't exist

### Conflicting Requirements
- Request contradicts existing code
- Breaking change required but not approved

### Destructive Uncertainty
- About to delete/overwrite with uncertainty
- Security-sensitive change

**NOT a show-stopper:**
- Minor implementation details
- Style preferences
- Trivial decisions

---

## Clear Prompt Indicators (Skip Clarification)

Proceed directly to execution when prompt includes:

### Explicit Target
- Specific file path mentioned
- Function/class name specified
- Exact error message provided

### Clear Success Criteria
- "Make X do Y"
- "Change A to B"
- Test case provided

### Defined Scope
- "Only in this file"
- "Just the frontend"
- Bounded request

---

## Protocol Summary

| Phase | Behavior |
|-------|----------|
| Prompt received | Check vagueness triggers |
| If vague | Ask questions (up to 4 at a time) |
| Repeat | Until satisfied with clarity |
| Once satisfied | Full autonomous execution |
| If show-stopper | Pause, ask, resume autonomy |
| Task complete | Report results |

---

## Integration with Vibe Coding

This protocol PRESERVES vibe coding autonomy:

- **Before clarity:** Ask questions (may feel slow)
- **After clarity:** Full autonomous execution (pure vibe mode)
- **During execution:** Only blockers pause the flow

The goal is FEWER interruptions overall by getting it right the first time.

---

**Reference:** Based on [Claude 4 Best Practices](https://platform.claude.ai/docs/en/build-with-claude/prompt-engineering/claude-4-best-practices) from Anthropic.
