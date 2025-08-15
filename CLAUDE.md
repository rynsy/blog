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

### Testing & Quality (🚨 NEEDS ATTENTION)
- `pnpm test` or `pnpm test:ci` - Run full test suite (lint + typecheck + unit + e2e) **[CURRENTLY FAILING]**
- `pnpm test:unit` - Run unit tests with Vitest **[168 FAILING - React hooks issues]**
- `pnpm test:e2e` - Run Playwright end-to-end tests **[TIMEOUT ISSUES]**
- `pnpm test:watch` - Watch mode for unit tests
- `pnpm test:local-ci` - Run comprehensive local CI including Docker tests
- `pnpm lint` - ESLint with auto-fix **[150+ ERRORS - unused vars, console statements]**
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

### Interactive Background System (✅ IMPLEMENTED)
The site features a sophisticated V3 modular background system with comprehensive capabilities:

1. **Background Modules V3** (`src/bgModules/`):
   - **Advanced modules**: DVD bouncer, fluid simulation (WebGL), falling sand (cellular automata)
   - **Gradient module**: Dynamic gradient animations with theme awareness
   - **Knowledge module**: Interactive D3 node graphs with physics simulation
   - **Registry system**: ModuleRegistryV3 with capability detection, memory budgets, conflicts resolution
   - **Easter egg system**: Discovery patterns, rewards, and progressive unlocks

2. **Canvas Management** (`src/components/CanvasHost*.tsx`):
   - **WebGL/Canvas2D**: Intelligent fallback system with device capability detection  
   - **Performance monitoring**: Real-time FPS, memory usage, render time tracking
   - **Adaptive rendering**: Quality adjustment based on device performance
   - **Resource management**: Proper cleanup and memory leak prevention

3. **Context System** (`src/contexts/`):
   - **BackgroundContextV3**: Enhanced state management with configuration persistence
   - **Analytics integration**: Module usage tracking and performance metrics
   - **Theme management**: Dark/light mode support across all modules
   - **Device adaptation**: Automatic quality adjustment for mobile/desktop

### Testing Strategy (🚨 CRITICAL ISSUES)
- **Unit Tests**: Jest/Vitest for component logic and utilities **[FAILING - React hooks environment issues]**
- **E2E Tests**: Playwright for user interactions and visual validation **[TIMEOUT ISSUES]**
- **Docker Integration**: Production-like environment testing with nginx **[WORKING]**
- **Accessibility**: Automated a11y testing with axe-core **[NEEDS FIXES]**
- **Performance**: Lighthouse CI and custom performance monitoring **[PARTIALLY WORKING]**

**Current Test Status:**
- ❌ Unit Tests: 168 failing (React context issues)
- ❌ E2E Tests: Timeout and dependency issues  
- ❌ Linting: 150+ errors (unused vars, console statements)
- ✅ Docker Production: Working correctly
- ⚠️ Bundle Size: ~2MB (within budget but can optimize)

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

---

## ⚠️ CURRENT PROJECT STATUS (August 2025)

### 🎯 Implementation Status
- ✅ **Architecture**: V3 background system fully implemented
- ✅ **Core Modules**: All 5 background modules working (gradient, knowledge, fluid, sand, DVD)
- ✅ **Production Build**: Docker containerization and nginx serving functional
- ✅ **Performance**: Bundle size within budget, monitoring systems active
- ❌ **Testing**: Critical failures in unit tests and E2E suite
- ❌ **Code Quality**: 150+ linting violations need resolution

### 🚨 Immediate Priorities
1. **Fix Testing Environment**: Resolve React hooks context issues in unit tests
2. **Code Quality**: Address ESLint violations (unused variables, console statements)
3. **E2E Stability**: Fix Playwright timeout and dependency issues
4. **Accessibility**: Complete ARIA implementation and focus management

### 📋 Next Phase Tasks
- [ ] Stabilize testing infrastructure
- [ ] Optimize bundle size (reduce New Relic chunks)
- [ ] Complete accessibility audit fixes
- [ ] Production deployment validation
- [ ] Performance optimization for mobile devices

### 💡 Technical Debt
- React testing environment needs proper mock setup
- WebGL memory cleanup implementation needed
- Bundle splitting for analytics dependencies
- Error boundary implementation for production resilience