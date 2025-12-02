# Custom Domain Setup Guide

This guide walks you through setting up a custom domain for your PrintStack application deployed on Firebase Hosting.

## Overview

PrintStack supports custom domains for both development and production environments. Custom domains provide:
- Professional branding
- Custom SSL certificates
- Better SEO
- User-friendly URLs

## Prerequisites

- Firebase project with PrintStack deployed
- Custom domain ownership
- Access to DNS provider
- Firebase CLI (for local testing)

## Quick Setup

### Step 1: Configure Domain in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your PrintStack project
3. Navigate to **Hosting** → **Custom domains**
4. Click **Add domain**
5. Enter your custom domain (e.g., `printstack.yourdomain.com`)
6. Click **Continue**

### Step 2: Verify Domain Ownership

Firebase will provide DNS records that you need to add to verify ownership:

#### For Root Domain (e.g., `printstack.com`):

```
Type: TXT
Name: @
Value: firebase-domain-verification=your-verification-code
```

#### For Subdomain (e.g., `app.printstack.com`):

```
Type: TXT
Name: _firebase-domain-verification.app
Value: firebase-domain-verification=your-verification-code
```

### Step 3: Configure DNS Records

After verification, Firebase will provide additional DNS records for SSL setup:

```
Type: A
Name: @ (or your subdomain name)
Value: 192.168.0.1, 192.168.0.2 (use Firebase's provided IPs)

Type: CNAME
Name: www (if using www subdomain)
Value: printstack.yourdomain.com
```

### Step 4: Update Application Configuration

Update your Firebase configuration to use the custom domain:

```javascript
// src/config/firebase.js
const firebaseConfig = {
  projectId: 'your-project-id',
  authDomain: 'printstack.yourdomain.com', // Update this
  databaseURL: 'https://your-project-id.firebaseio.com',
  // ... rest of config
};
```

## Environment-Specific Setup

### Production Domain

For production (`printstack-prod.web.app`):

```bash
# Using Firebase CLI
firebase hosting:sites:printstack-prod:channels:live:domains:add printstack.com

# Or through console
# Configure as root domain or subdomain as shown above
```

### Development Domain

For development (`printstack-dev.web.app`):

```bash
# Using Firebase CLI
firebase hosting:sites:printstack-dev:channels:dev:domains:add dev.printstack.com

# Preview channels
firebase hosting:sites:printstack-dev:channels:preview:domains:add preview.printstack.com
```

## DNS Configuration Examples

### Domain Registrar Examples

#### Google Domains

1. Go to your Google Domains dashboard
2. Select your domain
3. Navigate to **DNS**
4. Add custom records using Firebase's provided values

#### Namecheap

1. Log in to Namecheap
2. Go to **Domain List** → **Manage**
3. Select **Advanced DNS**
4. Add records as provided by Firebase

#### GoDaddy

1. Log in to GoDaddy
2. Go to **DNS Management**
3. Add the A records and TXT records provided by Firebase

## SSL Certificate Setup

Firebase automatically provisions SSL certificates for custom domains. However:

### Manual SSL (If Needed)

```bash
# Check SSL status
firebase hosting:sites:your-project-id:domains:printstack.com:ssl:get-status

# Force certificate renewal
firebase hosting:sites:your-project-id:domains:printstack.com:ssl:renew
```

## Configuration Files

### Firebase Hosting Configuration

Add domain redirects to `firebase.json`:

```json
{
  "hosting": {
    "public": "dist",
    "site": "printstack-prod",
    "redirects": [
      {
        "source": "http://printstack.yourdomain.com",
        "destination": "https://printstack.yourdomain.com",
        "type": 301
      },
      {
        "source": "https://www.printstack.yourdomain.com",
        "destination": "https://printstack.yourdomain.com",
        "type": 301
      }
    ],
    "cleanUrls": true,
    "trailingSlash": false
  }
}
```

### Environment-Specific Configs

#### For Production (`firebase-prod.json`):
```json
{
  "hosting": {
    "site": "printstack-prod",
    "public": "dist",
    "redirects": [
      {
        "source": "/old-path",
        "destination": "/new-path",
        "type": 301
      }
    ]
  }
}
```

#### For Development (`firebase-dev.json`):
```json
{
  "hosting": {
    "site": "printstack-dev",
    "public": "dist"
  }
}
```

## Testing Custom Domain

### Local Testing

```bash
# Test before DNS propagation
curl -H "Host: printstack.yourdomain.com" https://printstack-prod.web.app

# Use local tunneling for testing
ngrok http 5173
# Replace with provided ngrok URL in hosts file: 127.0.0.1 printstack.yourdomain.com
```

