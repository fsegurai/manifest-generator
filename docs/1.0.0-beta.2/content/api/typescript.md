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
  type: 'subfolder' | 'direct';
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
}
```

## Usage example

```ts
import type { ManifestResult, NavigationItem } from '@fsegurai/manifest-generator';

function render(items: NavigationItem[]) {
  return items.map(item => item.label);
}
```

## Next step

Read [API Reference](reference.md) for the functions that use these types.
