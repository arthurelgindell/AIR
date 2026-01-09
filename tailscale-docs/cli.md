# Tailscale CLI Reference

**Source:** https://tailscale.com/kb/1080/cli

---

## Overview

Built-in CLI for managing and troubleshooting devices. Available on Linux, macOS, Windows.

**Common flag:** `--socket=<path>` specifies tailscaled socket path.

---

## Connection Management

### tailscale up
Connect and authenticate.
```bash
tailscale up
tailscale up --ssh                    # Enable Tailscale SSH
tailscale up --advertise-exit-node    # Offer as exit node
tailscale up --auth-key=tskey-xxx     # Automated auth
```

### tailscale down
Disconnect.
```bash
tailscale down
tailscale down --reason="maintenance"
```

### tailscale login
Log in and add device.
```bash
tailscale login
tailscale login --auth-key=tskey-xxx
```

### tailscale logout
Disconnect and expire login.

### tailscale set
Modify preferences without full reconfiguration.
```bash
tailscale set --ssh                   # Enable SSH
tailscale set --advertise-exit-node   # Become exit node
```

---

## Device Information

### tailscale status
```bash
tailscale status          # Table format
tailscale status --json   # JSON output
```

### tailscale ip
```bash
tailscale ip       # All IPs
tailscale ip -4    # IPv4 only
tailscale ip -6    # IPv6 only
```

### tailscale whois
```bash
tailscale whois 100.64.0.1
```

### tailscale version
```bash
tailscale version
tailscale version --short
```

---

## Network Diagnostics

### tailscale ping
```bash
tailscale ping gamma
tailscale ping --c 5 alpha    # 5 pings
```

### tailscale netcheck
Report network conditions, UDP status, NAT info, DERP latency.
```bash
tailscale netcheck
```

### tailscale nc
Connect to port on remote host.
```bash
tailscale nc gamma 22
```

---

## Routing & Access

### tailscale exit-node
```bash
tailscale exit-node list      # List available
tailscale exit-node suggest   # Recommend best
```

### tailscale serve
```bash
tailscale serve 3000                  # Serve to tailnet
tailscale serve --bg 3000             # Background
tailscale serve status                # Show current
tailscale serve reset                 # Stop serving
```

### tailscale funnel
```bash
tailscale funnel 443                  # Expose to internet
tailscale funnel --bg 8080            # Background
tailscale funnel status               # Show current
tailscale funnel reset                # Stop funneling
```

---

## File Management

### tailscale file
```bash
tailscale file cp file.txt gamma:     # Send file
tailscale file get /downloads         # Receive files
```

### tailscale drive
```bash
tailscale drive share myshare /path   # Share directory
tailscale drive list                  # List shares
tailscale drive unshare myshare       # Remove share
```

---

## Security

### tailscale lock
```bash
tailscale lock status                 # Lock status
tailscale lock init                   # Initialize
tailscale lock add tlpub:xxx          # Add signing node
tailscale lock sign nodekey:xxx       # Sign node
```

### tailscale cert
```bash
tailscale cert gamma.tail5f2bae.ts.net
```

### tailscale ssh
```bash
tailscale ssh user@gamma
```

---

## System Management

### tailscale update
```bash
tailscale update                      # Update client
tailscale update --dry-run            # Check only
tailscale update --version=1.50.0     # Specific version
```

### tailscale bugreport
```bash
tailscale bugreport
tailscale bugreport --diagnose
```

### tailscale dns
```bash
tailscale dns status                  # DNS config
tailscale dns query example.com       # Query DNS
```

---

## Tab Completion

```bash
# Bash
tailscale completion bash > /etc/bash_completion.d/tailscale

# Zsh
tailscale completion zsh > ~/.zsh/completions/_tailscale

# Fish
tailscale completion fish > ~/.config/fish/completions/tailscale.fish
```
