# TypeScript

All public interfaces live in `packages/manifest-generator/src/types.ts` and are re-exported from the package root.

## Exported interfaces

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
  layout?: string;
  deprecated?: boolean;
  deprecatedAlternative?: string;
  publishedAt?: string;
  updatedAt?: string;
  keywords?: string[];
  children?: NavigationItem[];
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
  breadcrumb?: string;
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
