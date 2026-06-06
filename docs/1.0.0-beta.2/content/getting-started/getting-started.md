---
label: Getting Started with Manifest Generator
description: Complete guide to getting started with the Manifest Generator library
tags: ["getting-started", "installation", "tutorial", "quickstart"]
---

# Getting Started with Manifest Generator

This is a practical walkthrough for external users integrating the package into their own documentation project.

## 1) Prepare a docs folder

Example structure:

```text
my-docs/
├── README.md
├── getting-started.md
└── api/
    └── reference.md
```

## 2) Run the generator

```bash
npx @fsegurai/manifest-generator --route ./my-docs
```

## 3) Check generated files

The command writes:

- `my-docs/manifest.json`
- `my-docs/search-index.json`

## 4) Add frontmatter metadata

```md
---
label: API Reference
description: Endpoints and payloads
tags: [api, reference]
---
```

Supported control flags:

- `draft: true` to exclude a page
- `hidden: true` to exclude a page
- `isTitle: true` to make a title-only node

## 5) Use discovery for multiple projects

```bash
# preview what will be processed
npx @fsegurai/manifest-generator --discover --docs-root ./projects

# process all discovered projects
npx @fsegurai/manifest-generator --all --docs-root ./projects
```

## 6) Optional custom output directory

```bash
npx @fsegurai/manifest-generator --route ./my-docs --output ./public/docs-data
```

The output directory is created automatically when missing.

## Next steps

- [CLI Usage](../guides/cli-usage.md)
- [Project Structure](../guides/project-structure.md)
- [API Reference](../api/reference.md)
