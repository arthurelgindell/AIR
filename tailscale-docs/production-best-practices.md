# Production Best Practices

**Source:** https://tailscale.com/kb/1300/production-best-practices

---

## Eight Practice Areas

### 1. Deployment Checklist
Systematic verification for successful deployment.

### 2. Key and Secret Management
Managing various keys and secrets for your tailnet:
- Auth keys
- API tokens
- Node keys
- Tailnet Lock keys

### 3. Secret Scanning
Tailscale partners scan for exposed secrets and notify to prevent fraudulent access.

### 4. Admin Account with Passkey Login
Set up admin user with passkey to mitigate SSO lockout scenarios.

### 5. Performance Best Practices
Optimizing Tailscale deployment performance:
- Direct connections preferred over DERP relay
- Minimize subnet router hops
- Use appropriate exit node locations

### 6. Cloud Reference Architectures

#### AWS
- VPC integration patterns
- Security group configuration
- High availability setup

#### Azure
- Virtual network integration
- NSG configuration
- Redundancy patterns

#### GCP
- VPC setup
- Firewall rules
- Regional deployment

## Key Themes

| Area | Focus |
|------|-------|
| Security | Multi-layered authentication |
| Operations | Systematic checklists |
| Performance | Connection optimization |
| Deployment | Cloud-native patterns |
| Credentials | Lifecycle management |

## Recommendations for TAILSCALE Nodes

### Security
- Enable Tailnet Lock for cryptographic verification
- Use tags for non-user devices
- Regular key rotation

### Performance
- Monitor connection types (direct vs. relay)
- Use `tailscale netcheck` for diagnostics
- Position exit nodes strategically

### Operations
- Document node purposes and configurations
- Maintain consistent naming conventions
- Regular audit of device list

### Automation
- Use auth keys for automated provisioning
- API integration for monitoring
- GitOps for policy management
