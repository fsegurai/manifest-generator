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

## Problem: no projects discovered

### Common causes

- Wrong root path
- Docs folder has a different name
- No `.md` files in discovered directories

### Fix

```bash
npx @fsegurai/manifest-generator --discover --docs-root ./projects --docs-subfolder documentation
```

## Problem: config file not loaded

### Common causes

- Wrong file name (must be `manifest-generator.config.ts`, `.js`, or `.json`)
- Config file is in a parent directory, not the current working directory
- TypeScript config file has syntax errors

### Fix

```bash
# Specify the config path explicitly
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

The output folder is created automatically when missing.

## Problem: files missing from output

### Common causes

- Frontmatter includes `draft: true`
- Frontmatter includes `hidden: true`
- File extension is not `.md`

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

## Problem: validation reports unknown keys

### Common cause

Typo in a frontmatter field name. The tool validates against an allowlist of 21 known keys.

### Fix

Check the field name for typos. See the [Frontmatter guide](../guides/frontmatter.md#all-supported-fields) for the full list of allowed fields.

## Problem: permission denied writing output

### Fix

- Write to a folder you own
- Try a local temp output path

```bash
npx @fsegurai/manifest-generator --route ./docs --output ./tmp/docs-data
```

## Still blocked?

- Re-run with `--discover` and validate paths step by step
- Open an issue with:
  - command used
  - directory layout
  - expected vs actual result
  - full error output
