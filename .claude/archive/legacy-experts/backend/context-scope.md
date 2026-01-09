# Context Scope: Backend Expert

**Domain:** Backend / Server-Side
**Rule:** Only read/modify files matching IN SCOPE patterns.

---

## In Scope

### Directories
```
src/backend/              # Primary backend code
src/api/                  # API routes (if separate)
src/server/               # Server code (if separate)
src/services/             # Service layer
src/repositories/         # Data access
src/models/               # Data models
src/middleware/           # Server middleware
database/                 # Migrations, seeds
tests/backend/            # Backend tests
tests/api/                # API tests
docs/api/                 # API documentation
```

### File Patterns
```
*.api.ts                 # API files
*.service.ts             # Service files
*.repository.ts          # Repository files
*.model.ts               # Model files
*.middleware.ts          # Middleware files
*.controller.ts          # Controller files
**/migrations/*          # Database migrations
**/seeds/*               # Database seeds
openapi.yaml             # API specification
swagger.json             # Swagger documentation
```

---

## Shared (Read-Only Unless Coordinated)

```
src/shared/types/         # Read OK, modify with coordination
src/shared/utils/         # Read OK, modify with coordination
src/shared/constants/     # Read OK, modify with coordination
package.json              # Read OK, add deps with coordination
tsconfig.json             # Read only
.env.example              # Read only
```

---

## Out of Scope (NEVER Touch)

### Frontend
```
src/frontend/             # Frontend code
src/components/           # UI components
src/pages/                # Page components
src/styles/               # CSS/styling
src/hooks/                # React hooks
src/state/                # Client state
*.css                     # Stylesheets
*.scss                    # SASS files
```

### Infrastructure
```
docker/                   # Docker files
.github/                  # GitHub Actions
kubernetes/               # K8s manifests
terraform/                # Terraform
Dockerfile                # Docker build
docker-compose.yml        # Compose config
```

### Configuration
```
.claude/                  # Claude config
.env                      # Environment (secrets)
.env.*                    # Environment variants
credentials*              # Credentials
secrets*                  # Secrets
```

---

## Context Loading Priority

### 1. Critical (Always Load)
- Files being modified
- Service/repository being called
- Model definitions for data being used
- Middleware in request chain

### 2. High (Load if Room)
- Related services
- Database schema/migrations
- Existing tests for modified code

### 3. Medium (Load on Demand)
- API documentation
- Similar endpoint patterns
- Utility functions

---

## Boundary Violations

If task requires:
- **Frontend file changes:** Escalate, let frontend-expert handle
- **Infrastructure changes:** Escalate, let infrastructure-expert handle
- **Shared type changes:** Coordinate through Master Architect

---

*Backend boundaries keep server code focused and isolated.*
