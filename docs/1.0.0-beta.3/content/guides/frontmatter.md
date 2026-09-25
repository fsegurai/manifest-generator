# Frontmatter

The parser reads a YAML block at the top of each Markdown or MDX file and maps it to navigation items and search
entries. The parser uses `js-yaml` with `JSON_SCHEMA` for robust YAML parsing.

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

## All supported fields

| Field                   | Type     | Purpose                                                                    |
|-------------------------|----------|----------------------------------------------------------------------------|
| `label`                 | string   | Navigation label shown in the manifest                                     |
| `description`           | string   | Search description                                                         |
| `tags`                  | string[] | Search tags                                                                |
| `keywords`              | string[] | Additional search-relevant keywords (not shown in nav, indexed separately) |
| `order`                 | number   | Sort weight — lower values appear first                                    |
| `isTitle`               | boolean  | Mark an item as title-only (`route` becomes `#`)                           |
| `isParent`              | boolean  | Mark an item as a parent node                                              |
| `icon`                  | string   | Optional icon name                                                         |
| `iconType`              | string   | Optional icon source/type                                                  |
| `badge`                 | string   | Optional badge text                                                        |
| `badgeColor`            | string   | Optional badge color                                                       |
| `breadcrumbTitle`       | string   | Shorter label for breadcrumb context                                       |
| `layout`                | string   | Custom page layout identifier for the consuming frontend                   |
| `redirect`              | string   | URL to redirect this page to                                               |
| `externalUrl`           | string   | Link to an external resource instead of a doc page                         |
| `deprecated`            | boolean  | Flag this page as outdated                                                 |
| `deprecatedAlternative` | string   | Suggests a migration path (route or URL)                                   |
| `publishedAt`           | date     | ISO date string when the page was published                                |
| `updatedAt`             | date     | ISO date string when the page was last updated                             |
| `draft`                 | boolean  | Exclude from output entirely                                               |
| `hidden`                | boolean  | Exclude from output entirely (same as draft)                               |

## Validation

The `--validate` CLI flag and `validateDocs()` API check frontmatter correctness. 21 fields are checked against 11 rules:

| Rule                        | What it catches                                                |
|-----------------------------|---------------------------------------------------------------|
| label absent                | File has no `label` frontmatter                               |
| publishedAt > updatedAt     | Publish date is after the update date                         |
| publishedAt in future       | Publish date is set to a future date                          |
| order non-integer           | `order` is not a whole number                                 |
| order negative              | `order` is a negative number                                  |
| tags/keywords overlap       | Same term appears in both `tags` and `keywords`               |
| iconType without icon       | `iconType` set but `icon` is missing                          |
| badgeColor without badge    | `badgeColor` set but `badge` is missing                       |
| malformed externalUrl       | `externalUrl` is not a valid URL                              |
| redirect without leading /  | `redirect` doesn't start with `/`                             |
| unknown keys                | Frontmatter keys not in the allowed set (catches typos)       |
| draft and hidden            | Both `draft: true` and `hidden: true` (redundant)             |
| isTitle and isParent        | Both flags set on the same page                               |
| badge without badgeColor    | `badge` set but `badgeColor` missing                          |
| deprecated without alternative| `deprecated: true` but no `deprecatedAlternative`           |
| invalid date strings        | `publishedAt` / `updatedAt` are not valid ISO dates           |
| conflicting externalUrl/redirect | Both `externalUrl` and `redirect` set on the same file    |

Validation exits with code `1` when errors are found.

## Sorting

Items are sorted by `order` (ascending, default `999`), then alphabetically by `label`. Folders inherit metadata from
their README or index file.

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
- `breadcrumb` — auto-generated breadcrumb context from the route path

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

- YAML block scalars, quoted strings, and nested arrays are handled by `js-yaml` (JSON_SCHEMA).
- `true`, `false`, and `null` are recognised as booleans and null.
- Numeric values become numbers.
- JSON-style arrays (`[a, b]`) are parsed as YAML arrays.
- Empty YAML values (`label:`) become `null` — handled by `formatTitle` fallback.
- Empty, draft, and hidden items are removed from the output.
- Both `.md` and `.mdx` file extensions are supported.

## Output

The `cleanItem()` function strips all empty (`null`, `false`, `''`, `undefined`) fields from navigation items before
writing to `manifest.json`, producing minimal output.

## Next step

Read the [CLI Usage](cli-usage.md) guide for command-line examples that use these fields.
