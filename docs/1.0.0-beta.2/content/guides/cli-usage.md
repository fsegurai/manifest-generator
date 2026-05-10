# CLI Usage

This guide describes the public CLI for external users.

## Syntax

```bash
npx @fsegurai/manifest-generator [options] [path]
# or, if installed globally
manifest-generator [options] [path]
```

## Core options

| Option                                 | Description                            |
|----------------------------------------|----------------------------------------|
| `--all`, `-a`                          | Process all discovered projects        |
| `--project <name>`, `-p <name>`        | Process one project by name            |
| `--route <path>`, `-r <path>`          | Process one docs path directly         |
| `--docs-root <path>`, `-d <path>`      | Root directory used for discovery      |
| `--output <path>`, `-o <path>`         | Custom output directory                |
| `--docs-subfolder <name>`, `-s <name>` | Docs folder name (default: `docs`)     |
| `--discover`                           | List projects without generating files |
| `--help`, `-h`                         | Show help                              |
| `--version`, `-v`                      | Show version                           |

## Behavior notes

- Docs root must exist (missing root exits with code `1`).
- Output directories are created automatically.
- Discovery prefers docs subfolders before direct markdown fallback.

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
```

## Exit codes

- `0` success
- `1` error

## Next step

Read [Configuration](configuration.md) and [Project Structure](project-structure.md).
