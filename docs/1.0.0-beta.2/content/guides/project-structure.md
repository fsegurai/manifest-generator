# Project Structure

Discovery looks for documentation in two shapes:

1. A docs subfolder such as `docs/`
2. Markdown files directly in the project root

If a docs subfolder exists, it is preferred and the project is not duplicated as a direct project.

## Supported layouts

### Docs subfolder

```text
project-a/
├── docs/
│   ├── README.md
│   └── guide.md
└── package.json
```

### Direct markdown files

```text
project-b/
├── README.md
├── guide.mdx
└── package.json
```

### Custom docs folder

```text
project-c/
├── documentation/
│   ├── README.md
│   └── api.md
└── package.json
```

### Nested projects (recursive)

```text
packages/
├── group-a/
│   ├── project-1/
│   │   └── docs/
│   │       └── README.md
│   └── project-2/
│       └── docs/
│           └── README.md
└── standalone/
    └── README.md
```

Use `--recursive` (or `recursive: true` in the API) to discover projects more than one level deep. Without it, only `standalone` is found.

## Supported files

Both `.md` and `.mdx` file extensions are recognised and processed. Files with other extensions are ignored.

## Discovery rules

- Hidden directories are skipped.
- A `docsSubfolder` value of `docs` is used by default.
- Direct markdown fallback is only used when no matching docs subfolder is found.
- When a directory matches as a project root (has a docs folder or markdown files), recursive discovery stops at that directory — its children are treated as documentation content, not separate projects.
- `manifest.json` and `search-index.json` are ignored during scans.

## Output behaviour

- `--project` writes files to the project root unless `--output` is set.
- `--route` writes files to the route path unless `--output` is set.
- Missing output directories are created automatically.
- Output files only include non-empty fields (no `null` / `false` noise).

## Output example (cleaned)

```json
{
  "label": "Getting Started",
  "route": "getting-started",
  "isParent": true,
  "children": [
    {
      "label": "Installation",
      "route": "getting-started/installation"
    }
  ]
}
```

## Discovery example

```bash
# standard discovery
bun ./packages/manifest-generator/src/cli.ts --discover --docs-root ./docs

# recursive discovery
bun ./packages/manifest-generator/src/cli.ts --discover --recursive --docs-root ./packages
```

## Next step

Read [Frontmatter](frontmatter.md) to see the fields the parser understands.
