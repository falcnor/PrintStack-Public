#!/bin/bash

echo "🚨 Emergency Rollback Procedure"
echo "==============================="

# Configuration
ROLLBACK_REASON=${1:-"Emergency rollback - no reason provided"}
SECOND_APPROVER=${2:-""}

# Safety checks
if [ -z "$SECOND_APPROVER" ]; then
    echo "⚠️  WARNING: This is an emergency rollback without second approval"
    echo "Continue anyway? (y/N)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo "❌ Rollback cancelled"
        exit 1
    fi
fi

echo "Rollback reason: $ROLLBACK_REASON"
echo "Second approver: $SECOND_APPROVER"

# Log the rollback attempt
echo "$(date): Emergency rollback initiated. Reason: $ROLLBACK_REASON. Approver: $SECOND_APPROVER" >> /tmp/printstack-emergency.log

# Get current live version
echo "📋 Analyzing current deployment..."
CURRENT_VERSION=$(firebase hosting:versions:list --filter="status:LIVE" --format="value(versionId)" | head -n1)

if [ -z "$CURRENT_VERSION" ]; then
    echo "❌ Could not determine current live version"
    exit 1
fi

echo "Current live version: $CURRENT_VERSION"

# Get previous versions (excluding current)
PREVIOUS_VERSIONS=$(firebase hosting:versions:list --filter="status:CREATED" --format="value(versionId)" | head -5)

if [ -z "$PREVIOUS_VERSIONS" ]; then
    echo "❌ No previous versions found for rollback"
    exit 1
fi

echo ""
echo "📚 Available rollback versions:"
i=1
for version in $PREVIOUS_VERSIONS; do
    echo "  $i) $version"
    ((i++))
done

# Select most recent previous version
ROLLBACK_VERSION=$(echo "$PREVIOUS_VERSIONS" | head -n1)

echo ""
echo "🔄 Rolling back to version: $ROLLBACK_VERSION"

# Confirm before proceeding
echo "Proceed with rollback? (y/N)"
read -r response
if [[ ! "$response" =~ ^[Yy]$ ]]; then
    echo "❌ Rollback cancelled"
    exit 1
fi

# Perform rollback
echo "⏳ Executing rollback..."
if firebase hosting:rollback --version-id "$ROLLBACK_VERSION"; then
    echo "✅ Rollback command executed successfully"
else
    echo "❌ Rollback command failed"
    exit 1
fi

# Wait for propagation
echo "⏳ Waiting for propagation..."
sleep 10

# Verify rollback
echo "🔍 Verifying rollback..."
NEW_CURRENT=$(firebase hosting:versions:list --filter="status:LIVE" --format="value(versionId)" | head -n1)

if [ "$NEW_CURRENT" = "$ROLLBACK_VERSION" ]; then
    echo "✅ Rollback verification successful!"
    echo "🎉 Site is now running version: $ROLLBACK_VERSION"

    # Log successful rollback
    echo "$(date): Emergency rollback successful. From: $CURRENT_VERSION To: $ROLLBACK_VERSION" >> /tmp/printstack-emergency.log

    # Run post-rollback health check
    echo "🏥 Running post-rollback health check..."
    if [ -f "./scripts/verify-rollback.sh" ]; then
        ./scripts/verify-rollback.sh
    else
        echo "⚠️  Verification script not found - manual verification required"
        echo "Please manually verify site functionality"
    fi

else
    echo "❌ Rollback verification failed!"
    echo "Current version is still: $NEW_CURRENT"
    echo "Expected version: $ROLLBACK_VERSION"

    # Log failed rollback
    echo "$(date): Emergency rollback FAILED. From: $CURRENT_VERSION Expected: $ROLLBACK_VERSION Actual: $NEW_CURRENT" >> /tmp/printstack-emergency.log

    exit 1
fi

echo ""
echo "📊 Rollback Summary:"
echo "  Reason: $ROLLBACK_REASON"
echo "  Approver: $SECOND_APPROVER"
echo "  From version: $CURRENT_VERSION"
echo "  To version: $ROLLBACK_VERSION"
echo "  Timestamp: $(date)"
echo "  Log: /tmp/printstack-emergency.log"
echo ""
echo "📧 Please notify stakeholders of the rollback"
echo "🔍 Monitor site performance for the next 30 minutes"
echo "📝 Schedule post-mortem meeting"