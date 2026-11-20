---
label: API Reference
breadcrumbTitle: API
description: Programmatic use of the current Manifest Generator release.
tags: ["api", "reference", "typescript"]
---

# API Reference

Use the package root exports to generate manifests, discover projects, validate frontmatter, load config, and inspect
the current TypeScript types.

## Quick start

```ts
import {
  discoverProjects,
  generateManifest,
  generateManifestsWithDiscovery,
  loadConfig,
} from '@fsegurai/manifest-generator';
```

## What you can do

- Generate one manifest with `generateManifest()`.
- Discover docs projects with `discoverProjects()`, with `exclude` glob support.
- Process many projects with `generateManifestsWithDiscovery()`, including a `dryRun` preview mode.
- Validate frontmatter with `validateDocs()` without writing files.
- Load and merge config files with `loadConfig()` / `loadConfigFromFile()` / `mergeConfig()` / `defineConfig()`.
- Import shared types from `src/types.ts` via the package entrypoint.
- Since `1.2.0`: build the manifest from in-memory files with `generateManifestFromFiles()`, also in the browser through
  `@fsegurai/manifest-generator/core`.
- Since `1.2.0`: import types only from `@fsegurai/manifest-generator/schema`, and validate the generated files with the
  shipped JSON Schemas.

## Current notes

- `label` is the navigation title used by the parser.
- `ManifestGenerationOptions` now includes `exclude`, `projects`, `dryRun`, `prevNext`, `headingAnchors`,
  `extraFrontmatter`, `readingTime`, and `frontmatterAliases`.
- `generateManifest()` takes an optional `options` argument (`prevNext`, `headingAnchors`, `extraFrontmatter`,
  `readingTime`, `frontmatterAliases`) and `validateDocs()` an
  optional `options` argument (`frontmatterAliases`, `ignoreKeys`).
- Output directories are created automatically when needed (skipped under `dryRun`).

## Next step

- [Reference](reference.md) — function details and behavior
- [TypeScript](typescript.md) — exported interfaces and types
- [Browser-safe Core](core.md) — `@fsegurai/manifest-generator/core` and `generateManifestFromFiles()`
- [Types and JSON Schema](schema.md) — `@fsegurai/manifest-generator/schema` and the JSON Schemas
- [Examples](examples.md) — practical usage patterns
