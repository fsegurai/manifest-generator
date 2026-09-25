# Frontmatter

The parser reads a YAML block at the top of each Markdown or MDX file and maps it to navigation items and search
entries.

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

In addition to `label`, `description`, `route`, and `tags`, each search entry now includes:

- `keywords` — extra terms for search matching
- `breadcrumbTitle` — contextual short label

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

## Parsing rules

- Arrays like `[a, b]` are parsed with `JSON.parse` when possible.
- `true`, `false`, and `null` are recognised as booleans and null.
- Numeric values become numbers.
- Quoted strings preserve whitespace.
- Empty, draft, and hidden items are removed from the output.
- Both `.md` and `.mdx` file extensions are supported.

## Output

The `cleanItem()` function strips all empty (`null`, `false`, `''`, `undefined`) fields from navigation items before
writing to `manifest.json`, producing minimal output.

## Next step

Read the [CLI Usage](cli-usage.md) guide for command-line examples that use these fields.
