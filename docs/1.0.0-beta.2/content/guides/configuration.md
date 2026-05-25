# Configuration

Configuration is driven by CLI flags or the programmatic API.

## Programmatic API

```ts
import {generateManifestsWithDiscovery} from '@fsegurai/manifest-generator';

const results = generateManifestsWithDiscovery('./docs', {
    autoDetect: true,
    docsSubfolder: 'docs',
    outputDir: './docs/1.0.0-beta.2',
});
```

## `DiscoveryOptions`

```ts
interface DiscoveryOptions {
    docsSubfolder?: string;  // default: 'docs'
    recursive?: boolean;     // default: false
}
```

| Option          | Default  | Purpose                                    |
|-----------------|----------|--------------------------------------------|
| `docsSubfolder` | `'docs'` | Change the folder name discovery looks for |
| `recursive`     | `false`  | Scan nested directories for projects       |

## `ManifestGenerationOptions`

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

| Option          | Meaning                                                     |
|-----------------|-------------------------------------------------------------|
| `project`       | Process one named project under the docs root               |
| `route`         | Process one specific docs path (writes output to that path) |
| `outputDir`     | Write generated files to a different directory              |
| `docsSubfolder` | Look for docs in a folder other than `docs`                 |
| `autoDetect`    | Discover and process every matching project                 |
| `recursive`     | Recursively discover projects in nested directories         |

## Sorting

Navigation items are sorted by `order` (ascending), then alphabetically by `label`. Set the `order` frontmatter property
to control position:

```md
---
label: First
order: 1
---
```

Files without `order` default to `999` and sort alphabetically at the end.

## Output format

The `cleanItem()` function strips null, false, and empty string fields from `manifest.json` entries, producing minimal
output. Fields like `icon`, `badge`, `iconType`, `badgeColor` only appear when non-null.

## Frontmatter

Full reference in the [Frontmatter guide](frontmatter.md). Key additions:

- `order` — explicit sort weight
- `redirect` / `externalUrl` — route aliases
- `slug` — path override (via route)
- `breadcrumbTitle` — shorter label
- `layout` — page layout identifier
- `deprecated` + `deprecatedAlternative` — deprecation metadata
- `publishedAt` / `updatedAt` — dates
- `keywords` — extra search terms

## Validate mode

Use `validateDocs()` programmatically to check frontmatter without writing files:

```ts
import {validateDocs} from '@fsegurai/manifest-generator';

const results = validateDocs('./docs');
for (const result of results) {
    if (!result.valid) {
        console.error(result.file, result.errors);
    }
}
```

## Watch mode

Use `watchDocs()` for live regeneration on file changes:

```ts
import {watchDocs, generateManifestsWithDiscovery} from '@fsegurai/manifest-generator';

const watcher = watchDocs('./docs', (changedFile) => {
    console.log('Change detected:', changedFile);
    generateManifestsWithDiscovery('./docs', {autoDetect: true});
});

// Stop watching later:
watcher.close();
```

## Next step

Read [Project Structure](project-structure.md) to see how discovery behaves in practice.
