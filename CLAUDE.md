# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

This is a monorepo workspace using pnpm. All commands should be run from the project root:

### Core Development
- `pnpm develop` - Start Gatsby development server
- `pnpm build` - Build for Cloudflare Pages deployment
- `pnpm build:gh` - Build for GitHub Pages deployment with prefix paths
- `pnpm serve` - Serve production build locally
- `pnpm clean` - Clean build artifacts

### Testing & Quality
- `pnpm test` or `pnpm test:ci` - Run full test suite (lint + typecheck + unit + e2e)
- `pnpm test:unit` - Run unit tests with Jest/Vitest
- `pnpm test:e2e` - Run Playwright end-to-end tests
- `pnpm test:watch` - Watch mode for unit tests
- `pnpm test:local-ci` - Run comprehensive local CI including Docker tests
- `pnpm lint` - ESLint with auto-fix
- `pnpm typecheck` - TypeScript type checking

### Docker Testing (Production Validation)
- `pnpm test:docker:production` - Start production-like containers (site + analytics mock)
- `pnpm test:docker:e2e` - Run full E2E tests against production containers
- `pnpm test:docker:clean` - Clean up Docker containers and volumes

Alternative direct commands:
- `docker-compose -f docker-compose.production-test.yml up --build` - Manual production test setup

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

## Docker Production Testing

The project includes Docker configuration for testing production builds:

1. **Test Container** (`Dockerfile.test`): nginx serving static build
2. **Mock Services** (`test-fixtures/`): Analytics and API mocking
3. **Compose Setup** (`docker-compose.test.yml`): Full production simulation
4. **Playwright Integration**: E2E tests against containerized build

This allows catching deployment issues before production release.

## Performance Considerations

- Bundle size monitoring with bundlesize
- Dynamic module loading for background system
- WebGL performance optimization
- Adaptive rendering based on device capabilities
- Resource cleanup and memory management

## Privacy & Analytics

- Umami analytics with consent management
- New Relic performance monitoring
- CSP header management via `scripts/generate-headers.js`
- Privacy-first approach with user consent