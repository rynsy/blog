# Raindrop.io Bookmarks Integration Setup

This guide will help you set up the Raindrop.io API integration for your bookmarks feature.

## 🔧 **Prerequisites**

1. **Raindrop.io Account**: Sign up at [raindrop.io](https://raindrop.io) (free tier is fine)
2. **API Token**: You'll need to generate an API token

## 📡 **Getting Your Raindrop API Token**

### Method 1: Test Token (Quick Start)
1. Go to [Raindrop API Apps](https://app.raindrop.io/settings/integrations)
2. Click "Create new app"
3. Fill in basic details:
   - **Name**: "Personal Website"
   - **Description**: "API access for my personal website bookmarks"
4. After creation, copy the **Test Token** (starts with `ra_`)

### Method 2: OAuth (Production)
For production use, you can implement OAuth flow, but the test token is sufficient for personal use.

## ⚙️ **Environment Setup**

### Local Development
Create a `.env.development` file in your project root:
```bash
GATSBY_RAINDROP_TOKEN=ra_your_token_here
```

### Production (Cloudflare Pages)
1. Go to Cloudflare Pages dashboard
2. Select your project → Settings → Environment variables
3. Add variable:
   - **Name**: `GATSBY_RAINDROP_TOKEN`
   - **Value**: `ra_your_token_here`
   - **Environment**: Production

### GitHub Pages (Testing)
1. Go to your GitHub repository
2. Settings → Secrets and variables → Actions
3. Add repository secret:
   - **Name**: `GATSBY_RAINDROP_TOKEN`
   - **Value**: `ra_your_token_here`

Then update `.github/workflows/gatsby.yml` to include the environment variable:
```yaml
- name: Build with Gatsby (GitHub Pages)
  env:
    DEPLOY_TARGET: github
    GATSBY_RAINDROP_TOKEN: ${{ secrets.GATSBY_RAINDROP_TOKEN }}
  run: ${{ steps.detect-package-manager.outputs.manager }} run build:gh
```

## 📋 **Features Included**

### Homepage - Recent Reads
- Shows 3 most recent bookmarks
- Displays title, domain, date, tags
- Links to full bookmarks page

### Bookmarks Page (`/bookmarks`)
- **Search**: Full-text search across titles and descriptions
- **Filters**: By collection, type, tags
- **Sorting**: Date, title, domain
- **Collections**: Shows your Raindrop collections
- **Types**: Automatically categorizes (articles, videos, repos, etc.)
- **Tags**: All your tags with click-to-filter

### Bookmark Cards
- Title with external link
- Domain and date
- Cover image (if available)
- Tags
- Personal notes (if added in Raindrop)
- Type indicators (📄 articles, 🎥 videos, etc.)

## 🎯 **Usage Tips**

### Organizing Your Bookmarks
1. **Collections**: Use Raindrop collections to organize by topic
2. **Tags**: Add relevant tags for better filtering
3. **Notes**: Add personal thoughts in Raindrop - they'll show on your site
4. **Types**: Raindrop auto-detects types, but you can also manually set them

### Browser Extensions
Install the Raindrop browser extension to easily save bookmarks:
- [Chrome Extension](https://chrome.google.com/webstore/detail/raindropio/ldgfbffkinooeloadekpmfoklnobpien)
- [Firefox Add-on](https://addons.mozilla.org/en-US/firefox/addon/raindropio/)

## 🔍 **Testing**

### Local Testing
1. Add your token to `.env.development`
2. Add some bookmarks to your Raindrop account
3. Run `npm run develop`
4. Visit `http://localhost:8000` and `http://localhost:8000/bookmarks`

### Production Testing
1. Deploy to Cloudflare Pages with the environment variable set
2. Check that bookmarks load correctly
3. Test filtering and search functionality

## ⚠️ **Important Notes**

- **Rate Limits**: Raindrop API has rate limits, but they're generous for personal use
- **Public Bookmarks**: Only public bookmarks are accessible via API
- **Token Security**: Keep your API token secret - never commit it to the repository
- **Fallback**: If the API is unavailable, the sections gracefully hide
- **Performance**: Bookmarks are fetched client-side, so there's a brief loading state

## 🆘 **Troubleshooting**

### Bookmarks Not Loading in Production
**Issue**: Works locally but not in deployed version.
**Cause**: API calls happen client-side, not during build.

**Debug Steps**:
1. Open browser DevTools → Console tab
2. Look for console logs:
   - "Raindrop token not found in environment"  
   - "Fetching recent bookmarks..."
   - "Fetched bookmarks: X"
3. Check Network tab for requests to `https://api.raindrop.io`

**Solutions**:
- Verify `GATSBY_RAINDROP_TOKEN` is set in production environment
- Check that environment variable is visible in browser (appears in console logs)
- Ensure token has correct format (starts with `ra_`)

### Environment Variable Issues
- Environment variables starting with `GATSBY_` are exposed to the browser
- Make sure to restart your development server after adding environment variables
- Double-check spelling and format of the token
- In production, check Cloudflare Pages environment variables section

### API Errors
- **401 Unauthorized**: Token invalid or expired - regenerate in Raindrop settings
- **429 Rate Limited**: Too many requests - wait and try again
- **Network errors**: Check if Raindrop.io is accessible from your location
- **CORS errors**: Should not happen with Raindrop API, but check browser console

### Common Issues
**No network requests visible**: 
- Token not set in environment
- Component not rendering (check React DevTools)

**API calls but no data**:
- Check you have public bookmarks in Raindrop
- Verify token permissions (should have read access)

**Works locally but not deployed**:
- Environment variable not set in production
- Different subdomain/domain causing issues

## 📚 **Resources**

- [Raindrop.io API Documentation](https://developer.raindrop.io/)
- [Raindrop.io Help Center](https://help.raindrop.io/)
- [Environment Variables in Gatsby](https://www.gatsbyjs.com/docs/how-to/local-development/environment-variables/)