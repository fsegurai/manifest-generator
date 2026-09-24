# API Reference

The package exports its programmatic API from the package root (`@fsegurai/manifest-generator`, built from
`packages/manifest-generator/src/index.ts`). It is designed for Node.js and Bun-based tooling, with file-system access
for docs scanning and JSON output.

## Imports

```ts
import {
  cleanItem,
  dedupeHeadings,
  defineConfig,
  diceSimilarity,
  discoverProjects,
  extractHeadings,
  formatTitle,
  generateDocsManifests,
  generateManifest,
  generateManifestsWithDiscovery,
  makeBreadcrumb,
  makeExcerpt,
  parseFrontmatter,
  sortItems,
  validateDocs,
  walkDocs,
  watchDocs,
  ALLOWED_FRONTMATTER_KEYS,
} from '@fsegurai/manifest-generator';

import type {
  ConfigFile,
  DiscoveredProject,
  DiscoveryOptions,
  Frontmatter,
  ManifestGenerationOptions,
  ManifestResult,
  NavigationItem,
  ProcessingResult,
  ProjectConfig,
  SearchEntry,
  ValidateResult,
} from '@fsegurai/manifest-generator';
```

> `loadConfig`, `loadConfigFromFile`, `mergeConfig`, and `parseConfigFile` live in `src/config.ts` but are **not**
> re-exported from the package root — only `defineConfig` is public. Those loader functions back the CLI's `--config`
> handling internally; if you need config-file loading in your own script, replicate the small amount of logic
> yourself (read the file, `JSON.parse` for `.json`, or evaluate the exported object for `.js`/`.ts`).

## Exported functions

### `generateManifest(projectPath: string, exclude?: string[]): ManifestResult`

Scans a single docs directory and returns the manifest plus search index in memory. Items are sorted by `order` then
label. `exclude` accepts the same glob patterns as elsewhere.

```ts
const result = generateManifest('./docs/1.0.0/content', ['drafts/**']);
console.log(result.manifest);
console.log(result.searchIndex);
```

### `discoverProjects(rootDir: string, options?: DiscoveryOptions): DiscoveredProject[]`

Finds documentation projects under a root directory. Supports `recursive: true` for nested directory structures and
`exclude` glob patterns.

```ts
// standard
const projects = discoverProjects('./docs', { docsSubfolder: 'docs' });

// recursive, with exclusions
const allProjects = discoverProjects('./packages', {
  docsSubfolder: 'docs',
  recursive: true,
  exclude: ['**/legacy/**'],
});
```

### `generateDocsManifests(docsRoot: string, optionsOrWalker?): ProcessingResult[]`

Discovers projects under a docs root and writes `manifest.json` and `search-index.json` for each one. Accepts either a
`walkerFn` function directly (for DI/testing) or an options object:

```ts
interface Options {
  docsSubfolder?: string;
  recursive?: boolean;
  exclude?: string[];
  projects?: Record<string, ProjectConfig>;
  dryRun?: boolean;
  walkerFn?: (projectPath: string, relative: string, searchIndex: SearchEntry[], exclude?: string[]) => NavigationItem[];
}
```

`projects` lets you override `docsSubfolder`/`outputDir` per discovered project name; `dryRun: true` logs what would be
written instead of writing files.

### `generateManifestsWithDiscovery(rootDir: string, options?: ManifestGenerationOptions): ProcessingResult[]`

Main orchestration function used by the CLI. Supports these modes, checked in this order:

- `route` — process one docs path directly (writes output to that path, or `outputDir` if set)
- `project` — process one named project under `rootDir`
- `autoDetect` — discover and process all matching projects (respects `recursive`, `exclude`, `projects`)

### `validateDocs(rootDir: string): ValidateResult[]`

Validates frontmatter across all markdown/MDX files in a directory (recursively) without writing any output. Returns
an array of per-file results with warnings and errors.

```ts
const results = validateDocs('./docs');
const invalid = results.filter(r => !r.valid);
console.log(`${invalid.length} files have errors`);
```

### `watchDocs(rootDir: string, onChange: (changedFile: string) => void, interval?: number): { close: () => void }`

Watches a directory for file changes by polling `mtimeMs` (default interval: 1000ms) and fires a callback with the
changed file's path. Returns an object with a `close()` method to stop watching.

```ts
const watcher = watchDocs('./docs', (changedFile) => {
  console.log('Regenerating after:', changedFile);
});
// later: watcher.close();
```

### `sortItems(items: NavigationItem[]): NavigationItem[]`

Sorts items by `order` (ascending, default `999`) then alphabetically by `label`. Recursively sorts `children`.

