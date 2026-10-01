# Feature: folder labels from README + ship the CLI in dist

Locator: `odd/tasks/folder-labels-cli-build.md` · Engram mirror: `odd/folder-labels-cli-build/tasks`
Branch: `fix/folder-labels-cli-build` (from `development`)

## Objective
1. Let a folder take its label from its README/index frontmatter (`breadcrumbTitle` → `label` → `formatTitle(dirname)`), consistently for nav label, own breadcrumb, and descendants' breadcrumbs.
2. Make the published package actually contain a working CLI (`dist/cli.js`), runnable through `node_modules/.bin` symlinks / `npx`.

## Why
- `walkDocs` hard-codes `formatTitle(entry.name)`, so `api/` is always "Api".
- npm 1.0.0 `bin` points at `dist/cli.js`, which the build never emits; `isMainModule` also fails behind symlinks.

## Constraints
- Bun + `bun:test`; Biome style; Conventional Commits, no AI attribution.
- TDD: strict (source: session config "Strict TDD Mode: enabled"); runner: `bun test` in `packages/manifest-generator`.
- Delivery strategy: ask-on-risk; forecast ~250 authored lines (under budget).

## Tasks
- [x] T1 — Folder label from README (`src/index.ts`, `spec/index.test.ts`). Route: delegated (writer trigger: 2+ non-trivial files across T1/T2).
- [x] T2 — Build `dist/cli.js` + symlink-safe `isMainModule` + `types` export order (`vite.cli.config.ts`, `package.json`, `src/cli.ts`, `spec/cli.test.ts`). Route: delegated.
- [x] T3 — `test-types:packages` script, AGENTS.md + CHANGELOG `[Unreleased]`. Route: delegated.
- [x] T4 — docs/1.1.0 documentation for folder labels and CLI (Route: delegated; preparation trigger).

## Acceptance criteria
- README `label: API` in `api/` → folder label and all breadcrumb segments "API"; `breadcrumbTitle` wins over `label`; `.mdx` README/index honored; README child keeps its own label.
- `bun run pkg:build` emits `dist/cli.js` with shebang; `node dist/cli.js --help` works; packed tarball `npx manifest-generator --help` works.

## Checks
- `bun test` (package), `bun run lint`, `bun run test-types:packages`, `pkg:build`, pack+install smoke test.

## Progress / evidence
- T1: RED = 4 new tests failed (folder label from README label, breadcrumbTitle over label, index.mdx, README.mdx; the fallback test passed as expected). GREEN = `bun test` 180 pass / 0 fail. No pre-existing test needed changing (only a helper-name comment). Commit: `feat: derive folder label from README or index frontmatter` (see git log)
- T2: RED = `bun test spec/cli.test.ts` failed: "Export named 'isMainModule' not found" (0 pass, 1 fail, 1 error). GREEN = `bun test` 184 pass / 0 fail. Build emits dist/cli.js with a single shebang (no banner needed); `node dist/cli.js --help/--version` OK; `npm pack` + install in temp project + `npx manifest-generator --help` and `--version` OK; fixture api/README.md `label: API` -> folder label and breadcrumbs "API" in generated manifest/search-index. Commit: `fix: ship CLI in dist and make entry detection symlink-safe` (see git log)
- T3: no RED applicable (config/docs only; scripts verified by running). `bun run test-types:packages` exit 0; pkg:test 184 pass; `bun run lint` clean; pkg:build OK, dist/cli.js starts with shebang. Commit: `chore: add test-types script and document folder labels and CLI build` (see git log)

- T4: copied docs/1.0.0/content to docs/1.1.0/content and updated README, features, frontmatter, project-structure, configuration, api/reference, installation, cli-usage, troubleshooting, faq; set `breadcrumbTitle` on api, features and getting-started READMEs (Features/Getting Started/API) so nav labels stay short. `bun run generate:manifest` produced docs/1.1.0/manifest.json + search-index.json; folder `api` label = "API", `api/reference` breadcrumb = API > Reference. `bun run lint` clean. No demo/script version list exists (only a stale `generate:manifest-specific-version` pinned to beta.3, left unchanged).

- Review (T1–T3 range `development..145a013`): assessed high (process_boundary in package.json); consent granted; native 4-lens review approved and acknowledged. Non-blocking follow-ups: R3 `isMainModule(undefined)` test hits the default param instead of the `!invokedPath` guard; no test for README/index precedence when several coexist; no automated post-build check for `dist/cli.js`; readability suggestions on `vite.cli.config.ts`.

## Next step
- Optional follow-ups above; push/PR are the user's decision.
