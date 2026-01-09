# Exit Nodes

**Source:** https://tailscale.com/kb/1103/exit-nodes

---

## Overview

Route all internet traffic through a specific device on your TAILSCALE network. Similar to traditional VPN setup.

## Use Cases

- Secure traffic on untrusted networks
- Access geo-restricted services
- Regulatory compliance
- Test from different locations

## Requirements

- Tailscale v1.20+
- Linux, macOS, Windows, Android, or tvOS device
- Admin access for approval
- IP forwarding enabled (Linux)

## Setup

### 1. Enable IP Forwarding (Linux)
```bash
echo 'net.ipv4.ip_forward = 1' | sudo tee -a /etc/sysctl.d/99-tailscale.conf
echo 'net.ipv6.conf.all.forwarding = 1' | sudo tee -a /etc/sysctl.d/99-tailscale.conf
sudo sysctl -p /etc/sysctl.d/99-tailscale.conf
```

### 2. Advertise as Exit Node
```bash
sudo tailscale set --advertise-exit-node
```

Or on macOS/Windows: GUI > "Run as exit node"

### 3. Admin Approval
Admin console > Machines > Approve exit node

Or via policy:
```json
{
  "autoApprovers": {
    "exitNode": ["tag:exit"]
  }
}
```

### 4. Use Exit Node
```bash
tailscale set --exit-node=gamma
tailscale set --exit-node=auto:any    # Auto-select
tailscale set --exit-node=            # Disable
```

## Security

- **Opt-in:** Every device must explicitly enable
- Traffic exits via exit node's public IP
- Users don't need direct device access

## Limitations

| Platform | Limitation |
|----------|------------|
| Android | Userspace only, slower, needs power |
| macOS/Windows | Userspace only, prevent sleep |
| tvOS | Must be home hub |

## Local Network Access

Disabled by default. Enable with:
```bash
tailscale set --exit-node-allow-lan-access
```

## Use Cases for TAILSCALE Nodes

- AIR as exit node for secure browsing from other nodes
- Route ALPHA/BETA/GAMMA traffic through AIR for unified egress
- Test geo-location dependent features
