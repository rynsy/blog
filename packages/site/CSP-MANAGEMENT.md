# CSP Management Guide

This project uses a **configuration-driven approach** for managing Content Security Policy (CSP) headers, making it easy to add new domains and maintain security policies.

## 🎯 Quick Start

### Adding a New Domain

1. **Edit `csp-config.json`** - Add your domain to the appropriate section
2. **Run the update command** - `npm run update-csp` 
3. **Test locally** - The `_headers` file is automatically regenerated

### Example: Adding a New Image Source

```json
{
  "img-src": [
    "'self'",
    "data:",
    {
      "domain": "images.unsplash.com",
      "purpose": "High-quality stock photos for blog posts", 
      "category": "media"
    }
  ]
}
```

### Example: Adding a New Analytics Tool

```json
{
  "script-src": [
    "'self'",
    {
      "domain": "www.googletagmanager.com",
      "purpose": "Google Tag Manager",
      "category": "analytics"
    }
  ]
}
```

## 📁 File Structure

- **`csp-config.json`** - Main configuration file (edit this!)
- **`scripts/generate-headers.js`** - Generates `_headers` from config
- **`static/_headers`** - Auto-generated Cloudflare Pages headers file
- **`CSP-MANAGEMENT.md`** - This guide

## 🛠 Commands

| Command | Description |
|---------|-------------|
| `npm run update-csp` | Regenerate headers from config |
| `npm run generate-headers` | Same as above (alias) |
| `npm run build` | Automatically updates headers before building |

## 📋 CSP Directives Explained

### Common Directives

- **`img-src`** - Controls where images can be loaded from
- **`media-src`** - Controls where videos/audio can be loaded from  
- **`script-src`** - Controls where JavaScript can be loaded from
- **`style-src`** - Controls where CSS can be loaded from
- **`font-src`** - Controls where fonts can be loaded from
- **`connect-src`** - Controls AJAX/WebSocket/EventSource connections

### Special Values

- **`'self'`** - Same origin as the current site
- **`'unsafe-inline'`** - Allow inline scripts/styles (use carefully)
- **`'unsafe-eval'`** - Allow eval() and similar (use carefully)
- **`data:`** - Allow data: URLs
- **`*.example.com`** - Wildcard subdomains

## 🎨 Configuration Format

### Basic String Format
```json
"img-src": ["'self'", "example.com"]
```

### Documented Object Format (Recommended)
```json
"img-src": [
  "'self'",
  {
    "domain": "example.com",
    "purpose": "Why this domain is needed",
    "category": "media|analytics|fonts|tools|etc"
  }
]
```

## 🔧 Common Scenarios

### Adding a Video Hosting Service
```json
{
  "media-src": [
    "'self'",
    {
      "domain": "player.vimeo.com",
      "purpose": "Vimeo video embeds",
      "category": "media"
    }
  ]
}
```

### Adding a Widget/Embed
```json
{
  "script-src": [
    "'self'",
    {
      "domain": "widget.example.com",
      "purpose": "Third-party widget functionality",
      "category": "widgets"
    }
  ],
  "connect-src": [
    "'self'",
    {
      "domain": "api.example.com", 
      "purpose": "Widget API calls",
      "category": "widgets"
    }
  ]
}
```

### Adding a New Font Source
```json
{
  "font-src": [
    "'self'",
    "data:",
    {
      "domain": "use.typekit.net",
      "purpose": "Adobe Fonts (Typekit)",
      "category": "fonts"
    }
  ]
}
```

## 🚨 Security Best Practices

### ✅ DO
- Use the documented object format for transparency
- Be specific with domains (avoid wildcards when possible)
- Categorize domains for better organization
- Test changes locally before deploying
- Remove unused domains regularly

### ❌ DON'T
- Add `'unsafe-inline'` to script-src without careful consideration
- Use overly broad wildcards like `*` 
- Add domains without understanding their purpose
- Skip the regeneration step after config changes

## 🔍 Debugging CSP Issues

### Browser Console Errors
```
Refused to load the image 'https://example.com/image.jpg' because it violates the following Content Security Policy directive: "img-src 'self' ..."
```

**Solution:** Add `example.com` to the `img-src` directive in `csp-config.json`

### Common Error Patterns

| Error Contains | Add Domain To | Example |
|----------------|---------------|---------|
| "Refused to load the script" | `script-src` | Third-party JS libraries |
| "Refused to load the image" | `img-src` | External images |
| "Refused to load the media" | `media-src` | Videos/audio files |
| "Refused to connect" | `connect-src` | API calls, WebSockets |
| "Refused to apply inline style" | Review if `'unsafe-inline'` needed | Inline CSS |

## 🎯 Quick Commands Summary

```bash
# Add a domain and regenerate headers
npm run update-csp

# Build with updated headers
npm run build

# Check the generated headers
cat static/_headers
```

This system makes CSP management much more maintainable while keeping your site secure! 🔒✨