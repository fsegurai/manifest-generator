---
label: Features Overview
description: Current capabilities of the Manifest Generator release.
tags: ["features", "capabilities", "overview"]
---

# Features Overview

The current release focuses on one job: turn Markdown documentation into a manifest and a search index.

## Core capabilities

- Automatic project discovery
- Hierarchical navigation generation
- Flat search index generation
- Frontmatter parsing for `label`, `description`, `tags`, and visibility flags
- Programmatic API and CLI support
- Bun-based tests and monorepo workflows

## Current behavior highlights

| Area | Behavior |
|------|----------|
| Discovery | Prefers a docs subfolder, then falls back to direct Markdown files |
| Output | Creates missing output directories automatically |
| Validation | Fails fast when the docs root does not exist |
| Types | Shared types live in `src/types.ts` |
| Tests | Uses `bun:test` instead of Jest |

## Example workflow

```bash
bun ./packages/manifest-generator/src/cli.ts --discover --docs-root ./docs
bun ./packages/manifest-generator/src/cli.ts --docs-root ./docs/1.0.0-beta.2 --output ./docs/1.0.0-beta.2
```

## Next step

- [CLI Usage](../guides/cli-usage.md)
- [Frontmatter](../guides/frontmatter.md)
- [API Reference](../api/reference.md)
