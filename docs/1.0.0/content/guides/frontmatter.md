# Frontmatter

The parser reads a YAML block at the top of each Markdown or MDX file and maps it to navigation items and search
entries. The parser uses `js-yaml` v5 (`JSON_SCHEMA`) for robust YAML parsing.

## Example

```md
---
label: Custom Page Title
description: Short summary for search
tags: [guide, api]
order: 1
icon: book
badge: New
badgeColor: green
---
```

## All 21 supported fields

This is the exact list from the package's `ALLOWED_FRONTMATTER_KEYS` export:

| Field                   | Type     | Purpose                                                                    |
|-------------------------|----------|------------------------------------------------------------------------------|
| `label`                 | string   | Navigation label shown in the manifest (falls back to the filename)        |
| `description`           | string   | Search description                                                          |
| `tags`                  | string[] | Search tags                                                                 |
| `keywords`               | string[] | Additional search-relevant keywords (not shown in nav; not in search index)|
| `order`                 | number   | Sort weight — lower values appear first (default `999`)                    |
| `isTitle`               | boolean  | Mark an item as title-only (`route` becomes `#`)                           |
| `isParent`              | boolean  | Mark an item as a parent node                                              |
| `icon`                  | string   | Optional icon name                                                          |
| `iconType`              | string   | Optional icon source/type                                                  |
| `badge`                 | string   | Optional badge text                                                        |
| `badgeColor`            | string   | Optional badge color                                                       |
| `breadcrumbTitle`       | string   | On a folder: overrides its own label in descendants' breadcrumbs. On a leaf: overrides its own final breadcrumb segment; see [note](#breadcrumbtitle) below |
| `layout`                | string   | Custom page layout identifier for the consuming frontend                   |
| `redirect`              | string   | URL to redirect this page to                                               |
| `externalUrl`           | string   | Link to an external resource instead of a doc page                        |
| `deprecated`            | boolean  | Flag this page as outdated                                                 |
| `deprecatedAlternative` | string   | Suggests a migration path (route or URL)                                  |
| `publishedAt`           | date     | ISO date string when the page was published                               |
| `updatedAt`             | date     | ISO date string when the page was last updated                            |
| `draft`                 | boolean  | Exclude from output entirely                                               |
| `hidden`                | boolean  | Exclude from output entirely (same effect as `draft`)                     |

### `breadcrumbTitle`

`breadcrumbTitle` has two mechanics depending on where it's set:

1. **On a folder's own `README.md`/`index.md`** (README wins if both exist), it overrides what that folder's segment
   shows in every **descendant** page's auto-generated `breadcrumb` array (`search-index.json` and, now,
   `manifest.json`), instead of falling back to the title-cased folder name. It's also still carried through onto the
   generated `NavigationItem` (`item.breadcrumbTitle`) for a consuming frontend to read directly.
2. **On a leaf (non-index) file**, it overrides that file's **own** final breadcrumb segment label. This is new:
   previously a leaf's `breadcrumbTitle` had no effect on its own breadcrumb entry — it only worked as a folder-level
   mechanic. Both mechanics can apply at once: a folder's `breadcrumbTitle` shapes how it appears in its descendants'
   breadcrumbs, and a leaf's own `breadcrumbTitle` shapes only its own final segment.

```yaml
# docs/api-reference/README.md
---
breadcrumbTitle: API
---
```

```yaml
# docs/api-reference/authentication.md
---
breadcrumbTitle: Auth
---
```

With both files above, `authentication.md`'s breadcrumb becomes:

```json
"breadcrumb": [
  { "label": "API", "route": "api-reference" },
  { "label": "Auth", "route": "api-reference/authentication" }
]
```

The folder's `README.md` `breadcrumbTitle` ("API") overrides the ancestor segment, and the leaf's own
`breadcrumbTitle` ("Auth") overrides its own final segment — without it, the final segment would fall back to the
auto-derived `"Authentication"`.

## Validation

The `--validate` CLI flag and `validateDocs()` API check frontmatter correctness — 11 rules against the fields above:

