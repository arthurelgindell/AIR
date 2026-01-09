# TAILSCALE Optimization for Claude Code

**Analysis Date:** 2026-01-07
**Nodes:** AIR (personal), ALPHA, BETA, GAMMA
**Current State:** All-to-all SSH via MagicDNS configured

---

## Executive Summary

Analysis of Tailscale documentation reveals **7 high-value features** that can significantly optimize Claude Code operations across the TAILSCALE nodes. Priority ranked by impact and implementation effort.

---

## HIGH PRIORITY - Implement Immediately

### 1. Tailscale SSH (Replace OpenSSH)

**Impact:** Critical
**Effort:** Low
**Doc:** [tailscale-ssh.md](tailscale-ssh.md)

#### Current State
Using traditional OpenSSH over TAILSCALE network.

#### Optimization
Replace with Tailscale SSH for:
- **Zero key management** - No more authorized_keys synchronization
- **Centralized access control** - Policy-based, not file-based
- **Session recording** - Audit trail for all SSH sessions
- **Instant revocation** - Policy changes propagate in seconds

#### Implementation
```bash
# On each node
tailscale set --ssh

# Add to tailnet policy
{
  "ssh": [
    {
      "action": "accept",
      "src": ["autogroup:members"],
      "dst": ["*"],
      "users": ["arthurdell", "autogroup:nonroot"]
    }
  ]
}
```

#### Benefits for Claude Code
- No SSH key sync scripts needed
- Unified authentication across all nodes
- Session recording for debugging multi-node operations

---

### 2. Taildrop for File Transfer

**Impact:** High
**Effort:** Very Low
**Doc:** [taildrop.md](taildrop.md)

#### Current State
Using SCP/rsync for file transfers.

#### Optimization
Use Taildrop for:
- **Peer-to-peer encryption** - No intermediate servers
- **Resume capability** - Interrupted transfers resume
- **Cross-platform** - Works on all node types

#### Implementation
```bash
# Enable in admin console (General settings > Send Files)

# Transfer files
tailscale file cp config.json gamma:
tailscale file cp *.py alpha:

# Receive files
tailscale file get ~/incoming
```

#### Benefits for Claude Code
- Faster file sync between nodes
- No SSH overhead for transfers
- Works even when SSH is problematic

---

### 3. Tailscale Serve for Internal Services

**Impact:** High
**Effort:** Low
**Doc:** [serve.md](serve.md)

#### Current State
Services require manual port exposure and firewall config.

#### Optimization
Use Tailscale Serve for:
- **Automatic HTTPS** - Valid certificates on all endpoints
- **Identity headers** - Know who's accessing services
- **No firewall config** - Works through NAT

#### Implementation
```bash
# Expose development server on AIR
tailscale serve --bg 3000

# Expose API on BETA
tailscale serve --bg 8080

# Access from any node
curl https://air.tail5f2bae.ts.net:3000
```

#### Benefits for Claude Code
- Share dev servers between nodes instantly
- Identity-aware services for multi-user scenarios
- No port forwarding or firewall rules

---

## MEDIUM PRIORITY - Implement This Week

### 4. Tags for Node Classification

**Impact:** Medium
**Effort:** Low
**Doc:** [tags.md](tags.md)

#### Current State
Nodes identified only by name.

#### Optimization
Tag nodes by purpose:
- `tag:personal` - AIR
- `tag:compute` - ALPHA, BETA, GAMMA
- `tag:production` - Stable workloads
- `tag:development` - Experimental

#### Implementation
```bash
# Apply tags
sudo tailscale login --advertise-tags=tag:personal    # AIR
sudo tailscale login --advertise-tags=tag:compute     # Others

# Policy using tags
{
  "acls": [
    {
      "action": "accept",
      "src": ["tag:personal"],
      "dst": ["tag:compute:*"]
    }
  ]
}
```

#### Benefits for Claude Code
- Group operations by tag
- Different policies for personal vs. compute
- Easier ACL management as nodes grow

