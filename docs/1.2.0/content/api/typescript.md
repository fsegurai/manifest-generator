# TypeScript

All public interfaces live in `packages/manifest-generator/src/types.ts` and are re-exported from the package root.
Since `1.2.0`, the types that describe the generated files are also available from the types-only entry
`@fsegurai/manifest-generator/schema` — see [Types and JSON Schema](schema.md).

## Exported interfaces

### `BreadcrumbSegment`

```ts
interface BreadcrumbSegment {
  label: string;
  route: string;
}
```

### `NavigationItem`

```ts
interface NavigationItem {
  label: string;
  route?: string;
  tags?: string[];
  isTitle?: boolean;
  isParent?: boolean;
  description?: string;
  icon?: string | null;
  iconType?: string | null;
  badge?: string | null;
  badgeColor?: string | null;
  order?: number;
  redirect?: string;
  externalUrl?: string;
  breadcrumbTitle?: string;
  breadcrumb?: BreadcrumbSegment[];
  layout?: string;
  deprecated?: boolean;
  deprecatedAlternative?: string;
  publishedAt?: string;
  updatedAt?: string;
  keywords?: string[];
  prev?: PageLink; // only with the prevNext option (1.2.0+)
  next?: PageLink; // only with the prevNext option (1.2.0+)
  meta?: Record<string, unknown>; // only with the extraFrontmatter option (1.2.0+)
  wordCount?: number;             // only with the readingTime option (1.2.0+)
  readingTime?: number;           // minutes; only with the readingTime option (1.2.0+)
  children?: NavigationItem[];
}
```

### `PageLink`

Since `1.2.0`. An adjacent page in reading order, written on page items by the `prevNext` option.

```ts
interface PageLink {
  label: string;
  route: string;
}
```

### `SearchEntry`

```ts
interface SearchEntry {
  label: string;
  description?: string;
  route: string;
  tags?: string[];
  headings?: string[];
  excerpt?: string;
  breadcrumb?: BreadcrumbSegment[];
  sections?: PageSection[]; // only with the headingAnchors option (1.2.0+)
  hidden?: boolean;         // true for a `hidden: true` page (1.2.0+)
}
```

### `PageSection`

Since `1.2.0`. One `##` / `###` heading of a page, written in `sections` by the `headingAnchors` option.

```ts
interface PageSection {
  text: string;  // plain heading text, without Markdown markup
  id: string;    // GitHub-style slug, unique in the page (intro, intro-1, …)
  level: 2 | 3;
}
```

### `ManifestResult`

```ts
interface ManifestResult {
  manifest: NavigationItem[];
  searchIndex: SearchEntry[];
}
```

### `DiscoveredProject`

```ts
interface DiscoveredProject {
  name: string;
  projectPath: string;
  docsPath: string;
  type: 'subfolder' | 'direct' | 'recursive';
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

### `DiscoveryOptions`

```ts
interface DiscoveryOptions {
  docsSubfolder?: string;
  recursive?: boolean;
  exclude?: string[];
}
```

### `ManifestGenerationOptions`

```ts
interface ManifestGenerationOptions {
  project?: string | null;
  route?: string | null;
  outputDir?: string | null;
  docsSubfolder?: string;
  autoDetect?: boolean;
  recursive?: boolean;
  exclude?: string[];
  projects?: Record<string, ProjectConfig>;
  dryRun?: boolean;
  prevNext?: boolean;                // 1.2.0+
  headingAnchors?: boolean;   // 1.2.0+
  extraFrontmatter?: boolean; // 1.2.0+
  readingTime?: boolean;      // 1.2.0+
  frontmatterAliases?: FrontmatterAliases; // 1.2.0+
}
```

### `ManifestOptions`, `ManifestFromFilesOptions`, `ValidateOptions`

Since `1.2.0`. Option objects of `generateManifest()`, `generateManifestFromFiles()`, and `validateDocs()`.

```ts
type FrontmatterAliases = Record<string, string>; // { sourceKey: targetKey }, e.g. { title: 'label' }

interface WalkOptions {
  frontmatterAliases?: FrontmatterAliases;
  headingAnchors?: boolean;   // write `sections` on search entries (default false)
  extraFrontmatter?: boolean; // write `meta` on page items (default false)
  readingTime?: boolean;      // write `wordCount` / `readingTime` on page items (default false)
}

interface ManifestOptions extends WalkOptions {
  prevNext?: boolean; // default false
}

interface ManifestFromFilesOptions extends ManifestOptions {
  exclude?: string[];
}

interface ValidateOptions {
  frontmatterAliases?: FrontmatterAliases;
  ignoreKeys?: string[];
}
```

### `InMemoryFile` and `DocsReader`

Since `1.2.0`. Inputs of the browser-safe core — see [Browser-safe Core](core.md).

```ts
interface InMemoryFile {
  path: string; // relative to the docs root, e.g. 'guides/theming.md'
  content: string;
}

interface DocsReader {
  list(dir: string): { name: string; isDirectory: boolean; isFile: boolean }[];
  read(file: string): string;
  exists(file: string): boolean;
  join(...parts: string[]): string;
}
```

### `Frontmatter`

```ts
interface Frontmatter {
  label?: string;
  description?: string;
  tags?: string[];
  isTitle?: boolean;
  isParent?: boolean;
  icon?: string | null;
  iconType?: string | null;
  badge?: string | null;
  badgeColor?: string | null;
  draft?: boolean;
  hidden?: boolean;
  order?: number;
  redirect?: string;
  externalUrl?: string;
  breadcrumbTitle?: string;
  layout?: string;
  deprecated?: boolean;
  deprecatedAlternative?: string;
  publishedAt?: string;
  updatedAt?: string;
  keywords?: string[];
}
```

### `ProjectConfig`

```ts
interface ProjectConfig {
  docsSubfolder?: string;
  outputDir?: string;
}
```

Per-project override, keyed by project name inside `ConfigFile.projects`. This shape changed from
`1.0.0-beta.3` — it no longer carries `name`, `docsRoot`, `autoDetect`, or `recursive`; those remain
top-level/CLI-only concerns.

### `ConfigFile`

```ts
interface ConfigFile {
  docsRoot?: string;
  docsSubfolder?: string;
  outputDir?: string;
  recursive?: boolean;
  exclude?: string[];
  projects?: Record<string, ProjectConfig>;
  prevNext?: boolean;                      // 1.2.0+
  headingAnchors?: boolean;   // 1.2.0+
  extraFrontmatter?: boolean; // 1.2.0+
  readingTime?: boolean;      // 1.2.0+
  frontmatterAliases?: FrontmatterAliases; // 1.2.0+
  ignoreKeys?: string[];                   // 1.2.0+
}
```

There is no `project`, `route`, or `autoDetect` field — see [Configuration](../guides/configuration.md).

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

## Usage example

```ts
import type { ManifestResult, NavigationItem, ValidateResult } from '@fsegurai/manifest-generator';

function render(items: NavigationItem[]) {
  return items.map(item => item.label);
}
```

## Next step

Read [API Reference](reference.md) for the functions that use these types.
