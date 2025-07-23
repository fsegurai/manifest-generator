# 📦 Changelog

All notable changes to this project will be documented in this file.  
This project adheres to [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)

---

## [Unreleased]

- Initial development phase, no public releases yet.

---

## [0.0.0-alpha.2] - TBD

### 🚀 Added

- **Documentation manifest generation** — automatically creates navigation structures from Markdown files and directories.
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

[unreleased]: https://github.com/fsegurai/scrollspy/compare/v1.0.0...HEAD

[1.0.0]: https://github.com/fsegurai/scrollspy/releases/tag/v1.0.0
