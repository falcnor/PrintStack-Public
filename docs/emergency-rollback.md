# Emergency Rollback Procedures

This guide provides step-by-step procedures for emergency rollback scenarios in your Firebase Hosting deployment.

## 🚨 Emergency Rollback Scenarios

### 1. Failed Deployment Rollback
**When to use**: Deployment fails or leaves site in broken state

#### Manual Rollback to Previous Working Version

```bash
# 1. Identify the last successful deployment
firebase hosting:versions:list

# 2. Note the version ID of the last working deployment
# Example: Version ID: a1b2c3d4e5f6 (status: LIVE)

# 3. Rollback to that version
firebase hosting:rollback --version-id a1b2c3d4e5f6

# 4. Verify the rollback
firebase hosting:versions:list
```

#### Emergency Rollback Script
```bash
#!/bin/bash
# scripts/emergency-rollback.sh

echo "🚨 Emergency Rollback Procedure"
echo "==============================="

# Get current live version
CURRENT_VERSION=$(firebase hosting:versions:list --filter="status:LIVE" --format="value(versionId)" | head -n1)

echo "Current live version: $CURRENT_VERSION"

# Get previous versions (excluding current)
PREVIOUS_VERSIONS=$(firebase hosting:versions:list --filter="status:CREATED" --format="value(versionId)" | head -3)

if [ -z "$PREVIOUS_VERSIONS" ]; then
    echo "❌ No previous versions found for rollback"
    exit 1
fi

echo "Available rollback versions:"
echo "$PREVIOUS_VERSIONS"

# Select most recent previous version
ROLLBACK_VERSION=$(echo "$PREVIOUS_VERSIONS" | head -n1)

echo "Rolling back to version: $ROLLBACK_VERSION"

# Perform rollback
firebase hosting:rollback --version-id "$ROLLBACK_VERSION"

# Verify rollback
sleep 5
NEW_CURRENT=$(firebase hosting:versions:list --filter="status:LIVE" --format="value(versionId)" | head -n1)

if [ "$NEW_CURRENT" = "$ROLLBACK_VERSION" ]; then
    echo "✅ Rollback successful! Site is now running version: $ROLLBACK_VERSION"
else
    echo "❌ Rollback failed. Current version is still: $NEW_CURRENT"
    exit 1
fi
```

### 2. Complete Site Failure Rollback
**When to use**: Entire site is unreachable or returning errors

#### Immediate Actions
```bash
# 1. Check current site status
firebase hosting:sites:get

# 2. Check latest deployments
firebase hosting:versions:list --limit=5

# 3. If site is completely down, deploy emergency backup
npm run deploy:emergency
```

#### Emergency Deployment Script
```bash
#!/bin/bash
# scripts/deploy-emergency.sh

echo "🆘 Emergency Deployment"
echo "======================"

# Build emergency version (minimal, stable)
npm run build:emergency

# Deploy to emergency backup channel
firebase deploy --only hosting:emergency --message "Emergency deployment - $(date)"

# Verify emergency deployment
curl -f -s "https://emergency.your-domain.com" > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Emergency deployment successful"
    echo "Site available at: https://emergency.your-domain.com"
else
    echo "❌ Emergency deployment failed"
    exit 1
fi
```

### 3. Partial Feature Rollback
**When to use**: Specific features cause issues but core functionality works

#### Feature Toggle Rollback
```bash
# 1. Access feature flags in production
firebase hosting:config:get

# 2. Disable problematic features
firebase hosting:config:set feature.enable_new_ui=false

# 3. Restart services (if applicable)
firebase hosting:sites:redistribute
```

#### Content-Only Rollback
```bash
# 1. Rollback to previous content without code changes
firebase deploy --only hosting --public public-backup

# 2. Or use specific previous deployment content
firebase hosting:rollback --version-id PREVIOUS_VERSION_ID
```

## 🔄 Rollback Verification Procedures

### Post-Rollback Health Check
```bash
# Run comprehensive health check
npm run verify-deployment -- --url https://your-domain.com --report-failed

# Monitor uptime for 30 minutes
npm run uptime-monitor -- --duration=1800 --alerts --webhook=SLACK_WEBHOOK_URL

# Performance verification
npm run performance:audit -- --url https://your-domain.com --threshold=90
```

