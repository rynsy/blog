# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

This is a monorepo workspace using pnpm. All commands should be run from the project root:

### Core Development (✅ Optimized)
- `pnpm develop` - Start Gatsby development server (4.4s bootstrap, hot reload enabled)
- `pnpm build` - Build for Cloudflare Pages deployment (~17-19s production build)
- `pnpm build:cf` - Cloudflare-specific build with CSP headers
- `pnpm build:gh` - Build for GitHub Pages deployment with prefix paths
- `pnpm serve` - Serve production build locally
- `pnpm clean` - Clean build artifacts

### Testing & Quality (✅ Optimized)
- `pnpm test` or `pnpm test:ci` - Run full test suite (lint + typecheck + unit + e2e)
- `pnpm test:unit` - Run unit tests with Vitest (fast parallel execution)
- `pnpm test:e2e` - Run Playwright end-to-end tests
- `pnpm test:watch` - Watch mode for unit tests
- `pnpm test:local-ci` - Run comprehensive local CI including Docker tests
- `pnpm lint` - ESLint with auto-fix (configured for max 5 warnings)
- `pnpm typecheck` - TypeScript type checking (strict mode enabled)

### Docker Testing (✅ Production-Ready)
- `pnpm test:docker:production` - Start production-like containers (nginx + analytics mock)
- `pnpm test:docker:e2e` - Run full E2E tests against production containers
- `pnpm test:docker:clean` - Clean up Docker containers and volumes

Direct Docker commands:
- `docker-compose -f docker/docker-compose.production-test.yml up --build` - Manual production test setup

### Content Management
- `pnpm new-blog` - Create new blog post with proper frontmatter

## Architecture Overview

### Monorepo Structure
- `packages/site/` - Main Gatsby site with React/TypeScript
- `packages/tests/` - Dedicated test package with Playwright and unit tests
- `docs/` - Technical documentation and implementation guides

### Interactive Background System
The site features a modular background system with three main components:

1. **Background Modules** (`src/bgModules/`):
   - Advanced modules: DVD bouncer, fluid simulation, falling sand
   - Gradient module: Dynamic gradient animations  
   - Knowledge module: Interactive node graphs
   - Registry system for dynamic module loading

2. **Canvas Management** (`src/components/CanvasHost*.tsx`):
   - WebGL-enabled canvas rendering
   - Performance monitoring and adaptive rendering
   - Device capability detection

3. **Context System** (`src/contexts/`):
   - Background state management
   - Analytics integration
   - Theme management

### Testing Strategy
- **Unit Tests**: Jest/Vitest for component logic and utilities
- **E2E Tests**: Playwright for user interactions and visual validation
- **Docker Integration**: Production-like environment testing with nginx
- **Accessibility**: Automated a11y testing with axe-core
- **Performance**: Lighthouse CI and custom performance monitoring

### Key Technologies
- **Framework**: Gatsby 5+ with React 18
- **Language**: TypeScript with strict type checking
- **Styling**: TailwindCSS with PostCSS
- **Graphics**: WebGL for background animations, D3 for interactive elements
- **Testing**: Playwright for E2E, Jest/Vitest for units
- **Deployment**: Cloudflare Pages primary, GitHub Pages secondary

### Content System
- Blog posts in Markdown with KaTeX math support
- Reading list with Raindrop API integration
- Syntax highlighting with PrismJS
- SEO optimization with React Helmet

## Docker Production Testing (✅ Optimized & Validated)

The project includes fully validated Docker configuration for testing production builds:

1. **Production Container** (`packages/site/Dockerfile.production`): nginx:alpine serving static build
2. **Analytics Mock** (`test-fixtures/`): nginx serving mock analytics endpoints
3. **Compose Setup** (`docker/docker-compose.production-test.yml`): Full production simulation
4. **Playwright Integration**: E2E tests against containerized build with health checks
5. **Volume Management**: Proper .dockerignore configuration to include production assets

**Validation Results:**
- ✅ Build context correctly includes packages/site/public
- ✅ nginx serves Gatsby static files correctly  
- ✅ Health checks pass (HTTP 200 responses)
- ✅ Analytics mock service operational
- ✅ Container networking functional

This setup catches deployment issues before production release and validates the complete deployment pipeline.

## Performance Considerations (✅ Optimized)

**Build Performance:**
- Development server: 4.4s bootstrap time
- Production builds: 17-19s (optimized bundle splitting)
- Bundle size limits: JS 200kB, CSS 50kB (with monitoring)
- TypeScript incremental compilation enabled

**Runtime Performance:**
- Dynamic module loading for background system
- WebGL performance optimization with fallbacks
- Adaptive rendering based on device capabilities  
- Resource cleanup and memory management
- Code splitting and lazy loading implemented

**Developer Experience Optimizations:**
- Hot reload functional in development
- Fast unit test execution with Vitest
- Parallel test execution capabilities
- Docker-based production validation

## Privacy & Analytics

- Umami analytics with consent management
- New Relic performance monitoring
- CSP header management via `scripts/generate-headers.js`
- Privacy-first approach with user consent