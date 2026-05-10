# 📦 Changelog

All notable changes to this project will be documented in this file.  
This project adheres to [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)

---

## [Unreleased]

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