### Automated Verification Script
```bash
#!/bin/bash
# scripts/verify-rollback.sh

SITE_URL=${1:-"https://your-domain.com"}
ALERT_EMAIL=${2:-"admin@your-domain.com"}

echo "🔍 Verifying rollback to $SITE_URL"
echo "================================"

# Check 1: Site accessibility
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$SITE_URL")
if [ "$HTTP_STATUS" != "200" ]; then
    echo "❌ Site not accessible (HTTP $HTTP_STATUS)"
    # Send alert
    echo "Rollback verification failed - site not accessible" | mail -s "Rollback Alert" "$ALERT_EMAIL"
    exit 1
fi

# Check 2: Core functionality
curl -s "$SITE_URL" | grep -q "PrintStack"
if [ $? -ne 0 ]; then
    echo "❌ Core functionality missing"
    exit 1
fi

# Check 3: No console errors
# (Would use headless browser in production)

echo "✅ Rollback verification passed"
```

## 🛠️ Pre-Rollback Preparation

### Create Emergency Backup
```bash
# 1. Create current production backup
firebase hosting:versions:clone --version-id CURRENT_VERSION --destination-version-id EMERGENCY_BACKUP

# 2. Download current static files
firebase hosting:files:get

# 3. Create local emergency build
npm run build:emergency && npm run backup:static
```

### Emergency Contact Procedures
```bash
# 1. Notify stakeholders
echo "🚨 Production incident detected. Initiating rollback procedures." > /tmp/rollback_alert.txt
# Send to Slack/Teams/Email

# 2. Log incident
echo "$(date): Emergency rollback initiated. Reason: $1" >> /var/log/printstack-emergency.log

# 3. Document rollback
echo "Rollback details:" > /tmp/rollback_report.txt
echo "Timestamp: $(date)" >> /tmp/rollback_report.txt
echo "Reason: $1" >> /tmp/rollback_report.txt
echo "Previous Version: $2" >> /tmp/rollback_report.txt
echo "Rollback Version: $3" >> /tmp/rollback_report.txt
```

## 📊 Rollback Decision Matrix

| Scenario | Severity | Action | Timeframe |
|----------|----------|--------|-----------|
| Site completely down | Critical | Immediate emergency rollback | < 5 minutes |
| Core functionality broken | Critical | Full rollback to previous version | < 10 minutes |
| Performance degradation | High | Feature toggle or partial rollback | < 30 minutes |
| Minor UI issues | Medium | Schedule planned rollback | < 2 hours |
| Non-critical bugs | Low | Fix in place, no rollback | Next release |

## 🔒 Safety Measures

### Rollback Governance
```bash
# 1. Require two-person approval for production rollback
if [ -z "$SECOND_APPROVER" ]; then
    echo "❌ Second approver required for production rollback"
    exit 1
fi

# 2. Document rollback reason
if [ -z "$ROLLBACK_REASON" ]; then
    echo "❌ Rollback reason required"
    exit 1
fi

# 3. Create rollback ticket
echo "Creating rollback tracking ticket..."
# Integration with Jira/GitHub Issues
```

### Rollback Testing
```bash
# 1. Test rollback process in staging
npm run test:rollback -- --environment=staging

# 2. Verify rollback procedures work
npm run test:emergency -- --scenario=full-site-down

# 3. Validate rollback timeframes meet SLA
npm run test:sla -- --operation=rollback --target=300
```

## 📞 Emergency Contacts

| Role | Contact | Availability |
|------|---------|--------------|
| Site Reliability Lead | +1-555-0123 | 24/7 |
| Firebase Hosting Support | 24/7 Support | firebase.google.com/support |
| DevOps Engineer | devops@company.com | Business hours |
| Product Manager | product@company.com | Business hours |

## 📋 Rollback Checklist

### Before Rollback
- [ ] Identify rollback trigger and severity
- [ ] Select appropriate rollback target version
- [ ] Notify stakeholders and get approvals
- [ ] Create emergency backup of current state
- [ ] Prepare rollback communication

### During Rollback
- [ ] Execute rollback command
- [ ] Monitor rollback progress
- [ ] Verify site accessibility
- [ ] Run health checks
- [ ] Validate core functionality

### After Rollback
- [ ] Document rollback incident
- [ ] Analyze root cause
- [ ] Update monitoring alerts
- [ ] Schedule post-mortem
- [ ] Plan fix for future deployment

## ⚡ Quick Commands

```bash
# Emergency rollback (copy-paste ready)
firebase hosting:versions:list --filter="status:LIVE" --format="value(versionId)" | xargs -I {} firebase hosting:rollback --version-id {}

# Quick health check
curl -f -s "https://your-domain.com" && echo "✅ Site OK" || echo "❌ Site DOWN"

# Deploy emergency version
npm run build:emergency && firebase deploy --only hosting:emergency --message "Emergency deployment"

# Verify rollback
npm run verify-deployment -- --url https://your-domain.com --report-failed
```

---

**Remember**: In an emergency, speed is crucial but accuracy is essential. Follow these procedures and document every step for post-incident analysis.