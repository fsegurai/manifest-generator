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

# @fsegurai/manifest-generator

Monorepo for the Manifest Generator ecosystem.

This repository contains:

- the published package (`@fsegurai/manifest-generator`)
- versioned product documentation (`docs/*`)
- a demo app that consumes generated artifacts

## What the package does

The package scans Markdown and MDX documentation and generates:

- `manifest.json` (hierarchical navigation with sorting)
- `search-index.json` (flat search entries with keywords)

It can be used via CLI or programmatic API. Supports 20+ frontmatter fields,
frontmatter validation, recursive project discovery, file watching, and sorting.

## Repository structure

```text
manifest-generator/
├── docs/
│   └── 1.0.0-beta.2/
│       └── content/
├── packages/
│   └── manifest-generator/
│       ├── src/
│       │   ├── cli.ts
│       │   ├── index.ts
│       │   └── types.ts
│       └── spec/
├── demo/
└── scripts/
```

## Run locally (contributors)

### Requirements

- Node.js 22+
- Bun 1.3+

### Setup

```bash
bun install
```

### Development workflow

```bash
# run tests
bun test

# build all workspaces and demo
bun run build

# build only the package
bun run --filter '@fsegurai/manifest-generator' pkg:build

# run package tests only
bun run --filter '@fsegurai/manifest-generator' pkg:test
```

### Run the CLI locally

```bash
bun ./packages/manifest-generator/src/cli.ts --help
bun ./packages/manifest-generator/src/cli.ts --discover --docs-root ./docs
```

### Regenerate versioned docs artifacts

```bash
bun ./packages/manifest-generator/src/cli.ts \
  --docs-root ./docs/1.0.0-beta.2 \
  --output ./docs/1.0.0-beta.2
```

## Use as an external user

If you only want to consume the package, start with the versioned docs:

- `docs/1.0.0-beta.2/content/README.md`

Or run directly from npm:

```bash
npx @fsegurai/manifest-generator --help
npx @fsegurai/manifest-generator --route ./docs
```

## License

MIT
