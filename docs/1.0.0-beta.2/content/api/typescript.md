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
  keywords?: string[];
  breadcrumbTitle?: string;
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

The `type` field now includes `'recursive'` when the project was found via recursive discovery.

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
