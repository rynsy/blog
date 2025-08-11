# Multi-Agent Coordination Plan for Personal Site Repository

## Repository Analysis Summary

Based on comprehensive analysis of the personal site repository, I've identified multiple specialized issues requiring coordinated resolution:

### Current State Assessment
- **Gatsby-based personal site** with interactive background modules (gradient, knowledge graph, falling sand, etc.)
- **Monorepo structure** using pnpm with packages/site and packages/tests
- **Comprehensive E2E testing** with Playwright across multiple browsers and devices
- **Docker configuration** for production testing and CI/CD workflows
- **Multiple deleted files** in git status requiring cleanup
- **Complex testing infrastructure** with visual regression, accessibility, and performance monitoring

### Critical Issues Identified

1. **File Organization Issues**
   - 20+ deleted documentation/config files in git status
   - Untracked directories (archive/, docker/) need organization
   - Docker files relocated but references may be stale

2. **E2E Test Infrastructure Problems**
   - Complex test suite with potential configuration misalignment
   - Docker compose references in test-ui.sh point to missing docker-compose files
   - Test utilities reference SELECTORS and VIEWPORTS that may be outdated
   - Visual regression tests may have stale snapshot expectations

3. **Docker Configuration Issues**
   - Docker files moved to new locations (packages/site/, packages/tests/)
   - Docker compose configuration references may be broken
   - Production build pipeline needs validation
   - UI test docker integration needs repair

4. **Developer Experience Issues**
   - Complex build/test workflows may have broken integrations
   - Script references to moved/deleted files
   - Potential circular dependencies in test configurations

## Specialized Agent Coordination Plan

### Phase 1: Infrastructure Assessment & Repair (Parallel)

#### Agent 1: **devops-troubleshooter**
**Primary Focus**: Docker & CI/CD Pipeline Resolution
**Estimated Time**: 2-3 hours
**Priority**: CRITICAL

**Immediate Tasks**:
1. **Docker Configuration Audit**
   - Analyze moved Dockerfiles (packages/site/Dockerfile.production, packages/tests/Dockerfile.test)
   - Validate docker-compose configurations (docker/docker-compose.ui-test.yml)
   - Test build processes: `pnpm test:docker:production`, `pnpm test:docker:e2e`

2. **Script Integration Repair**
   - Fix scripts/test-ui.sh references to docker-compose files
   - Validate production build pipeline: `pnpm build` → Docker → nginx deployment
   - Test complete Docker workflow: build → test → deploy simulation

3. **CI/CD Workflow Validation**
   - Verify Cloudflare Pages deployment still works
   - Test GitHub Pages deployment pipeline
   - Validate all pnpm scripts in package.json work correctly

**Deliverables**:
- Working Docker build/test/deploy pipeline
- Fixed script references and path issues
- CI/CD workflow validation report
- Updated Docker configuration documentation

**Coordination Dependencies**:
- **Wait for**: refactoring-specialist file cleanup (Phase 1B)
- **Collaborate with**: test-automator on Docker-based E2E test fixes

---

#### Agent 2: **refactoring-specialist**
**Primary Focus**: File Organization & Codebase Structure
**Estimated Time**: 1-2 hours
**Priority**: HIGH (Blocking others)

**Immediate Tasks**:
1. **Git Status Cleanup Analysis**
   - Analyze 20+ deleted files: ARCHITECTURE_*.md, Accessibility_Guidelines.md, etc.
   - Determine which deleted files should be restored vs. permanently removed
   - Organize untracked directories (archive/, docker/)

2. **File Structure Reorganization**
   - Move/rename files to logical locations
   - Update import/reference paths throughout codebase
   - Clean up obsolete configuration files

3. **Dependency Path Validation**
   - Ensure all imports resolve correctly after file moves
   - Update relative path references in config files
   - Validate all package.json script references

**Deliverables**:
- Clean git working directory
- Organized file structure with logical hierarchy
- Updated path references throughout codebase
- File organization documentation

**Coordination Dependencies**:
- **Blocks**: devops-troubleshooter (Docker path fixes)
- **Blocks**: test-automator (test file references)
- **Collaborate with**: dx-optimizer on overall structure improvements

---

### Phase 1B: Test Infrastructure Repair (Sequential after 1A)

#### Agent 3: **test-automator**
**Primary Focus**: E2E Test Suite Repair & Validation
**Estimated Time**: 3-4 hours
**Priority**: CRITICAL

