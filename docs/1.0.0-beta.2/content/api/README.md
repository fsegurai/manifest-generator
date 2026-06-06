---
label: API Reference
description: Programmatic use of the current Manifest Generator release.
tags: ["api", "reference", "typescript"]
---

# API Reference

Use the package root exports to generate manifests, discover projects, and inspect the current TypeScript types.

## Quick start

```ts
import {
  discoverProjects,
  generateManifest,
  generateManifestsWithDiscovery,
} from '@fsegurai/manifest-generator';
```

## What you can do

- Generate one manifest with `generateManifest()`.
- Discover docs projects with `discoverProjects()`.
- Process many projects with `generateManifestsWithDiscovery()`.
- Import shared types from `src/types.ts` via the package entrypoint.

## Current notes

- `label` is the navigation title used by the parser.
- `ManifestGenerationOptions` is the current options type.
- Output directories are created automatically when needed.

## Next step

- [Reference](reference.md) — function details and behavior
- [TypeScript](typescript.md) — exported interfaces and types
- [Examples](examples.md) — practical usage patterns
