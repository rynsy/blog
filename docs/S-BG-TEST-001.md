# Design Document – **Interactive Background System Test Project**

| **Document version** | 1.0                      |
| -------------------- | ------------------------ |
| **Author**           | ChatGPT (draft for Ryan) |
| **Last updated**     | 2025-08-06               |
| **Status**           | Draft for team review    |

---

## 1. Purpose

Create a lightweight, automated test project that **verifies build, runtime, and accessibility integrity** of the interactive-background subsystem in the personal Gatsby/React site.
It must provide **fast feedback in CI**, enable future automated agents to validate PRs, and serve as a portfolio-grade example of disciplined front-end testing.

---

## 2. Goals & Non-Goals

| Goals                                                                                                 | Non-Goals                                                                     |
| ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| 1. Catch regressions when adding / refactoring background modules.                                    | Perfect physics / pixel-exact verification of simulations.                    |
| 2. Enforce core UX contracts: canvas mounts, no uncaught errors, theme sync, reduced-motion fallback. | Testing Gatsby's internal behavior; assume framework correctness.             |
| 3. Provide clear red/green CI signal in < 90 s.                                                       | 100 % line coverage. Aim for **meaningful** coverage (\~80 % for pure logic). |
| 4. Remain maintainable; new modules need ≤ 10 lines to join test matrix.                              | Heavy visual-regression flow unless explicitly enabled later.                 |

---

## 3. Scope

```
/tests
  unit/              # Vitest (logic + React components)
  e2e/               # Playwright project
  fixtures/          # Static JSON, deterministic seeds
  axe/               # Custom a11y checks
/.github/workflows   # CI pipeline
```

*Tested surface:*

* **BackgroundProvider** (React context & registry)
* **CanvasHost** (single canvas lifecycle)
* **ControlTray** interactions
* **Module contract compliance** (`setup ➜ {pause,resume,destroy}`)
* **Theme & reduced-motion propagation**

---

## 4. Architecture Overview

```
┌──────────┐             mount              ┌─────────────┐
│ Vitest   ├────────────→ React DOM + JSDOM │ Components  │
└──────────┘                                 └─────────────┘

┌──────────────┐ navigate `?egg=id`         ┌─────────────┐
│ Playwright   ├────────────────────────────→  Built site │
└──────────────┘  (Chromium/WebKit/Firefox)  └─────────────┘
        │          │  capture console errors
        └── axe-playwright → WCAG checks
```

---

## 5. Technology Stack

| Layer                 | Tech                                                                  | Rationale                                       |
| --------------------- | --------------------------------------------------------------------- | ----------------------------------------------- |
| **Unit / Component**  | **Vitest** (Jest-compatible, Vite-native) + **React Testing Library** | Fast, zero Babel config, good TS support.       |
| **E2E / Smoke**       | **Playwright test**                                                   | Multi-browser, parallel, easy CI.               |
| **Accessibility**     | **axe-playwright**                                                    | Automated WCAG scanning of rendered pages.      |
| **Type safety**       | **TypeScript strict** in CI, `tsc --noEmit`.                          | Detect contract breaks early.                   |
| **Coverage**          | `c8` via Vitest (`--coverage`)                                        | Istanbul reports; fail if < 80 %.               |
| **Bundle size guard** | `vite-plugin-bundle-size` or `bundlesize`                             | Block PRs that bloat lazy chunks beyond 200 kB. |

---

## 6. Test Strategy & Cases

| ID   | Type               | Description                                                                                           | Priority |
| ---- | ------------------ | ----------------------------------------------------------------------------------------------------- | -------- |
| U-01 | Unit               | `loadModule(id)` resolves valid modules, rejects unknown.                                             | P0       |
| U-02 | Unit               | `BackgroundProvider` persists selected module in `localStorage` and re-hydrates on mount.             | P0       |
| C-01 | Component          | When ControlTray selects a new module, context updates and previous module's `destroy()` is called.   | P0       |
| S-01 | Smoke (Playwright) | For each `MODULE_ID` → navigate `/?egg=id`, wait 300 ms, assert canvas visible & *no console errors*. | P0       |
| S-02 | Smoke              | Toggle dark/light mode; modules receive `onThemeChange`.                                              | P1       |
| A-01 | Accessibility      | Home page passes axe; no color-contrast or ARIA violations.                                           | P1       |
| P-01 | Performance        | Home page Lighthouse perf ≥ 90; simulation paused when `document.hidden`.                             | P2       |
| V-01 | Visual (optional)  | Deterministic Life simulation screenshot diff stable across runs.                                     | P3       |

