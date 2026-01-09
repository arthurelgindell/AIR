# Tags

**Source:** https://tailscale.com/kb/1068/tags

---

## Overview

Tags authenticate and identify non-user devices (servers, ephemeral nodes). Provide service-based identity for access control.

## Key Characteristics

- Remove user-based authentication when applied
- Multiple tags per device allowed
- Defined in `tagOwners` section of policy file
- Only designated owners can apply tags

## Requirements

- Free feature (all plans)
- Owner, Admin, or Network admin to define tags
- Tag owner status to assign tags

## Use Cases

### Ideal For
- Devices without user association
- Shared resource management
- Infrastructure component authentication

### Not Recommended For
- Annotating user devices
- Linking devices to user accounts
- End-user device authentication

## Tag Ownership

```json
{
  "tagOwners": {
    "tag:server": ["group:admins"],
    "tag:prod": ["tag:server", "alice@example.com"],
    "tag:dev": ["group:developers"]
  }
}
```

Owners can be users, groups, or other tags.

## Applying Tags

### Admin Console
Requires Owner/Admin/Network admin role.

### CLI
```bash
sudo tailscale login --advertise-tags=tag:server
sudo tailscale login --advertise-tags=tag:prod,tag:web
```

### API
```bash
curl -X POST "https://api.tailscale.com/api/v2/device/{id}/tags" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"tags": ["tag:server"]}'
```

## ACL Integration

```json
{
  "acls": [
    {
      "action": "accept",
      "src": ["tag:client"],
      "dst": ["tag:server:*"]
    }
  ]
}
```

## Key Expiry

Disabled by default when tags are applied. Re-authentication disables expiry unless explicitly enabled.

## Best Practices

- Establish consistent naming conventions early
- Use auth keys with pre-assigned tags
- Avoid tagging user-owned devices
- Document ownership hierarchies
- Consider composite tags (e.g., `tag:prod-postgresql-server`)
