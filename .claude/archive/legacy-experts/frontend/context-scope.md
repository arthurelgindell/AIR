# Context Scope: Frontend Expert

**Domain:** Frontend / Client-Side
**Rule:** Only read/modify files matching IN SCOPE patterns.

---

## In Scope

### Directories
```
src/frontend/             # Primary frontend code
src/components/           # UI components
src/pages/                # Page components
src/views/                # View components
src/hooks/                # Custom hooks
src/state/                # State management
src/styles/               # Styling
src/assets/               # Static assets
src/utils/frontend/       # Frontend utilities
tests/frontend/           # Frontend tests
tests/components/         # Component tests
public/                   # Public assets
```

### File Patterns
```
*.tsx                    # React components
*.jsx                    # JSX files
*.css                    # Stylesheets
*.scss                   # SASS files
*.module.css             # CSS modules
*.styled.ts              # Styled components
*.stories.tsx            # Storybook stories
*.test.tsx               # Component tests
```

---

## Shared (Read-Only Unless Coordinated)

```
src/shared/types/         # Read OK, modify with coordination
src/shared/utils/         # Read OK, modify with coordination
src/shared/constants/     # Read OK, modify with coordination
package.json              # Read OK, add deps with coordination
tsconfig.json             # Read only
```

---

## Out of Scope (NEVER Touch)

### Backend
```
src/backend/              # Backend code
src/api/                  # API routes (backend)
src/server/               # Server code
src/services/             # Backend services
src/repositories/         # Data access
src/models/               # Backend models
database/                 # Migrations, seeds
*.api.ts                  # API implementation files
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
- Components being modified
- Hooks used by those components
- Styles for those components
- Types for props/state

### 2. High (Load if Room)
- Related/parent components
- Shared component library
- State management for feature

### 3. Medium (Load on Demand)
- Design system documentation
- Similar component patterns
- Test files

---

## Boundary Violations

If task requires:
- **Backend file changes:** Escalate, request API from Backend Expert
- **Infrastructure changes:** Escalate to Infrastructure Expert
- **Shared type changes:** Coordinate through Master Architect

---

*Frontend boundaries keep UI code clean and focused.*
