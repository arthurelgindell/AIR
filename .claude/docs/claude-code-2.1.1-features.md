# Claude Code v2.1.1 Features Reference

**Last Updated:** 2026-01-08
**Version:** 2.1.1 (includes 2.1.0 features)

---

## Keyboard Shortcuts

| Shortcut | Action | Notes |
|----------|--------|-------|
| `Ctrl+B` | Background tasks | Backgrounds both bash and agents simultaneously |
| `Shift+Enter` | Multi-line input | Native support in iTerm2, WezTerm, Ghostty, Kitty |
| `Shift+Tab` (2x) | Toggle Plan Mode | Cycles: Normal → Auto-Accept → Plan |
| `Option+P` / `Alt+P` | Switch models | Change model while typing prompt |
| `Escape` | Interrupt | Stop current operation, preserve context |
| `Escape` (2x) | Edit prompt | Edit previous prompt to explore alternatives |

---

## Remote Session Commands

**Availability:** claude.ai subscribers only

| Command | Description |
|---------|-------------|
| `/teleport` | Resume cloud session locally |
| `/remote-env` | Configure remote environment variables |

### Teleport Usage

```bash
# From Claude Code web, copy session ID
# Then locally:
claude --teleport session_abc123
```

**Current Limitations:**
- Unidirectional only: Web → Local
- No Local → Remote or SSH support yet
- Feature request: [GitHub Issue #11455](https://github.com/anthropics/claude-code/issues/11455)

### Remote Environment Detection

```bash
#!/bin/bash
# Check if running in remote environment
if [ "$CLAUDE_CODE_REMOTE" = "true" ]; then
  echo "Running in Claude Code web"
  # Remote-specific logic here
fi
```

### Persist Environment Variables (SessionStart hooks)

```bash
#!/bin/bash
# Write to CLAUDE_ENV_FILE to persist vars for subsequent commands
if [ -n "$CLAUDE_ENV_FILE" ]; then
  echo "MY_VAR=value" >> "$CLAUDE_ENV_FILE"
fi
```

---

## Streamer Mode

Hide account information for streaming or recording sessions:

```bash
# Option 1: Environment variable
export CLAUDE_CODE_HIDE_ACCOUNT_INFO=1
claude

# Option 2: IS_DEMO variable
export IS_DEMO=1
claude
```

**What it hides:**
- Email address
- Organization name
- Account identification info

---

## Skill Hot-Reloading

Skills created or modified in `~/.claude/skills` or `.claude/skills` are now **immediately available** without restarting the session.

**Benefits:**
- Rapid skill development iteration
- No need to restart Claude Code after skill changes
- Both user-level and project-level skills supported

---

## Skill Frontmatter Options

| Field | Values | Description |
|-------|--------|-------------|
| `name` | string | Skill display name |
| `description` | string | When skill should be invoked |
| `context` | `fork` | Run in isolated sub-agent context |
| `agent` | `plan`, etc. | Force specific agent type |
| `trigger` | `auto` | Auto-activate on keywords |
| `priority` | `critical`, `high`, `medium` | Execution priority |
| `alwaysActive` | `true` | Keep skill always active |
| `model` | `sonnet`, `opus`, `haiku` | Override model for skill |

### Forked Context Example

```yaml
---
name: My Skill
description: Does something specialized
context: fork
---
```

**When to use `context: fork`:**
- Heavy computation that shouldn't pollute main context
- Token calculations or analysis
- Background monitoring tasks
- Scratchpad-style operations

---

## Wildcard Bash Permissions

New wildcard syntax for bash permissions:

```json
{
  "safeCommands": [
    "git *",
    "npm *",
    "python *",
    "node *"
  ]
}
```

**Patterns:**
- `npm *` - All npm commands
- `* install` - Any command ending in install
- `git * main` - Git commands targeting main

---

## Language Configuration

Set Claude's response language in settings:

```json
{
  "language": "japanese"
}
```

**Supported languages:** japanese, spanish, french, german, and others.

---

## Task(AgentName) Permissions

Disable specific agents:

```json
{
  "permissions": {
    "disallowedTools": ["Task(Explore)"]
  }
}
```

Or via CLI:
```bash
claude --disallowedTools "Task(Explore)"
```

---

## Terminal Setup

For terminals without native Shift+Enter support:

```bash
/terminal-setup
```

**Terminals with native support (no setup needed):**
- iTerm2
- WezTerm
- Ghostty
- Kitty

**Terminals requiring setup:**
- VS Code integrated terminal
- Alacritty
- Zed
- Warp

---

## Security Improvements

**v2.1.0 Security Fix:**
- Sensitive data (OAuth tokens, API keys, passwords) no longer exposed in debug logs
- Fixed potential credential leakage in verbose output

---

## Best Practices (from Anthropic)

1. **Treat CLAUDE.md like a prompt** - Iterate on effectiveness
2. **Explore → Plan → Code → Commit** workflow
3. **Test-driven development** - Write tests first, have Claude iterate
4. **Multi-Claude workflows** - Parallel instances for code + review
5. **Context management** - Use `/clear` between unrelated tasks
6. **Scratchpad pattern** - Track changes in a dedicated file

---

## Sources

- [Claude Code v2.1.0 Changelog](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- [Claude Code Settings Documentation](https://code.claude.com/docs/en/settings.md)
- [Claude Code Best Practices](https://www.anthropic.com/engineering/claude-code-best-practices)
- [Claude Code on the Web](https://code.claude.com/docs/en/claude-code-on-the-web)
