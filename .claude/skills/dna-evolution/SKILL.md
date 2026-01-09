---
name: DNA Evolution
description: Continuously learns and evolves patterns from interactions
context: fork
trigger: auto
priority: critical
alwaysActive: true
---

# DNA Evolution - Continuous Learning System

## Mission

Capture patterns from interactions to evolve Arthur's Cognitive DNA profile. The goal is `1+1 = exponential` — learned patterns compound across sessions rather than starting fresh.

## Activation

**Always active.** Monitors interactions for learning signals and updates DNA profile.

---

## Learning Triggers

### Explicit Feedback
- User says "that worked well" → Reinforce pattern
- User says "don't do that" → Mark as anti-pattern
- User rates session → Update feedback log
- User expresses preference → Capture to preferences

### Implicit Signals
- Correction received → Pattern was wrong, adjust confidence
- Approach succeeded → Reinforce with evidence
- Same question repeated → Explanation wasn't clear
- User simplified request → Original was over-engineered

### Pattern Recognition
- Technology choice praised → Strengthen preference
- Methodology worked → Increase confidence
- Integration succeeded → Document working pattern
- Error resolved → Capture resolution pattern

---

## DNA Profile Structure

**Location:** `.claude/context/cognitive-dna/arthur-dna-profile.json`

### What Gets Updated

| Section | Update Trigger | Update Type |
|---------|----------------|-------------|
| `strengths` | Positive feedback, successful pattern | Increase confidence, add evidence |
| `limitations` | Gap identified, failure pattern | Adjust augmentation strategy |
| `preferences.technical` | Technology success/failure | Add/prioritize technologies |
| `preferences.communication` | Clear/unclear feedback | Adjust communication patterns |
| `feedback.sessions` | End of significant work | Append session record |

### Evolution Tracking

Every significant update creates a snapshot:
- Location: `.claude/context/cognitive-dna/snapshots/`
- Format: `{timestamp}-{trigger}.json`
- Contains: Full profile at that point

---

## Learning Actions

### On Positive Feedback

```python
# Pseudocode
pattern = identify_pattern(feedback)
if pattern in profile.strengths:
    profile.strengths[pattern].confidence += 0.01
    profile.strengths[pattern].evidence += 1
else:
    add_emerging_strength(pattern)
```

### On Correction

```python
# Pseudocode
wrong_pattern = identify_pattern(correction)
if wrong_pattern in profile.strengths:
    profile.strengths[wrong_pattern].confidence -= 0.02
if needs_augmentation(wrong_pattern):
    add_to_limitations(wrong_pattern)
```

### On Session End

```python
# Pseudocode
session = {
    "id": generate_id(),
    "timestamp": now(),
    "activity": summarize_session(),
    "highlights": extract_highlights(),
    "technologies": extract_technologies(),
    "rating": infer_or_ask_rating()
}
profile.feedback.sessions.append(session)
```

---

## Gap Augmentation

When a limitation is detected, proactively compensate:

| Gap Area | Augmentation Strategy |
|----------|----------------------|
| Security | Include OWASP Top 10, suggest security review |
| Performance | Suggest profiling, recommend benchmarks |
| Testing | Recommend TDD, provide test templates |
| Frontend | Provide React/Vue patterns proactively |
| Rapid Prototyping | Suggest time-boxed spikes |

---

## Integration with HETA

DNA patterns inform branch expert behavior:

### Backend Expert
- Apply: Sequential problem-solving, validation emphasis
- Augment: Security considerations, performance profiling

### Frontend Expert
- Apply: Code examples, detailed explanations
- Augment: React/Vue best practices (lower confidence area)

### Infrastructure Expert
- Apply: DevOps patterns (high confidence: 73.7%)
- Augment: Security hardening

---

## Commands

### `/dna-status`
Show current DNA profile summary

### `/dna-learn {pattern}`
Explicitly capture a new pattern

### `/dna-feedback {rating} {note}`
Record session feedback

### `/dna-snapshot`
Force create a snapshot of current profile

---

## Persistence

### On Every Significant Change
1. Update `arthur-dna-profile.json`
2. Create snapshot if major change
3. Update `important-context.md` if critical

### Snapshot Triggers
- 5+ evidence points added to single strength
- New limitation identified
- Confidence shift > 5%
- Explicit user request

---

## Success Metrics

- Patterns from session N improve session N+1
- Corrections decrease over time
- High-confidence areas produce consistently positive feedback
- Augmented gaps show improvement

---

*DNA Evolution ensures every interaction makes the next one better.*
