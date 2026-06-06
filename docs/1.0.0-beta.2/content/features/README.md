---
label: Features Overview
description: Current capabilities of the Manifest Generator release.
tags: [ "features", "capabilities", "overview" ]
---

# Features Overview

The current release turns Markdown and MDX documentation into a manifest and a search index, with a growing set of
navigation and metadata capabilities.

## Core capabilities

- Automatic project discovery (including recursive for nested directories)
- Hierarchical navigation generation with sortable items
- Flat search index generation with keywords and breadcrumb titles
- Frontmatter parsing for 18+ metadata fields
- Programmatic API and CLI support
- Bun-based tests and monorepo workflows
- MDX file support alongside Markdown
- Frontmatter validation mode
- File-watching for live regeneration

## Current behaviour highlights

| Area       | Behaviour                                                                |
|------------|--------------------------------------------------------------------------|
| Discovery  | Prefers a docs subfolder, falls back to direct files, supports recursive |
| Sorting    | Items sorted by `order` frontmatter, then alphabetically                 |
| Output     | Clean JSON (no null/false fields) creates minimal output files           |
| Validation | `--validate` mode checks frontmatter without writing files               |
| Watching   | `--watch` polls for file changes and regenerates                         |
| Files      | Both `.md` and `.mdx` are processed                                      |
| Types      | Shared types live in `src/types.ts` with 6 interfaces                    |
| Tests      | Uses `bun:test` with 32+ tests across 2 test files                       |

## New frontmatter properties

| Property                | Purpose                                |
|-------------------------|----------------------------------------|
| `order`                 | Control navigation sort position       |
| `redirect`              | Declare a redirect URL for the page    |
| `externalUrl`           | Link to an external resource           |
| `breadcrumbTitle`       | Shorter label for breadcrumbs          |
| `layout`                | Custom layout identifier for frontends |
| `deprecated`            | Mark page as outdated                  |
| `deprecatedAlternative` | Suggest a migration route              |
| `publishedAt`           | ISO publication date                   |
| `updatedAt`             | ISO last-updated date                  |
| `keywords`              | Extra search terms                     |

## Example workflow

```bash
# validate first
npx @fsegurai/manifest-generator --validate --docs-root ./docs

# generate
npx @fsegurai/manifest-generator --docs-root ./docs/1.0.0-beta.2 --output ./docs/1.0.0-beta.2

# watch for changes
npx @fsegurai/manifest-generator --watch --route ./docs --output ./public
```

## What changed from 1.0.0-beta.1

- Added `order`, `redirect`, `externalUrl`, `breadcrumbTitle`, `layout`, `deprecated`, `deprecatedAlternative`,
  `publishedAt`, `updatedAt`, `keywords` frontmatter properties
- Added item sorting by `order` then label
- Added recursive project discovery (`--recursive`)
- Added frontmatter validation (`--validate`)
- Added file watching (`--watch`)
- Added MDX file support
- Added `cleanItem()` to output — no more null/false noise in manifest.json
- Added `validateDocs()` and `watchDocs()` to the programmatic API
- Improved frontmatter parser (multiline values, quoted strings, null support)

## Next step

- [CLI Usage](../guides/cli-usage.md)
- [Frontmatter](../guides/frontmatter.md)
- [API Reference](../api/reference.md)
