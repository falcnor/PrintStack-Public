# Firebase Hosting Setup Documentation

## Overview

This document contains the Firebase hosting setup and configuration details for the PrintStack application.

## Firebase Projects

### Development Environment
- **Project ID**: `printstack-dev`
- **Project Name**: PrintStack Development
- **Hosting URL**: https://printstack-dev.web.app
- **Firebase Console**: https://console.firebase.google.com/project/printstack-dev/overview

### Production Environment
- **Project ID**: `printstack-prod`
- **Project Name**: PrintStack Production
- **Hosting URL**: https://printstack-prod.web.app
- **Firebase Console**: https://console.firebase.google.com/project/printstack-prod/overview

### Original Project (Legacy)
- **Project ID**: `printstack-e48e0`
- **Project Name**: PrintStack
- **Firebase Console**: https://console.firebase.google.com/project/printstack-e48e0/overview

## Configuration Files

### firebaserc
```json
{
  "projects": {
    "default": "printstack-dev",
    "dev": "printstack-dev",
    "development": "printstack-dev",
    "prod": "printstack-prod",
    "production": "printstack-prod"
  }
}
```

### firebase.json
- Configured for single-page application (SPA) routing
- Optimized caching headers for static assets
- Security headers implemented
- Environment-specific optimizations

## Deployment Testing

Both environments have been successfully tested with manual deployment:

✅ **Development**: `npm run build && firebase deploy --project printstack-dev --only hosting`
✅ **Production**: `npm run build && firebase deploy --project printstack-prod --only hosting`

## Environment Detection

The application automatically detects its environment and uses appropriate localStorage namespaces:
- **Development**: `printstack_dev_*` prefixes
- **Production**: `printstack_prod_*` prefixes

## Next Steps

- Configure GitHub Actions for automated deployment
- Set up service accounts for CI/CD integration
- Implement environment-specific configurations