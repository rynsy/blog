# Background Engine Design

## Overview

A modular background animation system that provides interactive experiences behind site content while maintaining performance and accessibility. The system uses a "serious-but-goofy hacker" aesthetic with practical, incremental growth capabilities.

## Core Architecture

### 1. BackgroundProvider (React Context)
- **Responsibility**: Loads, pauses, and persists whichever interactive module is active
- **Implementation**: Top-level provider wrapped around `<Layout>`
- **Persistence**: Stores current module + settings in localStorage
- **State Management**: Manages module lifecycle (load, pause, resume, destroy)

### 2. CanvasHost Component
- **Responsibility**: Single full-viewport canvas positioned behind all content
- **Implementation**: Absolutely-positioned canvas with `z-index < 0`
- **Interaction**: `pointer-events: none` by default so normal links work
- **Rendering**: Supports both `<canvas>` and `<svg>` depending on module needs

### 3. Module Registry
- **Responsibility**: Map of module ID → lazy `import()` function
- **Interface**: Each module exports `setup({ canvas, width, height, theme })` 
- **Returns**: `{ pause, resume, destroy }` control methods
- **Loading**: Heavy code stays split and loads only when chosen

### 4. ControlTray Component
- **Responsibility**: Slide-out drawer for module picker and controls
- **Implementation**: Uses shadcn/ui `Sheet` component
- **Features**: Module picker, options, "Pause", "Reset" controls
- **Performance**: Only imports light metadata (name, icon), not heavy simulation code

## Planned Interactive Modules

### Phase 1: Knowledge Graph (Default)
- **Purpose**: Tasteful default that doubles as site navigation
- **Nodes**: Posts, pages, tags built from Gatsby data at build time
- **Physics**: `d3-force` or `react-force-graph` for WebGL rendering
- **Interaction**: Hover for tooltips, click to navigate
- **Performance**: Auto-freeze simulation after few seconds, resume on mouse-over

### Phase 2+: Additional Simulations
- **`fluid`**: Navier-Stokes ink swirling with site accent colors
- **`sand`**: Classic falling-sand cellular automata
- **`life`**: Conway's Life seeded with site logo outlines
- **`dvd`**: Bouncing DVD logos with theme-aware tinting
- **`geo95`**: Konami-code triggered retro DOS theme
- **`runner`**: Temple-Run character triggered on scroll

## Easter Egg Discovery Mechanics

### Hotkeys
- `shift+~`: Rotate to next module
- Konami code: Enable `geo95` retro theme
- Custom combinations for specific modules

### URL Parameters
- `?egg=dvd`: Direct module activation via URL
- `?theme=retro`: Theme overrides
- Shareable easter egg links

### Hidden UI Elements
- 4-pixel corner click areas for power users
- Secret panels and hidden controls
- Progressive disclosure based on interaction patterns

### Content Triggers
- Specific word clicks unlock modules
- Scroll position triggers
- Time-based reveals

## Styling & Accessibility

### Visual Integration
- **Low-contrast safeguard**: Raise body background opacity when module active
- **Theme synchronization**: Pass current theme to modules for consistent coloring
- **Responsive design**: Adapt to different screen sizes and orientations

### Accessibility Features
- **Prefers-reduced-motion**: Auto-pause heavy animations with user banner
- **Keyboard navigation**: Full keyboard access to all controls
- **Screen reader support**: Proper ARIA labels and descriptions
- **Focus management**: Maintain focus when toggling modules

## Performance Guardrails

### Runtime Optimization
- **Page Visibility API**: Pause simulation on tab blur or tray close
- **requestIdleCallback**: Defer non-essential loading until CPU idle
- **OffscreenCanvas**: Keep main thread smooth for heavy computations
- **Frame rate limiting**: Adaptive FPS based on device capabilities

### Bundle Management
- **Size budgets**: Keep total lazy chunk < 200 kB per module
- **Code splitting**: Each module in separate bundle
- **Tree shaking**: Remove unused simulation features
- **Webpack analysis**: Monitor bundle size in CI

## Implementation Roadmap

### Week 1: Foundation
- [ ] BackgroundProvider context setup
- [ ] CanvasHost component with empty render loop
- [ ] ControlTray with shadcn/ui Sheet
- [ ] localStorage persistence layer

### Week 2-3: First Module
- [ ] Knowledge Graph module implementation
- [ ] Build-time JSON generator for site structure
- [ ] Interactive navigation with hover/click
- [ ] Accessibility testing and fixes

### Week 4: Enhancement
- [ ] Fluid simulation module
- [ ] Hotkey cycling system
- [ ] Page Visibility API integration
- [ ] Performance monitoring setup

### Quarterly: New Features
- [ ] One new easter egg module per quarter
- [ ] Blog post announcements for marketing
- [ ] User feedback integration
- [ ] Performance optimizations

## Technical Integration

### Gatsby Integration
- **Build-time data**: Generate module metadata during build
- **Page context**: Pass site structure to knowledge graph
- **Static optimization**: Pre-render compatible modules
- **Plugin system**: Potential gatsby-plugin-background-engine

### Theme System
- **CSS variables**: Expose theme colors to canvas modules
- **Theme switching**: Reactive updates to active modules
- **Dark/light modes**: Automatic color scheme adaptation
- **Custom themes**: Support for seasonal or event themes

### State Management
- **Local state**: Module-specific settings and preferences
- **Global state**: Active module, theme, accessibility preferences
- **Persistence**: localStorage for user preferences
- **Sync**: Cross-tab synchronization for consistent experience

## Brand & Portfolio Benefits

### Technical Showcase
- **Interactive UX**: Demonstrates advanced frontend skills
- **Performance optimization**: Shows understanding of web performance
- **Modular architecture**: Exhibits clean code organization
- **Accessibility focus**: Highlights inclusive design practices

### Content Strategy
- **Navigation enhancement**: Graph makes site exploration intuitive
- **Engagement metrics**: Track interaction patterns for content insights
- **Social sharing**: Unique backgrounds create shareable moments
- **Recruiter appeal**: Living portfolio demonstrates capabilities

### Personality Expression
- **Professional playfulness**: Balances serious skills with creativity
- **Technical humor**: Easter eggs show personality without compromising UX
- **Community building**: Shareable discoveries encourage return visits
- **Memorable experience**: Unique approach stands out in competitive field

## Future Extensions

### Advanced Features
- **Multi-user sync**: Real-time collaboration on simulations
- **AI integration**: Procedural content generation
- **WebXR support**: VR/AR background experiences
- **Audio integration**: Synchronized sound design

### Analytics & Insights
- **Interaction tracking**: Anonymous usage patterns
- **Performance metrics**: Real-time performance monitoring
- **A/B testing**: Module effectiveness comparison
- **User feedback**: In-app feedback collection

### Community Features
- **Module sharing**: User-contributed background modules
- **Preset collections**: Curated theme packages
- **Seasonal events**: Time-based special modules
- **Achievement system**: Unlock progression for regular visitors