# Git Workflow Guidelines

## Branch Strategy

### Main Branches
- `main` - Production-ready code
- `develop` - Integration branch (optional)

### Feature Branches
- Format: `feature/short-description`
- Branch from: `main` or `develop`
- Merge to: `main` or `develop`

### Bug Fix Branches
- Format: `fix/short-description`
- Branch from: `main`
- Merge to: `main`

### Hotfix Branches
- Format: `hotfix/short-description`
- For urgent production fixes
- Branch from: `main`, merge to: `main`

---

## Commit Messages

### Format
```
<type>: <subject>

[optional body]

[optional footer]
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Formatting, no code change
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance tasks

### Examples
```
feat: add user authentication

Implement JWT-based authentication with refresh tokens.
Includes login, logout, and token refresh endpoints.

Closes #123
```

```
fix: resolve memory leak in event handler

Remove event listener on component unmount to prevent
accumulation of orphaned handlers.
```

### Guidelines
- Use imperative mood ("add" not "added")
- Keep subject under 50 characters
- Explain "why" in body, not "what"
- Reference issues when applicable

---

## Commit Practices

### Atomic Commits
- Each commit should be a logical unit
- Should compile and pass tests independently
- Easy to revert if needed

### Commit Frequency
- Commit early and often
- Don't accumulate large uncommitted changes
- Use work-in-progress commits if needed

---

## Pull Request Guidelines

### Before Creating PR
- [ ] Code compiles without errors
- [ ] All tests pass locally
- [ ] Code follows style guidelines
- [ ] No console.log or debug statements
- [ ] Self-reviewed the diff

### PR Description Template
```markdown
## Summary
Brief description of changes

## Changes
- Bullet list of specific changes

## Testing
How to test these changes

## Related Issues
Closes #XXX
```

### PR Size
- Keep PRs focused and small
- Aim for < 400 lines changed
- Split large changes into smaller PRs

---

## Code Review

### For Authors
- Respond to all comments
- Explain decisions when needed
- Be open to feedback
- Update code promptly

### For Reviewers
- Review within 1 business day
- Be constructive and specific
- Approve when ready (don't block unnecessarily)
- Focus on correctness and maintainability

---

## Merge Strategy

### Options
- **Squash and merge**: Clean history, single commit
- **Merge commit**: Preserves full history
- **Rebase and merge**: Linear history

### Recommendation
- Use **squash and merge** for feature branches
- Use **merge commit** for release branches
- Never force push to shared branches

---

## Protected Branches

### Rules for `main`
- Require pull request reviews
- Require status checks to pass
- No direct pushes
- No force pushes

---

## Git Commands Reference

### Daily Workflow
```bash
# Start new feature
git checkout main
git pull origin main
git checkout -b feature/my-feature

# Work and commit
git add .
git commit -m "feat: description"

# Push and create PR
git push -u origin feature/my-feature
```

### Sync with Main
```bash
git checkout main
git pull origin main
git checkout feature/my-feature
git rebase main
# or
git merge main
```

### Undo Last Commit
```bash
# Keep changes
git reset --soft HEAD~1

# Discard changes
git reset --hard HEAD~1
```

---

## Important Notes for Claude

### Never Do
- Force push to main/master
- Skip pre-commit hooks without user approval
- Amend commits that have been pushed
- Delete remote branches without confirmation

### Always Do
- Check `git status` before committing
- Review `git diff` before staging
- Follow existing commit message patterns
- Create meaningful commit messages
