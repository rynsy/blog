# Deployment Guide

This project supports deployment to both GitHub Pages and Cloudflare Pages with the correct path prefixes.

## 🔧 **Configuration**

- **GitHub Pages**: Uses `/blog` path prefix (matches your repository name)
- **Cloudflare Pages**: No path prefix (root domain deployment)

## 🚀 **Deployment Commands**

### GitHub Pages (Testing)
```bash
# Deploy to GitHub Pages at rynsy.github.io/blog/
npm run deploy

# Or build only
npm run build:gh
```

### Cloudflare Pages (Production)
```bash
# Deploy to Cloudflare Pages at rynsy.com
npm run deploy:cf

# Or build only
npm run build:cf
```

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