# Tailscale Documentation Index

**Downloaded:** 2026-01-07
**Source:** https://tailscale.com/kb
**Purpose:** Reference for TAILSCALE node optimization (AIR, ALPHA, BETA, GAMMA)

---

## Documentation Structure

### Core Features
- [tailscale-ssh.md](tailscale-ssh.md) - Zero-config SSH with session recording
- [serve.md](serve.md) - Expose services within tailnet
- [funnel.md](funnel.md) - Expose services to public internet
- [taildrop.md](taildrop.md) - Peer-to-peer file sharing
- [exit-nodes.md](exit-nodes.md) - Route internet traffic through nodes
- [magicdns.md](magicdns.md) - Automatic DNS for devices

### Access Control
- [acls.md](acls.md) - Access Control Lists
- [grants.md](grants.md) - Enhanced access control system
- [tags.md](tags.md) - Device tagging for policy
- [tailnet-lock.md](tailnet-lock.md) - Cryptographic node verification

### Automation & CLI
- [cli.md](cli.md) - Complete CLI reference
- [tailscale-up.md](tailscale-up.md) - Connection command flags
- [auth-keys.md](auth-keys.md) - Automated authentication
- [api.md](api.md) - REST API overview

### Operations
- [production-best-practices.md](production-best-practices.md) - Production deployment
- [integrations.md](integrations.md) - Platform integrations

### Analysis
- [CLAUDE-CODE-OPTIMIZATION.md](CLAUDE-CODE-OPTIMIZATION.md) - **High-value features for Claude Code**

---

## Quick Reference

### MagicDNS Names (Current)
- `air.tail5f2bae.ts.net`
- `alpha.tail5f2bae.ts.net`
- `beta.tail5f2bae.ts.net`
- `gamma.tail5f2bae.ts.net`

### Key Commands
```bash
tailscale status          # Show connection status
tailscale set --ssh       # Enable Tailscale SSH
tailscale serve 3000      # Expose port 3000 to tailnet
tailscale funnel 443      # Expose port 443 to internet
tailscale file cp <file> <node>:  # Send file via Taildrop
```
