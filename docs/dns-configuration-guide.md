# DNS Configuration Guide for PrintStack Custom Domains

This guide provides detailed DNS configuration instructions for various domain providers when setting up custom domains for PrintStack on Firebase Hosting.

## Quick Reference

### Required DNS Records

| Record Type | Name | Value/Target | Notes |
|-------------|------|---------------|-------|
| TXT | `_firebase-domain-verification` (for subdomain)<br>`@` (for root domain) | `firebase-domain-verification=CODE` | Get code from Firebase console |
| A | `@` (root) or subdomain | Firebase hosting IPs | Get current IPs from Firebase console |
| CNAME | `www` | `yourdomain.com` (for root) | Optional but recommended |

### Firebase Hosting IPs (Current)
```
192.168.30.46
192.168.30.45
```
*Note: Always verify current IPs in Firebase console as they may change.*

## Provider-Specific Instructions

### Google Domains

#### Step-by-Step Setup

1. **Sign in to Google Domains**
   - Visit [domains.google.com](https://domains.google.com)
   - Sign in with your Google account

2. **Navigate to DNS Settings**
   - Select your domain from the list
   - Click **DNS** in the left sidebar

3. **Add Verification Record**
   - Scroll to **Custom records**
   - Click **Add custom record**
   - Configure:
     - **Host**: `_firebase-domain-verification` (for subdomain) or `@` (for root)
     - **Type**: `TXT`
     - **TTL**: `1h` (or default)
     - **Data**: `firebase-domain-verification=YOUR_CODE`
   - Click **Save**

4. **Add Hosting Records**
   - Click **Add custom record** again
   - Configure:
     - **Host**: `@` (for root) or your subdomain name
     - **Type**: `A`
     - **TTL**: `1h`
     - **Data**: First Firebase IP
   - Repeat for second Firebase IP

5. **Add WWW Record (Optional)**
   - Click **Add custom record**
   - Configure:
     - **Host**: `www`
     - **Type**: `CNAME`
     - **TTL**: `1h`
     - **Data**: `yourdomain.com`

#### Verification

```bash
# Check DNS propagation
nslookup yourdomain.com
dig yourdomain.com A

# Verify all records
dig yourdomain.com TXT
dig yourdomain.com A
dig www.yourdomain.com CNAME
```

### Namecheap

#### Step-by-Step Setup

1. **Sign in to Namecheap**
   - Visit [namecheap.com](https://namecheap.com)
   - Click **Sign In** at the top

2. **Manage Domain**
   - Go to **Domain List** in the dashboard
   - Find your domain and click **Manage**

3. **Advanced DNS**
   - Scroll down to the **Advanced DNS** section
   - Click **Advanced DNS** tab

4. **Add TXT Record**
   - Click **Add New Record**
   - Configure:
     - **Type**: `TXT Record`
     - **Host**: `_firebase-domain-verification` (subdomain) or `@` (root)
     - **Value**: `firebase-domain-verification=YOUR_CODE`
     - **TTL**: `10 min`
   - Click **Save All Changes**

5. **Add A Records**
   - Click **Add New Record** for each Firebase IP
   - Configure:
     - **Type**: `A Record`
     - **Host**: `@` (root) or subdomain
     - **Value**: Firebase IP address
     - **TTL**: `10 min`
   - Add both Firebase IP addresses

6. **Add CNAME for WWW**
   - Click **Add New Record**
   - Configure:
     - **Type**: `CNAME Record`
     - **Host**: `www`
     - **Value**: `yourdomain.com`
     - **TTL**: `10 min`
   - Click **Save All Changes**

#### Namecheap Tips

- **Remove default records**: Delete existing `@` A records pointing to Namecheap parking
- **Disable forwarding**: Turn off domain forwarding if you're using Namecheap's default
- **TTL settings**: Use `10 min` for faster propagation during setup

### GoDaddy

#### Step-by-Step Setup

1. **Sign in to GoDaddy**
   - Visit [godaddy.com](https://godaddy.com)
   - Sign in to your account

2. **DNS Management**
   - Click **My Products** in the header
   - Find your domain and click **DNS**
   - Click **Manage DNS**

3. **Add TXT Record**
   - Scroll to **Records** section
   - Click **Add**
   - Configure:
     - **Type**: `TXT`
     - **Name**: `_firebase-domain-verification` (or `@` for root)
     - **Value**: `firebase-domain-verification=YOUR_CODE`
     - **TTL**: `1 Hour`
   - Click **Save**

4. **Add A Records**
   - Click **Add** for each Firebase IP
   - Configure:
     - **Type**: `A`
     - **Name**: `@` (or your subdomain)
     - **Value**: Firebase IP address
     - **TTL**: `1 Hour`
   - Add both Firebase IP addresses

5. **Add CNAME for WWW**
   - Click **Add**
   - Configure:
     - **Type**: `CNAME`
     - **Name**: `www`
     - **Value**: `yourdomain.com`
     - **TTL**: `1 Hour`
   - Click **Save**

#### GoDaddy Tips

- **Delete conflicting records**: Remove any existing `@` records with different IPs
- **Verify TTL**: Lower TTL values during setup for faster propagation
- **Check propagation**: Use GoDaddy's DNS management to see changes quickly

### Cloudflare

#### Step-by-Step Setup

1. **Sign in to Cloudflare**
   - Visit [dash.cloudflare.com](https://dash.cloudflare.com)
   - Sign in to your account

2. **Select Domain**
   - Choose your domain from the list

3. **Add DNS Records**

   **TXT Record:**
   - Click **Add record**
   - Configure:
     - **Type**: `TXT`
     - **Name**: `_firebase-domain-verification` (or `@` for root)
     - **Content**: `firebase-domain-verification=YOUR_CODE`
     - **TTL**: `Auto`
     - **Proxy status**: `DNS only` (gray cloud)
   - Click **Save**

   **A Records:**
   - Click **Add record** for each Firebase IP
   - Configure:
     - **Type**: `A`
     - **Name**: `@` (or your subdomain)
     - **IPv4 address**: Firebase IP
     - **TTL**: `Auto`
     - **Proxy status**: `DNS only` (gray cloud) - **IMPORTANT!**
   - Add both Firebase IP addresses

   **CNAME for WWW:**
   - Click **Add record**
   - Configure:
     - **Type**: `CNAME`
     - **Name**: `www`
     - **Target**: `yourdomain.com`
     - **TTL**: `Auto`
     - **Proxy status**: `DNS only` (gray cloud)
   - Click **Save**

#### Cloudflare Specific Notes

- **Proxy Status**: MUST be set to **DNS only** (gray cloud) for Firebase Hosting
- **SSL/TLS**: Set to **Flexible** or **Full** in SSL/TLS settings
- **Page Rules**: Disable any page rules that might interfere with Firebase routes

### Bluehost

#### Step-by-Step Setup

1. **Sign in to Bluehost**
   - Visit [bluehost.com](https://bluehost.com)
   - Log in to your account

2. **Domain Manager**
   - Go to **Domains** → **Domain Manager**
   - Select your domain

3. **DNS Zone Editor**
   - Click **DNS Zone Editor**
   - Select your domain from the dropdown

4. **Add TXT Record**
   - Click **Add DNS Record**
   - Configure:
     - **Host Record**: `_firebase-domain-verification` (or `@`)
     - **TTL**: `14400` (4 hours)
     - **Type**: `TXT`
     - **Points To**: `firebase-domain-verification=YOUR_CODE`
   - Click **Add Record**

5. **Add A Records**
   - Click **Add DNS Record** for each Firebase IP
   - Configure:
     - **Host Record**: `@` (or your subdomain)
     - **TTL**: `14400`
     - **Type**: `A`
     - **Points To**: Firebase IP address
   - Add both Firebase IPs

6. **Add CNAME for WWW**
   - Click **Add DNS Record**
   - Configure:
     - **Host Record**: `www`
     - **TTL**: `14400`
     - **Type**: `CNAME`
     - **Points To**: `yourdomain.com`
   - Click **Add Record**

### Network Solutions

#### Step-by-Step Setup

1. **Sign in to Network Solutions**
   - Visit [networksolutions.com](https://networksolutions.com)
   - Log in to your account

2. **Manage Domain**
   - Go to **My Account** → **My Domain Names**
   - Click on your domain name

3. **Advanced DNS**
   - Click **Manage** next to **Advanced DNS Settings**
   - Click **Edit Advanced DNS Records**

4. **Add Records**

   **TXT Record:**
   - Click **Add** in the TXT section
   - Configure:
     - **Type**: `TXT`
     - **Host**: `_firebase-domain-verification` (or `@`)
     - **Value**: `firebase-domain-verification=YOUR_CODE`
     - **TTL**: `3600` (1 hour)
   - Click **Continue**

   **A Records:**
   - Click **Add** for each Firebase IP
   - Configure:
     - **Type**: `A`
     - **Host**: `@` (or subdomain)
     - **Value**: Firebase IP address
     - **TTL**: `3600`
   - Add both Firebase IPs

   **CNAME for WWW:**
   - Click **Add**
   - Configure:
     - **Type**: `CNAME`
     - **Host**: `www`
     - **Value**: `yourdomain.com`
     - **TTL**: `3600`
   - Click **Continue**

## Advanced DNS Configuration

### Subdomain Setup

For `app.yourdomain.com`:

| Record Type | Host | Value |
|-------------|------|-------|
| TXT | `_firebase-domain-verification.app` | `firebase-domain-verification=CODE` |
| A | `app` | Firebase IP (first) |
| A | `app` | Firebase IP (second) |
| CNAME | `www.app` | `app.yourdomain.com` |

### Wildcard Subdomains

For `*.yourdomain.com`:

```dns
; Wildcard CNAME for all subdomains
*.yourdomain.com.  IN  CNAME   yourdomain.com.
```

**Note**: Firebase Hosting doesn't support wildcard subdomains directly. Configure each subdomain individually.

### Multiple Domains

For multiple domains pointing to the same site:

1. **Primary Domain**: Full setup as above
2. **Additional Domains**:
   - Add verification TXT record
   - Add A records pointing to Firebase IPs
   - Configure in Firebase console

## DNS Verification and Testing

### Verification Commands

```bash
# Check all record types
nslookup -type=TXT yourdomain.com
nslookup -type=A yourdomain.com
nslookup -type=CNAME www.yourdomain.com

# More detailed with dig
dig yourdomain.com ANY
dig www.yourdomain.com CNAME

# Check from different DNS servers
dig @8.8.8.8 yourdomain.com A
dig @1.1.1.1 yourdomain.com A
```

### Online Tools

- [DNSChecker.org](https://dnschecker.org/) - Global DNS propagation
- [WhatsMyDNS.net](https://whatsmydns.net/) - DNS propagation checker
- [DNSViz.net](https://dnsviz.net/) - DNS analysis and visualization

### SSL/TLS Verification

```bash
# Check SSL certificate
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com

# More comprehensive test
curl -I -L -v https://yourdomain.com

# Check certificate details
curl --insecure -v https://yourdomain.com 2>&1 | awk '/BEGIN CERTIFICATE/,/END CERTIFICATE/{print}' | openssl x509 -text -noout
```

## Troubleshooting

### Common DNS Issues

#### 1. DNS Not Propagating

**Symptoms:**
- Domain resolves to old IP
- Different results from different DNS servers
- Intermittent access

**Solutions:**
- Wait 24-48 hours for full propagation
- Clear local DNS cache: `ipconfig /flushdns` (Windows) or `sudo dscacheutil -flushcache` (macOS)
- Try different DNS resolvers: 8.8.8.8, 1.1.1.1
- Check with multiple propagation tools

#### 2. Verification TXT Record Issues

**Symptoms:**
- Firebase shows "Domain not verified"
- DNS records don't match

**Solutions:**
- Check record name: `_firebase-domain-verification` for subdomains, `@` for root
- Ensure value starts with `firebase-domain-verification=`
- Remove any quotes from the value
- Wait for DNS propagation before re-verifying

#### 3. SSL Certificate Not Issuing

**Symptoms:**
- Domain verified but SSL pending
- Certificate errors in browser
- No HTTPS access

**Solutions:**
- Ensure all A records point to Firebase IPs
- Check that DNS is fully propagated
- Manually trigger SSL renewal in Firebase console
- Wait up to 24 hours for automatic provisioning

#### 4. Redirects Not Working

**Symptoms:**
- HTTP doesn't redirect to HTTPS
- WWW doesn't redirect to root domain

**Solutions:**
- Check `firebase.json` redirects configuration
- Ensure redirects are properly formatted
- Test with `curl -I -L` to see full redirect chain
- Check Cloudflare proxy settings (must be DNS only)

### Emergency Recovery

#### Rollback to Previous Configuration

```bash
# Get previous Firebase hosting version
firebase hosting:sites:your-project:versions:list --limit 5

# Rollback to specific version
firebase hosting:sites:your-project:channels:live:rollback --to VERSION_ID
```

#### DNS Rollback

1. **Restore previous DNS records** in your domain provider
2. **Clear DNS cache** on your local machine
3. **Wait for propagation** (usually faster than initial setup)
4. **Verify with DNS tools** before notifying users

## Best Practices

### DNS Management

1. **Document Changes**: Keep records of DNS modifications
2. **Use Low TTL**: During setup, use TTL of 10 minutes to 1 hour
3. **Backup Records**: Screenshot or export DNS settings before changes
4. **Monitor Propagation**: Use multiple tools to verify global propagation
5. **Plan Downtime**: Schedule DNS changes during low-traffic periods

### Security

1. **DNSSEC**: Enable if your provider supports it
2. **Domain Auto-Renewal**: Set up automatic renewal to prevent accidental expiration
3. **Monitor Expiry**: Set calendar reminders for domain registration renewal
4. **Limit Access**: Restrict DNS management to authorized personnel

### Performance

1. **Geo-DNS**: Consider using Cloudflare or similar for global performance
2. **Caching**: Configure appropriate TTL values for your use case
3. **Monitoring**: Set up uptime monitoring for your custom domain
4. **Analytics**: Track domain performance and user experience

## Support Resources

### Official Documentation
- [Firebase Hosting Custom Domains](https://firebase.google.com/docs/hosting/custom-domain)
- [Firebase CLI Reference](https://firebase.google.com/docs/cli#hosting)

### Community Support
- [Firebase Community](https://stackoverflow.com/questions/tagged/firebase-hosting)
- Firebase Discord/Slack communities

### Emergency Contacts
- Your domain registrar's support
- Firebase support (if on paid plan)
- DNS propagation status tools

---

**Note**: DNS configurations are critical infrastructure. Always test thoroughly and have rollback procedures in place before making changes to production domains.