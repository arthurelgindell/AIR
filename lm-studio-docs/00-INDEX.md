# LM Studio Documentation

**Last Updated:** 2026-01-07
**Official Site:** https://lmstudio.ai
**Documentation:** https://lmstudio.ai/docs

---

## Documentation Index

| File | Topic |
|------|-------|
| [api-server.md](api-server.md) | Local API server setup and endpoints |
| [cli-reference.md](cli-reference.md) | Command line interface |
| [models.md](models.md) | Model management and formats |
| [TAILSCALE-INTEGRATION.md](TAILSCALE-INTEGRATION.md) | TAILSCALE node integration |

---

## Quick Reference

### Default Configuration
- **Port:** 1234
- **Base URL:** `http://localhost:1234/v1`
- **API Compatibility:** OpenAI-compatible

### TAILSCALE Node Status

| Node | URL | Models |
|------|-----|--------|
| ALPHA | http://100.65.29.44:1234 | glm-4.6v-flash, nvidia-nemotron-3-nano-30b-a3b-mlx, nomic-embed |
| BETA | http://100.84.202.68:1234 | nvidia/nemotron-3-nano, nomic-embed |

### Quick Commands

```bash
# List models on ALPHA
curl -s http://100.65.29.44:1234/v1/models | jq '.data[].id'

# List models on BETA
curl -s http://100.84.202.68:1234/v1/models | jq '.data[].id'

# Chat completion
curl http://100.65.29.44:1234/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "glm-4.6v-flash",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

---

*This documentation is auto-refreshed weekly.*
