# 📦 Changelog

All notable changes to this project will be documented in this file.  
This project adheres to [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [Unreleased]



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

- [Full Changelog](https://github.com/fsegurai/manifest-generator/compare/v1.0.0-beta.1...v1.0.0-beta.2)

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

- [Full Changelog](https://github.com/fsegurai/manifest-generator/compare/v0.0.0-alpha.3...v1.0.0-beta.1)

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

- This is the first stable release of the `scrollspy` library.
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
- ⚠️ IE is **not supported**

---

[unreleased]: https://github.com/fsegurai/scrollspy/compare/v1.0.0-beta.1...HEAD

[1.0.0-beta.1]: https://github.com/fsegurai/scrollspy/compare/v0.0.0-alpha.3...v1.0.0-beta.1

[0.0.0-alpha.3]: https://github.com/fsegurai/scrollspy/releases/tag/v0.0.0-alpha.3