### `cleanItem(item: NavigationItem): NavigationItem`

Removes `null`, `false`, and empty-string (`''`) fields (and `undefined`) from a navigation item, recursing into
`children`. Used internally before writing `manifest.json`. Not applied to `search-index.json` entries.

### `formatTitle(name: string): string`

Derives a readable label from a filename or folder name — strips `.md`/`.mdx`, replaces `-` with spaces, and
title-cases each word. Used as the fallback when frontmatter has no `label`.

### `parseFrontmatter<T>(content: string): T`

Extracts and parses the leading `---`-delimited YAML block from a Markdown/MDX string using `js-yaml`
(`JSON_SCHEMA`). Returns `{}` if there's no frontmatter block or it fails to parse.

### `extractHeadings(body: string): string[]`

Extracts all `h2`/`h3` (`##`/`###`) headings from a document body and deduplicates them via `dedupeHeadings()`.

### `dedupeHeadings(headings: string[], threshold?: number): string[]`

Collapses near-identical headings using `diceSimilarity()` (default threshold: `0.7`), keeping the first occurrence of
each cluster.

### `diceSimilarity(a: string, b: string): number`

Computes the Sørensen–Dice coefficient (bigram-based similarity, 0–1) between two strings. Used by
`dedupeHeadings()`.

### `makeExcerpt(body: string, maxLength?: number): string`

Strips Markdown syntax from a document body and truncates it to roughly `maxLength` characters (default `150`),
preferring a sentence or word boundary over a hard mid-word cut.

### `makeBreadcrumb(chain: BreadcrumbSegment[], self: BreadcrumbSegment): BreadcrumbSegment[]`

Appends `self` — the item's own `{ label, route }` segment — onto `chain` (the already-resolved ancestor segments),
returning `[...chain, self]`. Every item (folder or leaf) ends up with a non-empty breadcrumb array whose final
segment is itself; a root-level page with no ancestors gets a single-segment array containing just itself. Each
ancestor folder's label is its own `breadcrumbTitle` (from that folder's `README.md`/`index.md` frontmatter) when set,
falling back to the title-cased folder name otherwise; a leaf's own `breadcrumbTitle` overrides its own final
segment's label — see [Frontmatter](../guides/frontmatter.md#breadcrumbtitle). `walkDocs()` builds the ancestor chain
and resolves each item's own segment internally as it recurses; if you call `makeBreadcrumb()` directly, you're
responsible for resolving both the chain and the `self` segment yourself.

### `walkDocs(dir: string, relative?: string, searchIndex?: SearchEntry[], exclude?: string[], chain?: BreadcrumbSegment[]): NavigationItem[]`

The recursive directory walker that builds the navigation tree and populates `searchIndex` as a side effect. Used
internally by `generateManifest()`; exposed for advanced/custom pipelines.

### `defineConfig(config: ConfigFile): ConfigFile`

Type-safe identity helper for config files. Use in `manifest-generator.config.ts`:

```ts
import { defineConfig } from '@fsegurai/manifest-generator';

export default defineConfig({
  docsSubfolder: 'docs',
  recursive: true,
  exclude: ['drafts/**'],
});
```

### `ALLOWED_FRONTMATTER_KEYS`

A readonly `Set<string>` of all 21 recognised frontmatter key names. Useful for external validation tooling:

```ts
import { ALLOWED_FRONTMATTER_KEYS } from '@fsegurai/manifest-generator';

console.log(ALLOWED_FRONTMATTER_KEYS.has('label')); // true
console.log([...ALLOWED_FRONTMATTER_KEYS]);
// => ['label', 'description', 'tags', 'keywords', 'order', 'isTitle', 'isParent', 'icon', 'iconType', 'badge',
//     'badgeColor', 'breadcrumbTitle', 'layout', 'redirect', 'externalUrl', 'deprecated', 'deprecatedAlternative',
//     'publishedAt', 'updatedAt', 'draft', 'hidden']
```

## Current behaviour

- Missing output directories are created automatically (skipped under `dryRun`).
- Missing docs roots produce a hard error (`Error: Route not found: ...` / `Error: Project not found: ...`).
- When a docs subfolder exists, discovery prefers it over the direct-markdown fallback.
- Items are sorted by `order` frontmatter, then alphabetically by `label`.
- Output is cleaned (`manifest.json`) — no `null`/`false`/`''` fields.
- `draft` and `hidden` frontmatter remove pages from output.
- Both `.md` and `.mdx` files are processed.
- `exclude` glob patterns are honored by discovery, walking, and manifest generation alike.

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
