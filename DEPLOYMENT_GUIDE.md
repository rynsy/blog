# Deployment Guide

This project uses a development/production workflow with GitHub Pages for testing and Cloudflare Pages for production.

## 🔧 **Configuration**

- **GitHub Pages (Development)**: Uses `/blog` path prefix → `rynsy.github.io/blog/`
- **Cloudflare Pages (Production)**: No path prefix → `rynsy.com`

## 🚀 **Deployment Workflow**

### 1. Development/Testing (Automatic)
```bash
# Develop locally
npm run develop

# When ready to test, push to GitHub
git add .
git commit -m "Add new feature"
git push origin main
```
✅ **GitHub Actions automatically deploys to `rynsy.github.io/blog/` for testing**

### 2. Production (Manual)
```bash
# When satisfied with testing, deploy to production
npm run deploy:cf
```
✅ **Manually deploy to `rynsy.com` when ready to publish**

## 🎯 **Build Commands**

- `npm run build:gh` - Build for GitHub Pages (with `/blog` prefix)
- `npm run build:cf` - Build for Cloudflare Pages (no prefix)
- `npm run develop` - Local development server

## 📍 **URLs After Deployment**

### GitHub Pages URLs:
- **Homepage**: https://rynsy.github.io/blog/
- **Blog**: https://rynsy.github.io/blog/blog/
- **About**: https://rynsy.github.io/blog/about/
- **Portfolio**: https://rynsy.github.io/blog/portfolio/

### Cloudflare Pages URLs:
- **Homepage**: https://rynsy.com/
- **Blog**: https://rynsy.com/blog/
- **About**: https://rynsy.com/about/
- **Portfolio**: https://rynsy.com/portfolio/

## 🎯 **Key Features**

- ✅ JetBrains Mono Nerd Font
- ✅ Unified Tailwind design tokens  
- ✅ Responsive design across all pages
- ✅ Client-side routing with proper fallbacks
- ✅ Security headers (Cloudflare)
- ✅ Optimized caching

## 🔍 **Troubleshooting**

### GitHub Pages "Loading..." Issue
This was caused by the wrong path prefix. Now fixed with `/blog` prefix.

### Cloudflare Custom Domain
1. Go to Cloudflare Dashboard → Pages
2. Select `rynsy-personal-site` project  
3. Add custom domain: `rynsy.com`
4. DNS will auto-configure

### Build Issues
- Use `npm run clean` if you get cache issues
- Ensure you're using the right build command for each platform