# Configuration

Configuration is driven by CLI flags or the programmatic API.
The current API exports `DiscoveryOptions` and `ManifestGenerationOptions` from the package root.

## Programmatic API

```ts
import { generateManifestsWithDiscovery } from '@fsegurai/manifest-generator';

const results = generateManifestsWithDiscovery('./docs', {
  autoDetect: true,
  docsSubfolder: 'docs',
  outputDir: './docs/1.0.0-beta.2',
});
```

## `DiscoveryOptions`

```ts
interface DiscoveryOptions {
  docsSubfolder?: string;
}
```

Use this to change the folder name the discovery pass looks for.

## `ManifestGenerationOptions`

```ts
interface ManifestGenerationOptions {
  project?: string | null;
  route?: string | null;
  outputDir?: string | null;
  docsSubfolder?: string;
  autoDetect?: boolean;
}
```

### What each option does

| Option | Meaning |
|--------|---------|
| `project` | Process one named project under the docs root |
| `route` | Process one specific docs path |
| `outputDir` | Write generated files to a different directory |
| `docsSubfolder` | Look for docs in a folder other than `docs` |
| `autoDetect` | Discover and process every matching project |

## Frontmatter

The generator reads simple YAML frontmatter from Markdown files.
The current implementation uses `label`, not `title`, for the displayed navigation label.

```md
---
label: Custom Page Title
description: Short summary for search
tags: [guide, api]
---
```

### Supported fields

- `label`
- `description`
- `tags`
- `isTitle`
- `isParent`
- `icon`
- `iconType`
- `badge`
- `badgeColor`
- `draft`
- `hidden`

## Next step

Read [Project Structure](project-structure.md) to see how discovery behaves in practice.
