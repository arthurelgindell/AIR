# LM Studio API Server

**Source:** https://lmstudio.ai/docs/developer/core/server

---

## Overview

LM Studio provides a local API server that is fully **OpenAI-compatible**. Any code or library designed for OpenAI's API works with LM Studio without modification.

---

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| Port | 1234 | API server port |
| Bind Address | localhost | Network interface |
| CORS | Configurable | Cross-origin requests |
| Network Access | Configurable | Allow LAN access |

---

## Endpoints

### Chat Completions
```
POST /v1/chat/completions
```

Request:
```json
{
  "model": "model-id",
  "messages": [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "Hello!"}
  ],
  "temperature": 0.7,
  "max_tokens": 1000,
  "stream": false
}
```

Response:
```json
{
  "id": "chatcmpl-xxx",
  "object": "chat.completion",
  "created": 1234567890,
  "model": "model-id",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Hello! How can I help you?"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 8,
    "total_tokens": 18
  }
}
```

### Text Completions
```
POST /v1/completions
```

Request:
```json
{
  "model": "model-id",
  "prompt": "The quick brown fox",
  "max_tokens": 100
}
```

### Embeddings
```
POST /v1/embeddings
```

Request:
```json
{
  "model": "text-embedding-model",
  "input": "Text to embed"
}
```

### List Models
```
GET /v1/models
```

Response:
```json
{
  "object": "list",
  "data": [
    {
      "id": "model-identifier",
      "object": "model",
      "owned_by": "organization_owner"
    }
  ]
}
```

---

## Streaming

Enable streaming for real-time token output:

```json
{
  "model": "model-id",
  "messages": [...],
  "stream": true
}
```

Returns Server-Sent Events (SSE):
```
data: {"choices":[{"delta":{"content":"Hello"}}]}
data: {"choices":[{"delta":{"content":" world"}}]}
data: [DONE]
```

---

## Authentication

For local use, API keys can be arbitrary or omitted. The server accepts any value in the `Authorization` header.

```bash
curl http://localhost:1234/v1/models \
  -H "Authorization: Bearer any-value"
```

---

## Network Access

To allow access from other devices:

1. Open LM Studio Settings
2. Enable "Allow network access"
3. Note the bind address changes from `localhost` to `0.0.0.0`

**TAILSCALE Integration:** When bound to all interfaces, LM Studio is accessible via Tailscale IP from any node in the tailnet.

---

## Python Client Example

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://100.65.29.44:1234/v1",  # ALPHA
    api_key="not-needed"
)

response = client.chat.completions.create(
    model="glm-4.6v-flash",
    messages=[{"role": "user", "content": "Hello!"}]
)

print(response.choices[0].message.content)
```

---

## Curl Examples

### Chat Completion
```bash
curl http://100.65.29.44:1234/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "glm-4.6v-flash",
    "messages": [{"role": "user", "content": "What is 2+2?"}]
  }'
```

### List Models
```bash
curl http://100.65.29.44:1234/v1/models | jq '.data[].id'
```

### Generate Embedding
```bash
curl http://100.84.202.68:1234/v1/embeddings \
  -H "Content-Type: application/json" \
  -d '{
    "model": "text-embedding-nomic-embed-text-v1.5",
    "input": "Hello world"
  }'
```
