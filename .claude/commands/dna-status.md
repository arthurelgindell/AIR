---
name: dna-status
description: Display current Cognitive DNA profile summary
aliases: [dna, profile, patterns]
---

# DNA Status Command

Display Arthur's current Cognitive DNA profile and learning status.

## Usage

```bash
/dna-status           # Full summary
/dna-status brief     # Compact view
/dna-status strengths # Just strengths
/dna-status gaps      # Just limitations
```

## Output

### Full Summary

```
╔══════════════════════════════════════════════════════════════╗
║                  COGNITIVE DNA STATUS                        ║
╠══════════════════════════════════════════════════════════════╣
║ Success Rate: 94.18%                                         ║
║ Feedback Sessions: 14                                        ║
║ Average Rating: 4.79/5                                       ║
║ Last Updated: 2025-12-25                                     ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║ STRENGTHS (Apply Automatically)                              ║
║ ────────────────────────────────────────────────────────────║
║ ██████████████████████████████████████████████████ 95%      ║
║ Apple Silicon Native Development                             ║
║ → Metal GPU, CoreML, Swift FFI, MLX                         ║
║                                                              ║
║ █████████████████████████████████████░░░░░░░░░░░░░ 73.7%    ║
║ Technical Expertise (DevOps)                                 ║
║ → IaC, Docker, SQLite                                        ║
║                                                              ║
║ █████████████████████████████████████░░░░░░░░░░░░░ 73.4%    ║
║ Project Management                                           ║
║ → Iterative, milestone-based                                 ║
║                                                              ║
║ ████████████████████████████████████░░░░░░░░░░░░░░ 72.7%    ║
║ Communication Style                                          ║
║ → Code examples + detailed explanations                      ║
║                                                              ║
║ ████████████████████████████████████░░░░░░░░░░░░░░ 72.5%    ║
║ Problem-Solving Methodology                                  ║
║ → Sequential steps + validation                              ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║ GAPS (Proactively Augment)                                   ║
║ ────────────────────────────────────────────────────────────║
║ ██████████████████████████░░░░░░░░░░░░░░░░░░░░░░░░ 50%      ║
║ Security → Include OWASP Top 10, suggest reviews            ║
║                                                              ║
║ ██████████████████████████░░░░░░░░░░░░░░░░░░░░░░░░ 50%      ║
║ Performance → Suggest profiling, recommend benchmarks        ║
║                                                              ║
║ ██████████████████████████░░░░░░░░░░░░░░░░░░░░░░░░ 50%      ║
║ Testing → Recommend TDD, provide templates                   ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║ PLATFORM                                                     ║
║ ────────────────────────────────────────────────────────────║
║ Hardware: M3 Ultra                                           ║
║ Memory: 256GB Unified                                        ║
║ GPU: Metal with 10 compiled kernels                         ║
║ Neural: CoreML 16-core Neural Engine                        ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║ Working Style: Pragmatic & Iterative                         ║
║ Philosophy: 1+1 = exponential                                ║
╚══════════════════════════════════════════════════════════════╝
```

### Brief View

```bash
/dna-status brief
```

```
DNA: 94.18% success | 14 sessions | 4.79 avg rating
Top: Apple Silicon (95%), DevOps (73.7%), PM (73.4%)
Gaps: Security (50%), Performance (50%), Testing (50%)
Platform: M3 Ultra, 256GB, Metal GPU
```

## Related Commands

- `/dna-feedback` - Record learning feedback
- `/vibe-status` - Full system status including DNA

---

*Know your patterns. Leverage your strengths. Augment your gaps.*
