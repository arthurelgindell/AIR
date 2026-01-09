# Access Control Lists (ACLs)

**Source:** https://tailscale.com/kb/1018/acls

---

## Overview

Network layer approach to managing access within your tailnet. Define which devices/users can access ports on other devices.

## Basic Syntax

```json
{
  "acls": [
    {
      "action": "accept",
      "src": ["<sources>"],
      "dst": ["<destination>:<port>"]
    }
  ]
}
```

## Key Characteristics

| Property | Description |
|----------|-------------|
| **Deny-by-Default** | No communication without explicit access |
| **Directional** | Rules apply one way only |
| **Locally Enforced** | Devices enforce incoming connections |
| **Local Network Agnostic** | Don't affect local network access |

## Default Behavior

Without ACL definitions: allow-all policy.
To deny all: use empty `acls` section.

## Management Options

- Admin console Access Controls page
- GitOps for ACLs integration
- Tailscale API

## Plan Availability

| Feature | Free | Premium |
|---------|------|---------|
| Basic ACL rules | Yes | Yes |
| Autogroups | Yes | Yes |
| Tags | Yes | Yes |
| Groups | No | Yes |
| Users | No | Yes |
| Custom posture | No | Yes |

## Examples

### Allow all members to access servers
```json
{
  "acls": [
    {
      "action": "accept",
      "src": ["autogroup:members"],
      "dst": ["tag:server:*"]
    }
  ]
}
```

### SSH access to specific tag
```json
{
  "ssh": [
    {
      "action": "accept",
      "src": ["autogroup:members"],
      "dst": ["tag:prod"],
      "users": ["root", "autogroup:nonroot"]
    }
  ]
}
```

### Port-specific access
```json
{
  "acls": [
    {
      "action": "accept",
      "src": ["group:developers"],
      "dst": ["tag:database:5432"]
    }
  ]
}
```

## Migration Note

Tailscale recommends transitioning to **grants** (next-generation access control) though ACLs remain permanently supported.
