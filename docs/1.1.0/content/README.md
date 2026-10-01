---
label: Documentation Home
description: External-user documentation for @fsegurai/manifest-generator 1.1.0.
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
|----------------------------------------------|-----------------------------------------------|
| [Getting Started](getting-started/README.md) | Install and first successful generation     |
| [Guides](guides/README.md)                   | CLI, config, project structure, frontmatter |
| [API](api/README.md)                         | Programmatic usage and exported types       |
| [Features](features/README.md)               | Capabilities and behaviour highlights       |
| [Examples](examples/README.md)               | Practical patterns by scenario              |
| [Integration](integration/README.md)         | Build systems and CI/CD workflows           |
| [Help](help/README.md)                       | FAQ and troubleshooting                     |

## Current release notes

This `1.1.0` docs set covers the folder-label and CLI packaging update on top of `1.0.0`:

- **Folder labels from README/index** — a folder's navigation label, its own breadcrumb segment, and its descendants'
  breadcrumb segments now come from the folder's `README.md`/`README.mdx`/`index.md`/`index.mdx` frontmatter
  (`breadcrumbTitle`, then `label`, then the title-cased folder name). A folder `api/` whose `README.md` sets
  `breadcrumbTitle: API` now shows as "API" instead of "Api". See
  [Folder labels](guides/frontmatter.md#folder-labels).
- **The CLI now ships in the package** — the build emits `dist/cli.js`, the target of the `bin` entry. It runs through
  `npx @fsegurai/manifest-generator`, a global install, or `node_modules/.bin/manifest-generator`. `1.0.0` was
  published without this file, so the CLI did not work from npm; upgrade to `1.1.0` to fix it. See
  [Troubleshooting](help/troubleshooting.md#problem-the-cli-does-nothing-or-is-not-found-on-100).
- **Symlink-safe entry detection** — the CLI no longer silently does nothing when launched through the
  `node_modules/.bin` symlink or `npx`.
- **`types` listed first in `exports["."]`** — TypeScript now resolves the bundled declarations correctly.

See [What changed since 1.0.0](help/faq.md#what-changed-since-100) for the user-facing upgrade notes, and
`CHANGELOG.md` in the repository root for the complete changelog.
