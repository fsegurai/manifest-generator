# CLI Usage

This guide describes the public CLI for external users.

## Syntax

```bash
npx @fsegurai/manifest-generator [options] [path]
# or, if installed globally
manifest-generator [options] [path]
```

## Core options

| Option                                 | Description                                           |
|----------------------------------------|-------------------------------------------------------|
| `--all`, `-a`                          | Process all discovered projects                       |
| `--project <name>`, `-p <name>`        | Process one project by name                           |
| `--route <path>`, `-r <path>`          | Process one docs path directly                        |
| `--docs-root <path>`, `-d <path>`      | Root directory used for discovery                     |
| `--output <path>`, `-o <path>`         | Custom output directory                               |
| `--docs-subfolder <name>`, `-s <name>` | Docs folder name (default: `docs`)                    |
| `--discover`                           | List projects without generating files                |
| `--recursive`                          | Recursively discover projects in nested directories   |
| `--validate`                           | Validate frontmatter in docs without generating files |
| `--watch`                              | Watch for file changes and regenerate                 |
| `--config <path>`                      | Path to config file (default: auto-detect)            |
| `--init`                               | Scaffold config file and sample docs structure        |
| `--help`, `-h`                         | Show help                                             |
| `--version`, `-v`                      | Show version                                          |

## New in 1.0.0-beta.3

### `--config`

Load options from a config file rather than passing CLI flags. Supports `.json`, `.js`, and `.ts` files:

```bash
npx @fsegurai/manifest-generator --config ./manifest-generator.config.ts
```

The tool auto-detects `manifest-generator.config.ts`, `.js`, or `.json` in the current directory — `--config` is only needed for non-standard paths.

### `--init`

Scaffolds a complete project setup in one command:

```bash
npx @fsegurai/manifest-generator --init
```

Creates `manifest-generator.config.ts` with sensible defaults plus a `docs/` folder with example Markdown files demonstrating frontmatter features including `label`, `tags`, `order`, `icon`, `badge`, `deprecated`, and `externalUrl`.

### `--validate` (extended)

Now performs 11 checks instead of 6. New validations:

- **label absent**: warn when a file has no `label` in frontmatter
- **publishedAt > updatedAt**: warn if publish date is after update date
- **publishedAt in future**: warn if publish date is in the future
- **order non-integer**: warn if `order` is not a whole number
- **order negative**: warn if `order` is a negative number
- **tags/keywords overlap**: warn if the same term appears in both arrays
- **iconType without icon**: warn if `iconType` is set but `icon` is missing
- **badgeColor without badge**: warn if `badgeColor` is set but `badge` is missing
- **malformed externalUrl**: warn if `externalUrl` is not a valid URL
- **redirect without leading /**: warn if `redirect` doesn't start with `/`
- **unknown keys**: warn about frontmatter keys that aren't in the allowed set — catches typos

## Behaviour notes

- Docs root must exist (missing root exits with code `1`).
- Output directories are created automatically.
- Discovery prefers `docs` subfolders before direct markdown fallback.
- Both `.md` and `.mdx` files are processed.
- Output files (`manifest.json`, `search-index.json`) omit empty fields for smaller file sizes.
- Config file values are overridden by CLI flags when both are provided.

## Examples

```bash
# one docs route
npx @fsegurai/manifest-generator --route ./docs

# discover only
npx @fsegurai/manifest-generator --discover --docs-root ./projects

# process all projects under a root
npx @fsegurai/manifest-generator --all --docs-root ./projects

# process one project
npx @fsegurai/manifest-generator --project my-package --docs-root ./packages

# custom docs subfolder + output
npx @fsegurai/manifest-generator --all --docs-root ./packages --docs-subfolder documentation --output ./public/data

# validate frontmatter
npx @fsegurai/manifest-generator --validate --docs-root ./docs

# recursive discovery + generation
npx @fsegurai/manifest-generator --all --recursive --docs-root ./packages

# use a config file
npx @fsegurai/manifest-generator --config ./config/manifest-generator.config.json

# scaffold a new project
npx @fsegurai/manifest-generator --init
```

## Exit codes

- `0` success
- `1` error or validation failure

## Next step

Read [Configuration](configuration.md) and [Project Structure](project-structure.md).
