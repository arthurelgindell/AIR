# LM Studio TAILSCALE Integration

---

## Overview

LM Studio instances on ALPHA and BETA are accessible across the TAILSCALE network via **Tailscale Serve** (HTTPS with automatic certificates).

---

## Current Configuration

| Node | Tailscale IP | HTTPS URL | Port | Status |
|------|--------------|-----------|------|--------|
| ALPHA | 100.76.246.64 | https://alpha.tail5f2bae.ts.net | 1234 | Active |
| BETA | 100.117.121.73 | https://beta.tail5f2bae.ts.net | 1234 | Active |

### Additional Services

| Service | Node | HTTPS URL | Local Port |
|---------|------|-----------|------------|
| LanceDB | BETA | https://beta.tail5f2bae.ts.net:8443 | 8000 |

---

## Access Patterns

### Via Tailscale Serve (Recommended)
```bash
# HTTPS with automatic certificates
curl https://alpha.tail5f2bae.ts.net/v1/models
curl https://beta.tail5f2bae.ts.net/v1/models

# LanceDB on BETA
curl https://beta.tail5f2bae.ts.net:8443/
```

### Direct HTTP (Fallback)
```bash
# From any TAILSCALE node (if Serve is unavailable)
curl http://100.76.246.64:1234/v1/models
curl http://100.117.121.73:1234/v1/models
```

---

## Python Client Configuration

```python
from openai import OpenAI

# ALPHA endpoint (via Tailscale Serve HTTPS)
alpha_client = OpenAI(
    base_url="https://alpha.tail5f2bae.ts.net/v1",
    api_key="not-needed"
)

# BETA endpoint (via Tailscale Serve HTTPS)
beta_client = OpenAI(
    base_url="https://beta.tail5f2bae.ts.net/v1",
    api_key="not-needed"
)

# Use ALPHA for GLM model
response = alpha_client.chat.completions.create(
    model="glm-4.6v-flash",
    messages=[{"role": "user", "content": "Hello"}]
)

# Use BETA for Nemotron
response = beta_client.chat.completions.create(
    model="nvidia/nemotron-3-nano",
    messages=[{"role": "user", "content": "Hello"}]
)
```

---

## Load Balancing Strategy

For redundancy, route requests based on model availability:

```python
def get_client_for_model(model_id):
    alpha_models = ["glm-4.6v-flash", "nvidia-nemotron-3-nano-30b-a3b-mlx"]
    beta_models = ["nvidia/nemotron-3-nano"]

    if model_id in alpha_models:
        return OpenAI(base_url="https://alpha.tail5f2bae.ts.net/v1", api_key="x")
    elif model_id in beta_models:
        return OpenAI(base_url="https://beta.tail5f2bae.ts.net/v1", api_key="x")
    else:
        # Both have embedding model
        return OpenAI(base_url="https://alpha.tail5f2bae.ts.net/v1", api_key="x")
```

---

## Health Checks

```bash
# Check ALPHA (HTTPS)
curl -s -o /dev/null -w "%{http_code}" https://alpha.tail5f2bae.ts.net/v1/models

# Check BETA (HTTPS)
curl -s -o /dev/null -w "%{http_code}" https://beta.tail5f2bae.ts.net/v1/models

# Check LanceDB on BETA
curl -s -o /dev/null -w "%{http_code}" https://beta.tail5f2bae.ts.net:8443/
```

---

## Tailscale Serve Configuration

Tailscale Serve is active on both nodes, providing HTTPS with automatic certificates.

```bash
# ALPHA configuration
tailscale serve --bg 1234

# BETA configuration (LM Studio + LanceDB)
tailscale serve --bg --https=443 1234
tailscale serve --bg --https=8443 8000
```

Benefits:
- HTTPS with automatic certificates
- MagicDNS hostnames (no IP management)
- Identity headers for request attribution

---

## Available Models

| Node | Model ID | Type |
|------|----------|------|
| ALPHA | glm-4.6v-flash | Chat |
| ALPHA | nvidia-nemotron-3-nano-30b-a3b-mlx | Chat |
| ALPHA | text-embedding-nomic-embed-text-v1.5 | Embedding |
| BETA | nvidia/nemotron-3-nano | Chat |
| BETA | text-embedding-nomic-embed-text-v1.5 | Embedding |

---

## Troubleshooting

### Connection Refused
- Check LM Studio is running
- Verify "Allow network access" is enabled in LM Studio settings
- Check Tailscale Serve status: `tailscale serve status`

### Timeout
- Check Tailscale status: `tailscale status`
- Verify direct connection: `tailscale ping alpha-1`
- Verify serve is running: `tailscale serve status`

### Certificate Issues
- Tailscale Serve uses automatic HTTPS certificates
- Only accessible within the tailnet (not public internet)
- Use full MagicDNS hostname: `alpha.tail5f2bae.ts.net`

### Version Mismatch Warning
- If App Store and Homebrew Tailscale conflict, remove App Store version
- Check: `ps aux | grep tailscale`
- Restart daemon: `brew services restart tailscale`
