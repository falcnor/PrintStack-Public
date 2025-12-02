# Firebase Service Account Setup Guide

This document provides step-by-step instructions for setting up Firebase service accounts for automated deployment via GitHub Actions.

## Prerequisites

- Google Cloud SDK (gcloud) installed and authenticated
- Owner or Editor role on the Firebase projects
- Access to GitHub repository settings

## Development Service Account Setup

### 1. Create Service Account for Development Project

```bash
# Set the project context
gcloud config set project printstack-dev

# Create service account
gcloud iam service-accounts create firebase-ci-printstack-dev \
  --display-name="Firebase CI/CD Service Account (Development)" \
  --description="Service account for GitHub Actions deployment to development environment"

# Get the service account email
DEV_SA_EMAIL=$(gcloud iam service-accounts list --filter="displayName:Firebase CI/CD Service Account (Development)" --format="value(email)")

echo "Development Service Account Email: $DEV_SA_EMAIL"
```

### 2. Grant Required Permissions for Development

```bash
# Grant Firebase Admin role
gcloud projects add-iam-policy-binding printstack-dev \
  --member="serviceAccount:$DEV_SA_EMAIL" \
  --role="roles/firebase.admin"

# Grant Hosting Admin role
gcloud projects add-iam-policy-binding printstack-dev \
  --member="serviceAccount:$DEV_SA_EMAIL" \
  --role="roles/firebasehosting.admin"

# Grant Cloud Functions Admin role (if using functions)
gcloud projects add-iam-policy-binding printstack-dev \
  --member="serviceAccount:$DEV_SA_EMAIL" \
  --role="roles/cloudfunctions.admin"
```

### 3. Generate Service Account Key for Development

```bash
# Create service account key file
gcloud iam service-accounts keys create ./firebase-service-account-dev.json \
  --iam-account="$DEV_SA_EMAIL" \
  --key-format=JSON

echo "Development service account key saved to: ./firebase-service-account-dev.json"
```

## Production Service Account Setup

### 1. Create Service Account for Production Project

```bash
# Set the project context
gcloud config set project printstack-prod

# Create service account
gcloud iam service-accounts create firebase-ci-printstack-prod \
  --display-name="Firebase CI/CD Service Account (Production)" \
  --description="Service account for GitHub Actions deployment to production environment"

# Get the service account email
PROD_SA_EMAIL=$(gcloud iam service-accounts list --filter="displayName:Firebase CI/CD Service Account (Production)" --format="value(email)")

echo "Production Service Account Email: $PROD_SA_EMAIL"
```

### 2. Grant Required Permissions for Production

```bash
# Grant Firebase Admin role
gcloud projects add-iam-policy-binding printstack-prod \
  --member="serviceAccount:$PROD_SA_EMAIL" \
  --role="roles/firebase.admin"

# Grant Hosting Admin role
gcloud projects add-iam-policy-binding printstack-prod \
  --member="serviceAccount:$PROD_SA_EMAIL" \
  --role="roles/firebasehosting.admin"

# Grant Cloud Functions Admin role (if using functions)
gcloud projects add-iam-policy-binding printstack-prod \
  --member="serviceAccount:$PROD_SA_EMAIL" \
  --role="roles/cloudfunctions.admin"
```

### 3. Generate Service Account Key for Production

```bash
# Create service account key file
gcloud iam service-accounts keys create ./firebase-service-account-prod.json \
  --iam-account="$PROD_SA_EMAIL" \
  --key-format=JSON

echo "Production service account key saved to: ./firebase-service-account-prod.json"
```

## GitHub Repository Configuration

### 1. Add Secrets to GitHub Repository

1. Navigate to your GitHub repository
2. Go to **Settings** > **Secrets and variables** > **Actions**
3. Add the following repository secrets:

**Development Environment:**
- Name: `FIREBASE_SERVICE_ACCOUNT_DEV`
- Value: Content of `firebase-service-account-dev.json`

**Production Environment:**
- Name: `FIREBASE_SERVICE_ACCOUNT_PROD`
- Value: Content of `firebase-service-account-prod.json`

### 2. Enable Production Environment Protection

1. Go to **Settings** > **Environments**
2. Create a new environment named `production`
3. Add protection rules:
   - Require reviewers
   - Wait timer (recommended: 5 minutes)
   - Prevent self-approval

## Verification

### Test Development Deployment
```bash
# Push to deploy branch
git push origin deploy
```

### Test Production Deployment
```bash
# Push to main branch
git push origin main
```

## Security Considerations

1. **Principle of Least Privilege**: Only grant necessary permissions
2. **Key Rotation**: Rotate service account keys regularly (every 90 days)
3. **Key Storage**: Never commit service account keys to version control
4. **Access Logs**: Monitor IAM audit logs for suspicious activity
5. **Environment Separation**: Use different service accounts for dev/prod

## Troubleshooting

### Common Issues

1. **Permission Denied**: Ensure service account has proper IAM roles
2. **Invalid Key**: Regenerate service account key if corrupted
3. **Wrong Project**: Verify gcloud project configuration
4. **GitHub Secrets**: Ensure secrets are correctly configured and not expired

### Debug Commands

```bash
# Test service account authentication
gcloud auth activate-service-account --key-file=./firebase-service-account-dev.json
gcloud projects list

# Test Firebase CLI authentication
export GOOGLE_APPLICATION_CREDENTIALS="./firebase-service-account-dev.json"
firebase projects:list
```

## Cleanup

If you need to delete service accounts:

```bash
# List service accounts
gcloud iam service-accounts list

# Delete service account (use with caution)
gcloud iam service-accounts delete firebase-ci-printstack-dev@printstack-dev.iam.gserviceaccount.com
gcloud iam service-accounts delete firebase-ci-printstack-prod@printstack-prod.iam.gserviceaccount.com
```

## Alternative Setup via Firebase Console

If you prefer using the Firebase console instead of gcloud CLI:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (printstack-dev or printstack-prod)
3. Navigate to **Project Settings** > **Service Accounts**
4. Click **Generate new private key**
5. Select **JSON** format
6. Save the key file securely
7. Add the key content to GitHub repository secrets

## References

- [Firebase Service Accounts Documentation](https://firebase.google.com/docs/admin/setup)
- [Google Cloud IAM Documentation](https://cloud.google.com/iam/docs)
- [GitHub Actions Secrets Documentation](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions)