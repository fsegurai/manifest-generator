---
label: What's New in 1.2.0
description: Release notes for @fsegurai/manifest-generator 1.2.0 — browser-safe core, types and JSON Schemas, prev/next links, heading anchors, extra frontmatter, reading time, searchable hidden pages, frontmatter aliases, and ignored keys.
tags: [ "release-notes", "changelog", "upgrade" ]
keywords: [ "1.2.0", "core", "schema", "prevNext", "headingAnchors", "extraFrontmatter", "readingTime", "hidden", "frontmatterAliases", "ignoreKeys" ]
---

# What's New in 1.2.0

`1.2.0` is a minor release. New output fields are opt-in or live in a new entry point. With the same config and flags,
`manifest.json` and `search-index.json` are identical to `1.1.0`, with two exceptions (see
[Behaviour changes](#behaviour-changes)): `hidden: true` pages now stay in the search index, and `##` lines inside
fenced code blocks are no longer listed as headings.

## Highlights

### Browser-safe core entry

`@fsegurai/manifest-generator/core` has no `node:*` imports, so it runs in browsers, workers, and docs playgrounds. It
exposes the pure helpers plus `generateManifestFromFiles([{ path, content }], options)`, which returns the same
manifest and search index as `generateManifest(dir)` for the same tree.

```ts
import { generateManifestFromFiles } from '@fsegurai/manifest-generator/core';

const { manifest, searchIndex } = generateManifestFromFiles([
  { path: 'README.md', content: '---\nlabel: Home\n---\n# Welcome' },
  { path: 'guides/theming.md', content: '---\nlabel: Theming\n---\n## Colors' },
]);
```

See [Browser-safe Core](api/core.md).

### Types and JSON Schema entry

`@fsegurai/manifest-generator/schema` is a types-only entry (`NavigationItem`, `SearchEntry`, `BreadcrumbSegment`,
`PageLink`, `Frontmatter`, …), and the package ships `schema/manifest.schema.json` and
`schema/search-index.schema.json` to validate the generated files.

```ts
import type { NavigationItem, SearchEntry } from '@fsegurai/manifest-generator/schema';
```

See [Types and JSON Schema](api/schema.md).

### Previous / next links

The opt-in `prevNext` option (`--prev-next`, config `prevNext: true`) writes `prev` / `next` (`{ label, route }`) on
page items in manifest reading order.

```bash
npx @fsegurai/manifest-generator --route ./docs --prev-next
```

See [Previous / next links](guides/configuration.md#prevnext--previous--next-links).

### Heading anchors

The opt-in `headingAnchors` option (`--heading-anchors`, config `headingAnchors: true`) writes `sections` on search
entries: each `##` / `###` heading as `{ text, id, level }`, so a search result can link to `route#id`. The ids are
GitHub-style slugs, unique in the page, the same ones `github-slugger`, `marked-gfm-heading-id`, and ngx-markdown's
`headingIds` give.

```json
"sections": [{ "text": "Getting started", "id": "getting-started", "level": 2 }]
```

### Extra frontmatter

The opt-in `extraFrontmatter` option (`--extra-frontmatter`, config `extraFrontmatter: true`) copies the frontmatter keys
the generator does not know into `meta` on page items, so your app can read its own fields (`owner`, `status`, …)
without a generator release.

### Reading time

The opt-in `readingTime` option (`--reading-time`, config `readingTime: true`) writes `wordCount` (code blocks excluded)
and `readingTime` (minutes at 200 words per minute, rounded up) on page items.

See [Configuration](guides/configuration.md#headinganchors--section-anchors-in-the-search-index) for all three.

### Frontmatter aliases and ignored keys

Config `frontmatterAliases` (for example `{ title: 'label' }`, no defaults) maps foreign keys for generation and
validation when the target key is not set. `ignoreKeys` / `--ignore-keys a,b` stops `--validate` from reporting those
keys as unknown. `validateDocs()` takes an optional options argument with both.

```json
{
  "frontmatterAliases": { "title": "label", "created": "publishedAt", "updated": "updatedAt" },
  "ignoreKeys": ["mood"]
}
```

See [Frontmatter aliases](guides/frontmatter.md#frontmatter-aliases).

### Config validation for the new keys

A wrong-typed `prevNext` / `headingAnchors` / `extraFrontmatter` / `readingTime` / `frontmatterAliases` / `ignoreKeys`,
or an alias to an unknown frontmatter key, stops the
CLI with `Error: Invalid config: …` (exit code `1`) instead of being ignored.

## Behaviour changes

- **Hidden pages stay searchable.** `hidden: true` now leaves a page out of `manifest.json` only, as the docs always
  described it. The page stays routable, and its search entry stays in `search-index.json`, flagged `"hidden": true`,
  so a search UI can show or filter it. `prev` / `next` links skip it. Before 1.2.0, `hidden` dropped the page from both
  files, like `draft`. `draft: true` is unchanged, and wins when both are set. To keep a page out of search, use
  `draft: true` or filter on `hidden` in your search UI.
- **Code samples are no longer read as headings.** `extractHeadings()` (the `headings` field of search entries) skips
  lines inside fenced code blocks (```` ``` ```` / `~~~`), so a `## comment` in a shell sample no longer shows up.

## API additions

| Export                                   | Entry                    | Purpose                                                    |
|------------------------------------------|--------------------------|--------------------------------------------------------------|
| `generateManifestFromFiles(files, opts)` | root, `/core`            | Manifest and search index from in-memory files              |
| `applyPrevNext(items)`                   | root, `/core`            | Add `prev` / `next` links to a built manifest               |
| `applyFrontmatterAliases(fm, aliases)`   | root, `/core`            | Apply aliases to one parsed frontmatter object              |
| `walkTree(reader, …)`, `createMemoryReader(files)` | `/core`        | The walker shared with `walkDocs`, and its in-memory reader |
| `extractSections(body)`, `slugifyHeading(text)` | root, `/core`     | Heading anchors (`{ text, id, level }`) and their slug      |
| `generateManifest(dir, exclude, options)` | root                    | New optional `options` (`prevNext`, `headingAnchors`, `extraFrontmatter`, `readingTime`, `frontmatterAliases`) |
| `validateDocs(dir, options)`             | root                     | New optional `options` (`frontmatterAliases`, `ignoreKeys`) |
| `PageLink`, `PageSection`, `ManifestOptions`, `ValidateOptions`, `InMemoryFile`, `DocsReader`, `FrontmatterAliases` | root (`/core`, `/schema` for some) | New types |

## New CLI flags

| Flag                   | Purpose                                                               |
|------------------------|-------------------------------------------------------------------------|
| `--prev-next`          | Write `prev` / `next` links on each page item of the manifest          |
| `--heading-anchors`    | Write h2/h3 `sections` (text, id, level) on search entries             |
| `--extra-frontmatter`  | Copy unknown frontmatter keys into `meta` on page items                 |
| `--reading-time`       | Write `wordCount` / `readingTime` on page items                         |
| `--ignore-keys <keys>` | Comma-separated frontmatter keys `--validate` must not report as unknown |

## Infrastructure

- Biome 2.6 (`biome.json` migrated); `*.md`, `*.yml`, and `*.yaml` stay out of the lint scope.
- `pkg:build` runs a second Vite pass (`vite build --mode entries`) that emits `dist/core.{esm.js,cjs}` and
  `dist/schema.{esm.js,cjs}`.
- Dependency updates: `marked` `18.2.1`; dev dependencies `@biomejs/biome` `2.6.8`, `@types/node` `26.6.6`,
  `bun-types` `1.4.5`, `portless` `0.18.1`, `rimraf` `6.1.4`, `vite` `8.3.8`, `vite-plugin-dts` `5.1.2`.

## Upgrading from 1.1.0

No changes are required, unless you rely on `hidden: true` pages being absent from `search-index.json` (see
[Behaviour changes](#behaviour-changes)). Install the new version:

```bash
npm install --save-dev @fsegurai/manifest-generator@1.2.0
```

If your config file already contains a `prevNext`, `headingAnchors`, `extraFrontmatter`, `readingTime`,
`frontmatterAliases`, or `ignoreKeys` key with a different meaning
or type, the CLI now reports it as `Error: Invalid config: …` instead of ignoring it.

See `CHANGELOG.md` in the repository root for the complete changelog.
