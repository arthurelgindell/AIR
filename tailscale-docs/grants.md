# Grants

**Source:** https://tailscale.com/kb/1324/grants

---

## Overview

Tailscale's modern access control system unifying network and application-layer permissions. Deny-by-default, zero-trust, least-privilege philosophy.

## Core Architecture

### Three Components

1. **Source (src)** - Users or devices requesting access
2. **Destination (dst)** - Resources being accessed
3. **Capabilities** - Permissions granted after connecting

### Selectors

| Type | Example |
|------|---------|
| Individual users | `"alice@example.com"` |
| User groups | `"group:developers"` |
| Device tags | `"tag:server"` |
| Admin roles | `"autogroup:admin"` |
| Special | `"autogroup:internet"` |

## Dual-Layer Permissions

### Network Layer (ip)
Basic connectivity - protocols, ports.
```json
"ip": ["tcp:443", "udp:53"]
```

### Application Layer (app)
Feature-level access.
```json
"app": {
  "tailscale.com/cap/tailsql": [{}]
}
```

## Benefits Over ACLs

- Fine-grained role-based permissions
- Device posture integration
- Unified network + application control
- Routing awareness via `via` specifications
- Context-aware policies

## Example Grant

```json
{
  "grants": [
    {
      "src": ["group:developers"],
      "dst": ["tag:api-server"],
      "ip": ["tcp:443", "tcp:8080"],
      "app": {
        "tailscale.com/cap/drive": [{"shares": ["*"]}]
      }
    }
  ]
}
```

## Limitations

- Applications define capabilities (not validated by Tailscale)
- Device posture checks apply to sources only
- Can coexist with legacy ACLs

## Recommendation

Use grants for new implementations; migrate existing ACLs when feasible.
