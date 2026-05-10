# API Reference

The package exports its programmatic API from the package root.
It is designed for Node.js and Bun-based tooling, with file-system access for docs scanning and JSON output.

## Imports

```ts
import {
  discoverProjects,
  generateDocsManifests,
  generateManifest,
  generateManifestsWithDiscovery,
} from '@fsegurai/manifest-generator';

import type {
  DiscoveryOptions,
  DiscoveredProject,
  ManifestGenerationOptions,
  ManifestResult,
  NavigationItem,
  ProcessingResult,
  SearchEntry,
} from '@fsegurai/manifest-generator';
```

## Exported functions

### `generateManifest(projectPath: string): ManifestResult`

Scans a single docs directory and returns the manifest plus search index in memory.

```ts
const result = generateManifest('./docs/1.0.0-beta.2/content');
console.log(result.manifest);
console.log(result.searchIndex);
```

### `discoverProjects(rootDir: string, options?: DiscoveryOptions): DiscoveredProject[]`

Finds documentation projects under a root directory.
A project is considered valid when it has either a docs subfolder or direct Markdown files.

```ts
const projects = discoverProjects('./docs', { docsSubfolder: 'docs' });
```

### `generateDocsManifests(docsRoot: string, optionsOrWalker?): ProcessingResult[]`

Discovers projects under a docs root and writes `manifest.json` and `search-index.json` for each one.
It accepts either a walker function or an options object with `docsSubfolder` and `walkerFn`.

### `generateManifestsWithDiscovery(rootDir: string, options?: ManifestGenerationOptions): ProcessingResult[]`

Main orchestration function used by the CLI.
It supports these modes:

- `route` — process one docs path
- `project` — process one named project
- `autoDetect` — discover and process all matching projects

## Current behavior

- Missing output directories are created automatically.
- Missing docs roots produce a hard error.
- When a docs subfolder exists, discovery prefers it over the direct-markdown fallback.
- `draft` and `hidden` frontmatter remove pages from output.

## Result types

### `ManifestResult`

```ts
interface ManifestResult {
  manifest: NavigationItem[];
  searchIndex: SearchEntry[];
}
```

### `ProcessingResult`

```ts
interface ProcessingResult {
  name: string;
  processed: boolean;
  error?: string;
}
```

## Next step

Read [TypeScript](typescript.md) for the full exported interface list and their fields.
