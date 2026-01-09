# Tailscale Channel Summary

**Last Updated:** 2026-01-08
**Status:** Active (newly created)
**Model:** opus

---

## Current Tailnet Configuration

| Node | IP | Role | Services |
|------|-----|------|----------|
| air | 100.79.73.73 | Command center | GUI client |
| alpha | 100.76.246.64 | Compute node | LM Studio HTTPS |
| beta | 100.117.121.73 | Compute node | LM Studio + LanceDB HTTPS |
| gamma | 100.102.59.5 | Compute node | Linux compute |

## Service URLs

| Service | URL | Status |
|---------|-----|--------|
| ALPHA LM Studio | https://alpha.tail5f2bae.ts.net/v1 | Active |
| BETA LM Studio | https://beta.tail5f2bae.ts.net/v1 | Active |
| BETA LanceDB | https://beta.tail5f2bae.ts.net:8443 | Active |

---

## Capabilities

| Capability | Status |
|------------|--------|
| ACL Documentation | ⏳ Pending fetch |
| CLI Reference | ⏳ Pending fetch |
| Serve Documentation | ⏳ Pending fetch |
| SSH Documentation | ⏳ Pending fetch |
| Node Status (live) | ⏳ Pending fetch |
| Serve Status (live) | ⏳ Pending fetch |

---

## Documentation Sources

| Source | Type | Cadence | Last Fetch |
|--------|------|---------|------------|
| kb-acls | web | weekly | never |
| kb-cli | web | weekly | never |
| kb-serve | web | weekly | never |
| kb-ssh | web | weekly | never |
| node-status | command | hourly | never |
| serve-status | command | hourly | never |

---

## Recent Changes

- **2026-01-08:** Channel created with initial structure
- **2026-01-08:** Tailscale Serve configured on ALPHA and BETA
- **2026-01-08:** Tailscale SSH enabled on ALPHA, BETA, GAMMA

---

## Decisions

| Decision | Rationale | Date |
|----------|-----------|------|
| Use opus model | Network config requires deep reasoning | 2026-01-08 |
| Hourly node status | Need current network state | 2026-01-08 |
| Weekly doc refresh | KB articles don't change frequently | 2026-01-08 |

---

## Dependencies

### Provides
- Tailscale CLI guidance
- ACL policy management
- Tailscale Serve configuration
- Tailscale SSH setup
- Node connectivity status

### Requires
- tailscale CLI installed
- Network connectivity to tailnet
- Admin access for ACL changes

---

## Integration Points

- **LM Studio channel:** Services exposed via Tailscale Serve
- **All channels:** May use Tailscale SSH for remote access

---

## Known Limitations

- ACL changes require admin console access
- Serve certificates require valid MagicDNS names
- Command outputs depend on tailscale daemon running

---

## Metrics

- **Documentation files:** 0 (pending initial fetch)
- **Sources configured:** 6
- **Last successful refresh:** never
