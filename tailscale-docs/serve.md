# Tailscale Serve

**Source:** https://tailscale.com/kb/1312/serve

---

## Overview

Tailscale Serve routes traffic from other tailnet devices to a local service on your device. Share services privately within your tailnet (unlike Funnel which is public).

## Basic Usage

```bash
tailscale serve 3000
```

Proxies requests to `http://127.0.0.1:3000`. Remains active in foreground until terminated.

## Requirements

- HTTPS certificates enabled in tailnet
- Access control rules apply
- Interactive CLI provides web consent for HTTPS enablement

## Identity Headers

When proxying, Serve adds identity headers:

| Header | Content |
|--------|---------|
| `Tailscale-User-Login` | Requester's login (e.g., "alice@example.com") |
| `Tailscale-User-Name` | Display name (e.g., "Alice Architect") |
| `Tailscale-User-Profile-Pic` | Profile picture URL |

**Security Note:** Services should listen only on localhost to prevent header spoofing.

## App Capabilities Header

Available in unstable client v1.91.26+:
```bash
tailscale serve --accept-app-caps 3000
```

Forwards user app capabilities via `Tailscale-App-Capabilities` header.

## Limitations

- DNS names restricted to `device-name.tailnet-name.ts.net`
- File/directory serving limited to open-source macOS client
- Same port cannot serve both Serve (private) and Funnel (public)

## Examples

```bash
# Serve local web server
tailscale serve 3000

# Serve specific path
tailscale serve /path/to/files

# Serve with HTTPS
tailscale serve https://localhost:8443

# Background mode
tailscale serve --bg 3000
```

## Use Cases for Claude Code

- Expose development servers between nodes
- Share documentation servers within tailnet
- Internal API endpoints accessible from any node