### Production Testing

```bash
# Check domain resolution
nslookup printstack.yourdomain.com

# Test HTTPS
curl -I https://printstack.yourdomain.com

# Check SSL certificate
openssl s_client -connect printstack.yourdomain.com:443 -servername printstack.yourdomain.com
```

## Deployment with Custom Domain

### Automated Deployment

Update your GitHub Actions workflows to use custom domains:

```yaml
# .github/workflows/deploy-prod.yml
- name: Deploy to Firebase
  run: |
    firebase deploy --only hosting --project printstack-prod \
      --non-interactive
  env:
    DEPLOY_URL: https://printstack.yourdomain.com
```

### Health Checks

Add custom domain to health check endpoints:

```javascript
// monitoring/uptime-config.json
{
  "endpoints": [
    {
      "name": "PrintStack Production",
      "url": "https://printstack.yourdomain.com",
      "method": "GET",
      "frequency": "900"
    }
  ]
}
```

## SEO and Performance

### Meta Tags

Update your HTML meta tags for the custom domain:

```html
<!-- index.html -->
<link rel="canonical" href="https://printstack.yourdomain.com" />

<meta property="og:url" content="https://printstack.yourdomain.com" />
<meta property="og:site_name" content="PrintStack" />

<!-- PWA Manifest -->
{
  "start_url": "https://printstack.yourdomain.com/",
  "scope": "https://printstack.yourdomain.com/"
}
```

### Sitemap

Generate and submit sitemap:

```xml
<!-- public/sitemap.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://printstack.yourdomain.com/</loc>
    <priority>1.0</priority>
  </url>
</urlset>
```

## Monitoring and Analytics

### Firebase Analytics

Configure Analytics for the custom domain:

```javascript
// analytics initialization
firebase.analytics().setAnalyticsCollectionEnabled(true);
```

### Custom Domain Verification

Monitor domain health:

```javascript
// Add to main.js
if (window.location.hostname === 'printstack.yourdomain.com') {
  console.log('🎉 Production domain loaded');
  // Custom domain-specific logic
}
```

## Troubleshooting

### Common Issues

#### DNS Propagation Delays

```bash
# Check DNS propagation
dig printstack.yourdomain.com
nslookup printstack.yourdomain.com

# Global DNS check
https://dnschecker.org/#A/printstack.yourdomain.com
```

#### SSL Certificate Issues

```bash
# Check certificate status
firebase hosting:sites:your-project-id:domains:printstack.yourdomain.com:ssl:get-status

# Force renewal
firebase hosting:sites:your-project-id:domains:printstack.yourdomain.com:ssl:renew
```

#### Redirects Not Working

Check `firebase.json` configuration:

```bash
# Test redirects
curl -I -L https://printstack.yourdomain.com/old-path
```

### Verification Commands

```bash
# Check domain association
firebase hosting:sites:your-project-id:domains:list

# Verify configuration
firebase hosting:sites:your-project-id:config:get

# Test deployment with dry run
firebase deploy --dry-run --only hosting --project your-project-id
```

## Security Considerations

### CORS Configuration

Update CORS settings for the new domain:

```javascript
// In your backend/API configuration
app.use(cors({
  origin: ['https://printstack.yourdomain.com', 'https://app.printstack.yourdomain.com']
}));
```

### CSP Headers

Update Content Security Policy:

```json
// firebase.json
{
  "headers": [
    {
      "source": "**/*.@(js|css)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self' https://printstack.yourdomain.com; script-src 'self' 'unsafe-inline';"
        }
      ]
    }
  ]
}
```

## Maintenance

### Regular Tasks

1. **SSL Certificate Renewal**: Firebase handles this automatically
2. **DNS Monitoring**: Check for any DNS changes quarterly
3. **Domain Renewal**: Set reminders for domain registration renewal
4. **Performance Monitoring**: Use tools like Lighthouse for domain performance

### Backup Configuration

Keep backups of your DNS records:

```bash
# Export DNS records (if your provider supports it)
# Or manually document in docs/dns-backup.md

{
  "domains": {
    "printstack.yourdomain.com": {
      "A": ["192.168.0.1", "192.168.0.2"],
      "TXT": ["firebase-domain-verification=code"],
      "CNAME": { "www": "printstack.yourdomain.com" }
    }
  }
}
```

## Support

For domain-specific issues:
1. Check Firebase Hosting Documentation
2. Contact your domain registrar's support
3. Review Firebase console for domain status
4. Use [DNS checking tools](https://dnschecker.org/)

---

**Note**: DNS changes can take 24-48 hours to propagate globally. Plan domain migrations during low-traffic periods.