**Immediate Tasks**:
1. **Playwright Configuration Analysis**
   - Audit playwright.config.ts project configurations
   - Validate test file organization and naming conventions
   - Check baseURL and webServer configurations

2. **Test Utilities & Infrastructure Repair**
   - Fix test-utils.ts SELECTORS and VIEWPORTS references
   - Repair TestUtils class method implementations
   - Validate accessibility test axe-core integration

3. **Cross-Browser Test Validation**
   - Test visual regression suite across all configured browsers
   - Validate accessibility tests on desktop/mobile
   - Ensure performance monitoring tests work correctly

4. **Docker Integration Testing**
   - Test Docker-based E2E execution: `pnpm test:docker:e2e`
   - Validate production environment testing
   - Fix any container networking issues

**Deliverables**:
- Fully functional Playwright test suite
- Working Docker-based test execution
- Updated test documentation and examples
- CI-ready test configuration

**Coordination Dependencies**:
- **Wait for**: refactoring-specialist file cleanup
- **Wait for**: devops-troubleshooter Docker fixes
- **Collaborate with**: dx-optimizer on test workflow improvements

---

### Phase 2: Developer Experience Optimization (Parallel)

#### Agent 4: **dx-optimizer**
**Primary Focus**: Developer Workflow & Build Process Enhancement
**Estimated Time**: 2-3 hours
**Priority**: MEDIUM

**Immediate Tasks**:
1. **Build Process Optimization**
   - Analyze monorepo pnpm workspace configuration
   - Optimize build scripts and dependency management
   - Validate turbo integration for build acceleration

2. **Developer Workflow Enhancement**
   - Improve local development setup (pnpm develop workflow)
   - Enhance debugging capabilities for background modules
   - Optimize hot reload and development server performance

3. **Documentation & Onboarding**
   - Update CLAUDE.md with corrected workflows
   - Create developer setup guide
   - Document testing strategies and Docker workflows

4. **Performance & Bundle Analysis**
   - Validate bundle size monitoring with bundlesize
   - Optimize webpack configuration for development
   - Enhance build analysis and reporting

**Deliverables**:
- Optimized development workflow
- Enhanced build processes and performance
- Updated documentation and developer guides
- Performance monitoring and optimization recommendations

**Coordination Dependencies**:
- **Wait for**: All Phase 1 agents to complete
- **Integrate**: Solutions from all other agents
- **Provide**: Final validation and workflow documentation

---

## Coordination Protocol

### Communication Pattern
```
Phase 1A (Parallel):
├── devops-troubleshooter: Docker & CI/CD
└── refactoring-specialist: File cleanup (BLOCKS others)

Phase 1B (Sequential):
└── test-automator: E2E tests (AFTER file cleanup + Docker fixes)

Phase 2 (Integration):
└── dx-optimizer: Workflow enhancement (AFTER all Phase 1)
```

### Progress Checkpoints
1. **Hour 1**: refactoring-specialist completes file cleanup
2. **Hour 2**: devops-troubleshooter completes Docker fixes  
3. **Hour 3**: test-automator begins E2E repair
4. **Hour 4-5**: test-automator completes test suite
5. **Hour 6-8**: dx-optimizer performs final integration & optimization

### Success Metrics
- [ ] All Docker commands work: `pnpm test:docker:*`
- [ ] All E2E tests pass: `pnpm test:e2e`
- [ ] Clean git status with organized files
- [ ] Complete CI/CD pipeline validation
- [ ] Improved developer experience with working workflows
- [ ] Updated documentation reflecting current state

### Risk Mitigation
- **Circular Dependencies**: refactoring-specialist goes first to establish clean foundation
- **Integration Issues**: dx-optimizer validates all integration points
- **Docker Complexity**: devops-troubleshooter focuses specifically on container issues
- **Test Failures**: test-automator has dedicated time after infrastructure is stable

## Expected Outcomes

After coordination completion:
1. **Clean Repository**: Organized files, clean git status, logical structure
2. **Working Docker Pipeline**: Full build/test/deploy cycle functional
3. **Reliable E2E Tests**: Complete test suite passing across all browsers/devices
4. **Enhanced DX**: Optimized workflows, better documentation, improved performance
5. **CI/CD Ready**: Validated deployment pipelines to Cloudflare and GitHub Pages

This coordinated approach ensures systematic resolution of all identified issues while maintaining the sophisticated functionality of your interactive background system and comprehensive testing infrastructure.