---

## 7. CI / CD Pipeline

**GitHub Actions**: `.github/workflows/test.yml`

```yaml
name: CI

on:
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run lint                  # ESLint + Prettier
      - run: npm run typecheck             # tsc --noEmit
      - run: npm run test:unit             # Vitest
      - run: npx playwright install --with-deps
      - run: npm run test:e2e              # Playwright
```

*Branch protection*: require **all** checks green.
Optional: cache Playwright browsers to cut runtime.

---

## 8. Directory & Naming Conventions

```
src/
  bgModules/<id>/index.ts          # export setup()
  bgModules/<id>/__tests__/…       # module-specific unit tests
tests/
  unit/*.test.ts                   # cross-module logic
  e2e/module-smoke.spec.ts         # auto-generated matrix
vite.config.ts                     # test-aware alias
```

---

## 9. Quality Gates & Metrics

| Metric                    | Threshold            | Enforcement           |
| ------------------------- | -------------------- | --------------------- |
| Unit coverage (lines)     | ≥ 80 % for `src/bg*` | Vitest coverage check |
| Playwright smoke failures | 0                    | CI job exit ≠ 0       |
| Axe violations            | 0 critical / serious | CI fail               |
| Bundle size (lazy chunk)  | < 200 kB gzip        | `bundlesize` check    |
| CI duration               | < 90 s median        | Watch & optimize      |

---

## 10. Risks & Mitigations

| Risk                                                 | Impact          | Mitigation                                                               |
| ---------------------------------------------------- | --------------- | ------------------------------------------------------------------------ |
| Non-deterministic graphics cause flaky visual tests. | CI noise        | Limit visual tests to deterministic seeds; keep smoke tests non-visual.  |
| Playwright build adds minutes to CI.                 | Slower feedback | Cache browsers; run only on PR (not push).                               |
| New animation libs break JSDOM unit tests.           | False failures  | Mock heavy WebGL calls in Vitest; rely on smoke test for real rendering. |

---

## 11. Timeline (initial rollout)

| Week | Deliverable                                                                  |
| ---- | ---------------------------------------------------------------------------- |
| 0.5  | Configure Vitest + TS strict; write U-01, U-02.                              |
| 1    | Add RTL component tests & coverage gate.                                     |
| 1.5  | Integrate Playwright; implement S-01 matrix with existing modules.           |
| 2    | Axe checks, dark/light theme smoke.                                          |
| 2.5  | GitHub Actions pipeline and branch protection; badges on README.             |
| 3+   | Optional performance & visual regression, plus docs for contributors/agents. |

---

## 12. Maintenance Guidelines

1. **When adding a module**

   * Add lazy import in registry & metadata list.
   * Drop a minimal unit test if module exports helpers.
   * Ensure it passes existing smoke suite.

2. **When changing APIs**

   * Update `types/bg.d.ts` first.
   * CI will highlight all modules & tests that break.

3. **Automated Dependabot + Renovate** for security; CI will guard.

---

## 13. Appendix – NPM Scripts

```jsonc
{
  "lint":       "eslint 'src/**/*.{ts,tsx}' --max-warnings=0",
  "typecheck":  "tsc --noEmit",
  "test:unit":  "vitest run --coverage",
  "test:e2e":   "playwright test --reporter=list",
  "test:ci":    "npm run lint && npm run typecheck && npm run test:unit && npm run test:e2e"
}
```

---

## 14. Open Questions

1. **Visual regression worth it now?**
   – Decide after first public launch; can bolt on Playwright screenshot diff later.

2. **Monorepo vs separate `/tests` package?**
   – Current doc assumes same repo for simplicity; re-evaluate if you split UI into its own package.

---

**End of Document**