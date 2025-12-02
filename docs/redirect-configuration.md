# Redirect Configuration Guide

This document explains the 301 redirect rules configured in `firebase.json` for PrintStack's Firebase Hosting deployment.

## 🔄 Overview

The redirect configuration ensures SEO-friendly URL transitions, maintains URL consistency, and preserves search engine rankings when migrating to Firebase Hosting.

## 📋 Redirect Categories

### 1. Core Navigation Redirects

| From | To | Purpose |
|------|----|---------|
| `/home` | `/` | Legacy home page URL |
| `/index.html` | `/` | Remove file extension |
| `/dashboard` | `/` | Legacy dashboard URL |
| `/overview` | `/` | Alternative dashboard URL |
| `/app` | `/` | Legacy application URL |

### 2. Pluralization Standardization

| From | To | Purpose |
|------|----|---------|
| `/filament/:id*` | `/filaments/:id` | Ensure plural form |
| `/model/:id*` | `/models/:id` | Ensure plural form |
| `/print/:id*` | `/prints/:id` | Ensure plural form |
| `/statistic/:id*` | `/statistics/:id` | Ensure plural form |

**Regex Patterns:**
```
/filament(?:s)?/(.+) → /filaments/:id
/model(?:s)?/(.+) → /models/:id
/print(?:s)?/(.+) → /prints/:id
/statistic(?:s)?/(.+) → /statistics/:id
```

### 3. Feature Renames

| From | To | Purpose |
|------|----|---------|
| `/inventory` | `/filaments` | New filament management |
| `/library` | `/models` | New models library |
| `/history` | `/prints` | New print history |
| `/analytics` | `/statistics` | New statistics page |

### 4. Domain Migration

| Pattern | To | Purpose |
|---------|----|---------|
| `/(www\.)?printstack\.app` | `https://printstack.dev` | Primary domain migration |
| `/(www\.)?printstack\.io` | `https://printstack.dev` | Secondary domain migration |
| `/http://*` | `https://printstack.dev` | HTTP to HTTPS migration |

### 5. CRUD Action Routes

| Pattern | To | Purpose |
|---------|----|---------|
| `/add/(.*)` | `/$1/add` | Standardize add actions |
| `/edit/(.*)` | `/$1/edit` | Standardize edit actions |
| `/delete/(.*)` | `/$1/delete` | Standardize delete actions |

**Examples:**
- `/add/filament` → `/filament/add`
- `/edit/model/123` → `/model/edit/123`
- `/delete/print/456` → `/print/delete/456`

### 6. API Versioning

| From | To | Purpose |
|------|----|---------|
| `/api/v1/:path*` | `/api/:path*` | Merge API versions |
| `/api/v2/:path*` | `/api/:path*` | Merge API versions |

### 7. Authentication Routes

| From | To | Purpose |
|------|----|---------|
| `/auth/login` | `/login` | Simplify auth URLs |
| `/auth/register` | `/register` | Simplify auth URLs |
| `/auth/logout` | `/logout` | Simplify auth URLs |

### 8. User Profile Routes

| From | To | Purpose |
|------|----|---------|
| `/user/profile` | `/profile` | Simplify profile URL |
| `/user/settings` | `/settings` | Simplify settings URL |

### 9. Search and Filtering

| Pattern | To | Purpose |
|---------|----|---------|
| `/search\?q=(.*)` | `/search?q=$1` | Standardize search URLs |
| `/category/(.*)` | `/models?category=$1` | Category filtering |
| `/tag/(.*)` | `/models?tag=$1` | Tag filtering |

### 10. Feature Content

| From | To | Purpose |
|------|----|---------|
| `/featured` | `/models?featured=true` | Featured models |
| `/recent` | `/prints?recent=true` | Recent prints |
| `/popular` | `/models?popular=true` | Popular models |

## 🔧 Configuration Details

### Firebase Hosting Redirect Syntax

```json
{
  "redirects": [
    {
      "source": "/old-url",
      "destination": "/new-url",
      "type": 301
    },
    {
      "regex": "/pattern/(.*)",
      "destination": "/new-path/$1",
      "type": 301
    }
  ]
}
```

