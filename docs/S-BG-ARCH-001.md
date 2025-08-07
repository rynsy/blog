# Design Document — **Repository Organization & Interactive-Module Architecture**

| **Document ID** | S-BG-ARCH-001         |
| --------------- | --------------------- |
| **Version**     | 1.0                   |
| **Author**      | Ryan / ChatGPT assist |
| **Created**     | 2025-08-06            |
| **Status**      | Draft ➜ review        |

---

## 1 · Purpose

Standardize the **directory / package structure** and the **runtime layering model** that powers the interactive background system (knowledge-graph, fluid sim, Easter eggs, etc.) on the personal Gatsby/Tailwind blog.
Goals:

1. Keep the blog lean, performant, and accessible.
2. Make it trivial to add, swap, or remove modules.
3. Enable an external test harness (separate package) and future "agent" contributors.

---

## 2 · Glossary

| Term          | Definition                                                                               |
| ------------- | ---------------------------------------------------------------------------------------- |
| **Module**    | A self-contained interactive visual (graph, fluid, sand, DVD logo).                      |
| **Layer**     | Z-index tier where a module renders: `background` (behind content) or `overlay` (above). |
| **Workspace** | A directory inside the monorepo managed by pnpm/yarn workspaces.                         |

---

## 3 · Goals & Non-Goals

| Goals                                                           | Non-Goals                                                         |
| --------------------------------------------------------------- | ----------------------------------------------------------------- |
| Clear two-package monorepo layout (`site`, `tests`).            | Splitting into multiple repos.                                    |
| Pluggable module registry with type-safe contract.              | Full CMS for modules.                                             |
| Single shared canvas for most modules; optional overlay canvas. | Pixel-perfect visual regression out of scope here (see test doc). |
| Runtime safeguards for contrast, reduced-motion.                | Designing every individual module (handled per-module docs).      |

---

## 4 · Repository Layout (workspaces)

```
/
├─ package.json                # root dev-deps (lint, prettier, turbo)
├─ pnpm-workspace.yaml
│
├─ packages/
│   ├─ site/                   # Gatsby blog + interactive engine
│   │   ├─ src/
│   │   │   ├─ bgModules/      # one folder per module
│   │   │   ├─ components/
│   │   │   └─ …
│   │   └─ gatsby-config.js
│   │
│   └─ tests/                  # Vitest + Playwright suite
│       └─ …
└─ docs/                       # design docs (including this file)
```

*Workspace tooling*: **pnpm** + **Turborepo** remote cache for fast CI.

---

## 5 · Runtime Layering Model

| Z-index | Layer          | Who draws here                         | Pointer Policy      |
| ------- | -------------- | -------------------------------------- | ------------------- |
| 900     | **Overlay**    | Opt-in modules (e.g., DVD logos)       | `auto` (toggleable) |
| 800     | HUD            | ControlTray (`Sheet`)                  | `auto`              |
| 700     | **Content**    | Article container (`glass` or `solid`) | `auto`              |
| 100     | **Background** | Default modules (graph, fluid, sand)   | `none` by default   |
| 0       | Base           | Body bg color                          | n/a                 |

**Glass container**

```tsx
<div className="
  relative mx-auto max-w-prose p-6
  bg-white/70 dark:bg-slate-900/60
  backdrop-blur-md
">
  {children}
</div>
```

Toggle to solid via Markdown front-matter `fullscreen: true`.

---

## 6 · Module Contract & Manifest

```ts
export interface BgModule {
  /** Called once when module becomes active */
  setup(opts: SetupOpts): ModuleAPI;
}

export interface ModuleAPI {
  pause(): void;
  resume(): void;
  destroy(): void;
}

export interface ModuleMeta {
  id: string;
  name: string;
  layer: 'background' | 'overlay';
  interactive: boolean;     // needs pointer events?
  themeAware: boolean;      // responds to dark/light
}
```

*Registry*

```ts
export const modules: Record<string, () => Promise<{ meta: ModuleMeta; mod: BgModule }>> = {
  graph: () => import('./bgModules/graph'),
  fluid: () => import('./bgModules/fluid'),
  // …
};
```

*Provider responsibilities*

1. Lazy-import selected module.
2. Swap canvas or overlay root based on `layer`.
3. Handle `pointer-events` from `interactive`.
4. Relay theme changes via `window.matchMedia('(prefers-color-scheme)')`.
5. Persist `activeModuleId` and user toggles in `localStorage`.

---

## 7 · Accessibility & Performance Guards

| Guard                  | Mechanism                                                                                                   |
| ---------------------- | ----------------------------------------------------------------------------------------------------------- |
| **Reduced-motion**     | `prefers-reduced-motion: reduce` ➜ background pauses, overlay forbidden.                                    |
| **Contrast auto-tune** | Sample avg luminance under content; if ratio < 4.5:1 raise container opacity (utility fn `ensureContrast`). |
| **Tab blur / hidden**  | `visibilitychange` listener ➜ `pause()`.                                                                    |
| **FPS throttle**       | `requestAnimationFrame` wrapper that lowers to 15 FPS when content in full view.                            |
| **Bundle budget**      | CI check `bundlesize < 200 kB gzip` for each lazy chunk.                                                    |

---

## 8 · Workflow for Adding a Module

1. `pnpm create bgmodule <id>` (scaffold script).
2. Implement `setup()` + export `meta`.
3. Add preview GIF to README.
4. Run `pnpm -F tests test` → smoke suite mounts new module automatically via manifest.
5. Open PR; CI must pass bundle-size, unit, E2E checks.

---

## 9 · Open Questions

1. **Storybook** worth adding to isolate modules? (Could live in `packages/site` later.)
2. **Service-worker caching** for heavy shader assets?
3. Formal **design-token hooks** into shaders (Tailwind config export).

---

## 10 · Timeline

| Week | Task                                                             |
| ---- | ---------------------------------------------------------------- |
| 1    | Convert repo to workspaces, move Gatsby code → `site/`.          |
| 2    | Implement `BackgroundProvider`, single canvas, meta registry.    |
| 2    | Migrate graph module; prove layer & pointer-policy logic.        |
| 3    | Glass container + contrast util; add overlay DVD module.         |
| 3    | Hook bundle-size and reduced-motion checks.                      |
| 4    | Freeze v1; hand off to testing strategy (doc **S-BG-TEST-001**). |

---

## 11 · Appendix – Key Decisions

| Decision                      | Rationale                                                                    |
| ----------------------------- | ---------------------------------------------------------------------------- |
| **Single repo, two packages** | Simplest collaboration flow; no version-sync headaches.                      |
| **Meta manifest**             | Enables automatic test matrix & ControlTray generation.                      |
| **Glass default**             | Balances background visibility with readability; accessible fallback exists. |
| **Pointer-events toggle**     | Sandbox modules need drawing; others should never intercept clicks.          |
| **Overlay permission toggle** | Avoids user frustration; default safe.                                       |

---

**End of Document**