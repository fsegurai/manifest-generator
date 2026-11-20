---
label: Documentation Home
description: External-user documentation for @fsegurai/manifest-generator 1.2.0.
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

# add prev/next links to page items
npx @fsegurai/manifest-generator --route ./docs --prev-next

# section anchors in the search index, custom frontmatter, reading time
npx @fsegurai/manifest-generator --route ./docs --heading-anchors --extra-frontmatter --reading-time
```

## Who this is for

- Documentation site builders
- Teams with monorepos or multiple docs projects
- Tooling engineers integrating docs generation into CI/CD

## Documentation map

| Area                                         | Purpose                                     |
|----------------------------------------------|-----------------------------------------------|
| [Getting Started](getting-started/README.md) | Install and first successful generation     |
| [Guides](guides/README.md)                   | CLI, config, project structure, frontmatter |
| [API](api/README.md)                         | Programmatic usage and exported types       |
| [Features](features/README.md)               | Capabilities and behaviour highlights       |
| [Examples](examples/README.md)               | Practical patterns by scenario              |
| [Integration](integration/README.md)         | Build systems and CI/CD workflows           |
| [Help](help/README.md)                       | FAQ and troubleshooting                     |
| [What's New in 1.2.0](whats-new.md)          | Release notes and upgrade notes             |

## Current release notes

This `1.2.0` docs set covers the browser-safe core, schema, and frontmatter-interop update on top of `1.1.0`:

- **Browser-safe core entry** — `@fsegurai/manifest-generator/core` has no `node:*` imports and adds
  `generateManifestFromFiles([{ path, content }], options)`, which returns the same manifest and search index as
  `generateManifest(dir)` for the same tree. See [Browser-safe Core](api/core.md).
- **Types and JSON Schema entry** — `@fsegurai/manifest-generator/schema` (types only) plus the shipped
  `schema/manifest.schema.json` and `schema/search-index.schema.json`. See [Types and JSON Schema](api/schema.md).
- **Previous / next links** — opt-in `prevNext` option (`--prev-next`, config `prevNext`) writes `prev` / `next` on page
  items in reading order. See [Configuration](guides/configuration.md#prevnext--previous--next-links).
- **Heading anchors, extra frontmatter, reading time** — opt-in `headingAnchors` (`sections` with GitHub-style ids on
  search entries), `extraFrontmatter` (unknown keys in `meta`), and `readingTime` (`wordCount` / `readingTime`). See
  [Configuration](guides/configuration.md#headinganchors--section-anchors-in-the-search-index).
- **Hidden pages stay searchable** — `hidden: true` leaves a page out of the navigation only; its search entry stays,
  flagged `hidden: true`. `draft: true` still drops both.
- **Frontmatter aliases and ignored keys** — config `frontmatterAliases` (e.g. `{ title: 'label' }`) and
  `ignoreKeys` / `--ignore-keys a,b` for docs written for another tool. See
  [Frontmatter aliases](guides/frontmatter.md#frontmatter-aliases).
- **Config validation** — a wrong-typed `prevNext` / `frontmatterAliases` / `ignoreKeys`, or an alias to an unknown
  key, stops the CLI with `Error: Invalid config: …`.

Output is unchanged from `1.1.0` unless you use `hidden: true` or have `##` lines inside fenced code blocks. See [What's New in 1.2.0](whats-new.md) for the full release notes, and
`CHANGELOG.md` in the repository root for the complete changelog.
