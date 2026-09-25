---
label: Features Overview
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
- Flat search index generation with headings, excerpts, and auto-generated breadcrumbs
- Frontmatter parsing for 21 metadata fields (`ALLOWED_FRONTMATTER_KEYS`)
- Extended frontmatter validation — 11 checks including date validity, unknown keys, type errors, and more
- Programmatic API and CLI support
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
| Sorting    | Items sorted by `order` frontmatter, then alphabetically                         |
| Output     | Clean JSON (no null/false/'' fields in `manifest.json`) creates minimal output files |
| Validation | 11 rule checks against 21 allowed frontmatter keys, including unknown-key detection |
| Watching   | `--watch` polls for file changes and regenerates                                 |
| Files      | Both `.md` and `.mdx` are processed                                               |
| Types      | Shared types live in `src/types.ts`                                              |
| Mode flags | `--validate`/`--discover`/`--watch`/`--init` are mutually exclusive — combining them errors |

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
