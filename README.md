# Ryan Lindsey - Personal Website

My personal website and blog built with modern web technologies. A digital space where ideas connect and evolve, featuring technical blog posts, portfolio projects, and thoughts on technology, algorithms, and software development.

🌐 **Live Site**: [rynsy.com](https://rynsy.com)

## Features

- **Modern Blog Platform**: Technical articles with syntax highlighting and mathematical notation support
- **Interactive Background System V3**: Advanced modular visual system with:
  - 🎮 **5 Dynamic Modules**: Gradient animations, interactive knowledge graphs, WebGL fluid simulation, falling sand, DVD bouncer
  - 🎯 **Smart Adaptation**: Device capability detection with automatic quality adjustment
  - 🎨 **Theme Integration**: Dark/light mode support across all visual elements
  - 🏆 **Easter Egg System**: Hidden discovery patterns and progressive unlocks
  - 📊 **Performance Monitoring**: Real-time FPS and memory usage tracking
- **Reading List**: Curated collection of technical resources and learning materials
- **Portfolio Showcase**: Highlighting key projects and technical work
- **Responsive Design**: Optimized for all devices and screen sizes
- **Performance Focused**: Built with Gatsby for blazing-fast static site generation
- **Production Ready**: Docker containerization with comprehensive testing infrastructure

## Tech Stack

- **Framework**: Gatsby 5+ (React 18-based static site generator)
- **Language**: TypeScript with strict type checking
- **Styling**: TailwindCSS with PostCSS pipeline
- **Graphics**: WebGL for advanced visualizations, D3.js for interactive elements
- **Content**: Markdown with Remark for blog posts and documentation
- **Math**: KaTeX for mathematical expressions
- **Code**: PrismJS for syntax highlighting
- **Testing**: Playwright for E2E, Vitest for unit tests **[Currently experiencing issues]**
- **Deployment**: Cloudflare Pages primary, GitHub Pages secondary
- **Infrastructure**: Docker containerization, nginx production serving
- **Analytics**: Umami privacy-first analytics, New Relic performance monitoring

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

# Run tests (currently experiencing issues)
pnpm test

# Run specific test suites
pnpm test:unit    # Unit tests (currently failing)
pnpm test:e2e     # E2E tests (timeout issues)
pnpm lint         # Code quality (150+ violations)

# Docker production testing
pnpm test:docker:production  # Works correctly

# Create new blog post
pnpm new-blog
```

## Project Structure

This is a monorepo workspace with the following structure:

```
.
├── packages/
│   ├── site/                    # Main Gatsby site
│   │   ├── src/bgModules/      # Background system V3 modules
│   │   ├── src/components/     # React components and canvas hosts
│   │   ├── src/contexts/       # Background and theme contexts
│   │   └── src/utils/          # Performance monitoring and utilities
│   └── tests/                  # Test suites and automation (needs fixes)
├── docs/                       # Technical documentation
├── docker/                     # Production containerization
├── interfaces/                 # TypeScript V3 interfaces
└── scripts/                    # Build and deployment scripts
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

---

## ⚠️ Current Development Status (August 2025)

### ✅ **What's Working**
- **Core Architecture**: V3 background system fully implemented with 5 interactive modules
- **Production Infrastructure**: Docker containerization and nginx serving functional
- **Build System**: Gatsby builds successfully (~21s), bundle size within budget (~2MB)
- **Advanced Features**: WebGL graphics, physics simulations, easter egg discovery system

### 🚨 **Critical Issues**
- **Testing Infrastructure**: 168 unit tests failing due to React hooks context issues
- **Code Quality**: 150+ ESLint violations (unused variables, console statements)
- **E2E Tests**: Playwright tests experiencing timeout and dependency issues
- **Accessibility**: ARIA implementation incomplete, focus management needs work

### 🎯 **Immediate Priorities**
1. Fix React testing environment for unit tests
2. Resolve ESLint violations for code quality
3. Stabilize E2E test suite
4. Complete accessibility audit fixes

### 📈 **Technical Achievements**
- **Modular Design**: Sophisticated module registry with capability detection
- **Performance**: Real-time monitoring with adaptive rendering
- **User Experience**: Interactive background system with theme integration
- **DevOps**: Production-ready containerization with health checks

## License

This project is open source and available under the [MIT License](LICENSE).