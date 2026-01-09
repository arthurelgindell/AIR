# Auth Keys

**Source:** https://tailscale.com/kb/1085/auth-keys

---

## Overview

Pre-authentication credentials enabling device registration without browser authentication. Essential for containerized deployments, IoT devices, and infrastructure-as-code.

## Key Concept

"An auth key authenticates a device as the user who generated the key."

When tags are applied, devices assume the tagged identity after initial authentication.

## Key Types

### One-Off Keys
- Single-use credentials
- Auto-revoke after initial use
- Ideal for cloud servers

### Reusable Keys
- Multi-use credentials
- **Security warning:** Very dangerous if stolen
- Use with caution for shared resources

## Key Expiry

- 1-90 days (default: 90 days)
- Expiration doesn't affect already-authenticated devices
- Tagged devices: expiry defaults to disabled

## Generation

**Requirements:** Owner, Admin, IT admin, or Network admin role

**Admin Console:** Keys page > Generate

**Options:**
- Ephemeral: Auto-removes offline devices
- Pre-approved: Bypasses device approval
- Tags: Auto-applies organizational tags

## Usage

```bash
# Basic registration
sudo tailscale up --auth-key=tskey-abcdef1432341818

# With tags
sudo tailscale up --auth-key=tskey-xxx --advertise-tags=tag:server

# Ephemeral node
sudo tailscale up --auth-key=tskey-xxx --hostname=ephemeral-worker
```

## Revocation

- Admins can revoke keys via admin console
- **Note:** Revoking a key does NOT deauthorize nodes already using it

## Best Practices

| Deployment | Recommendation |
|------------|----------------|
| Ephemeral workloads | Ephemeral keys (containers, Lambda) |
| Server deployments | Pre-approved, tagged keys |
| Locked tailnets | Pre-signed keys via `tailscale lock sign` |

## Alternative

OAuth clients + Tailscale API for programmatic key generation.

## Use Cases for Claude Code

- Automated node provisioning scripts
- CI/CD pipeline integration
- Container deployments with ephemeral keys
