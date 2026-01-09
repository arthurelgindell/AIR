# Architecture Guidelines

## Core Principles

### Separation of Concerns
- Each module should have a single, well-defined responsibility
- Minimize coupling between modules
- Use clear interfaces for communication

### Layered Architecture
- Presentation layer (UI/API)
- Business logic layer (services)
- Data access layer (repositories)
- External integrations (adapters)

### Dependency Inversion
- Depend on abstractions, not implementations
- High-level modules should not depend on low-level modules
- Use dependency injection where appropriate

---

## Directory Structure

```
project/
├── src/
│   ├── core/           # Business logic, domain models
│   ├── services/       # Application services
│   ├── adapters/       # External integrations
│   ├── api/            # API endpoints (if applicable)
│   ├── ui/             # UI components (if applicable)
│   └── utils/          # Shared utilities
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── config/             # Configuration files
├── docs/               # Documentation
└── scripts/            # Build/deploy scripts
```

---

## Design Patterns

### Preferred Patterns
- **Repository Pattern**: Abstract data access
- **Factory Pattern**: Object creation
- **Strategy Pattern**: Interchangeable algorithms
- **Observer Pattern**: Event handling
- **Adapter Pattern**: External integrations

### Anti-Patterns to Avoid
- God objects (too many responsibilities)
- Spaghetti code (tangled dependencies)
- Premature abstraction
- Over-engineering

---

## API Design

### REST Endpoints
- Use nouns for resources (`/users`, `/orders`)
- Use HTTP methods correctly (GET, POST, PUT, DELETE)
- Version your API (`/v1/users`)
- Return appropriate status codes

### Request/Response
- Use consistent response format
- Include pagination for lists
- Handle errors uniformly
- Document all endpoints

---

## Data Flow

### Unidirectional Data Flow
- Data flows in one direction
- Changes trigger updates through defined channels
- State is predictable and traceable

### Event-Driven
- Use events for cross-cutting concerns
- Decouple publishers and subscribers
- Log events for debugging

---

## Configuration

### Environment-Based
- Use environment variables for secrets
- Separate config by environment (dev, staging, prod)
- Never commit secrets to version control

### Configuration Files
- Use `.env` for local development
- Use `config/` directory for structured config
- Document all configuration options

---

## Error Handling

### Application Errors
- Define error hierarchy
- Include error codes for programmatic handling
- Provide user-friendly messages

### External Failures
- Implement retry logic with backoff
- Use circuit breakers for failing services
- Have fallback mechanisms

---

## Security Considerations

### Authentication/Authorization
- Use established libraries
- Implement proper session management
- Follow principle of least privilege

### Data Protection
- Encrypt sensitive data at rest
- Use HTTPS for all communications
- Validate and sanitize all inputs

---

## Performance

### Optimization Guidelines
- Measure before optimizing
- Focus on hot paths
- Use caching strategically
- Consider async operations

### Scalability
- Design for horizontal scaling
- Use stateless services when possible
- Plan for database scaling

---

## Documentation

### Required Documentation
- Architecture overview (this document)
- API documentation
- Setup/deployment guides
- Architecture Decision Records (ADRs)

### ADR Format
```markdown
# Title

## Context
Why this decision was needed

## Decision
What was decided

## Alternatives Considered
What else was evaluated

## Consequences
Trade-offs and implications
```

---

## Review Checklist

Before implementing architecture changes:

- [ ] Does it follow separation of concerns?
- [ ] Is the dependency direction correct?
- [ ] Are interfaces well-defined?
- [ ] Is it testable?
- [ ] Is it documented?
- [ ] Have you created an ADR?