### Redirect Types

- **301**: Permanent redirect (SEO-friendly, preserves link juice)
- **302**: Temporary redirect
- **404**: Not found (used for security patterns)

### Source Matching

- **Simple paths**: `/home`, `/filaments`
- **Wildcards**: `/filament/:id*` - matches `/filament/123`, `/filament/123/edit`
- **Regex patterns**: `/pattern/(.*)` - capture groups for dynamic content

## 📊 SEO Benefits

### Why Use 301 Redirects?

1. **Preserve Search Rankings**: Transfer 90-99% of link equity
2. **User Experience**: Seamless navigation to updated URLs
3. **Analytics Consolidation**: Combine metrics for old and new URLs
4. **Bookmark Compatibility**: Maintain existing user bookmarks

### Best Practices Implemented

1. **Specific to General**: Most specific rules first
2. **Logical Grouping**: Related redirects together
3. **Regex Optimization**: Efficient pattern matching
4. **Domain Migration**: Complete domain transition support

## 🚀 Implementation Notes

### Performance Considerations

- Redirects are processed at Firebase's edge locations
- Minimal latency impact (< 10ms)
- Cached for optimal performance

### Testing Redirects

```bash
# Test specific redirect
curl -I "https://printstack.dev/home"

# Should return:
# HTTP/2 301
# location: https://printstack.dev/

# Test regex redirect
curl -I "https://printstack.dev/filament/123"

# Should return:
# HTTP/2 301
# location: https://printstack.dev/filaments/123
```

### Monitoring Redirects

Use Google Search Console to monitor:
- Redirect chains (avoid multiple hops)
- 404 errors from broken redirects
- Search traffic patterns post-migration

## 🔍 Common Redirect Scenarios

### Scenario 1: Old Bookmark

User visits: `printstack.dev/inventory`
1. Firebase matches `/inventory` redirect rule
2. Returns 301 to `/filaments`
3. Browser follows redirect to `/filaments`
4. User sees filament library

### Scenario 2: Search Engine Crawler

Crawler requests: `printstack.dev/model/123-abc-def`
1. Regex matches `/model/:id*` pattern
2. Captures `123-abc-def` as `:id*
3. Returns 301 to `/models/123-abc-def`
4. Search engine updates index to new URL

### Scenario 3: External Link

External site links to: `printstack.dev/library`
1. Firebase matches `/library` redirect
2. Returns 301 to `/models`
3. Link equity transfers to `/models`
4. User lands on models library

## 🛠️ Maintenance

### Adding New Redirects

1. Update `firebase.json` redirects array
2. Test locally with `firebase serve`
3. Deploy with `firebase deploy --only hosting`
4. Verify with `curl -I` checks
5. Monitor for redirect chains

### Removing Redirects

1. Check analytics for traffic to old URLs
2. Ensure no external links use old URLs
3. Remove redirect rule from `firebase.json`
4. Update documentation
5. Deploy and verify

### Common Issues

1. **Redirect Loops**: Ensure destination doesn't redirect back to source
2. **Too Many Hops**: Keep redirects to single hop when possible
3. **Regex Conflicts**: Test regex patterns don't overlap
4. **Case Sensitivity**: URLs are case-sensitive by default

## 📈 Analytics Integration

### Track Redirect Performance

```javascript
// In your analytics setup
gtag('config', 'GA_MEASUREMENT_ID', {
  custom_map: {
    'custom_parameter_1': 'redirect_source'
  }
});

// Log redirects (if needed for debugging)
if (window.location.pathname.includes('/old-path')) {
  gtag('event', 'redirect', {
    'custom_parameter_1': window.location.pathname
  });
}
```

### Monitor Search Console

1. Check Coverage report for redirect issues
2. Monitor Index status for new URLs
3. Review Performance metrics post-redirect
4. Track any crawl errors

---

**Note**: This redirect configuration supports both the migration to Firebase Hosting and the URL structure improvements in the React application. Regular updates may be needed as the application evolves.