# Taildrop

**Source:** https://tailscale.com/kb/1106/taildrop

---

## Overview

Taildrop is Tailscale's file-sharing feature (public alpha). Enables encrypted peer-to-peer file transfers between personal devices without intermediary servers.

## Key Features

- **Encrypted transfers** - Secure peer-to-peer using fastest available path
- **Cross-platform** - macOS, iOS, Windows, Android, Linux
- **No third-party servers** - Complete privacy
- **Resume capability** - Interrupted transfers resume for up to 1 hour

## Setup

### Enable Taildrop
Admin console > General settings > Enable "Send Files"

## Usage by Platform

### Linux (CLI)
```bash
# Send file
tailscale file cp document.pdf gamma:

# Send multiple files
tailscale file cp *.txt alpha:

# Receive files (in current directory)
sudo tailscale file get .

# Receive to specific directory
sudo tailscale file get /path/to/destination
```

### macOS/iOS
Right-click > Share > Taildrop > Select device

### Windows
Right-click > "Send with Tailscale"

### Android
Share button > Tailscale > Select device

## File Locations

| Platform | Location |
|----------|----------|
| macOS | `~/Downloads` |
| Windows | `C:\Users\(username)\Downloads` |
| iOS/Android | Via Files app |
| Linux | Specified in `tailscale file get` command |

## Limitations

- Personal device transfers only
- Cannot send to other users' devices
- Tagged nodes incompatible
- Both devices must run Tailscale
- macOS/iOS cannot resume receiving transfers

## Use Cases for Claude Code

- Transfer configuration files between nodes
- Share project files across AIR, ALPHA, BETA, GAMMA
- Quick file sync without git/scp setup
