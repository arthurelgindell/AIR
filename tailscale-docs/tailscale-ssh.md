# Tailscale SSH

**Source:** https://tailscale.com/kb/1193/tailscale-ssh

---

## Overview

Tailscale SSH allows Tailscale to manage authentication and authorization for SSH connections within your tailnet. Available on Personal, Personal Plus, Premium, and Enterprise plans.

## Key Features

### Authentication & Authorization
- Intercepts port 22 traffic from the tailnet
- Uses node keys instead of traditional SSH keypairs
- End-to-end encryption via WireGuard
- Standard SSH protocol compatibility

### Check Mode
- Optional security feature requiring re-authentication
- 12-hour access window (customizable)
- Optional MFA integration

### Session Recording
- Record SSH sessions for audit
- Troubleshooting capabilities
- Compliance support

## Requirements

- Linux or macOS (open-source tailscaled variant only)
- Tailscale v1.24 or later
- Proper access control policies allowing SSH traffic
- SSH advertised on destination host

## Setup

### 1. Enable SSH on Host
```bash
tailscale set --ssh
```

### 2. Configure Access Policies
Define SSH rules in tailnet policy file:
```json
{
  "ssh": [
    {
      "action": "accept",
      "src": ["autogroup:members"],
      "dst": ["tag:server"],
      "users": ["autogroup:nonroot"]
    }
  ]
}
```

### 3. Connect
```bash
ssh device              # Using MagicDNS
ssh user@100.64.0.1     # Using Tailscale IP
```

## Access Control Policy Structure

| Field | Purpose |
|-------|---------|
| `action` | "accept" or "check" |
| `src` | Source users/groups/tags |
| `dst` | Destination devices |
| `users` | Allowed SSH usernames |
| `checkPeriod` | Verification interval (1 min - 168 hours) |
| `acceptEnv` | Environment variable allowlist |

## Benefits

- **Reduced key management** - WireGuard keys auto-generate and expire
- **Centralized control** - Policies replace distributed SSH keys
- **Compliance support** - Session recording for audit trails
- **Immediate revocation** - Policy updates take effect in seconds

## Limitations

- Port 22 only
- Linux and macOS open-source variants only
- Not for Synology or QNAP
- Incompatible with non-Tailscale IPs
- Restarting tailscaled terminates active sessions

## Security Considerations

May not suit:
- Multi-user machines with different access permissions
- Machines running untrusted code with outbound SSH access

Alternative: Run traditional SSH server on top of Tailscale network layer.
