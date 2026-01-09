# LM Studio CLI Reference

**Source:** https://lmstudio.ai/docs/cli

---

## Overview

LM Studio provides a command-line interface (`lms`) for server management and model operations.

---

## Server Commands

### Start Server
```bash
lms server start [options]
```

| Option | Description |
|--------|-------------|
| `--port PORT` | Specify port (default: 1234) |
| `--host HOST` | Bind address |
| `--cors` | Enable CORS |

### Stop Server
```bash
lms server stop
```

### Server Status
```bash
lms server status
```

---

## Model Commands

### List Models
```bash
lms list
```

### Load Model
```bash
lms load <model-path>
```

### Unload Model
```bash
lms unload <model-id>
```

---

## Configuration

### Show Config
```bash
lms config show
```

### Set Config
```bash
lms config set <key> <value>
```

---

## Examples

### Start server on custom port
```bash
lms server start --port 8080
```

### Start with network access
```bash
lms server start --host 0.0.0.0
```

---

## Notes

- CLI requires LM Studio to be installed
- macOS GUI app may not expose CLI in PATH
- Standalone installation recommended for CLI access
