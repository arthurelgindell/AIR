# Tailscale Funnel

**Source:** https://tailscale.com/kb/1223/funnel

---

## Overview

Tailscale Funnel routes traffic from the broader internet to a local service on your device. Share services with anyone via a unique URL, regardless of whether they use Tailscale.

## How It Works

1. **URL Generation** - Creates unique Funnel URL
2. **DNS Resolution** - Public DNS resolves to Funnel relay server IP (not your device)
3. **Encrypted Proxy** - Relay establishes TCP proxy with end-to-end encryption
4. **Request Processing** - Device receives encrypted requests, returns encrypted responses

**Critical:** Funnel relay servers do not decrypt traffic between public devices and your device.

## Requirements

- Tailscale v1.38.3 or later
- MagicDNS enabled
- Valid HTTPS certificates
- Funnel node attribute in tailnet policy file
- Personal, Personal Plus, Premium, or Enterprise plan

## Limitations

- DNS names in tailnet domain only (`tailnet-name.ts.net`)
- Ports 443, 8443, and 10000 only
- TLS-encrypted connections required
- Non-configurable bandwidth limits
- CLI-supporting platforms only

## Setup

### 1. Enable in Policy File
```json
{
  "nodeAttrs": [
    {
      "target": ["*"],
      "attr": ["funnel"]
    }
  ]
}
```

### 2. Expose Service
```bash
tailscale funnel 3000
```

Your service is now available at `https://device.tailnet-name.ts.net`

## Common Issues

- Missing funnel node attributes
- Invalid/missing HTTPS certificates
- Access control restrictions
- DNS propagation delays (up to 10 minutes)

## Status

Currently in beta.

## Use Cases for Claude Code

- Expose webhook endpoints for external services
- Share development previews with external collaborators
- Public API endpoints from any node
