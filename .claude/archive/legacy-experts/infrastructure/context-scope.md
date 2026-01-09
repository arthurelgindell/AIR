# Context Scope: Infrastructure Expert

**Domain:** Infrastructure / DevOps
**Rule:** Only read/modify files matching IN SCOPE patterns.

---

## In Scope

### Directories
```
infrastructure/           # Primary infra directory
docker/                   # Docker configs
kubernetes/               # K8s manifests
k8s/                      # K8s manifests (alternate)
terraform/                # Terraform IaC
pulumi/                   # Pulumi IaC
.github/workflows/        # GitHub Actions
.gitlab-ci/               # GitLab CI
scripts/                  # Deployment scripts
monitoring/               # Monitoring configs
nginx/                    # Nginx configs
```

### File Patterns
```
Dockerfile*               # Docker builds
docker-compose*.yml       # Compose files
*.yaml (K8s manifests)    # Kubernetes
*.tf                      # Terraform
Makefile                  # Build automation
*.sh                      # Shell scripts
.env.example              # Env template (not .env!)
```

### Specific Files
```
.dockerignore             # Docker ignore
.github/workflows/*.yml   # GitHub Actions
Procfile                  # Process definition
fly.toml                  # Fly.io config
vercel.json               # Vercel config
netlify.toml              # Netlify config
render.yaml               # Render config
```

---

## Shared (Read-Only Unless Coordinated)

```
package.json              # Read for scripts, coordinate changes
tsconfig.json             # Read for build understanding
README.md                 # Read, coordinate deploy docs
```

---

## Out of Scope (NEVER Touch)

### Application Code
```
src/                      # All source code
tests/                    # Test code
*.ts                      # TypeScript source
*.tsx                     # React components
*.css                     # Stylesheets
```

### Configuration (Secrets)
```
.env                      # Actual env files (secrets!)
.env.local                # Local env
.env.production           # Production env
credentials*              # Credentials
secrets*                  # Secrets
*.pem                     # Certificates
*.key                     # Private keys
```

### Claude Configuration
```
.claude/                  # Claude config
```

---

## Context Loading Priority

### 1. Critical (Always Load)
- Files being modified
- Related infrastructure files
- Environment templates

### 2. High (Load if Room)
- CI/CD workflows
- Docker configuration
- Deploy scripts

### 3. Medium (Load on Demand)
- Cloud provider configs
- Monitoring setup
- Documentation

---

## Boundary Violations

If task requires:
- **Application code changes:** Escalate to Backend/Frontend
- **Database schema changes:** Coordinate with Backend
- **Actual secrets:** Never touch, only templates

---

## Special Considerations

### Secrets Management
- NEVER read or modify actual .env files
- Only work with .env.example templates
- Document required secrets without values
- Use secret references (${SECRET_NAME})

### Production Safety
- Always test in non-production first
- Escalate production deployment changes
- Document rollback procedures

---

*Infrastructure boundaries keep DevOps focused and secure.*
