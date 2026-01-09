# Domain Summary: MJ Automation

**Last Updated:** 2026-01-06T21:30:00Z
**Expert:** mj-automation
**Status:** Active

---

## Current State

Fully functional Midjourney web automation system with image and video generation capabilities.

---

## Capabilities

| Capability | Status | Description |
|------------|--------|-------------|
| Image Generation | ✅ Complete | Prompt → generate → download |
| Video Generation | ✅ Complete | Image-to-video with motion modes |
| Batch Processing | ✅ Complete | Themed batch workflows |
| Remote Transfer | ✅ Complete | rsync to BETA storage |
| Session Management | ✅ Complete | Login check, cookie-based auth |

---

## Recent Changes

- Initial implementation complete
- Browser automation via AppleScript established
- JavaScript injection for DOM manipulation
- Batch workflow with LinkedIn themes
- BETA storage integration

---

## Decisions Made

| Decision | Rationale | Date |
|----------|-----------|------|
| AppleScript for Chrome control | Native macOS, no browser extensions needed | 2026-01-06 |
| Web interface over Discord | More reliable, no phone verification | 2026-01-06 |
| rsync for transfers | Efficient, resumable, SSH-based | 2026-01-06 |
| Cookie-based sessions | Long-lived, no token refresh needed | 2026-01-06 |

---

## Dependencies

### Provides
- `MidjourneyAutomation` class for programmatic access
- `batch_generate()` function for batch processing
- Theme-based content generation
- Remote storage pipeline

### Requires
- Chrome browser (logged into midjourney.com)
- SSH access to BETA storage server
- macOS with AppleScript support

---

## Known Limitations

- Video downloads require browser auth (manual download needed)
- Draft Mode must be disabled in MJ web interface
- One generation at a time (serial processing)

---

## Integration Points

- **Parent:** Master Architect (for cross-domain coordination)
- **Storage:** BETA server at `/Volumes/STUDIO/`
- **Future:** Gemini automation (sibling domain)

---

## Metrics

| Metric | Value |
|--------|-------|
| Lines of Code | 1,324 |
| Files | 7 |
| Theme Configurations | 12 |
| Automation Methods | 30+ |

---

*This summary propagates to Master Architect for system-wide awareness.*
