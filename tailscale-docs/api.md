# Tailscale API

**Source:** https://tailscale.com/kb/1101/api

---

## Overview

REST API for automating network management. Available across all pricing plans.

**Full API Reference:** https://tailscale.com/api

## Authentication

### Access Tokens
- Generate from Admin console > Keys page
- Required role: Owner, Admin, IT admin, or Network admin
- Expiry: 1-90 days (configurable)
- Case-sensitive
- Can be manually revoked

### OAuth Clients
Alternative for delegated fine-grained control.

## Common Endpoints

### Devices
```bash
# List devices
curl "https://api.tailscale.com/api/v2/tailnet/-/devices" \
  -u "$API_KEY:"

# Get device details
curl "https://api.tailscale.com/api/v2/device/{deviceId}" \
  -u "$API_KEY:"

# Delete device
curl -X DELETE "https://api.tailscale.com/api/v2/device/{deviceId}" \
  -u "$API_KEY:"

# Set device tags
curl -X POST "https://api.tailscale.com/api/v2/device/{deviceId}/tags" \
  -u "$API_KEY:" \
  -d '{"tags": ["tag:server"]}'
```

### Keys
```bash
# Create auth key
curl -X POST "https://api.tailscale.com/api/v2/tailnet/-/keys" \
  -u "$API_KEY:" \
  -d '{"capabilities": {"devices": {"create": {"reusable": false, "ephemeral": true}}}}'

# List keys
curl "https://api.tailscale.com/api/v2/tailnet/-/keys" \
  -u "$API_KEY:"
```

### Policy (ACLs)
```bash
# Get current policy
curl "https://api.tailscale.com/api/v2/tailnet/-/acl" \
  -u "$API_KEY:"

# Update policy
curl -X POST "https://api.tailscale.com/api/v2/tailnet/-/acl" \
  -u "$API_KEY:" \
  -H "Content-Type: application/json" \
  -d @policy.json
```

### DNS
```bash
# Get DNS settings
curl "https://api.tailscale.com/api/v2/tailnet/-/dns/nameservers" \
  -u "$API_KEY:"
```

## Use Cases for Claude Code

- Automated device management scripts
- Dynamic policy updates
- Integration with CI/CD pipelines
- Monitoring and alerting systems
- Custom dashboards
