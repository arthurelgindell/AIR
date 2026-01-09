# Code Style Guidelines

## General Principles

### Clarity Over Cleverness
- Write code that is easy to read and understand
- Prefer explicit over implicit
- Use descriptive names for variables, functions, and classes

### Consistency
- Follow existing patterns in the codebase
- Match the style of surrounding code
- Use consistent formatting throughout

### Simplicity
- Keep functions small and focused
- Avoid premature optimization
- Don't over-engineer solutions

---

## Naming Conventions

### Variables
- Use `camelCase` for local variables and parameters
- Use `SCREAMING_SNAKE_CASE` for constants
- Use descriptive names that explain purpose

### Functions
- Use `camelCase` for function names
- Start with a verb (get, set, create, update, delete)
- Name should describe what the function does

### Classes
- Use `PascalCase` for class names
- Use nouns or noun phrases
- Be specific about the class's responsibility

### Files
- Use `kebab-case` for file names
- Name should reflect primary export
- Group related files in directories

---

## Code Structure

### Functions
- Keep functions under 50 lines when possible
- Single responsibility principle
- Minimize side effects
- Return early for error conditions

### Classes
- One class per file (with exceptions for small related classes)
- Group related methods together
- Keep public interface minimal

### Modules
- Clear separation of concerns
- Explicit exports
- Avoid circular dependencies

---

## Comments

### When to Comment
- Complex algorithms that aren't obvious
- Business logic that requires context
- Workarounds for known issues
- Public API documentation

### When NOT to Comment
- Obvious code
- Restating what the code does
- Outdated or incorrect information
- TODO items without context

### Comment Style
```
// Single line for brief explanations

/**
 * Multi-line for documentation
 * @param {type} name - Description
 * @returns {type} Description
 */
```

---

## Error Handling

### Principles
- Fail fast and explicitly
- Provide meaningful error messages
- Log errors with context
- Don't swallow exceptions silently

### Pattern
```javascript
try {
  // risky operation
} catch (error) {
  // log with context
  // handle or rethrow
}
```

---

## Testing

### Naming
- Describe the behavior being tested
- Use "should" or "when" patterns
- Group related tests

### Structure
- Arrange, Act, Assert pattern
- One assertion per test when practical
- Test edge cases and error conditions

---

## Language-Specific Guidelines

Adapt these general principles to the specific language being used:

- **JavaScript/TypeScript**: Follow Airbnb or StandardJS conventions
- **Python**: Follow PEP 8
- **Go**: Follow Go conventions (gofmt)
- **Rust**: Follow Rust conventions (rustfmt)

---

## When to Deviate

It's acceptable to deviate from these guidelines when:
- Following existing codebase patterns
- Performance requirements dictate otherwise
- Language idioms conflict with general rules
- Team has established different conventions

Always document the reason for deviation.
