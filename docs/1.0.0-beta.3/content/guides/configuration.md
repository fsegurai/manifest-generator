# Configuration

Configuration is driven by CLI flags, a config file, or the programmatic API. When both a config file and CLI flags are
provided, CLI flags take precedence.

## Config file

Place a `manifest-generator.config.ts`, `.js`, or `.json` file in your project root.

```ts
// manifest-generator.config.ts
import {defineConfig} from '@fsegurai/manifest-generator';

export default defineConfig({
    docsSubfolder: 'docs',
    recursive: true,
});
```

The `--config <path>` flag overrides auto-detection:

```bash
npx @fsegurai/manifest-generator --config ./config/manifest-generator.config.json
```

### Config file format

```json
{
    "project": "my-package",
    "route": null,
    "outputDir": "./public/docs-data",
    "docsSubfolder": "docs",
    "autoDetect": false,
    "recursive": false
}
```

All fields are optional. Values are merged with CLI flags, with CLI flags taking priority.

### `defineConfig`

Type-safe helper for `.ts` config files:

```ts
import {defineConfig} from '@fsegurai/manifest-generator';

export default defineConfig({
    project: 'my-package',
    outputDir: './dist/manifests',
});
```

### Config file lookup order

When no `--config` flag is given, the tool looks for (in order):

1. `manifest-generator.config.ts`
2. `manifest-generator.config.js`
3. `manifest-generator.config.json`

The first one found is used.

## `--init` scaffold

The `--init` command creates a complete starter setup:

```bash
npx @fsegurai/manifest-generator --init
```

This generates:

- `manifest-generator.config.ts` — config file with `docsSubfolder: 'docs'`
- `docs/` folder with 7 sample Markdown files demonstrating frontmatter features (label, tags, order, icon, badge,
  deprecated, externalUrl, and more)

## Programmatic API

```ts
import {generateManifestsWithDiscovery} from '@fsegurai/manifest-generator';

const results = generateManifestsWithDiscovery('./docs', {
    autoDetect: true,
    docsSubfolder: 'docs',
    outputDir: './docs/1.0.0-beta.3',
});
```

## `ConfigFile`

```ts
interface ConfigFile {
    project?: string | null;
    route?: string | null;
    outputDir?: string | null;
    docsSubfolder?: string;
    autoDetect?: boolean;
    recursive?: boolean;
}
```

| Field           | Default  | Purpose                                     |
|-----------------|----------|---------------------------------------------|
| `project`       | `null`   | Process one named project                   |
| `route`         | `null`   | Process one specific docs path              |
| `outputDir`     | `null`   | Write files to a different directory        |
| `docsSubfolder` | `'docs'` | Folder name discovery looks for             |
| `autoDetect`    | `false`  | Discover and process every matching project |
| `recursive`     | `false`  | Scan nested directories for projects        |

## `DiscoveryOptions`

```ts
interface DiscoveryOptions {
    docsSubfolder?: string;  // default: 'docs'
    recursive?: boolean;     // default: false
}
```

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
