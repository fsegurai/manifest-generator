# 📦 Changelog

All notable changes to this project will be documented in this file.
This project adheres to [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [Unreleased]

No changes yet.

---

## [1.0.0] - 2026-09-25

### 🚀 Added

- **Breadcrumb segments** — every item in `manifest.json` and `search-index.json` now includes a
  `breadcrumb` field: a `BreadcrumbSegment[]` (`{label, route}`) with one segment per navigation level,
  always ending in the item's own segment.
- **Config exclusions** — `exclude` globs in the config file now skip matching files during manifest
  generation.

### 🔧 Changes

- **`--init` CLI hardening** — new tests for the `--init` scaffold; `README.md`/`index.md` precedence
  clarified; unsupported extensions skipped; more robust error handling in manifest generation.
- **Monorepo restructure** — workspace renamed to `manifest-generator-monorepo`, lockfile upgraded to
  v2, package marked `sideEffects: false`, `js-yaml` bumped to `5.4.2`.
- **`vite-plugin-dts` build** — replaced the custom declaration plugins with `vite-plugin-dts`;
  simplified build options and cleaned up unused Vite config.
- **Husky Git hooks** — pre-commit and pre-push hooks enforce linting and formatting.
- **Docs for 1.0.0** — comprehensive advanced/basic usage and build-system integration examples;
  `.js` → `.ts` Vite config examples; breadcrumb and YAML example cleanup.
- **Demo & workflows** — new changelog demo (markdown rendering, light/dark themes); release/build/PR
  pipelines; Appwrite Terraform configuration; perf-monitor workflow path fix; removed stale demo
  files, configs, and skill-registry artifacts.

### 🔐 Security

- Updated `trivy` to version `0.71.1` to address vulnerabilities in previous versions.
- **Added dependencies**.
	- Dev Dependencies
		- `@biomejs/biome` - `2.5.14` - needed for linting and formatting - replaces ESLint toolchain.
		- `husky` - `9.1.7` - needed for Git hooks to enforce code quality and pre-commit checks.
		- `vite-plugin-dts` - `5.1.1` - needed for generating TypeScript declaration files for the package.
- **Update dependencies** — address potential vulnerabilities and/or improvements in development dependencies.
	- Dependencies
		- `@material/web` from `2.4.1` to `2.5.0`
		- `marked` from `18.0.5` to `18.0.14`
	- Dev Dependencies
		- `@types/node` from `25.9.2` to `26.6.2`
		- `bun-types` from `1.3.14` to `1.4.2`
		- `portless` from `0.14.0` to `0.15.6`
		- `terser` from `5.48.0` to `5.51.2`
		- `typescript` from `6.0.3` to `7.0.2`
		- `vite` from `8.0.16` to `8.3.1`
	- Removed: `@eslint/js`, `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser`, `eslint`, `globals`,
	  `typescript-eslint`

**Full Changelog**: https://github.com/fsegurai/manifest-generator/commits/1.0.0

---

## [1.0.0-beta.3] - 2026-06-05

### 🚀 Added

- **Config file support** — `manifest-generator.config.json/.js/.ts` with `--config` flag, auto-detection in project
  root. Includes `defineConfig()` type-safe helper and `mergeConfig()` for CLI-flag priority.
- **`--init` scaffold command** — one-command setup that creates a config file + sample docs structure (7 Markdown files
  demonstrating frontmatter features).
- **`ALLOWED_FRONTMATTER_KEYS`** — public API export: readonly `Set<string>` of all recognized frontmatter key names.
- **11 new frontmatter validation rules** — label absent, `publishedAt` in future / after `updatedAt`, `order`
  non-integer / negative, unknown-key detection, malformed URLs, conflicting flags (`draft`+`hidden`,
  `isTitle`+`isParent`, `externalUrl`+`redirect`), date format validation, `badge`/`badgeColor` checks,
  `deprecated` without alternative.
- **Search index enrichment** — new fields in `SearchEntry`: `headings[]` (deduplicated `h2`/`h3`), `excerpt` (first
  ~150 chars, markup-stripped), `breadcrumb` (auto-derived from route path). Removed `keywords` and `breadcrumbTitle`
  from search entries (redundant with `tags` and the derived `breadcrumb`).
- **Heading deduplication** — `diceSimilarity()` and `dedupeHeadings()` using Dice coefficient (bigram-based,
  threshold 0.7) to collapse near-identical headings.
- **Route prefix for separate output** — when `--output` differs from the source route, all routes in
  `manifest.json` and `search-index.json` are automatically prefixed with the relative path from output to source
  (e.g., `getting-started/installation` → `content/getting-started/installation`).
- `ConfigFile`, `ProjectConfig` TypeScript interfaces exported from the package entrypoint.

### 🔧 Changed

- Replaced custom YAML parser with `js-yaml` (JSON_SCHEMA) — handles block scalars, quoted strings, nested and
  JSON-style arrays, explicit `null`. Empty YAML values (`label:`) now correctly become `null`.
- `SearchEntry` type: removed `keywords` and `breadcrumbTitle`; added `headings[]`, `excerpt`, `breadcrumb`.
- Output location: `manifest.json` and `search-index.json` now written to the `--output` directory (or source root
  if omitted) instead of alongside source markdown. In this repo, files live at `docs/<version>/` — separate from
  the `content/` source subdirectory.
- `generate:manifest` and `generate:manifest-current` npm scripts updated: `--output` now points to version root
  instead of the content subdirectory. Removed stale `generate:manifest-beta2` alias.
- `generateDocsManifests()` now applies route prefix based on the project path vs docs path relationship.
- Config priority: CLI flags > config file > hardcoded defaults.
- Added dependency: `js-yaml@^4.2.0`, `@types/js-yaml@^4.0.9`.

### 🧪 Testing

- Expanded test suite from 32 to **122 tests**, 269 expect() calls across 3 test files.
- Added test coverage for: config loading/merging (13 tests), `diceSimilarity` (3), `dedupeHeadings` (2),
  `extractHeadings` deduplication, search-index fields integration.
- Updated tests for removed `keywords`/`breadcrumbTitle` from `SearchEntry`.

### 📃 Documentation

- Created full 29-file docs set under `docs/1.0.0-beta.3/content/` — landing page, getting-started (4), guides (5),
  api (4), features (2), help (3), examples (4), integration (5). Updated for config, `--init`, js-yaml, and all
  new validation rules.
- **features/search-index.md**: new Search Index Fields table; Dice coefficient deduplication explanation; fixed
  all code examples from `title`→`label` and `path`→`route`; updated JSON examples with `content/`-prefixed routes.
- **features/README.md**, **guides/frontmatter.md**, **api/typescript.md**: updated for search-index fields and
  schema changes.
- **AGENTS.md**: updated with output location, route prefix behavior, test counts, and build scripts.
- All `.github/` files rewritten to reference manifest-generator.

**Full Changelog**: https://github.com/fsegurai/manifest-generator/commits/1.0.0-beta.3

---

## [1.0.0-beta.2] - 2026-06-05

### 🚀 Added

- **Frontmatter expansion** — 10 new metadata fields: `order`, `redirect`, `externalUrl`, `breadcrumbTitle`, `layout`,
  `deprecated`, `deprecatedAlternative`, `publishedAt`, `updatedAt`, `keywords`. Full support in both `NavigationItem`
  and `SearchEntry` output types.
- **Item sorting** — navigation items are now sorted by `order` (ascending, default 999), then alphabetically by
  `label`.
  Exported as `sortItems()` for programmatic use.
- **Recursive discovery** — new `--recursive` flag / `recursive: true` option discovers projects nested beyond one
  level.
  Recursion stops at project roots (directories that match as documentation projects).
- **Frontmatter validation** — new `--validate` CLI mode and `validateDocs()` API that checks date validity, conflicting
  flags (`draft`+`hidden`, `isTitle`+`isParent`), missing `deprecatedAlternative`, and more.
- **File watching** — new `--watch` CLI mode and `watchDocs()` API for polling-based live regeneration on file changes.
- **MDX support** — `.mdx` files are now processed alongside `.md` files.
- **Improved frontmatter parser** — now handles multiline values (`|`, `>`), quoted strings (single and double),
  explicit `null`, and numeric values without regression.
- **New API exports** — `validateDocs()`, `watchDocs()`, `sortItems()` are now exported from the package entrypoint.

### 🔧 Changed

- Moved public type definitions into `packages/manifest-generator/src/types.ts` and re-exported them from the package
  entrypoint.
- Updated the CLI and core generator flow to use Bun-friendly tests and clearer runtime behavior.
- Improved project discovery so docs subfolders are preferred before falling back to direct Markdown roots.
- Updated the package README, release docs, and versioned documentation structure to match the current monorepo layout.
- `--route` now writes output files to the route directory itself (not `path.dirname(route)`), matching user
  expectations. Use `--output` to redirect.
- Output files (`manifest.json`) now go through `cleanItem()` — null, false, and empty-string fields are stripped,
  producing smaller, cleaner JSON.
- `generateDocsManifests()` now accepts `recursive` in its options object and passes it to `discoverProjects()`.
- Frontmatter types (`Frontmatter`, `NavigationItem`, `SearchEntry`, `DiscoveryOptions`, `ManifestGenerationOptions`)
  expanded with all new fields.
- The `DiscoverdProject.type` field now includes `'recursive'` for projects found via recursive discovery.
- The `globalThis.__manifestGeneratorWalkDocs` DI hack has been removed. Use `walkerFn` instead.

### 🐛 Fixed

- The CLI now creates missing output directories before writing `manifest.json` and `search-index.json`.
- The CLI now fails fast when the docs root does not exist instead of silently returning success.
- The UMD build is configured with explicit globals for Node.js externals.
- Bun test execution no longer auto-runs the CLI during test runs.

### 🧪 Testing

- Added Bun test coverage for frontmatter parsing, discovery, manifest generation, and CLI behavior.
- Verified the package build continues to succeed across ESM, CJS, and UMD outputs.
- Expanded test suite from 12 to 32 tests covering: frontmatter parsing (quoted, null, numeric, empty), `.mdx` support,
  item sorting, `cleanItem`, recursive discovery, `validateDocs` warnings/errors, CLI `--validate` and
  `--recursive` flags, route generation output paths, and cleaned output format verification.

### 🔐 Security

- Added `Trivy Security Scanner` to the project to automatically scan for vulnerabilities in dependencies and container
  images as part of the CI/CD pipeline.
- **Added dependencies**.
    - Dev Dependencies
        - `bun-types` - `1.3.14` - needed for testing purposes only.
        - `portless` - `0.14.0` - needed for local development. Replace port numbers with stable names.
        - `terser` - `5.48.0` - needed for production builds as part of Vite.
        - `vite` - `8.0.16` - needed for development and build processes. Replacement of Rollup.
        - `globals` - `17.5.0` - needed for eslint configuration file.
- **Update dependencies** — address potential vulnerabilities and/or improvements in development dependencies.
    - Dependencies
        - `@material/web` from `2.4.1` to `xx`
        - `marked` from `17.0.1` to `18.0.5`
        - `marked-highlight` from `2.2.3` to `2.2.4`
    - Dev Dependencies
        - `@eslint/js` from `9.39.1` to `10.0.1`
        - `@types/node` from `24.10.1` to `25.9.2`
        - `@typescript-eslint/eslint-plugin` from `8.47.0` to `8.60.1`
        - `@typescript-eslint/parser` from `8.47.0` to `8.60.1`
        - `eslint` from `9.39.1` to `10.4.1`
        - `rimraf` from `6.1.2` to `6.1.3`
        - `typescript` from `5.8.3` to `6.0.3`
        - `typescript-eslint` from `8.47.0` to `8.60.1`
- **Removed dependencies** — eliminated unused dependencies to reduce potential security risks and improve project
  maintainability.
    - Removed Dependencies
        - `@babel/core`
        - '@babel/preset-env'
        - `@rollup/plugin-commonjs`
        - `@rollup/plugin-node-resolve`
        - `@rollup/plugin-replace`
        - `@rollup/plugin-typescript`
        - `@types/jest`
        - `cpy-cli`
        - `github-slugger`
        - 'jest'
        - `jest-cli`
        - 'jest-environment-jsdom'
        - `rollup`
        - `rollup-plugin-dev`
        - 'ts-node'
        - 'tsd'
        - `semantic-release`

### 📃 Documentation

- Refreshed the root README to explain the monorepo layout and current workflows.
- Updated all files under `docs/1.0.0-beta.2/content/` with full feature documentation, examples, and code samples.
- Updated `AGENTS.md` with new CLI flags, frontmatter keys, and behavior notes.
- Updated root `CHANGELOG.md` and `README.md` with feature summaries.

**Full Changelog**: https://github.com/fsegurai/manifest-generator/commits/v1.0.0-beta.2

---

## [1.0.0-beta.1] - 2025-11-21

### 🚀 Added

- New dev dependency for eslint configuration file. `globals` - `16.5.0`

### 🔧 Changed

- Removed demo configuration and environment variables replacement from rollup configuration file.
- Improved keywords declared in the `package.json` files.

### 🔐 Security

- Improved test coverage to %90 +.
- **Update dependencies** — address potential vulnerabilities and/or improvements in development dependencies.
    - Dependencies
    - `@material/web` from `2.4.0` to `2.4.1`
    - `marked` from `16.4.0` to `17.0.1`
    - `marked-highlight` from `2.2.2` to `2.2.3`
    - Dev Dependencies
        - `@babel/core` from `7.28.4` to `7.28.5`
        - `@babel/preset-env` from `7.28.3` to `7.28.5`
        - `@eslint/js` from `9.36.0` to `9.39.1`
        - `@rollup/plugin-commonjs` from `28.0.6` to `29.0.0`
        - `@rollup/plugin-replace` from `6.0.2` to `6.0.3`
        - `@rollup/plugin-typescript` from `12.1.4` to `12.3.0`
        - `@types/node` from `24.6.2` to `24.10.1`
        - `@typescript-eslint/eslint-plugin` from `8.45.0` to `8.47.0`
        - `@typescript-eslint/parser` from `8.45.0` to `8.47.0`
        - `eslint` from `9.36.0` to `9.39.1`
        - `rimraf` from `6.0.1` to `6.1.2`
        - `rollup` from `4.52.3` to `4.53.3`
        - `typescript-eslint` from `8.45.0` to `8.47.0`

**Full Changelog**: https://github.com/fsegurai/manifest-generator/commits/v1.0.0-beta.1

---

## [0.0.0-alpha.3] - 2025-10-07

### 🚀 Added

- **Documentation manifest generation** — automatically creates navigation structures from Markdown files and
  directories.
- **Search index generation** — creates searchable indexes for documentation content.
- **Frontmatter parsing** — extracts metadata from YAML frontmatter in Markdown files (title, tags, draft, hidden).
- **Automatic project discovery** — intelligently finds documentation projects in various folder structures.
- **CLI interface** — command-line tool with comprehensive options for processing documentation.
- **Programmatic API** — use as a library in your Node.js applications with ES modules and CommonJS support.
- **TypeScript support** — full TypeScript definitions included for a better development experience.
- **Cross-platform compatibility** — works on Windows, macOS, and Linux.
- **Flexible input handling** — supports both direct markdown files and docs subfolders.
- **Multiple processing modes** — process all projects, specific projects, or specific routes.
- **Custom output directories** — specify where to save generated manifest and search index files.
- **Draft and hidden content filtering** — respects `draft` and `hidden` frontmatter flags.
- **Hierarchical navigation** — builds nested navigation structures from directory hierarchies.
- **Smart title formatting** — automatically formats filenames into readable titles.
- **JSON output format** — generates clean, structured JSON files for manifests and search indexes.

### 🛠 Changed

- N/A (initial release)

### 🐛 Fixed

- N/A (initial release)

### 🗑️ Removed

- N/A (initial release)

**Full Changelog**: https://github.com/fsegurai/manifest-generator/commits/v0.0.0-alpha.3

---

## 📦 Dependencies

### Runtime

- No external dependencies (zero dependency library).

- Native browser features (ES6+, `CustomEvent`, `MutationObserver`, etc.).

### Development

- [`bun`](https://bun.sh/) — JS runtime and package manager

- [`typescript`](https://www.typescriptlang.org/) — static type checking
- [`eslint`](https://eslint.org/) — code linting and formatting
- [`jest`](https://jestjs.io/) — testing framework

---

## 🔁 Migration Guide

### From 0.x → 1.0.0

- This is the first stable release of the `manifest-generator` library.
- ✅ No migration needed.

---

## 💥 Breaking Changes

- N/A — initial release

---

## ✅ Compatibility

- ✅ Chrome
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ✅ ES6+ support required
- ⚠️ IE is **not supported*

---

[unreleased]: https://github.com/fsegurai/manifest-generator/compare/v1.0.0...HEAD

[1.0.0]: https://github.com/fsegurai/manifest-generator/compare/v1.0.0-beta.3...v1.0.0

[1.0.0-beta.3]: https://github.com/fsegurai/manifest-generator/compare/v1.0.0-beta.2...v1.0.0-beta.3

[1.0.0-beta.2]: https://github.com/fsegurai/manifest-generator/compare/v1.0.0-beta.1...v1.0.0-beta.2

[1.0.0-beta.1]: https://github.com/fsegurai/manifest-generator/compare/v0.0.0-alpha.3...v1.0.0-beta.1

[0.0.0-alpha.3]: https://github.com/fsegurai/manifest-generator/releases/tag/v0.0.0-alpha.3
