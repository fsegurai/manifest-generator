# Frontmatter

The parser reads a small YAML block at the top of each Markdown file.
It uses `label` for the navigation title and `description`/`tags` for search metadata.

## Example

```md
---
label: Custom Page Title
description: Short summary for search
tags: [guide, api]
isParent: true
---
```

## Supported fields

| Field | Purpose |
|-------|---------|
| `label` | Navigation label shown in the manifest |
| `description` | Search description |
| `tags` | Search tags |
| `isTitle` | Mark an item as title-only (`route` becomes `#`) |
| `isParent` | Mark an item as a parent node |
| `icon` | Optional icon name |
| `iconType` | Optional icon source/type |
| `badge` | Optional badge text |
| `badgeColor` | Optional badge color |
| `draft` | Exclude from output |
| `hidden` | Exclude from output |

## Parsing rules

- Arrays like `[a, b]` are parsed with `JSON.parse` when possible.
- `true` and `false` become booleans.
- Numeric values become numbers.
- Empty, draft, and hidden items are removed from the output.

## Current behavior

- `label` is used in the manifest and search index.
- `title` is not used by the current implementation.
- `cleanItem()` removes empty/null fields before writing JSON.

## Next step

Read [API Reference](../api/reference.md) for the exported functions that consume this metadata.
