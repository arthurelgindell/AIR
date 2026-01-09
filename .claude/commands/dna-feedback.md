---
name: dna-feedback
description: Record learning feedback to evolve Cognitive DNA
aliases: [feedback, learn, rate]
---

# DNA Feedback Command

Record feedback to evolve Arthur's Cognitive DNA profile. Every piece of feedback makes future sessions better.

## Usage

```bash
# Quick rating (1-5)
/dna-feedback 5

# Rating with note
/dna-feedback 5 "Swift Metal implementation worked perfectly"

# Capture specific learning
/dna-feedback learn "prefer-async-await over callbacks in Swift"

# Mark anti-pattern
/dna-feedback avoid "don't suggest PyTorch when CoreML works"
```

## Feedback Types

### Session Rating
```bash
/dna-feedback {1-5} [optional note]
```
Rates the current session and captures what worked/didn't work.

### Learn Pattern
```bash
/dna-feedback learn "{pattern-description}"
```
Explicitly teaches a new pattern to apply in future sessions.

### Avoid Pattern
```bash
/dna-feedback avoid "{anti-pattern}"
```
Marks something to NOT do in future sessions.

### Reinforce Strength
```bash
/dna-feedback reinforce "{strength-area}"
```
Increases confidence in an existing strength.

## What Gets Updated

| Feedback Type | DNA Section Updated |
|---------------|---------------------|
| Rating 4-5 | `feedback.sessions` + reinforce recent patterns |
| Rating 1-3 | `feedback.sessions` + flag for review |
| Learn | `strengths` (new emerging capability) |
| Avoid | `limitations` (new augmentation needed) |
| Reinforce | `strengths[area].confidence` +0.02 |

## Examples

```bash
# After successful implementation
/dna-feedback 5 "Metal GPU compute worked great for image processing"

# Learning a preference
/dna-feedback learn "Arthur prefers SQLite for local caching over Redis"

# Marking what didn't work
/dna-feedback avoid "Long explanations before code - show code first"

# Reinforcing known strength
/dna-feedback reinforce "Apple Silicon Native Development"
```

## Automatic Feedback

Some feedback is captured automatically:
- Corrections → Reduce confidence in wrong pattern
- Repeated questions → Unclear explanation
- User simplifies request → Over-engineered solution
- Quick acceptance → Good pattern match

## Profile Location

`.claude/context/cognitive-dna/arthur-dna-profile.json`

---

*Every piece of feedback compounds. 1+1 = exponential.*
