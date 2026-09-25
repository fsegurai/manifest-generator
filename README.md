<p align="center" class="intro">
  <img alt="Manifest Generator Logo" src="https://raw.githubusercontent.com/fsegurai/manifest-generator/main/demo/public/manifest-generator.svg">
</p>

<p align="center" class="intro">
  <a href="https://github.com/fsegurai/manifest-generator">
      <img src="https://img.shields.io/azure-devops/build/fsegurai/06cb8729-d71a-43f5-a4b8-f387da813f19/27/main?label=Build%20Status&"
          alt="Build Main Status">
  </a>
  <a href="https://github.com/fsegurai/manifest-generator/releases/latest">
      <img src="https://img.shields.io/github/v/release/fsegurai/manifest-generator"
          alt="Latest Release">
  </a>
  <br>
  <img alt="GitHub contributors" src="https://img.shields.io/github/contributors/fsegurai/manifest-generator">
  <img alt="Dependency status for repo" src="https://img.shields.io/librariesio/github/fsegurai/manifest-generator">
  <a href="https://opensource.org/licenses/MIT">
    <img alt="GitHub License" src="https://img.shields.io/github/license/fsegurai/manifest-generator">
  </a>
  <br>
  <img alt="Stars" src="https://img.shields.io/github/stars/fsegurai/manifest-generator?style=square&labelColor=343b41"/>
  <img alt="Forks" src="https://img.shields.io/github/forks/fsegurai/manifest-generator?style=square&labelColor=343b41"/>
</p>

**A library and CLI for generating navigation manifests and search indexes from Markdown/MDX documentation.**

`@fsegurai/manifest-generator` is a CLI and library that scans Markdown/MDX documentation and generates hierarchical navigation manifests and search
indexes. Built with TypeScript, powered by Bun.

## Table of Contents