| Rule                              | What it catches                                                  |
|------------------------------------|--------------------------------------------------------------------|
| label absent                      | File has no `label` frontmatter (warning)                         |
| publishedAt > updatedAt           | Publish date is after the update date (warning)                   |
| publishedAt in future             | Publish date is set to a future date (warning)                    |
| order non-integer                 | `order` is not a whole number (warning)                            |
| order negative                    | `order` is a negative number (error — invalid)                    |
| tags/keywords overlap             | Same term appears in both `tags` and `keywords` (warning)          |
| iconType without icon             | `iconType` set but `icon` is missing (warning)                     |
| badge/badgeColor mismatch         | Either is set without the other (warning, either direction)       |
| malformed externalUrl             | `externalUrl` has no `://` scheme (warning)                        |
| redirect without leading `/`      | `redirect` doesn't start with `/` (warning)                        |
| unknown keys                      | Frontmatter keys not in `ALLOWED_FRONTMATTER_KEYS` (warning — catches typos) |

Additional checks folded into the same pass: `draft` + `hidden` both set (warning, redundant), `isTitle` + `isParent`
both set (warning, mutually exclusive concepts), `deprecated` without `deprecatedAlternative` (warning), and invalid
`publishedAt` / `updatedAt` date strings (**error** — `Date.parse()` fails).

Validation exits with code `1` only when a file has an **error** (invalid date, negative `order`) — warnings alone do
not fail the exit code.

## Sorting

Items are sorted by `order` (ascending, default `999`), then alphabetically by `label`. Folders inherit `order`,
`icon`, `iconType`, `badge`, and `badgeColor` from their `README.md`/`index.md` file.

```md
---
label: First Page
order: 1
---

---
label: Second Page
order: 2
---
```

Files without `order` sort alphabetically at the end.

## Search index fields

In addition to `label`, `description`, `route`, and `tags`, each search entry includes:

- `headings[]` — deduplicated `h2`/`h3` headings extracted from the document body
- `excerpt` — first ~150 characters of body content, stripped of markup
- `breadcrumb` — an always-present, non-empty `BreadcrumbSegment[]` (`{ label, route }`) built from ancestor folder
  README/index frontmatter, ending with the item's own segment; a root-level page with no ancestors gets a
  single-segment array containing just itself

## Rich frontmatter examples

### Redirect from an old page

```md
---
label: Old Page
redirect: /new-location/page
---
```

### External link in nav

```md
---
label: External Docs
externalUrl: https://example.com/docs
---
```

### Deprecated page

```md
---
label: Legacy API
deprecated: true
deprecatedAlternative: /api/v2/getting-started
---
```

### Page with dates

```md
---
label: Changelog
publishedAt: 2024-01-15
updatedAt: 2024-06-01
---
```

### Page with icon and badge

```md
---
label: Features
icon: star
iconType: filled
badge: New
badgeColor: green
---
```

## Parsing rules

- Parsing uses `js-yaml@^5.4.2` with the `JSON_SCHEMA` — block scalars, quoted strings, and nested/JSON-style arrays
  (`[a, b]`) are all handled correctly.
- `true`, `false`, and explicit `null` are recognised as booleans and null.
- Numeric values become numbers.
- **`js-yaml` v5 semantic change**: an empty scalar (`label:` with nothing after the colon) now parses to `''` (empty
  string), not `null` as in earlier `js-yaml` major versions. This is a `js-yaml` v5 behavior, not a bug in this
  package. In practice it has no visible effect here: `label`, `description`, `icon`, `iconType`, `badge`, and
  `badgeColor` are all read with an `||` fallback (e.g. `meta.label || formatTitle(entry.name)`), which treats `''` and
  `null` identically.
- Empty, `draft: true`, and `hidden: true` items are removed from the output entirely.
- Both `.md` and `.mdx` file extensions are supported.

## Output

The `cleanItem()` function strips all empty (`null`, `false`, `''`, `undefined`) fields from navigation items before
writing to `manifest.json`, producing minimal output; `breadcrumb` is always a non-empty array, so it's never stripped
by this pass. It does **not** run over `search-index.json` entries — those are written as-is, so an `undefined` field
(e.g. `excerpt` when the body is empty) is simply omitted by `JSON.stringify`, while an explicit `''` in a search
entry would still show up. In practice, `headings` and `excerpt` are only ever set to a real value or left
`undefined`, never `''`; `breadcrumb` is always present and never `undefined`.

## Next step

Read the [CLI Usage](cli-usage.md) guide for command-line examples that use these fields.
