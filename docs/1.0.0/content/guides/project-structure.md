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

Use `--recursive` (or `recursive: true` in the API/config file) to discover projects more than one level deep. Without
it, only `standalone` is found.

## Excluding paths from discovery and walking

Both discovery and the manifest walker accept `exclude` — an array of glob patterns matched against paths relative to
the scanned root, with `/` as the separator. `*` matches within one path segment, `**` matches across segments:

```bash
# via API/config: exclude: ['drafts/**', '**/*.internal.md']
```

An excluded directory (matched, e.g., by `drafts/**`) is skipped entirely along with everything inside it — it never
appears as a discovered project or a navigation entry. See [Configuration](configuration.md#exclude--glob-patterns).

## Config file placement

Place `manifest-generator.config.ts`, `.js`, or `.json` at your project root alongside `package.json`:

```text
my-project/
├── manifest-generator.config.ts  ← Config file
├── docs/
│   ├── README.md
│   └── guide.md
└── package.json
```

The config file is auto-detected when running from the project root, or loaded from an exact path with `--config`.

## `--init` scaffold output

Running `npx @fsegurai/manifest-generator --init` creates (interactively prompting for the values below when run in a
real terminal, or using these defaults otherwise):

```text
my-project/
├── manifest-generator.config.ts
└── docs/
    ├── README.md
    ├── getting-started.md
    ├── api/
    │   └── reference.md
    └── guides/
        ├── README.md
        ├── setup.md
        └── advanced.md
```

## Supported files

Both `.md` and `.mdx` file extensions are recognised and processed. Files with other extensions are ignored.

## Discovery rules

- Hidden directories are skipped.
- A `docsSubfolder` value of `docs` is used by default.
- Direct markdown fallback is only used when no matching docs subfolder is found.
- When a directory matches as a project root (has a docs folder or markdown files), recursive discovery stops at that
  directory — its children are treated as documentation content, not separate projects.
- `manifest.json` is ignored during scans (excluded by name, alongside dotfiles).
- Paths matching an `exclude` glob pattern are skipped entirely.

## Output behaviour

- `--project` writes files to the project root unless `--output` is set.
- `--route` writes files to the route path unless `--output` is set.
- Missing output directories are created automatically — unless `--dry-run` is set, in which case nothing is written.
- Output files only include non-empty fields (no `null` / `false` / `''` noise).
- When a folder has both `README.md` and `index.md`, `README.md` deterministically wins and a warning is printed —
  this no longer depends on filesystem read order.

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
npx @fsegurai/manifest-generator --discover --docs-root ./docs

# recursive discovery
npx @fsegurai/manifest-generator --discover --recursive --docs-root ./packages

# discovery as JSON
npx @fsegurai/manifest-generator --discover --docs-root ./packages --json
```

## Next step

Read [Frontmatter](frontmatter.md) to see the fields the parser understands.
