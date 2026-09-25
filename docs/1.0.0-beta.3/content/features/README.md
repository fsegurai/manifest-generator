---
label: Features Overview
description: Current capabilities of the Manifest Generator release.
tags: [ "features", "capabilities", "overview" ]
---

# Features Overview

The current release turns Markdown and MDX documentation into a manifest and a search index, with a growing set of
navigation and metadata capabilities.

## Core capabilities

- Config file support — `manifest-generator.config.json/.js/.ts` with `--config` flag and `defineConfig()` helper
- `--init` scaffold — one-command setup that creates a config file and sample docs structure
- Automatic project discovery (including recursive for nested directories)
- Hierarchical navigation generation with sortable items
- Flat search index generation with headings, excerpts, and auto-generated breadcrumbs
- Frontmatter parsing for 21+ metadata fields
- Extended frontmatter validation — 11 checks including date validity, unknown keys, type errors, and more
- Programmatic API and CLI support
- Bun-based tests and monorepo workflows
- MDX file support alongside Markdown
- File-watching for live regeneration

## Current behaviour highlights

| Area       | Behaviour                                                                |
|------------|--------------------------------------------------------------------------|
| Config     | Loaded from `.ts`, `.js`, or `.json` files; CLI flags override config    |
| --init     | Creates `manifest-generator.config.ts` + `docs/` structure with examples |
| Discovery  | Prefers a docs subfolder, falls back to direct files, supports recursive |
| Sorting    | Items sorted by `order` frontmatter, then alphabetically                 |
| Output     | Clean JSON (no null/false fields) creates minimal output files           |
| Validation | 21+ frontmatter checks including unknown-key detection and date validity |
| Watching   | `--watch` polls for file changes and regenerates                         |
| Files      | Both `.md` and `.mdx` are processed                                      |
| Types      | Shared types live in `src/types.ts` with 8 interfaces                    |
| Tests      | Uses `bun:test` with 122+ tests across 3 test files                      |

## What changed from 1.0.0-beta.2

- Added config file support (`manifest-generator.config.json/.js/.ts`)
- Added `--config` CLI flag and `defineConfig()` helper
- Added `--init` scaffold command
- Added 11 new frontmatter validation rules (missing label, future dates, unknown keys, etc.)
- Added `ALLOWED_FRONTMATTER_KEYS` public API export
- Replaced custom YAML parser with `js-yaml` (JSON_SCHEMA)
- Added `ConfigFile`, `ProjectConfig` TypeScript interfaces
- Expanded tests from 104 to 122 tests across 3 test files
- Search index: added `headings[]`, `excerpt`, `breadcrumb`; removed `keywords`, `breadcrumbTitle`
- Heading deduplication via Dice coefficient (bigram similarity, threshold 0.7)

## Next step

- [CLI Usage](../guides/cli-usage.md)
- [Frontmatter](../guides/frontmatter.md)
- [API Reference](../api/reference.md)
