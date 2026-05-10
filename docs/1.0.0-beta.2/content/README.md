---
label: Documentation Home
description: External-user documentation for @fsegurai/manifest-generator 1.0.0-beta.2.
tags: ["documentation", "overview", "manifest-generator"]
---

# @fsegurai/manifest-generator Docs

`@fsegurai/manifest-generator` generates two JSON files from Markdown documentation:

- `manifest.json` for hierarchical navigation
- `search-index.json` for search data

This documentation is written for users who want to consume the published package from npm.

## Quick start

1. Install or run with `npx`.
2. Point the CLI to your docs folder.
3. Use the generated JSON in your docs UI/site.

```bash
# no install required
npx @fsegurai/manifest-generator --route ./docs

# process all discoverable projects under a root
npx @fsegurai/manifest-generator --all --docs-root ./projects
```

## Who this is for

- Documentation site builders
- Teams with monorepos or multiple docs projects
- Tooling engineers integrating docs generation into CI/CD

## Documentation map

| Area                                         | Purpose                                     |
|----------------------------------------------|---------------------------------------------|
| [Getting Started](getting-started/README.md) | Install and first successful generation     |
| [Guides](guides/README.md)                   | CLI, config, project structure, frontmatter |
| [API](api/README.md)                         | Programmatic usage and exported types       |
| [Examples](examples/README.md)               | Practical patterns by scenario              |
| [Integration](integration/README.md)         | Build systems and CI/CD workflows           |
| [Help](help/README.md)                       | FAQ and troubleshooting                     |

## Current release notes

This `1.0.0-beta.2` docs set reflects:

- Bun-based tests (no Jest)
- Shared types split into `types.ts`
- Better discovery behavior (prefer docs subfolder)
- Better CLI behavior for missing docs roots and output directory creation
