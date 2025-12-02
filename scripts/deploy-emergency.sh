#!/bin/bash

echo "🆘 Emergency Deployment"
echo "======================"

# Configuration
EMERGENCY_REASON=${1:-"Emergency deployment - no reason provided"}
SITE_URL=${2:-"https://emergency.printstack.dev"}

echo "Emergency reason: $EMERGENCY_REASON"
echo "Target URL: $SITE_URL"

# Create emergency build directory
EMERGENCY_BUILD_DIR="dist-emergency"

# Clean previous emergency build
echo "🧹 Cleaning previous emergency build..."
rm -rf "$EMERGENCY_BUILD_DIR"

# Create minimal, stable emergency version
echo "🔨 Building emergency version..."

# Create emergency HTML (minimal, stable)
cat > "$EMERGENCY_BUILD_DIR/emergency.html" << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PrintStack - Maintenance Mode</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
        }

        .container {
            max-width: 600px;
            text-align: center;
            padding: 2rem;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 16px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
        }

        .logo {
            font-size: 2.5rem;
            font-weight: bold;
            margin-bottom: 1rem;
            background: linear-gradient(45deg, #FFD700, #FFA500);
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .status {
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 1.5rem 0;
            font-size: 1.2rem;
        }

        .status-dot {
            width: 12px;
            height: 12px;
            background: #FFD700;
            border-radius: 50%;
            margin-right: 0.5rem;
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }

        .message {
            margin: 1.5rem 0;
            line-height: 1.6;
        }

        .info {
            background: rgba(255, 255, 255, 0.1);
            padding: 1rem;
            border-radius: 8px;
            margin: 1rem 0;
            font-size: 0.9rem;
        }

        .contact {
            margin-top: 2rem;
            font-size: 0.9rem;
            opacity: 0.8;
        }

        .timestamp {
            font-size: 0.8rem;
            opacity: 0.6;
            margin-top: 1rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">PrintStack</div>

        <div class="status">
            <div class="status-dot"></div>
            <span>Maintenance Mode</span>
        </div>

        <div class="message">
            PrintStack is currently undergoing emergency maintenance.
        </div>

        <div class="info">
            <strong>Status:</strong> Emergency deployment in progress<br>
            <strong>Reason:</strong> Critical system maintenance<br>
            <strong>ETA:</strong> Service restoration pending
        </div>

        <div class="contact">
            For immediate assistance:<br>
            📧 support@printstack.dev<br>
            📱 +1-555-PRINT-3D
        </div>

        <div class="timestamp" id="timestamp"></div>
    </div>

    <script>
        // Update timestamp
        function updateTimestamp() {
            const now = new Date();
            document.getElementById('timestamp').textContent =
                'Last updated: ' + now.toLocaleString();
        }

        updateTimestamp();
        setInterval(updateTimestamp, 60000); // Update every minute

        // Auto-reload check (every 5 minutes)
        setInterval(() => {
            fetch(window.location.href, { method: 'HEAD' })
                .then(response => {
                    if (response.ok && response.headers.get('x-maintenance-mode') !== 'true') {
                        window.location.reload();
                    }
                })
                .catch(() => {
                    // Ignore fetch errors during maintenance
                });
        }, 300000);
    </script>
</body>
</html>
EOF

# Create emergency firebase.json config
cat > "$EMERGENCY_BUILD_DIR/firebase-emergency.json" << 'EOF'
{
  "hosting": {
    "public": ".",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "headers": [
      {
        "source": "**",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "no-cache, no-store, must-revalidate"
          },
          {
            "key": "X-Maintenance-Mode",
            "value": "true"
          }
        ]
      }
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/emergency.html"
      }
    ]
  }
}
EOF

echo "📦 Emergency build created"

# Deploy to emergency channel
echo "🚀 Deploying emergency version..."

if command -v firebase &> /dev/null; then
    # Deploy using Firebase CLI
    cd "$EMERGENCY_BUILD_DIR"

    if firebase deploy --only hosting --config firebase-emergency.json --message "Emergency deployment: $EMERGENCY_REASON - $(date)"; then
        echo "✅ Emergency deployment successful"

        # Get the deployed URL
        SITE_URL=$(firebase hosting:sites:get --format="value(defaultUrl)" 2>/dev/null || echo "$SITE_URL")

        echo "🌐 Emergency site available at: $SITE_URL"

        # Verify emergency deployment
        echo "🔍 Verifying emergency deployment..."
        sleep 5

        if curl -f -s "$SITE_URL" > /dev/null; then
            echo "✅ Emergency deployment verification successful"
            echo "📊 Emergency deployment summary:"
            echo "  Reason: $EMERGENCY_REASON"
            echo "  URL: $SITE_URL"
            echo "  Timestamp: $(date)"
            echo "  Status: LIVE"

            # Log emergency deployment
            echo "$(date): Emergency deployment successful. URL: $SITE_URL. Reason: $EMERGENCY_REASON" >> /tmp/printstack-emergency.log
        else
            echo "❌ Emergency deployment verification failed"
            exit 1
        fi
    else
        echo "❌ Emergency deployment failed"
        exit 1
    fi

    cd ..
else
    echo "❌ Firebase CLI not found. Please install Firebase CLI."
    exit 1
fi

echo ""
echo "📋 Next Steps:"
echo "1. Monitor emergency deployment at: $SITE_URL"
echo "2. Notify stakeholders of emergency status"
echo "3. Investigate and resolve root cause"
echo "4. Plan full recovery deployment"
echo "5. Schedule post-incident review"