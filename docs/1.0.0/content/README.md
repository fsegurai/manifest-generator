---
label: Documentation Home
description: External-user documentation for @fsegurai/manifest-generator 1.0.0.
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

This `1.0.0` docs set reflects the stable release, built on top of `1.0.0-beta.3`:

- **`js-yaml` v5** — the parser now depends on `js-yaml@^5.4.2`. An empty frontmatter scalar (e.g. `label:` with nothing
  after it) parses to `''` (empty string), not `null` — a `js-yaml` v5 semantic change, not a bug. Since the parser
  falls back with `meta.label || formatTitle(...)`, this has no visible effect on generated labels.
- **`--config <path>` loads an exact file** — no longer just a directory search; it reads the file you point it at,
  falling back with a warning if the path does not exist.
- **`--version` reports the installed tool's own version** — resolved from the package's own `package.json` by walking
  up from the CLI's own file location, regardless of the caller's working directory.
- **Config file gains `docsRoot`, `exclude`, and `projects`** — `exclude` accepts glob patterns (`*` / `**`) matched
  against paths relative to the scanned root; `projects` lets you override `docsSubfolder` / `outputDir` per
  discovered project by name.
- **New CLI flags**: `--json` (machine-readable output for `--discover` / `--validate`), `--dry-run` (preview
  generation without writing files), `--quiet` / `-q` (suppress banner and progress output; errors still show).
- **Conflicting mode flags now error clearly** — passing two of `--validate`, `--discover`, `--watch`, `--init`
  together exits with code `1` and a clear message instead of silently picking one.
- **Colorized `--validate` output** — validation status labels (`[OK]` / `[FAIL]`) are colorized in a TTY; disabled by
  `NO_COLOR` or when output is piped/non-TTY.
- **Interactive `--init`** — prompts for docs subfolder, output directory, and recursive discovery when run in a real
  terminal (TTY); falls back to the previous non-interactive defaults in CI, pipes, and scripts.
- **Deterministic `README.md` vs `index.md` precedence** — when a folder has both, `README.md` now always wins (with a
  console warning), instead of depending on filesystem read order.

See [What changed since beta.3](help/faq.md#what-changed-since-1000-beta3) for the full user-facing migration list, and
`CHANGELOG.md` in the repository root for the complete changelog.
