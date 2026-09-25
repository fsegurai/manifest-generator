# CLI Usage

This guide describes the public CLI for external users.

## Syntax

```bash
npx @fsegurai/manifest-generator [options] [path]
# or, if installed globally
manifest-generator [options] [path]
```

## All flags

| Option                                 | Description                                                       |
|-----------------------------------------|--------------------------------------------------------------------|
| `--all`, `-a`                          | Process all discovered projects                                    |
| `--project <name>`, `-p <name>`        | Process one project by name                                        |
| `--route <path>`, `-r <path>`          | Process one docs path directly                                     |
| `--docs-root <path>`, `-d <path>`      | Root directory used for discovery                                  |
| `--output <path>`, `-o <path>`         | Custom output directory                                            |
| `--docs-subfolder <name>`, `-s <name>` | Docs folder name (default: `docs`)                                 |
| `--discover`                           | List projects without generating files                             |
| `--recursive`                          | Recursively discover projects in nested directories                |
| `--init`                               | Scaffold config file and sample docs structure                     |
| `--validate`                           | Validate frontmatter in docs without generating files              |
| `--watch`                              | Watch for file changes and regenerate                              |
| `--config <path>`                      | Path to an exact config file (default: auto-detect in cwd)         |
| `--json`                               | Output machine-readable JSON (`--discover` / `--validate` only)    |
| `--dry-run`                            | Run generation without writing files to disk                       |
| `--quiet`, `-q`                        | Suppress banner and progress output (errors still show)            |
| `--help`, `-h`                         | Show help                                                           |
| `--version`, `-v`                      | Show version                                                        |

`--init`, `--discover`, `--validate`, and `--watch` are **mode flags** — pass exactly one of them per invocation. Passing
two or more together (e.g. `--validate --watch`) now exits with code `1` and a clear error naming the conflicting flags,
instead of silently picking one.

### `--config <path>`

Loads that **exact file**, not just a directory search:

```bash
npx @fsegurai/manifest-generator --config ./manifest-generator.config.ts
```

If the path does not exist, the CLI warns and continues with an empty config (CLI flags and defaults still apply). When
`--config` is omitted, the tool auto-detects `manifest-generator.config.ts`, `.js`, or `.json` in the current working
directory (see [Configuration](configuration.md)).

### `--init`

Scaffolds a complete project setup in one command:

```bash
npx @fsegurai/manifest-generator --init
npx @fsegurai/manifest-generator --init ./my-docs-project
```

Creates `manifest-generator.config.ts` with sensible defaults plus a `docs/` folder with example Markdown files
demonstrating frontmatter features including `label`, `tags`, `order`, `icon`, `badge`, `deprecated`, and more.

Run it in a real terminal (stdin is a TTY, and you're not in a test environment) and it interactively prompts for:

- docs subfolder name (default: `docs`)
- output directory (default: source root)
- whether to enable recursive discovery (default: no)

In CI, pipes, or scripts (no TTY, or a test environment), it skips the prompts and scaffolds using those same defaults
non-interactively.

### `--json`

Only affects `--discover` and `--validate`. Prints the raw result array as JSON instead of the human-readable report,
and suppresses the banner:

```bash
npx @fsegurai/manifest-generator --discover --json
npx @fsegurai/manifest-generator --validate --json
```

`--validate --json` still exits with code `1` when any file is invalid.

### `--dry-run`

Runs the full generation pipeline (discovery, parsing, sorting) but never calls `fs.writeFileSync` or
`fs.mkdirSync` — it only logs what would be written and how many items/entries it contains:

```bash
npx @fsegurai/manifest-generator --route ./docs --dry-run
```

`--dry-run` is incompatible with `--watch` (file writes are the entire point of watch mode). Passing both prints a
warning and falls back to a single dry-run pass, ignoring `--watch`.

### `--quiet` / `-q`

Suppresses the startup banner and progress lines; errors and the final summary line still print. `--json` implies
`--quiet` automatically.

```bash
npx @fsegurai/manifest-generator --all --quiet
```

### `--validate`

Checks frontmatter against 11 rules across the 21 allowed keys — see [Frontmatter](frontmatter.md#validation) for the
full rule list. Output is colorized (`[OK]` in green, `[FAIL]` in red, warnings in yellow) when running in a TTY;
colors are disabled automatically when `NO_COLOR` is set or when output is piped/non-TTY.

## Behaviour notes

- Docs root must exist (missing root exits with code `1`).
- Output directories are created automatically (skipped entirely under `--dry-run`).
- Discovery prefers `docs` subfolders before direct markdown fallback.
- Both `.md` and `.mdx` files are processed.
- Output files (`manifest.json`, `search-index.json`) omit empty fields for smaller file sizes.
- Config file values are overridden by CLI flags when both are provided.
- `--config <path>` overrides auto-detection entirely — it does not merge with an auto-detected file.

## Examples

```bash
# one docs route
npx @fsegurai/manifest-generator --route ./docs

# discover only
npx @fsegurai/manifest-generator --discover --docs-root ./projects

# discover as JSON
npx @fsegurai/manifest-generator --discover --docs-root ./projects --json

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

# use an exact config file
npx @fsegurai/manifest-generator --config ./config/manifest-generator.config.json

# preview only, no files written
npx @fsegurai/manifest-generator --all --dry-run

# scaffold a new project
npx @fsegurai/manifest-generator --init

# quiet run, only the final summary line
npx @fsegurai/manifest-generator --all --quiet
```

## Exit codes

- `0` = success
- `1` = failure (missing docs root, invalid frontmatter under `--validate`, conflicting mode flags, or a generation
  error)

## Next step

Read [Configuration](configuration.md) and [Project Structure](project-structure.md).
