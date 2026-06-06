---
label: Documentation Home
description: External-user documentation for @fsegurai/manifest-generator 1.0.0-beta.2.
tags: [ "documentation", "overview", "manifest-generator" ]
---

# @fsegurai/manifest-generator Docs

`@fsegurai/manifest-generator` generates two JSON files from Markdown and MDX documentation:

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

# validate frontmatter first
npx @fsegurai/manifest-generator --validate --docs-root ./docs
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

- **Sorting**: items sorted by `order` frontmatter, then alphabetically
- **New frontmatter**: `order`, `redirect`, `externalUrl`, `breadcrumbTitle`, `layout`, `deprecated`,
  `deprecatedAlternative`, `publishedAt`, `updatedAt`, `keywords`
- **Recursive discovery**: `--recursive` flag for nested project trees
- **Validation**: `--validate` mode checks frontmatter without writing files
- **Watch mode**: `--watch` polls for file changes and regenerates
- **MDX support**: `.mdx` files are processed alongside `.md`
- **Cleaner output**: `cleanItem()` removes null/false fields from JSON
- **Improved parser**: multiline values, quoted strings, null support
- **New API**: `validateDocs()`, `watchDocs()`, `sortItems()` exported
