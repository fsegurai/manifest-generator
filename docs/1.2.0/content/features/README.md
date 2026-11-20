---
label: Features Overview
breadcrumbTitle: Features
description: Current capabilities of the Manifest Generator release.
tags: [ "features", "capabilities", "overview" ]
---

# Features Overview

The current release turns Markdown and MDX documentation into a manifest and a search index, with a growing set of
navigation, metadata, and configuration capabilities.

## Core capabilities

- Config file support — `manifest-generator.config.json/.js/.ts`, auto-detected or loaded from an exact path with
  `--config`, plus `defineConfig()`
- `docsRoot`, `exclude` (glob patterns), and per-project `projects` overrides in the config file
- `--init` scaffold, now interactive in a real terminal (prompts for docs subfolder, output dir, recursive)
- `--dry-run` preview mode — full pipeline runs, nothing is written to disk
- `--json` machine-readable output for `--discover` and `--validate`
- `--quiet`/`-q` to suppress banner/progress output
- Automatic project discovery (including recursive for nested directories), with glob-based exclusion
- Hierarchical navigation generation with sortable items
- Folder labels taken from the folder's `README`/`index` frontmatter (`breadcrumbTitle`, then `label`)
- CLI shipped in the package (`dist/cli.js`), runnable via `npx`, a global install, or `node_modules/.bin`
- Flat search index generation with headings, excerpts, and auto-generated breadcrumbs
- Frontmatter parsing for 21 metadata fields (`ALLOWED_FRONTMATTER_KEYS`)
- Extended frontmatter validation — 11 checks including date validity, unknown keys, type errors, and more
- Programmatic API and CLI support
- Browser-safe `@fsegurai/manifest-generator/core` entry with `generateManifestFromFiles()` for in-memory files
- Types-only `@fsegurai/manifest-generator/schema` entry and JSON Schemas for `manifest.json` / `search-index.json`
- Opt-in `prev`/`next` page links (`prevNext`, `--prev-next`)
- Opt-in heading anchors in the search index (`headingAnchors`, `--heading-anchors`), with GitHub-style ids
- Opt-in custom frontmatter in `meta` (`extraFrontmatter`, `--extra-frontmatter`)
- Opt-in `wordCount` / `readingTime` on page items (`readingTime`, `--reading-time`)
- `hidden: true` pages leave the navigation but stay searchable
- `frontmatterAliases` and `ignoreKeys` / `--ignore-keys` for frontmatter written for other tools
- Bun-based tests and monorepo workflows
- MDX file support alongside Markdown
- File-watching for live regeneration

## Current behaviour highlights

| Area       | Behaviour                                                                       |
|------------|-----------------------------------------------------------------------------------|
| Config     | Loaded from `.ts`, `.js`, or `.json`; CLI flags override config; `--config <path>` loads an exact file |
| --init     | Interactive prompts in a TTY; same defaults non-interactively                    |
| --dry-run  | Runs the full pipeline, writes nothing                                           |
| --json     | Machine-readable output for `--discover`/`--validate`                            |
| Discovery  | Prefers a docs subfolder, falls back to direct files, supports recursive + `exclude` |
| Folder label | `breadcrumbTitle` → `label` → title-cased folder name, from README/index (README wins)  |
| Sorting    | Items sorted by `order` frontmatter, then alphabetically                         |
| Output     | Clean JSON (no null/false/'' fields in `manifest.json`) creates minimal output files |
| Validation | 11 rule checks against 21 allowed frontmatter keys, including unknown-key detection |
| Watching   | `--watch` polls for file changes and regenerates                                 |
| Files      | Both `.md` and `.mdx` are processed                                               |
| Types      | Shared types live in `src/types.ts`                                              |
| Mode flags | `--validate`/`--discover`/`--watch`/`--init` are mutually exclusive — combining them errors |
| Prev/next  | Opt-in; page items get `prev`/`next` in depth-first manifest order, title nodes and external links skipped |
| Anchors    | Opt-in `sections` per search entry; ids match `github-slugger` / ngx-markdown `headingIds` |
| Hidden     | Left out of `manifest.json`, kept in `search-index.json` with `hidden: true`; `draft` drops both |
| Aliases    | `frontmatterAliases` fills a target key only when it is not set; no default aliases |
| Runtimes   | `/core` and `/schema` have no `node:*` imports and run in browsers and workers |

## What changed in 1.2.0

- New browser-safe entry `@fsegurai/manifest-generator/core` with `generateManifestFromFiles()` — see
  [Browser-safe Core](../api/core.md).
- New types-only entry `@fsegurai/manifest-generator/schema` and shipped JSON Schemas — see
  [Types and JSON Schema](../api/schema.md).
- Opt-in `prevNext` option / `--prev-next` flag.
- Opt-in `headingAnchors`, `extraFrontmatter`, and `readingTime` options (`--heading-anchors`, `--extra-frontmatter`,
  `--reading-time`).
- `hidden: true` pages stay in the search index (flagged `hidden`); `extractHeadings` skips fenced code blocks.
- Config `frontmatterAliases` and `ignoreKeys`, CLI `--ignore-keys`; `validateDocs()` takes an options argument.
- Wrong-typed new config keys stop the CLI with `Error: Invalid config: …`.

Full release notes: [What's New in 1.2.0](../whats-new.md).

## What changed in 1.1.0

- A folder's label (navigation entry, own breadcrumb segment, and descendants' breadcrumb segments) now comes from its
  `README.md`/`README.mdx`/`index.md`/`index.mdx` frontmatter: `breadcrumbTitle`, then `label`, then the title-cased
  folder name. The README's own entry keeps its own `label`.
- The CLI is now included in the published package as `dist/cli.js` (`1.0.0` shipped without it).
- CLI entry detection resolves symlinks, so `npx` and `node_modules/.bin/manifest-generator` work.
- `types` is listed first in `exports["."]` so TypeScript resolves the declarations.

## What changed from 1.0.0-beta.3

- Upgraded to `js-yaml` v5 — an empty frontmatter scalar now parses to `''` instead of `null` (a `js-yaml` semantic
  change; no visible effect thanks to existing `||` fallbacks).
- `--config <path>` now loads that exact file instead of only participating in directory auto-detection.
- `--version` now always resolves the installed tool's own version, regardless of the caller's working directory.
- Config file gained `docsRoot`, `exclude` (glob patterns), and `projects` (per-project `docsSubfolder`/`outputDir`
  overrides); it no longer has `project`, `route`, or `autoDetect` fields.
- Added `--json`, `--dry-run`, and `--quiet`/`-q` CLI flags.
- Passing two mode flags together (`--validate`, `--discover`, `--watch`, `--init`) now errors instead of silently
  picking one.
- `--validate` output is colorized in a TTY (respects `NO_COLOR`).
- `--init` is interactive in a real terminal; unchanged defaults otherwise.
- `README.md` now deterministically wins over `index.md` in the same folder (with a console warning).
- `ManifestGenerationOptions` and `DiscoveryOptions` gained `exclude`; `ManifestGenerationOptions` also gained
  `projects` and `dryRun`.

## Next step

- [CLI Usage](../guides/cli-usage.md)
- [Frontmatter](../guides/frontmatter.md)
- [API Reference](../api/reference.md)
