#!/bin/bash

SITE_URL=${1:-"https://printstack.dev"}
ALERT_EMAIL=${2:-"admin@printstack.dev"}
LOG_FILE="/tmp/rollback-verification.log"

echo "🔍 Verifying rollback to $SITE_URL"
echo "================================"

# Initialize log
echo "$(date): Starting rollback verification for $SITE_URL" >> "$LOG_FILE"

# Check 1: Site accessibility
echo "📡 Checking site accessibility..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$SITE_URL" --connect-timeout 10)

if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ Site accessible (HTTP 200)"
    echo "$(date): Site accessibility check passed" >> "$LOG_FILE"
else
    echo "❌ Site not accessible (HTTP $HTTP_STATUS)"
    echo "$(date): Site accessibility check failed (HTTP $HTTP_STATUS)" >> "$LOG_FILE"

    # Send alert
    if command -v mail &> /dev/null; then
        echo "Rollback verification failed - site not accessible (HTTP $HTTP_STATUS)" | mail -s "🚨 Rollback Alert - $SITE_URL" "$ALERT_EMAIL"
    fi
    exit 1
fi

# Check 2: Content verification
echo "📄 Verifying page content..."
PAGE_CONTENT=$(curl -s "$SITE_URL" --connect-timeout 10)

# Check for PrintStack identifier
if echo "$PAGE_CONTENT" | grep -q "PrintStack\|printstack\|Print Stack"; then
    echo "✅ PrintStack content detected"
    echo "$(date): Content verification passed - PrintStack found" >> "$LOG_FILE"
else
    echo "⚠️  PrintStack identifier not found in content"
    echo "$(date): Content verification warning - PrintStack not detected" >> "$LOG_FILE"
fi

# Check 3: Basic functionality indicators
echo "🔧 Checking basic functionality indicators..."

# Check for React app content or error pages
if echo "$PAGE_CONTENT" | grep -q "react-dom\|React\|id=\"root\"" && ! echo "$PAGE_CONTENT" | grep -q "Error\|error\|Failed\|failed"; then
    echo "✅ React app active"
    echo "$(date): React app verification passed" >> "$LOG_FILE"
else
    echo "⚠️  React app may not be loaded properly"
    echo "$(date): React app verification warning" >> "$LOG_FILE"
fi

# Check 4: Resource loading
echo "📦 Checking resource loading..."

# Check CSS files
CSS_CHECK=$(curl -s "$SITE_URL" --connect-timeout 5 | grep -o 'href="[^"]*\.css"' | head -3)
if [ -n "$CSS_CHECK" ]; then
    echo "✅ CSS resources found"
    echo "$(date): CSS resources verification passed" >> "$LOG_FILE"
else
    echo "⚠️  No CSS resources detected"
    echo "$(date): CSS resources verification warning" >> "$LOG_FILE"
fi

# Check JavaScript files
JS_CHECK=$(curl -s "$SITE_URL" --connect-timeout 5 | grep -o 'src="[^"]*\.js"' | head -3)
if [ -n "$JS_CHECK" ]; then
    echo "✅ JavaScript resources found"
    echo "$(date): JavaScript resources verification passed" >> "$LOG_FILE"
else
    echo "⚠️  No JavaScript resources detected"
    echo "$(date): JavaScript resources verification warning" >> "$LOG_FILE"
fi

# Check 5: Performance indicators
echo "⚡ Checking basic performance..."

# Response time check
RESPONSE_TIME=$(curl -o /dev/null -s -w "%{time_total}" "$SITE_URL" --connect-timeout 10)
RESPONSE_TIME_MS=$(echo "$RESPONSE_TIME * 1000" | bc 2>/dev/null || echo "9999")

if [ "${RESPONSE_TIME_MS%.*}" -lt "3000" ]; then
    echo "✅ Response time acceptable (${RESPONSE_TIME_MS%.*}ms)"
    echo "$(date): Performance check passed - ${RESPONSE_TIME_MS%.*}ms response time" >> "$LOG_FILE"
else
    echo "⚠️  Slow response time (${RESPONSE_TIME_MS%.*}ms)"
    echo "$(date): Performance check warning - ${RESPONSE_TIME_MS%.*}ms response time" >> "$LOG_FILE"
fi

# Check 6: Security headers (basic)
echo "🔒 Checking basic security headers..."
SECURITY_HEADERS=$(curl -s -I "$SITE_URL" --connect-timeout 5)

if echo "$SECURITY_HEADERS" | grep -qi "x-content-type-options\|x-frame-options\|x-xss-protection"; then
    echo "✅ Security headers present"
    echo "$(date): Security headers check passed" >> "$LOG_FILE"
else
    echo "⚠️  Some security headers may be missing"
    echo "$(date): Security headers check warning" >> "$LOG_FILE"
fi

# Generate final report
echo ""
echo "📊 Rollback Verification Report"
echo "================================"
echo "Site URL: $SITE_URL"
echo "Timestamp: $(date)"
echo "HTTP Status: $HTTP_STATUS"
echo "Response Time: ${RESPONSE_TIME_MS%.*}ms"
echo "Log File: $LOG_FILE"

# Count checks passed
TESTS_PASSED=0
TOTAL_TESTS=6

# Simple pass/fail counting (based on our checks above)
if [ "$HTTP_STATUS" = "200" ]; then ((TESTS_PASSED++)); fi
if echo "$PAGE_CONTENT" | grep -q "PrintStack\|printstack\|Print Stack"; then ((TESTS_PASSED++)); fi
if echo "$PAGE_CONTENT" | grep -q "react-dom\|React\|id=\"root\""; then ((TESTS_PASSED++)); fi
if [ -n "$CSS_CHECK" ] && [ -n "$JS_CHECK" ]; then ((TESTS_PASSED++)); fi
if [ "${RESPONSE_TIME_MS%.*}" -lt "3000" ]; then ((TESTS_PASSED++)); fi
if echo "$SECURITY_HEADERS" | grep -qi "x-content-type-options\|x-frame-options\|x-xss-protection"; then ((TESTS_PASSED++)); fi

PASS_RATE=$((TESTS_PASSED * 100 / TOTAL_TESTS))

echo "Tests Passed: $TESTS_PASSED/$TOTAL_TESTS"
echo "Pass Rate: $PASS_RATE%"

# Final assessment
echo ""
if [ "$PASS_RATE" -ge "80" ]; then
    echo "✅ Rollback verification PASSED"
    echo "🎉 Site is functioning correctly after rollback"
    echo "$(date): FINAL RESULT - ROLLBACK VERIFICATION PASSED ($PASS_RATE%)" >> "$LOG_FILE"
    exit 0
elif [ "$PASS_RATE" -ge "60" ]; then
    echo "⚠️  Rollback verification PARTIALLY PASSED"
    echo "🔍 Some issues detected - monitor closely"
    echo "$(date): FINAL RESULT - ROLLBACK VERIFICATION PARTIAL ($PASS_RATE%)" >> "$LOG_FILE"
    exit 0
else
    echo "❌ Rollback verification FAILED"
    echo "🚨 Major issues detected - immediate attention required"
    echo "$(date): FINAL RESULT - ROLLBACK VERIFICATION FAILED ($PASS_RATE%)" >> "$LOG_FILE"

    # Send alert for failed verification
    if command -v mail &> /dev/null; then
        echo "Rollback verification failed with $PASS_RATE% pass rate. Immediate attention required." | mail -s "🚨 CRITICAL - Rollback Verification Failed" "$ALERT_EMAIL"
    fi

    exit 1
fi