# CLI Deployment Guide for Cloudflare Pages

## Quick Deploy Commands

### First-time Deployment
```bash
# Build and deploy in one command
npm run deploy:cf
```

### Subsequent Deployments
```bash
# Deploy production
npm run deploy:cf

# Deploy preview (for testing)
npm run deploy:cf:preview
```

## Manual Steps

### 1. One-time Setup
```bash
# Install dependencies (already done)
npm install

# Login to Cloudflare (if not already authenticated)
npx wrangler login
```

### 2. Deploy
```bash
# Build the site
npm run build:cf

# Deploy to Cloudflare Pages
npx wrangler pages deploy public --project-name rynsy-personal-site
```

### 3. Custom Domain Setup
After first deployment, add custom domain:
```bash
# Add your domain (run once)
npx wrangler pages domain add rynsy-personal-site rynsy.com
npx wrangler pages domain add rynsy-personal-site www.rynsy.com
```

## Project Configuration

- **Project Name**: `rynsy-personal-site`
- **Build Command**: `npm run build:cf`
- **Output Directory**: `public`
- **Framework**: Gatsby

## Available Scripts

- `npm run deploy:cf` - Build and deploy to production
- `npm run deploy:cf:preview` - Build and deploy preview
- `npm run build:cf` - Build only (for manual deployment)

## What Happens During Deployment

1. ✅ Gatsby builds static site to `public/`
2. ✅ `_redirects` enables client-side routing
3. ✅ `_headers` adds security headers
4. ✅ Wrangler uploads to Cloudflare Pages
5. ✅ Site is available at generated URL
6. ✅ Custom domain points to your site (if configured)

## Troubleshooting

### Authentication Issues
```bash
npx wrangler logout
npx wrangler login
```

### Project Already Exists
If you get a "project already exists" error, either:
1. Use a different project name in the scripts, or
2. Deploy to existing project:
```bash
npx wrangler pages deploy public --project-name existing-project-name
```

### Check Deployment Status
```bash
npx wrangler pages deployment list --project-name rynsy-personal-site
```

## Environment Variables

Set in Cloudflare dashboard or via CLI:
```bash
npx wrangler pages secret put VARIABLE_NAME --project-name rynsy-personal-site
```