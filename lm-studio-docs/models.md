# LM Studio Models

**Last Updated:** 2026-01-07 14:11:07

---

## TAILSCALE Node Models

### ALPHA (100.65.29.44)

```
glm-4.6v-flash
nvidia-nemotron-3-nano-30b-a3b-mlx
text-embedding-nomic-embed-text-v1.5
```

### BETA (100.84.202.68)

```
nvidia/nemotron-3-nano
text-embedding-nomic-embed-text-v1.5
```

---

## Supported Formats

| Format | Extension | Description |
|--------|-----------|-------------|
| GGUF | `.gguf` | Quantized models for llama.cpp |
| SafeTensors | `.safetensors` | Safe tensor format |
| MLX | `-mlx` | Apple Silicon optimized |

---

## Model Selection

Use the model ID in API requests:

```json
{
  "model": "<model-id>",
  "messages": [...]
}
```

---

## Refresh Model List

```bash
# ALPHA
curl -s http://100.65.29.44:1234/v1/models | jq '.data[].id'

# BETA
curl -s http://100.84.202.68:1234/v1/models | jq '.data[].id'
```
