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
  validateDocs,
  watchDocs,
  sortItems,
  cleanItem,
} from '@fsegurai/manifest-generator';

import type {
  DiscoveryOptions,
  DiscoveredProject,
  ManifestGenerationOptions,
  ManifestResult,
  NavigationItem,
  ProcessingResult,
  SearchEntry,
  ValidateResult,
} from '@fsegurai/manifest-generator';
```

## Exported functions

### `generateManifest(projectPath: string): ManifestResult`

Scans a single docs directory and returns the manifest plus search index in memory. Items are sorted by `order` then label.

```ts
const result = generateManifest('./docs/1.0.0-beta.2/content');
console.log(result.manifest);
console.log(result.searchIndex);
```

### `discoverProjects(rootDir: string, options?: DiscoveryOptions): DiscoveredProject[]`

Finds documentation projects under a root directory.
Supports `recursive: true` for nested directory structures.

```ts
// standard
const projects = discoverProjects('./docs', { docsSubfolder: 'docs' });

// recursive
const allProjects = discoverProjects('./packages', {
  docsSubfolder: 'docs',
  recursive: true,
});
```

### `generateDocsManifests(docsRoot: string, optionsOrWalker?): ProcessingResult[]`

Discovers projects under a docs root and writes `manifest.json` and `search-index.json` for each one.
Accepts a `walkerFn` for DI, plus `docsSubfolder` and `recursive` options.

### `generateManifestsWithDiscovery(rootDir: string, options?: ManifestGenerationOptions): ProcessingResult[]`

Main orchestration function used by the CLI.
Supports these modes:

- `route` — process one docs path (writes output to that path)
- `project` — process one named project
- `autoDetect` — discover and process all matching projects

### `validateDocs(rootDir: string): ValidateResult[]`

Validates frontmatter across all markdown/MDX files in a directory without writing any output. Returns an array of per-file results with warnings and errors.

```ts
const results = validateDocs('./docs');
const invalid = results.filter(r => !r.valid);
console.log(`${invalid.length} files have errors`);
```

### `watchDocs(rootDir: string, onChange: (file: string) => void, interval?: number): { close: () => void }`

Watches a directory for file changes and fires a callback. Returns an object with a `close()` method to stop watching.

```ts
const watcher = watchDocs('./docs', (changedFile) => {
  console.log('Regenerating after:', changedFile);
});
// later: watcher.close();
```

### `sortItems(items: NavigationItem[]): NavigationItem[]`

Sorts items by `order` (ascending, default 999) then alphabetically by `label`. Recursively sorts children.

### `cleanItem(item: NavigationItem): NavigationItem`

Removes null, false, and empty string fields from a navigation item. Used internally before writing JSON output.

## Current behaviour

- Missing output directories are created automatically.
- Missing docs roots produce a hard error.
- When a docs subfolder exists, discovery prefers it over the direct-markdown fallback.
- Items are sorted by `order` frontmatter, then alphabetically by `label`.
- Output is cleaned — no `null`/`false`/empty fields in `manifest.json`.
- `draft` and `hidden` frontmatter remove pages from output.
- Both `.md` and `.mdx` files are processed.

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

### `ValidateResult`

```ts
interface ValidateResult {
  file: string;
  valid: boolean;
  warnings: string[];
  errors: string[];
  frontmatter?: Frontmatter;
}
```

## Next step

Read [TypeScript](typescript.md) for the full exported interface list and their fields.
