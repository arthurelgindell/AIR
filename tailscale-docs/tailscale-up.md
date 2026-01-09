# tailscale up Command

**Source:** https://tailscale.com/kb/1241/tailscale-up

---

## Overview

Connects device to Tailscale and handles authentication.

**Important:** Flags aren't retained between runs - must respecify each time.

## Complete Flag Reference

### Connection

| Flag | Purpose |
|------|---------|
| `--auth-key=<key>` | Automated authentication |
| `--force-reauth` | Trigger re-authentication |
| `--login-server=<url>` | Custom control server |
| `--timeout=<duration>` | Initialization wait (e.g., `30s`) |
| `--qr` | Display QR code for login |

### DNS & Routing

| Flag | Purpose |
|------|---------|
| `--accept-dns` | Accept DNS settings (default: enabled) |
| `--accept-routes` | Accept subnet routes from other nodes |
| `--advertise-routes=<ip>` | Expose subnet routes |
| `--exit-node=<ip\|name>` | Use exit node; `auto:any` for auto |
| `--exit-node-allow-lan-access` | Permit LAN with exit node |

### Node Identity

| Flag | Purpose |
|------|---------|
| `--hostname=<name>` | Override MagicDNS hostname |
| `--advertise-tags=<tags>` | Assign tagged permissions |
| `--advertise-exit-node` | Offer as exit node |
| `--advertise-connector` | Mark as app connector |

### Security

| Flag | Purpose |
|------|---------|
| `--ssh` | Enable Tailscale SSH server |
| `--shields-up` | Block incoming connections |
| `--accept-risk=<risk>` | Accept risks: `lose-ssh`, `all` |

### Linux-Specific

| Flag | Purpose |
|------|---------|
| `--netfilter-mode` | Firewall: `off`, `nodivert`, `on` |
| `--snat-subnet-routes` | NAT to advertised routes |
| `--stateful-filtering` | Stateful connection tracking |

### System

| Flag | Purpose |
|------|---------|
| `--operator=<user>` | Run as non-root user |
| `--unattended` | Windows: Keep running after logout |
| `--reset` | Restore defaults |
| `--json` | JSON output |

## Common Usage Examples

```bash
# Basic connection
tailscale up

# Enable SSH
tailscale up --ssh

# Automated with auth key
tailscale up --auth-key=tskey-xxx

# Tagged server
tailscale up --auth-key=tskey-xxx --advertise-tags=tag:server

# Exit node
tailscale up --advertise-exit-node

# Custom hostname
tailscale up --hostname=production-api

# Accept routes and enable SSH
tailscale up --accept-routes --ssh
```

## Flag Clearing

Pass empty arguments to reset:
```bash
tailscale up --advertise-tags=
tailscale up --exit-node=
```
