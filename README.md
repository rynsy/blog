# Ryan Lindsey - Personal Website

My personal website and blog built with modern web technologies. A digital space where ideas connect and evolve, featuring technical blog posts, portfolio projects, and thoughts on technology, algorithms, and software development.

🌐 **Live Site**: [rynsy.com](https://rynsy.com)

## Features

- **Modern Blog Platform**: Technical articles with syntax highlighting and mathematical notation support
- **Interactive Background System**: Dynamic visual elements that respond to user interaction
- **Reading List**: Curated collection of technical resources and learning materials
- **Portfolio Showcase**: Highlighting key projects and technical work
- **Responsive Design**: Optimized for all devices and screen sizes
- **Performance Focused**: Built with Gatsby for blazing-fast static site generation

## Tech Stack

- **Framework**: Gatsby (React-based static site generator)
- **Language**: TypeScript for type safety and better developer experience
- **Styling**: PostCSS with modern CSS features
- **Content**: Markdown with Remark for blog posts and documentation
- **Math**: KaTeX for mathematical expressions
- **Code**: PrismJS for syntax highlighting
- **Testing**: Playwright for end-to-end testing
- **Deployment**: Cloudflare Pages with automated CI/CD

## Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm develop

# Build for production
pnpm build

# Serve production build
pnpm serve

# Run tests
pnpm test

# Create new blog post
pnpm new-blog
```

## Project Structure

This is a monorepo workspace with the following structure:

```
.
├── packages/
│   ├── site/          # Main Gatsby site
│   └── tests/         # Test suites and automation
├── docs/              # Technical documentation
└── scripts/           # Build and deployment scripts
```

## Content Management

Blog posts are written in Markdown and stored in `packages/site/content/blog/`. Each post supports:

- Mathematical expressions with KaTeX
- Code syntax highlighting
- Interactive media and visualizations
- Tagging and categorization
- Reading time estimation

## Deployment

The site is automatically deployed to Cloudflare Pages on every push to main. Multiple deployment targets are supported:

- **Production**: Cloudflare Pages at rynsy.com
- **GitHub Pages**: Alternative deployment option
- **Preview**: Branch deployments for testing

## License

This project is open source and available under the [MIT License](LICENSE).