---
label: Browser-safe Core
description: Use @fsegurai/manifest-generator/core in browsers and other non-Node runtimes, including generateManifestFromFiles.
tags: [ "api", "core", "browser", "in-memory" ]
keywords: [ "generateManifestFromFiles", "walkTree", "createMemoryReader", "playground" ]
---

# Browser-safe Core

Since `1.2.0`, the package has a second entry, `@fsegurai/manifest-generator/core`, with no `node:*` imports. It runs
in browsers, web workers, edge runtimes, and docs playgrounds, where the package root (which reads the file system)
cannot load.

## When to use it

| You want to…                                                 | Import from                               |
|----------------------------------------------------------------|-------------------------------------------|
| Generate files from a docs folder in Node.js or Bun          | `@fsegurai/manifest-generator`            |
| Build a manifest from files held in memory (browser, worker) | `@fsegurai/manifest-generator/core`       |
| Only read `manifest.json` / `search-index.json` with types    | `@fsegurai/manifest-generator/schema` ([Types and JSON Schema](schema.md)) |

## `generateManifestFromFiles(files, options?)`

```ts
function generateManifestFromFiles(files: InMemoryFile[], options?: ManifestFromFilesOptions): ManifestResult;

interface InMemoryFile {
  path: string;    // relative to the docs root, `/` separators, e.g. 'guides/theming.md'
  content: string; // the raw Markdown/MDX, frontmatter included
}

interface ManifestFromFilesOptions {
  exclude?: string[];                          // glob patterns, as in the config `exclude`
  prevNext?: boolean;                          // write prev/next links (default false)
  headingAnchors?: boolean;                    // write `sections` on search entries (default false)
  extraFrontmatter?: boolean;                  // write `meta` on page items (default false)
  readingTime?: boolean;                       // write `wordCount` / `readingTime` (default false)
  frontmatterAliases?: Record<string, string>; // e.g. { title: 'label' }
}
```

It returns the same `{ manifest, searchIndex }` as `generateManifest(dir)` for the same tree on disk: same labels,
routes, breadcrumbs, folder labels, sorting, and search-index order (in-memory directories are listed by name, which
matches Node's `readdir` order). Paths are normalised: `\` becomes `/`, and a leading `./` or `/` is dropped.

```ts
import { cleanItem, generateManifestFromFiles } from '@fsegurai/manifest-generator/core';

const { manifest, searchIndex } = generateManifestFromFiles(
  [
    { path: 'README.md', content: '---\nlabel: Home\n---\n# Welcome' },
    { path: 'guides/README.md', content: '---\nlabel: Guides\n---\n# Guides' },
    { path: 'guides/theming.md', content: '---\nlabel: Theming\norder: 1\n---\n## Colors\n\nPick a palette.' },
    { path: 'drafts/ideas.md', content: '---\nlabel: Ideas\n---\n# Ideas' },
  ],
  { exclude: ['drafts/**'], prevNext: true },
);

// What manifest.json would contain (the CLI strips empty fields the same way)
const manifestJson = JSON.stringify(manifest.map(cleanItem), null, 2);
const searchIndexJson = JSON.stringify(searchIndex, null, 2);
```

## In the browser

Any bundler (Vite, webpack, Rollup, esbuild) resolves the `./core` export. Without a bundler, load the ESM build from a
CDN:

```html
<script type="module">
  import { generateManifestFromFiles } from 'https://cdn.jsdelivr.net/npm/@fsegurai/manifest-generator@1.2.0/dist/core.esm.js';

  const { manifest } = generateManifestFromFiles([
    { path: 'README.md', content: '---\nlabel: Home\n---\n# Welcome' },
  ]);
  document.querySelector('pre').textContent = JSON.stringify(manifest, null, 2);
</script>
<pre></pre>
```

`dist/core.esm.js` is self-contained: the YAML parser (`js-yaml`) is bundled in and the file has no `import`
statements, so it loads from any CDN or static host without an import map.

## Other exports

`/core` also exports the pure helpers of the package root, so playgrounds can run single steps:

- `parseFrontmatter`, `getBody`, `formatTitle`, `extractHeadings`, `dedupeHeadings`, `diceSimilarity`, `makeExcerpt`
- `extractSections(body)` and `slugifyHeading(text)` — the heading anchors of the `headingAnchors` option
- `cleanItem`, `sortItems`, `makeBreadcrumb`, `isMarkdownFile`, `isExcluded`
- `ALLOWED_FRONTMATTER_KEYS`
- `applyPrevNext(items)` — adds `prev` / `next` links to an already-built manifest
- `applyFrontmatterAliases(frontmatter, aliases)` — applies `frontmatterAliases` to one parsed frontmatter object
- `walkTree(reader, dir, relative?, searchIndex?, exclude?, chain?, options?)` — the walker shared with `walkDocs`,
  over any `DocsReader` (`list`, `read`, `exists`, `join`)
- `createMemoryReader(files)` — the `DocsReader` used by `generateManifestFromFiles`

`validateDocs`, `walkDocs`, `watchDocs`, and the project-discovery functions read the file system, so they stay in the
package root only.

## Next step

- [Types and JSON Schema](schema.md) — type the generated files and validate them
- [Reference](reference.md) — the Node.js API
