# API Reference

The package exports its programmatic API from the package root (`@fsegurai/manifest-generator`, built from
`packages/manifest-generator/src/index.ts`). It is designed for Node.js and Bun-based tooling, with file-system access
for docs scanning and JSON output.

For browsers and other non-Node runtimes, use the browser-safe entry `@fsegurai/manifest-generator/core` — see
[Browser-safe Core](core.md). Apps that only read the generated files can import types from
`@fsegurai/manifest-generator/schema` — see [Types and JSON Schema](schema.md).

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
  // 1.2.0+
  applyFrontmatterAliases,
  applyPrevNext,
  generateManifestFromFiles,
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
  // 1.2.0+
  BreadcrumbSegment,
  DocsReader,
  FrontmatterAliases,
  InMemoryFile,
  ManifestFromFilesOptions,
  ManifestOptions,
  PageLink,
  ValidateOptions,
  WalkOptions,
} from '@fsegurai/manifest-generator';
```

> `loadConfig`, `loadConfigFromFile`, `mergeConfig`, and `parseConfigFile` live in `src/config.ts` but are **not**
> re-exported from the package root — only `defineConfig` is public. Those loader functions back the CLI's `--config`
> handling internally; if you need config-file loading in your own script, replicate the small amount of logic
> yourself (read the file, `JSON.parse` for `.json`, or evaluate the exported object for `.js`/`.ts`).

## Exported functions

### `generateManifest(projectPath: string, exclude?: string[], options?: ManifestOptions): ManifestResult`

Scans a single docs directory and returns the manifest plus search index in memory. Items are sorted by `order` then
label. `exclude` accepts the same glob patterns as elsewhere. Since `1.2.0`, `options.prevNext` adds `prev` / `next`
links to page items (see [Previous / next links](../guides/configuration.md#prevnext--previous--next-links)), and
`options.frontmatterAliases` maps foreign frontmatter keys (see
[Frontmatter aliases](../guides/frontmatter.md#frontmatter-aliases)).

```ts
const result = generateManifest('./docs/1.2.0/content', ['drafts/**']);
console.log(result.manifest);
console.log(result.searchIndex);

// 1.2.0+
const withLinks = generateManifest('./notes', [], { prevNext: true, frontmatterAliases: { title: 'label' } });
```

### `generateManifestFromFiles(files: InMemoryFile[], options?: ManifestFromFilesOptions): ManifestResult`

Since `1.2.0`. Builds the same result as `generateManifest()` from in-memory `{ path, content }` files, without the file
system. Also exported from the browser-safe `@fsegurai/manifest-generator/core` entry — see
[Browser-safe Core](core.md).

```ts
const { manifest } = generateManifestFromFiles(
  [{ path: 'README.md', content: '---\nlabel: Home\n---\n# Welcome' }],
  { prevNext: true },
);
```

### `applyPrevNext(items: NavigationItem[]): NavigationItem[]`

Since `1.2.0`. Returns the manifest with `prev` / `next` links on its page items. This is what the `prevNext` option
runs after walking.

### `applyFrontmatterAliases(frontmatter, aliases): Frontmatter`

Since `1.2.0`. Returns a copy of `frontmatter` where each alias key fills its target key when the target is not set.
For example, with `{ title: 'label' }`, `{ title: 'Intro' }` becomes `{ title: 'Intro', label: 'Intro' }`.

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
  prevNext?: boolean;                          // 1.2.0+
  headingAnchors?: boolean;                    // 1.2.0+
  extraFrontmatter?: boolean;                  // 1.2.0+
  readingTime?: boolean;                       // 1.2.0+
  frontmatterAliases?: Record<string, string>; // 1.2.0+
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

### `validateDocs(rootDir: string, options?: ValidateOptions): ValidateResult[]`

Validates frontmatter across all markdown/MDX files in a directory (recursively) without writing any output. Returns
an array of per-file results with warnings and errors. Since `1.2.0`, `options.frontmatterAliases` validates aliased
keys as their targets (and stops reporting the alias keys as unknown), and `options.ignoreKeys` lists keys never
reported as unknown.

```ts
const results = validateDocs('./docs');
const invalid = results.filter(r => !r.valid);
console.log(`${invalid.length} files have errors`);

// 1.2.0+: notes written for another tool
validateDocs('./notes', { frontmatterAliases: { title: 'label' }, ignoreKeys: ['mood'] });
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

Extracts all `h2`/`h3` (`##`/`###`) headings from a document body and deduplicates them via `dedupeHeadings()`. Since
`1.2.0`, lines inside fenced code blocks (```` ``` ```` / `~~~`) are skipped, so a `## comment` in a code sample is no
longer read as a heading.

### `extractSections(body: string): PageSection[]`

Since `1.2.0`. Returns the `##` / `###` ATX headings of a body (outside fenced code) as `{ text, id, level }`, with the
GitHub-style id a slugger gives each one: lower-cased, unique in the page (`intro`, `intro-1`, …), counting headings of
every level. This is what the `headingAnchors` option writes in `sections`.

```ts
extractSections('# Guide\n## Getting *started*\n## Getting started');
// [{ text: 'Getting started', id: 'getting-started', level: 2 },
//  { text: 'Getting started', id: 'getting-started-1', level: 2 }]
```

### `slugifyHeading(text: string): string`

Since `1.2.0`. The GitHub-style slug of a heading text (as `github-slugger`), without the uniqueness suffix:
`slugifyHeading('Hello, World!')` → `'hello-world'`.

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
ancestor folder's label is resolved from its `README.md`/`README.mdx`/`index.md`/`index.mdx` frontmatter —
`breadcrumbTitle`, then `label`, then the title-cased folder name; a leaf's own `breadcrumbTitle` overrides its own final
segment's label — see [Frontmatter](../guides/frontmatter.md#breadcrumbtitle). `walkDocs()` builds the ancestor chain
and resolves each item's own segment internally as it recurses; if you call `makeBreadcrumb()` directly, you're
responsible for resolving both the chain and the `self` segment yourself.

### `walkDocs(dir: string, relative?: string, searchIndex?: SearchEntry[], exclude?: string[], chain?: BreadcrumbSegment[], options?: WalkOptions): NavigationItem[]`

The recursive directory walker that builds the navigation tree and populates `searchIndex` as a side effect. Used
internally by `generateManifest()`; exposed for advanced/custom pipelines. Since `1.2.0` it is the file-system form of
`walkTree` from [`@fsegurai/manifest-generator/core`](core.md), and `options.frontmatterAliases` applies aliases.

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
- `draft` frontmatter removes a page from both outputs; `hidden` removes it from `manifest.json` only (its search entry
  stays, with `hidden: true`).
- Both `.md` and `.mdx` files are processed.
- `exclude` glob patterns are honored by discovery, walking, and manifest generation alike.
- `prev` / `next` links are written only when `prevNext` is set (1.2.0+); default output is unchanged.
- `sections`, `meta`, and `wordCount` / `readingTime` are written only with `headingAnchors`, `extraFrontmatter`, and
  `readingTime` (1.2.0+); default output is unchanged.

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
