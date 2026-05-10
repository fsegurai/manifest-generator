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
├── guide.md
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

## Current discovery rules

- Hidden directories are skipped.
- A `docsSubfolder` value of `docs` is used by default.
- Direct markdown fallback is only used when no matching docs subfolder is found.
- `manifest.json` and `search-index.json` are ignored during scans.

## Output behavior

- `--project` writes files to the project root unless `--output` is set.
- `--route` writes files next to the route unless `--output` is set.
- Missing output directories are created automatically.

## Discovery example

```bash
bun ./packages/manifest-generator/src/cli.ts --discover --docs-root ./docs
```

## Next step

Read [Frontmatter](frontmatter.md) to see the fields the parser understands.
