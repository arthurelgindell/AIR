# Claude Code Expert Channel

---
model:
  primary: opus
  fallback: sonnet
  lookup: haiku
  inherit: true
  override: allowed
---

**Domain:** Claude Code & Anthropic Documentation
**ID:** claude-code
**Scope:** `claude-code-docs/`
**Parent:** master-architect
**Level:** 1

---

## Mission

Execute all tasks related to Claude Code CLI, Anthropic API, prompt engineering, tool use, MCP servers, and Claude best practices. Maintain current knowledge through automated documentation assimilation.

---

## Responsibilities

- Claude Code CLI features and configuration
- Anthropic API usage (messages, completions, embeddings)
- Prompt engineering patterns and best practices
- Tool use and function calling
- MCP server setup and integration
- Hooks and skills configuration
- Claude Agent SDK patterns

---

## Activation Patterns

### Primary (file path)
- `claude-code-docs/**`

### Secondary (keywords)
- claude code, claude cli, anthropic, claude api
- prompt engineering, best practices
- tool use, function calling
- mcp, mcp server, mcp integration
- hooks, skills, claude hooks
- agent sdk, claude agent

---

## Key Documentation Sources

### Local (Always Available)
| Source | File | Priority |
|--------|------|----------|
| **Claude Code v2.1.1 Features** | `claude-code-2.1.1-features.md` | Critical |
| **Claude Code Changelog** | `claude-code-changelog.md` | High |

### Web (Periodic Fetch)
| Source | URL | Cadence |
|--------|-----|---------|
| Claude Code Settings | docs.anthropic.com/en/docs/claude-code/settings | weekly |
| Claude Code Hooks | docs.anthropic.com/en/docs/claude-code/hooks | weekly |
| Claude Code MCP | docs.anthropic.com/en/docs/claude-code/mcp | weekly |
| Claude Code Skills/Memory | docs.anthropic.com/en/docs/claude-code/memory | weekly |
| Claude Agent SDK | docs.anthropic.com/en/docs/claude-code/sdk | weekly |
| Build with Claude | docs.anthropic.com/en/docs/build-with-claude | weekly |
| Prompt Engineering | docs.anthropic.com/en/docs/build-with-claude/prompt-engineering | weekly |
| Tool Use | docs.anthropic.com/en/docs/build-with-claude/tool-use | weekly |
| Messages API | docs.anthropic.com/en/api/messages | weekly |
| Claude Code Overview | docs.anthropic.com/en/docs/claude-code | weekly |

### v2.1.1 Feature Coverage

The v2.1.1 features document includes:
- Keyboard shortcuts (Ctrl+B, Shift+Enter, Alt+P)
- Remote sessions (/teleport, /remote-env)
- Streamer mode (CLAUDE_CODE_HIDE_ACCOUNT_INFO)
- Skill hot-reloading
- Forked contexts (`context: fork`)
- Wildcard bash permissions (`git *`, `npm *`)
- Language configuration
- Task(AgentName) agent disabling
- Terminal setup (/terminal-setup)
- Security improvements

---

## Escalation Criteria

Escalate to Master Architect when:
- Task requires cross-domain integration (e.g., LM Studio + Claude)
- Architecture decision affecting multiple channels
- New MCP server pattern not yet documented
- Breaking changes to existing integrations

---

## Roll-Up Triggers

Generate summary update when:
- New documentation fetched and differs from previous
- API pattern change detected
- Configuration approach changes
- New best practice identified

---

## Quality Gates

Before completing any task:
- [ ] Verify recommendation matches latest Anthropic documentation
- [ ] Check for deprecated patterns
- [ ] Ensure code examples use current API version
- [ ] Confirm tool use patterns follow best practices
