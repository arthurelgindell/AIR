# MagicDNS

**Source:** https://tailscale.com/kb/1081/magicdns

---

## Overview

Automatically registers DNS names for devices in your tailnet. Use machine names instead of IP addresses.

## Current Configuration

**Tailnet Domain:** `tail5f2bae.ts.net`

| Node | MagicDNS Name |
|------|---------------|
| AIR | air.tail5f2bae.ts.net |
| ALPHA | alpha.tail5f2bae.ts.net |
| BETA | beta.tail5f2bae.ts.net |
| GAMMA | gamma.tail5f2bae.ts.net |

## Enabling

Tailnets created after October 20, 2022 have MagicDNS enabled by default.

Manual: Admin console > DNS page > Toggle MagicDNS

## Usage

```bash
ssh alpha                    # Short name (with search domain)
ssh alpha.tail5f2bae.ts.net  # FQDN
ping gamma
curl http://beta:8080
```

## Domain Name Structure

`<machine-name>.<tailnet-name>.ts.net`

- **Machine Name** - User-editable device identifier
- **Tailnet DNS Name** - Organization's domain

## Configuration

### Change Machine Name
Edit in device settings via admin console.

### Disable MagicDNS

**Network-wide:** Admin console > DNS > Toggle off

**Per-device (Linux):**
```bash
tailscale set --accept-dns=false
```

**macOS:** Preferences > Uncheck "Use Tailscale DNS settings"

**Windows:** SHIFT + right-click tray > Deselect "Use Tailscale DNS"

## Limitations

- macOS: Some CLI tools (host, nslookup) bypass system DNS
- Shared devices require FQDN

## Best Practices

- Use consistent, descriptive machine names
- Keep names short for convenience
- Document naming conventions
