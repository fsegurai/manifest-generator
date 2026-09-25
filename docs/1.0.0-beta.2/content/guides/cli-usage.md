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
| `--help`, `-h`                         | Show help                                             |
| `--version`, `-v`                      | Show version                                          |

## New in 1.0.0-beta.2

### `--validate`

Validates frontmatter across all markdown files without writing any output.

```bash
npx @fsegurai/manifest-generator --validate --docs-root ./docs
```

Reports warnings for:

- Both `draft` and `hidden` set (redundant)
- Both `isTitle` and `isParent` set on the same page
- `badge` set without `badgeColor`
- `deprecated` set without `deprecatedAlternative`
- Invalid date strings in `publishedAt` / `updatedAt`
- Conflicting `externalUrl` and `redirect`

Exits with code `1` when validation errors are found.

### `--recursive`

Extends discovery to search nested directories beyond one level:

```bash
# discovery
npx @fsegurai/manifest-generator --discover --recursive --docs-root ./packages

# generate all nested projects
npx @fsegurai/manifest-generator --all --recursive --docs-root ./packages
```

Without `--recursive`, only immediate children of the root are checked.

### `--watch`

Watches the docs root for file changes and automatically regenerates manifests and search indexes:

```bash
npx @fsegurai/manifest-generator --watch --route ./docs --output ./public/data
```

Press `Ctrl+C` to stop. The watcher polls for modified files every second.

## Behaviour notes

- Docs root must exist (missing root exits with code `1`).
- Output directories are created automatically.
- Discovery prefers `docs` subfolders before direct markdown fallback.
- Both `.md` and `.mdx` files are processed.
- Output files (`manifest.json`, `search-index.json`) now omit empty fields for smaller file sizes.

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
```

## Exit codes

- `0` success
- `1` error or validation failure

## Next step

Read [Configuration](configuration.md) and [Project Structure](project-structure.md).
