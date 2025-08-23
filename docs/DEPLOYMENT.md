# Cloudflare Pages Deployment Guide

This project is now configured for deployment to Cloudflare Pages at rynsy.com.

## Prerequisites

1. A Cloudflare account with your domain (rynsy.com) configured
2. Git repository pushed to GitHub/GitLab/Bitbucket

## Deployment Methods

### Method 1: Cloudflare Dashboard (Recommended)

1. **Login to Cloudflare Dashboard**
   - Go to https://dash.cloudflare.com
   - Navigate to "Pages" in the sidebar

2. **Create New Project**
   - Click "Create a project"
   - Choose "Connect to Git"
   - Connect your Git provider and select this repository

3. **Configure Build Settings**
   - **Framework preset**: Gatsby
   - **Build command**: `npm run build:cf`
   - **Build output directory**: `public`
   - **Root directory**: `/` (leave empty)

4. **Environment Variables** (if needed)
   - Add any environment variables your site needs
   - Set `NODE_ENV=production`

5. **Custom Domain**
   - After deployment, go to the project's "Custom domains" tab
   - Add `rynsy.com` and `www.rynsy.com`
   - Cloudflare will automatically configure SSL

### Method 2: Wrangler CLI

1. **Install Wrangler**
   ```bash
   npm install -g wrangler
   ```

2. **Login to Cloudflare**
   ```bash
   wrangler login
   ```

3. **Deploy**
   ```bash
   npm run build:cf
   wrangler pages publish public --project-name rynsy-personal-site
   ```

## Project Configuration

### Files Added for Cloudflare Pages:

- **`wrangler.toml`**: Cloudflare configuration
- **`static/_redirects`**: Client-side routing redirects
- **`static/_headers`**: Security headers and caching rules
- **`package.json`**: Added `build:cf` script
- **`gatsby-config.ts`**: Updated site URL and removed path prefix

### Build Configuration:

- **Build Command**: `npm run build:cf`
- **Output Directory**: `public`
- **Node Version**: 18+ (recommended)

## Domain Setup

1. Ensure your domain (rynsy.com) is added to your Cloudflare account
2. Set up DNS to point to Cloudflare's nameservers
3. In Cloudflare Pages, add custom domains:
   - `rynsy.com`
   - `www.rynsy.com` (optional)

## Features Configured

✅ **Client-side routing** - SPA navigation works correctly  
✅ **Security headers** - XSS protection, frame options, etc.  
✅ **Static asset caching** - Optimized cache headers  
✅ **Custom 404 page** - Gatsby 404 page integration  
✅ **Blog post routing** - Dynamic blog post URLs  
✅ **Modern font loading** - JetBrains Mono Nerd Font  
✅ **Unified design system** - Tailwind design tokens  

## Verification

After deployment, test:
- [ ] Homepage loads correctly
- [ ] Navigation between pages works
- [ ] Blog posts are accessible
- [ ] 404 page displays for invalid URLs
- [ ] Font loads properly
- [ ] Mobile responsiveness
- [ ] Performance (should score well on PageSpeed Insights)

## Rollback

If you need to rollback:
1. Go to Cloudflare Pages dashboard
2. Select your project
3. Go to "Deployments" tab
4. Click "Rollback" on a previous deployment

## Support

- Cloudflare Pages docs: https://developers.cloudflare.com/pages/
- Gatsby deployment guide: https://www.gatsbyjs.com/docs/how-to/previews-deploys-hosting/deploying-to-cloudflare-pages/