---
label: Troubleshooting
description: Diagnose and fix common CLI and generation issues.
tags: ["troubleshooting", "help", "cli"]
---

# Troubleshooting

Use this page when generation fails or outputs are empty.

## Quick diagnostics

```bash
# 1) Check command and version
npx @fsegurai/manifest-generator --version

# 2) See what discovery finds
npx @fsegurai/manifest-generator --discover --docs-root ./projects

# 3) Test a single route
npx @fsegurai/manifest-generator --route ./docs

# 4) Preview without writing anything
npx @fsegurai/manifest-generator --route ./docs --dry-run
```

## Problem: the CLI does nothing or is not found on 1.0.0

### Symptom

Running `npx @fsegurai/manifest-generator` or `manifest-generator` prints nothing, exits immediately, or fails with a
"not found" error when using version `1.0.0` from npm.

### Cause

`1.0.0` was published without `dist/cli.js`, the file the `bin` entry points to, so the CLI could not run from the
npm package. Entry detection also failed behind the `node_modules/.bin` symlink.

### Fix

Upgrade to `1.1.0` or later, which ships `dist/cli.js` and detects the entry point through symlinks:

```bash
npm install --save-dev @fsegurai/manifest-generator@latest
# or run the latest version directly
npx @fsegurai/manifest-generator@latest --version
```

## Problem: docs root not found

### Symptom

CLI exits with an error similar to:

- `Documentation directory not found: <path>`

### Fix

- Point `--docs-root` to an existing folder
- Or create the folder first and add `.md` files

```bash
mkdir -p ./docs
printf "# Home\n" > ./docs/README.md
npx @fsegurai/manifest-generator --route ./docs
```

## Problem: "flags are mutually exclusive" error

### Symptom

```
Error: the flags --validate, --watch are mutually exclusive. Pass only one of --validate, --discover, --watch, --init at a time.
```

### Fix

`--validate`, `--discover`, `--watch`, and `--init` are mode flags — only one can be active per run. Remove all but
one of them from the command.

## Problem: no projects discovered

### Common causes

- Wrong root path
- Docs folder has a different name
- No `.md` files in discovered directories
- An `exclude` glob pattern is unintentionally matching your docs folder

### Fix

```bash
npx @fsegurai/manifest-generator --discover --docs-root ./projects --docs-subfolder documentation
```

## Problem: config file not loaded

### Common causes

- Wrong file name (must be `manifest-generator.config.ts`, `.js`, or `.json`)
- Config file is in a parent directory, not the current working directory, and no `--config` path was given
- `--config <path>` points to a file that doesn't exist (the CLI warns and falls back to an empty config)
- TypeScript/JS config file has syntax the tool's lightweight parser can't evaluate (it's not a full module loader —
  keep the exported config a plain object literal)

### Fix

```bash
# Specify the config path explicitly — loads that exact file
npx @fsegurai/manifest-generator --config ./config/manifest-generator.config.json

# Verify the file exists
ls -la manifest-generator.config.*

# Check for syntax errors by running with --config only
npx @fsegurai/manifest-generator --config ./manifest-generator.config.ts --discover
```

## Problem: output files are not where I expect

### Fix

Use `--output` explicitly:

```bash
npx @fsegurai/manifest-generator --route ./docs --output ./public/docs-data
```

The output folder is created automatically when missing (unless `--dry-run` is set, in which case nothing is
written at all).

## Problem: files missing from output

### Common causes

- Frontmatter includes `draft: true`
- Frontmatter includes `hidden: true`
- File extension is not `.md` or `.mdx`
- The file's path matches an `exclude` glob pattern

### Fix

Check frontmatter:

```md
---
draft: false
hidden: false
---
```

## Problem: title in output is unexpected

Use `label` in frontmatter (not `title`):

```md
---
label: My Custom Title
---
```

## Problem: a folder has an unexpected label

### Symptom

A folder shows as "Api" (the title-cased folder name), or as the README's own label instead of the section name you
want, in the navigation or in breadcrumbs.

### Fix

A folder is labelled from its own `README.md`, `README.mdx`, `index.md`, or `index.mdx` frontmatter, in that order,
using `breadcrumbTitle`, then `label`, then the title-cased folder name. Add the field you want to that file:

```yaml
# docs/api/README.md
---
breadcrumbTitle: API
---
```

If both a README and an index file exist, the README is used. Because `breadcrumbTitle` wins over `label`, set it when
you want the section label to differ from the README page's own `label`. See
[Folder labels](../guides/frontmatter.md#folder-labels).

## Problem: validation reports unknown keys

### Common cause

Typo in a frontmatter field name. The tool validates against an allowlist of 21 known keys
(`ALLOWED_FRONTMATTER_KEYS`).

### Fix

Check the field name for typos. See the [Frontmatter guide](../guides/frontmatter.md#all-21-supported-fields) for the
full list of allowed fields.

## Problem: a folder shows the wrong index page

### Symptom

A folder contains both `README.md` and `index.md`, and the wrong one's frontmatter (icon/badge/order) shows up on the
folder node — with a console warning like:

```
Warning: both README and index found in getting-started — README takes precedence
```

### Fix

This is expected and deterministic: `README.md` always wins when both exist in the same folder. Remove or rename
whichever file you don't want to act as the index, or move its content into `README.md`.

## Problem: permission denied writing output

### Fix

- Write to a folder you own
- Try a local temp output path

```bash
npx @fsegurai/manifest-generator --route ./docs --output ./tmp/docs-data
```

## Still blocked?

- Re-run with `--discover` and validate paths step by step
- Try `--dry-run` to confirm what *would* happen without side effects
- Open an issue with:
  - command used
  - directory layout
  - expected vs actual result
  - full error output
