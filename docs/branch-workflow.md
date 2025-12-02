# Branch Workflow Guide

This documentation outlines the Git branching strategy and workflow for PrintStack development.

## 🌳 Branch Structure

### **Main Branches**

| Branch | Purpose | Protection | Deployment |
|--------|---------|------------|------------|
| `main` | **Production** | ❌ No direct pushes<br>❌ Requires PR<br>✅ Required status checks | ✅ Production deployment via GitHub Actions |
| `dev` | **Development** | ❌ No direct pushes<br>✅ Requires PR<br>✅ Required status checks | ✅ Development deployment via GitHub Actions |

### **Feature Branches**

- **Format**: `xxx-feature-description` (e.g., `003-user-authentication`)
- **Based on**: `dev` branch
- **Merged to**: `dev` via Pull Request

## 🔄 Development Workflow

### **1. Feature Development**

```bash
# Always start from latest dev branch
git checkout dev
git pull origin dev

# Create feature branch
git checkout -b 003-user-authentication

# Do your work...
git add .
git commit -m "feat: add user authentication system"

# Push to remote
git push origin 003-user-authentication
```

### **2. Pull Request Process**

1. **Target Branch**: `dev` (never `main`)
2. **Required Reviews**: At least 1 code review
3. **Required Status Checks**:
   - ✅ Linting passes
   - ✅ Tests pass
   - ✅ Build succeeds
   - ✅ Type checking passes

### **3. Merging to Production**

```bash
# Step 1: Merge feature to dev
# Done via GitHub PR to dev branch

# Step 2: Deploy to development
# Automatic when merged to dev

# Step 3: Promote to main
git checkout main
git pull origin main
git merge dev --no-ff
git push origin main

# Production deployment is automatic
```

## 🚦 Branch Rules

### **🔴 Do NOT Push Directly To**
- `main` - Use PRs only
- `dev` - Use PRs for large changes

### **🟢 Safe To Push To**
- `main` - Only when updating GitHub Actions (`--force-with-lease`)
- `dev` - Small hotfixes
- Feature branches - During development

### **⚠️ Special Cases**

#### **Hotfixes to Production**
```bash
# Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-bug-fix

# Fix the issue and push
git add .
git commit -m "hotfix: fix critical security vulnerability"
git push origin hotfix/critical-bug-fix

# Merge directly to main with reviewers
# Then merge main back to dev
git checkout dev
git merge main
git push origin dev
```

#### **GitHub Actions Updates**
```bash
# Only allowed for workflow updates
git checkout main
git add .github/
git commit -m "ci: update GitHub Actions workflows"
git push origin main --force-with-lease
```

## 📊 Current Branch Status

### **✅ Completed Features (Merged to main)**
- `001-inventory-enhancement` - Enhanced filament tracking
- `001-refactor-react` - React application rewrite
- `001-firebase-hosting` - Complete Firebase Hosting setup

### **🔄 Active Development**
- `dev` - Production-ready codebase with all features
- `002-supabase-integration` - In progress (not merged)

### **📝 Branch Naming Convention**

| Prefix | Purpose | Example |
|--------|---------|---------|
| `feat-` | New feature | `feat-user-profiles` |
| `fix-` | Bug fix | `fix-login-validation` |
| `hotfix-` | Critical production fix | `hotfix-security-patch` |
| `refactor-` | Code improvement | `refactor-performance-optimization` |
| `ci-` | CI/CD changes | `ci-update-dependencies` |
| `docs-` | Documentation | `docs-api-reference` |
| `test-` | Test improvements | `test-unit-coverage` |

## 🛡️ Branch Protection Rules

### **Main Branch Protection (GitHub Settings)**
- ✅ Require pull request reviews before merging
- ✅ Dismiss stale PR approvals when new commits are pushed
- ✅ Require branches to be up to date before merging
- ✅ Require status checks to pass before merging
- ❌ Restrict pushes to maintainers only (handled by workflows)

### **Dev Branch Protection (GitHub Settings)**
- ✅ Require pull request reviews before merging
- ✅ Require status checks to pass before merging
- ✅ Allow force pushes by maintainers

## 🔄 Pull Request Templates

### **PR Title Format**
- **Features**: `feat: add user authentication system`
- **Fixes**: `fix: resolve memory leak in filament tracking`
- **Hotfixes**: `hotfix: patch critical security vulnerability`

### **PR Description Template**
```markdown
## 🎯 Purpose
Brief description of what this PR accomplishes.

## 🔄 Changes
- Added new feature X
- Fixed bug Y
- Updated documentation Z

## 🧪 Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## 📸 Screenshots
(If applicable)

## 🔗 Related Issues
Closes #123
```

## 🚀 CI/CD Integration

### **Deployment Triggers**
- **To `main`** → Production deployment (manual approval)
- **To `dev`** → Development deployment (automatic)
- **Feature branches** → Build and test only

### **Environment Configuration**
- **Production**: Uses production Firebase project
- **Development**: Uses staging Firebase project
- **Feature branches**: No deployment, build verification only

## 📋 Best Practices

### **✅ Do**
- Keep branches focused on single features
- Write descriptive commit messages
- Update documentation with changes
- Run tests before pushing
- Use PRs for all code changes
- Delete merged feature branches

### **❌ Don't**
- Push directly to main (except ci updates)
- Work directly on dev for large features
- Leave feature branches abandoned
- Commit sensitive data
- Merge without reviews
- Force push to shared branches

## 🎨 Git Configuration

### **Recommended Git Hooks**
```bash
# Pre-commit hook example
#!/bin/sh
npm run lint
npm run test
```

### **Global Configuration**
```bash
git config --global init.defaultBranch main
git config --global pull.rebase false
git config --global push.default simple
git config --global branch.autosetuprebase always
```

## 🔍 Branch Cleanup

### **Regular Maintenance**
```bash
# Clean up merged branches
git checkout main
git remote prune origin
git branch --merged | grep -v "main\|dev" | xargs -n 1 git branch -d

# Clean up stale remote branches
git remote prune origin --dry-run
git remote prune origin
```

### **When to Delete**
- ✅ After successful merge
- ✅ Feature completed and merged
- ❌ Never delete main or dev
- ❌ Keep active work branches

---

**This workflow ensures stable production deployments while maintaining agile development practices.**