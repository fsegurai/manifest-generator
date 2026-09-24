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

For a non-standard path, use `--config` — it loads that exact file instead of searching the current directory:

```bash
npx @fsegurai/manifest-generator --config ./config/manifest-generator.config.json
```

## What does `--init` do?

It scaffolds a complete setup in one command:

```bash
npx @fsegurai/manifest-generator --init
```

Run it in a real terminal and it interactively asks for the docs subfolder name, output directory, and whether to
enable recursive discovery. Run it non-interactively (CI, scripts, pipes) and it uses the same defaults it always did,
without prompting. Either way it creates `manifest-generator.config.ts` and a `docs/` folder with sample Markdown
files demonstrating frontmatter features.

## What frontmatter validations are available?

The `--validate` flag checks the 21 allowed frontmatter keys against 11 rules, including date validity, unknown key
detection (catches typos), type correctness, required fields, and conflicting flags. See the
[Frontmatter guide](../guides/frontmatter.md#validation) for the full list. Output is colorized in a TTY (respects
`NO_COLOR`).

## How do I process many docs projects at once?

```bash
npx @fsegurai/manifest-generator --all --docs-root ./projects
```

Use `--discover` first if you want a dry run of *which projects* would be picked up:

```bash
npx @fsegurai/manifest-generator --discover --docs-root ./projects
```

Use `--dry-run` if you want to preview the *generated output* without writing anything:

```bash
npx @fsegurai/manifest-generator --all --docs-root ./projects --dry-run
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

If the output directory does not exist, the CLI creates it (unless `--dry-run` is set).

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

## Can I exclude a folder or file pattern from processing?

Yes, via the config file's `exclude` array (glob patterns, `*` and `**` supported):

```ts
export default defineConfig({
  exclude: ['drafts/**', '**/*.internal.md'],
});
```

See [Configuration](../guides/configuration.md#exclude--glob-patterns).

## Can I get machine-readable output?

Yes — `--json` works with `--discover` and `--validate`:

```bash
npx @fsegurai/manifest-generator --validate --json
```

## What runtime should I use?

Use Node.js 22+ or Bun 1.3+ for this release line.

## What changed since 1.0.0-beta.3?

If you're upgrading from a beta:

- `js-yaml` moved to v5. An empty frontmatter scalar (`label:` with nothing after it) now parses to `''` instead of
  `null`. This has no observable effect in this tool because affected fields already use an `||` fallback.
- `--config <path>` now loads that exact file rather than only informing auto-detection.
- `--version` always reports the installed tool's own version, no matter your working directory.
- The config file schema changed: it gained `docsRoot`, `exclude`, and `projects`, and **lost** `project`, `route`,
  and `autoDetect` (those remain CLI/API-only options, not persisted config).
- New flags: `--json`, `--dry-run`, `--quiet`/`-q`.
- Combining two mode flags (`--validate`, `--discover`, `--watch`, `--init`) now errors instead of silently choosing
  one.
- `--validate` output is colorized in a TTY.
- `--init` is interactive in a real terminal; identical defaults otherwise.
- `README.md` now deterministically beats `index.md` when a folder has both.
- `loadConfig`/`loadConfigFromFile`/`mergeConfig` were never part of the public package API and still aren't — only
  `defineConfig` is exported for config authoring.

If none of your config files use `project`, `route`, or `autoDetect`, no action is needed beyond re-reading
[Configuration](../guides/configuration.md) for the new `exclude`/`projects` capabilities.

## Where should I go next?

- [CLI Usage](../guides/cli-usage.md)
- [Configuration](../guides/configuration.md)
- [Troubleshooting](troubleshooting.md)
