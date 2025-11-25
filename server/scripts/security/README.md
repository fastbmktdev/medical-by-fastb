# Security Scripts

This directory contains security-related scripts for managing secrets and preventing security incidents.

## 📁 Files

### 1. `cleanup-git-history.sh`
**Purpose:** Remove hardcoded secrets from git history

**⚠️ WARNING:** This script rewrites git history. All team members must re-clone the repository after running.

**Prerequisites:**
```bash
# Install git-filter-repo
pip install git-filter-repo
# OR
brew install git-filter-repo
```

**Usage:**
```bash
./scripts/security/cleanup-git-history.sh
```

**What it does:**
- Creates a backup branch before cleanup
- Removes exposed secrets from all git history
- Provides instructions for force pushing

**After running:**
1. Review changes: `git log --oneline`
2. Force push: `git push --force-with-lease origin master`
3. Notify all team members to re-clone
4. Delete backup branch after verification

---

### 2. `pre-commit-secret-check.sh`
**Purpose:** Pre-commit hook that checks for secrets before allowing commits

**Installation:**
```bash
# Option 1: Use the install script
./scripts/security/install-pre-commit-hook.sh

# Option 2: Manual installation
cp scripts/security/pre-commit-secret-check.sh .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

**What it checks:**
- Supabase keys (sb_publishable_, sb_secret_, JWT tokens)
- API keys (api_key, secret_key patterns)
- Passwords and tokens
- AWS keys (AKIA patterns)
- Stripe keys (sk_live_, pk_live_, etc.)
- Generic long strings that might be secrets

**How it works:**
- Runs automatically before each commit
- Scans staged files for secret patterns
- Blocks commit if secrets are detected
- Provides helpful error messages

**To test:**
```bash
# Try to commit a file with a secret pattern
echo "api_key: 'test12345678901234567890'" > test.txt
git add test.txt
git commit -m "test"
# Should be blocked by the hook
```

---

### 3. `install-pre-commit-hook.sh`
**Purpose:** Installer script for the pre-commit hook

**Usage:**
```bash
./scripts/security/install-pre-commit-hook.sh
```

**What it does:**
- Checks if .git directory exists
- Backs up existing pre-commit hook (if any)
- Installs the secret detection hook
- Makes the hook executable

---

### 4. `get-supabase-keys.sh`
**Purpose:** Get Supabase keys from terminal instead of dashboard

**Usage:**
```bash
# Local development
./scripts/security/get-supabase-keys.sh --local

# From environment variables
./scripts/security/get-supabase-keys.sh --env

# Production project (requires Supabase CLI login)
./scripts/security/get-supabase-keys.sh --project <project-ref>
```

**What it does:**
- Retrieves Supabase keys from local instance or environment
- Displays keys in format ready for .env.local
- Copies to clipboard (macOS)

**Examples:**
```bash
# Get local keys
./scripts/security/get-supabase-keys.sh --local

# Output:
# NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
# NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
# SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

---

### 5. `update-env-from-keys.sh`
**Purpose:** Automatically update .env.local with Supabase keys

**Usage:**
```bash
# From local Supabase
./scripts/security/update-env-from-keys.sh --local

# With provided keys
./scripts/security/update-env-from-keys.sh --url <url> --anon <key> --service <key>
```

**What it does:**
- Gets keys from local Supabase or command line
- Creates backup of existing .env.local
- Updates .env.local with new keys
- Removes old Supabase entries

---

## 🔒 Security Best Practices

### 1. Never Commit Secrets
- ✅ Use environment variables
- ✅ Add secrets to .env.local (in .gitignore)
- ❌ Never hardcode secrets in source code
- ❌ Never commit .env files

### 2. Use Pre-commit Hooks
Always install the pre-commit hook to catch secrets before they're committed.

### 3. Regular Audits
- Run security scans regularly
- Review git history for exposed secrets
- Rotate keys periodically

### 4. If Secrets Are Exposed
1. **Immediately rotate** the exposed secrets
2. **Remove from git history** using cleanup script
3. **Notify team** to re-clone repository
4. **Update all environments** with new keys
5. **Review access logs** for unauthorized access

## 📚 Related Documentation

- `SECURITY_INCIDENT_REPORT.md` - Incident report and action items
- `PRODUCTION_SECRET_ROTATION_GUIDE.md` - Step-by-step rotation guide
- `.gitignore` - Patterns to prevent committing secrets

## 🆘 Troubleshooting

### Pre-commit hook not working
```bash
# Check if hook exists and is executable
ls -la .git/hooks/pre-commit

# Reinstall if needed
./scripts/security/install-pre-commit-hook.sh
```

### Cleanup script fails
```bash
# Check if git-filter-repo is installed
which git-filter-repo

# Install if missing
pip install git-filter-repo
```

### False positives in secret detection
The hook may flag legitimate strings that look like secrets. In that case:
1. Review the flagged content
2. If it's not a secret, you can temporarily bypass (not recommended)
3. Better: Refactor code to avoid patterns that look like secrets

---

**Last Updated:** 2025-01-XX  
**Maintained By:** Security Team