- [What the package does](#what-the-package-does)
- [Installation](#installation)
- [Usage](#usage)
  - [CLI reference](#cli-reference)
  - [Programmatic API](#programmatic-api)
- [Frontmatter fields](#frontmatter-fields)
- [Documentation](#documentation)
- [Demo](#demo)
- [Local Development](#local-development)
- [Semantic Versioning](#semantic-versioning)
- [License](#license)

## What the package does

Given a directory of Markdown or MDX files with YAML frontmatter, `@fsegurai/manifest-generator` produces two artifacts:

- **`manifest.json`** — hierarchical navigation tree with sorting, frontmatter metadata, draft/hidden filtering, and
  folder inheritance
- **`search-index.json`** — flat search entries with headings, excerpts, and structured breadcrumb trails

Supports 21 frontmatter keys, recursive project discovery, file watching, frontmatter validation, and per-project
config overrides.

## Installation

```bash
npm install @fsegurai/manifest-generator
```

Or run it without installing:

```bash
npx @fsegurai/manifest-generator --help
```

## Usage

### CLI reference

```text
--discover        Auto-detect documentation projects in --docs-root
--validate        Validate frontmatter across all discovered projects
--recursive       Discover projects in nested directories
--watch           Watch for file changes and regenerate
--init            Scaffold a docs structure + config file (interactive on a TTY)
--all             Process all discovered projects
--project <name>  Target a specific project by name
--route <path>    Target a single documentation route
--docs-root <dir> Root directory for documentation discovery
--output <dir>    Output directory for generated manifests
--docs-subfolder  Custom subfolder name inside project dirs (default: docs)
--config <path>   Load an exact config file, skipping auto-detection
--json            Machine-readable JSON output (--discover / --validate)
--dry-run         Run generation without writing files to disk
--quiet, -q       Suppress banner/progress output (errors still show)
```

`--validate`, `--discover`, `--watch`, and `--init` are mutually exclusive. Exit codes are `0` (success) or `1`
(failure) throughout.

```bash
npx @fsegurai/manifest-generator --route ./docs
npx @fsegurai/manifest-generator --discover --docs-root ./documentation --recursive
```

### Programmatic API

Every function below is **synchronous** — none return Promises.

```ts
import {
  generateManifest,
  generateDocsManifests,
  discoverProjects,
  validateDocs,
  watchDocs,
  type NavigationItem,
} from '@fsegurai/manifest-generator'

// In-memory manifest generation for a single directory
const { manifest, searchIndex } = generateManifest('./docs')

// Discover projects under a root, then generate manifests for each
const projects = discoverProjects('./docs', { recursive: true })
const results = generateDocsManifests('./docs', { recursive: true, outputDir: './dist' })

// Validate frontmatter
const validation = validateDocs('./docs')
const hasErrors = validation.some((r) => !r.valid)

// Watch for changes
const watcher = watchDocs('./docs', (changedFile) => {
  console.log('Changed:', changedFile)
})
watcher.close()
```

See [Frontmatter fields](#frontmatter-fields) below for the shape of what gets read, and
[`packages/manifest-generator/README.md`](./packages/manifest-generator/README.md) for the full type/API reference
(`NavigationItem`, `SearchEntry`, `ConfigFile`, and every exported function).

## Frontmatter fields

The package reads YAML frontmatter from `.md` and `.mdx` files. Supported keys:

| Key                                    | Type           | Description                              |
|-----------------------------------------|----------------|------------------------------------------|
| `label`                                | string         | Display name in navigation               |
| `description`                          | string         | Short description (used in search index) |
| `tags`                                 | string[]       | Content tags                             |
| `keywords`                             | string[]       | Search keywords                          |
| `order`                                | number         | Sort position in navigation              |
| `isTitle`                              | boolean        | Use as section title                     |
| `isParent`                             | boolean        | Mark as parent node                      |
| `icon` / `iconType`                    | string         | Icon reference                           |
| `badge` / `badgeColor`                 | string         | Badge text and color                     |
| `breadcrumbTitle`                      | string         | Override breadcrumb label (folder index files override descendants' segment; any file overrides its own) |
| `layout`                               | string         | Layout template                          |
| `redirect` / `externalUrl`             | string         | URL redirects                            |
| `deprecated` / `deprecatedAlternative` | boolean/string | Deprecation status                       |
| `publishedAt` / `updatedAt`            | date           | Publication metadata                     |
| `draft`                                | boolean        | Hide from production                     |
| `hidden`                               | boolean        | Exclude from navigation                  |

## Documentation

For full documentation — including config file schema, output JSON shapes, and a complete API reference — start with:

- [`docs/1.0.0/content/README.md`](./docs/1.0.0/content/README.md) — the versioned docs site source
- [`packages/manifest-generator/README.md`](./packages/manifest-generator/README.md) — the package's own README (published to npm)

## Demo

A small Vite demo app lives under `demo/`. There's no hosted live instance — run it locally:

```bash
bun install
bun run start        # dev server (vite)
bun run start:prod   # preview a production build
```

## Local Development

### Requirements

- Node.js 22+, Bun 1.3+

### Setup

```bash
bun install
```

### Development workflow

```bash
# run all tests
bun test

# run tests with coverage
bun test --coverage

# run single-package tests
bun run --filter '@fsegurai/manifest-generator' pkg:test

# lint everything
bun run lint

# build package + demo
bun run build

# build only the library
bun run --filter '@fsegurai/manifest-generator' pkg:build
```

### Run the CLI locally

```bash
bun ./packages/manifest-generator/src/cli.ts --help
bun ./packages/manifest-generator/src/cli.ts --discover --docs-root ./docs
```

### Regenerate versioned docs (maintainers)

```bash
bun run generate:manifest
```

This runs the CLI against `docs/$npm_package_version/content` and writes `manifest.json`/`search-index.json` back
into `docs/$npm_package_version/` — i.e. it always targets the docs folder matching the current package version.

## Semantic Versioning

Commits follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat` — a new feature
- `fix` — a bug fix
- `docs` — documentation-only changes
- `refactor` — code change that neither fixes a bug nor adds a feature
- `test` — adding or correcting tests
- `chore` — tooling, dependencies, build config
- `del` — removing code, files, or features

## License

Licensed under [MIT](https://opensource.org/licenses/MIT).
