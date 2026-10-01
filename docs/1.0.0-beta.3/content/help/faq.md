---
label: FAQ
description: Frequently asked questions for external users of @fsegurai/manifest-generator.
tags: ["faq", "help", "support"]
---

# Frequently Asked Questions

## What does this package generate?

It generates two files from Markdown docs:

- `manifest.json` for hierarchical navigation
- `search-index.json` for flat search entries

## Do I need to install it globally?

No. You can run it directly with `npx`:

```bash
npx @fsegurai/manifest-generator --help
```

## What is the fastest command to try it?

```bash
npx @fsegurai/manifest-generator --route ./docs
```

## How do I use a config file?

Create a `manifest-generator.config.ts` file in your project root:

```ts
import { defineConfig } from '@fsegurai/manifest-generator';

export default defineConfig({
  docsSubfolder: 'docs',
  recursive: true,
});
```

Then run without flags:

```bash
npx @fsegurai/manifest-generator
```

For a non-standard path, use `--config`:

```bash
npx @fsegurai/manifest-generator --config ./config/manifest-generator.config.json
```

## What does `--init` do?

It scaffolds a complete setup in one command:

```bash
npx @fsegurai/manifest-generator --init
```

Creates `manifest-generator.config.ts` and a `docs/` folder with sample Markdown files demonstrating frontmatter features.

## What frontmatter validations are available?

The `--validate` flag checks 21 fields against 11 rules, including date validity, unknown key detection (catches typos), type correctness, required fields, and conflicting flags. See the [Frontmatter guide](../guides/frontmatter.md#validation) for the full list.

## How do I process many docs projects at once?

```bash
npx @fsegurai/manifest-generator --all --docs-root ./projects
```

Use `--discover` first if you want a dry run:

```bash
npx @fsegurai/manifest-generator --discover --docs-root ./projects
```

## How do I process one named project?

```bash
npx @fsegurai/manifest-generator --project my-docs --docs-root ./projects
```

## Can I write output to a different folder?

Yes:

```bash
npx @fsegurai/manifest-generator --route ./docs --output ./public/docs-data
```

If the output directory does not exist, the CLI creates it.

## What if my docs folder is not called `docs`?

Use `--docs-subfolder`:

```bash
npx @fsegurai/manifest-generator --all --docs-root ./packages --docs-subfolder documentation
```

## Which frontmatter field controls the visible page title?

Use `label`.

```md
---
label: API Reference
description: Endpoints and payloads
tags: [api, reference]
---
```

## How do I hide a page from output?

Use one of these flags in frontmatter:

```md
---
draft: true
hidden: true
---
```

Both flags exclude the file from manifest and search index generation.

## What runtime should I use?

Use Node.js 22+ or Bun 1.3+ for this release line.

## Where should I go next?

- [CLI Usage](../guides/cli-usage.md)
- [Configuration](../guides/configuration.md)
- [Troubleshooting](troubleshooting.md)