---

### 5. Exit Node on AIR

**Impact:** Medium
**Effort:** Low
**Doc:** [exit-nodes.md](exit-nodes.md)

#### Current State
Each node uses its own internet connection.

#### Optimization
Configure AIR as exit node for:
- **Unified egress** - All traffic appears from AIR's IP
- **Security** - Route through trusted connection
- **Testing** - Simulate different network conditions

#### Implementation
```bash
# On AIR
sudo tailscale set --advertise-exit-node

# On other nodes (when needed)
tailscale set --exit-node=air
tailscale set --exit-node=        # Disable
```

#### Benefits for Claude Code
- Consistent network identity for external APIs
- Secure browsing from any node
- Test geo-dependent features

---

### 6. ACLs/Grants for Access Control

**Impact:** Medium
**Effort:** Medium
**Doc:** [acls.md](acls.md), [grants.md](grants.md)

#### Current State
Open access between all nodes.

#### Optimization
Implement granular access control:
- Define which nodes can access which services
- Port-level restrictions
- Time-based access (grants)

#### Implementation
```json
{
  "acls": [
    {
      "action": "accept",
      "src": ["tag:personal"],
      "dst": ["*:*"]
    },
    {
      "action": "accept",
      "src": ["tag:compute"],
      "dst": ["tag:compute:22,80,443,5432"]
    }
  ]
}
```

#### Benefits for Claude Code
- Security segmentation
- Limit blast radius of compromised nodes
- Audit-friendly access patterns

---

## LOWER PRIORITY - Implement When Needed

### 7. Tailnet Lock for Maximum Security

**Impact:** Medium
**Effort:** High
**Doc:** [tailnet-lock.md](tailnet-lock.md)

#### Current State
Trust Tailscale coordination server.

#### Optimization
Enable Tailnet Lock for:
- **Cryptographic verification** - All nodes signed
- **Zero trust** - Even Tailscale can't add nodes
- **Compliance** - Maximum security posture

#### Implementation
```bash
# Initialize (requires 2+ signing nodes)
tailscale lock init

# Store 10 disablement secrets securely!

# Sign new nodes
tailscale lock sign nodekey:xxx
```

#### Consideration
High operational overhead. Implement only if security requirements demand.

---

## Quick Wins Summary

| Feature | Command | Time |
|---------|---------|------|
| Enable Tailscale SSH | `tailscale set --ssh` | 1 min/node |
| Enable Taildrop | Admin console toggle | 1 min |
| Serve local port | `tailscale serve 3000` | 10 sec |
| Check connection type | `tailscale ping <node>` | 10 sec |
| Network diagnostics | `tailscale netcheck` | 30 sec |

---

## Recommended Implementation Order

### Week 1: Foundation
1. Enable Tailscale SSH on all nodes
2. Enable Taildrop
3. Test Tailscale Serve on AIR

### Week 2: Organization
4. Apply tags to all nodes
5. Configure basic ACLs
6. Configure AIR as optional exit node

### Future: Security Hardening
7. Evaluate Tailnet Lock requirements
8. Implement grants for fine-grained control
9. Set up session recording

---

## Monitoring Commands

```bash
# Connection status
tailscale status

# Network conditions
tailscale netcheck

# Ping with connection type
tailscale ping gamma

# Check if using direct or relay
tailscale status --json | jq '.Peer | to_entries[] | {name: .value.HostName, relay: .value.Relay}'
```

---

## Current Node Configuration

| Node | Role | Recommended Tags |
|------|------|-----------------|
| AIR | Personal/Dev Controller | `tag:personal`, `tag:controller` |
| ALPHA | Compute | `tag:compute` |
| BETA | Compute | `tag:compute` |
| GAMMA | Compute (Ubuntu) | `tag:compute`, `tag:linux` |

---

*Analysis based on Tailscale documentation as of 2026-01-07*
