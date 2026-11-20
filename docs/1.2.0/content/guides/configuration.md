# Configuration

Configuration is driven by CLI flags, a config file, or the programmatic API. When both a config file and CLI flags are
provided, **CLI flags always win**.

## Config file

Place a `manifest-generator.config.ts`, `.js`, or `.json` file in your project root.

```ts
// manifest-generator.config.ts
import { defineConfig } from '@fsegurai/manifest-generator';

export default defineConfig({
  docsRoot: './packages',
  docsSubfolder: 'docs',
  recursive: true,
  exclude: ['drafts/**', '**/*.internal.md'],
});
```

### Auto-detection vs `--config <path>`

With no `--config` flag, the tool looks for these files (in order) in the **current working directory**, and uses the
first one it finds:

1. `manifest-generator.config.ts`
2. `manifest-generator.config.js`
3. `manifest-generator.config.json`

`--config <path>` bypasses auto-detection entirely and loads that **exact file**, from any location:

```bash
npx @fsegurai/manifest-generator --config ./config/manifest-generator.config.json
```

If the given path does not exist, the CLI prints a warning and continues as if no config file were found (an empty
config — CLI flags and hardcoded defaults still apply).

### Config file format (`.json`)

```json
{
  "docsRoot": "./packages",
  "docsSubfolder": "docs",
  "outputDir": "./public/docs-data",
  "recursive": false,
  "exclude": ["drafts/**"],
  "projects": {
    "frontend": { "docsSubfolder": "documentation", "outputDir": "./dist/frontend" }
  }
}
```

All fields are optional. `.js` and `.ts` config files are parsed by stripping imports/comments and evaluating the
remaining `export default {...}` object expression — they are not executed as full ESM modules, so keep the exported
config a plain object literal (no dynamic logic, no `await`).

### `defineConfig`

Type-safe identity helper for `.ts`/`.js` config files — it returns its argument unchanged, purely for editor
autocompletion:

```ts
import { defineConfig } from '@fsegurai/manifest-generator';

export default defineConfig({
  docsSubfolder: 'docs',
  outputDir: './dist/manifests',
});
```

## `ConfigFile` schema

```ts
interface ConfigFile {
  docsRoot?: string;
  docsSubfolder?: string;
  outputDir?: string;
  recursive?: boolean;
  exclude?: string[];
  projects?: Record<string, ProjectConfig>;
  prevNext?: boolean;
  headingAnchors?: boolean;
  extraFrontmatter?: boolean;
  readingTime?: boolean;
  frontmatterAliases?: Record<string, string>;
  ignoreKeys?: string[];
}
```

| Field           | Default  | Purpose                                                         |
|-----------------|----------|-------------------------------------------------------------------|
| `docsRoot`      | —        | Root directory used for discovery (same role as `--docs-root`)   |
| `docsSubfolder` | `'docs'` | Folder name discovery looks for inside each project              |
| `outputDir`     | —        | Write generated files to a different directory                  |
| `recursive`     | `false`  | Scan nested directories for projects more than one level deep    |
| `exclude`       | `[]`     | Glob patterns to skip during discovery and walking (see below)   |
| `projects`      | `{}`     | Per-project overrides, keyed by discovered project name          |
| `prevNext`      | `false`  | Write `prev`/`next` page links (same as `--prev-next`)            |
| `headingAnchors` | `false` | Write h2/h3 `sections` with ids on search entries (same as `--heading-anchors`) |
| `extraFrontmatter` | `false` | Copy unknown frontmatter keys into `meta` on page items (same as `--extra-frontmatter`) |
| `readingTime`   | `false`  | Write `wordCount` / `readingTime` on page items (same as `--reading-time`) |
| `frontmatterAliases` | `{}` | Foreign frontmatter key → supported key, for generation and validation (no default aliases) |
| `ignoreKeys`    | `[]`     | Keys `--validate` does not report as unknown (`--ignore-keys` replaces this list) |

`prevNext`, `headingAnchors`, `extraFrontmatter`, `readingTime`, `frontmatterAliases`, and `ignoreKeys` are validated
when the config loads. A wrong type, or an alias whose
target is not a supported frontmatter key, stops the CLI with exit code `1` instead of being ignored:

```text
Error: Invalid config: "prevNext" must be a boolean
Error: Invalid config: "ignoreKeys" must be an array of strings
Error: Invalid config: "frontmatterAliases" must be an object mapping frontmatter keys to keys
Error: Invalid config: frontmatterAliases: "title" maps to unknown frontmatter key "heading"
```

### `prevNext` — previous / next links

Since `1.2.0`. With `prevNext: true` (or `--prev-next`, or the `prevNext` API option), every page item gets `prev` and
`next` links (`{ label, route }`) to the adjacent pages in reading order: depth-first, in manifest order. Pages are items
with an internal route: title nodes (`#`) and items with an `externalUrl` or an absolute URL route are skipped, and a
folder and its `README` are the same page (linked through the folder, which comes first). The first page has no `prev`
and the last one no `next`. Off by default; without it the output is unchanged.

```json
{
  "label": "Installation",
  "route": "getting-started/installation",
  "prev": { "label": "Getting Started", "route": "getting-started" },
  "next": { "label": "First Steps", "route": "getting-started/first-steps" }
}
```

### `headingAnchors` — section anchors in the search index

Since `1.2.0`. With `headingAnchors: true` (or `--heading-anchors`), every search entry gets `sections`: its `##` /
`###` headings as `{ text, id, level }`, so a search result can link to `route#id`.

```json
{
  "label": "Installation",
  "route": "getting-started/installation",
  "headings": ["Option 1: `npx` (no install)", "Requirements"],
  "sections": [
    { "text": "Option 1: npx (no install)", "id": "option-1-npx-no-install", "level": 2 },
    { "text": "Requirements", "id": "requirements", "level": 2 }
  ]
}
```

Ids are GitHub-style slugs, made unique in the page (`intro`, `intro-1`, …) counting the headings of every level in
document order. They are the ids `github-slugger`, `marked-gfm-heading-id`, and ngx-markdown's `headingIds` give the
same headings, so the links land on the rendered heading. Headings inside fenced code blocks are skipped; setext
headings (`===` / `---` underlines) are not read. `text` is the plain heading text, without Markdown markup. Pages
without `##` / `###` headings get no `sections`, and the existing `headings` field is unchanged.

### `extraFrontmatter` — your own frontmatter keys

Since `1.2.0`. With `extraFrontmatter: true` (or `--extra-frontmatter`), page items get `meta`: every frontmatter key
the generator does not know, with its value as written (strings, numbers, lists, objects). Known keys and alias source
keys are left out, and pages without such keys get no `meta`.

```md
---
label: Quick start
owner: docs-team
reviewers: [ana, li]
---
```

```json
{ "label": "Quick start", "route": "quick-start", "meta": { "owner": "docs-team", "reviewers": ["ana", "li"] } }
```

`--validate` still reports these keys as unknown; list them in `ignoreKeys` to silence that.

### `readingTime` — word count and reading time

Since `1.2.0`. With `readingTime: true` (or `--reading-time`), page items get `wordCount` (words of the body, Markdown
markup and code blocks excluded) and `readingTime` (minutes at 200 words per minute, rounded up; `0` for an empty
page). Title nodes (`isTitle`) get neither.

```json
{ "label": "Configuration", "route": "guides/configuration", "wordCount": 1240, "readingTime": 7 }
```

### `frontmatterAliases` and `ignoreKeys`

Since `1.2.0`. Use them for docs written for another tool (Obsidian notes, another static-site generator):

```json
{
  "frontmatterAliases": { "title": "label", "created": "publishedAt", "updated": "updatedAt" },
  "ignoreKeys": ["mood"]
}
```

An alias applies only when the target key is not set, and both generation and `--validate` use it. `ignoreKeys` only
silences unknown-key reports in `--validate`. See [Frontmatter aliases](frontmatter.md#frontmatter-aliases).

There is no `project`, `route`, or `autoDetect` field in the config file — those are CLI/runtime concerns (`--project`,
`--route`, and the default "process everything" behavior), not persisted configuration.

### `exclude` — glob patterns

`exclude` is an array of glob-style patterns matched against each entry's path **relative to the scanned root**, using
`/` as the separator regardless of OS. Supported wildcards:

- `*` — matches any run of characters except `/` (a single path segment)
- `**` — matches across path segments (any depth, including zero)

```ts
export default defineConfig({
  exclude: [
    'drafts/**',        // skip an entire directory
    '**/*.internal.md', // skip any file ending in .internal.md, anywhere
    'legacy/old-page.md',
  ],
});
```

Excluded entries are skipped both during project **discovery** (`discoverProjects`) and while **walking** a docs tree
(`walkDocs`) — a directory matched by `exclude` is skipped entirely, along with everything inside it.

### `projects` — per-project overrides

Keyed by the project name as returned by `discoverProjects()` (the directory name). Each entry can override
`docsSubfolder` and/or `outputDir` for that one project, without affecting the rest:

```ts
interface ProjectConfig {
  docsSubfolder?: string;
  outputDir?: string;
}
```

```ts
export default defineConfig({
  docsRoot: './packages',
  recursive: true,
  projects: {
    // 'frontend' uses a non-standard docs folder name and a custom output location
    frontend: { docsSubfolder: 'documentation', outputDir: './dist/frontend-docs' },
    // other discovered projects fall back to the top-level docsSubfolder/outputDir
  },
});
```

An `outputDir` override may be relative (resolved against that project's own root) or absolute.

## `--init` scaffold

The `--init` command creates a complete starter setup:

```bash
npx @fsegurai/manifest-generator --init
```

Run in a real terminal, it prompts for the docs subfolder name, output directory, and recursive discovery; run
non-interactively (CI, scripts, pipes), it falls back to the same defaults `--init` always used. Either way it
generates:

- `manifest-generator.config.ts` — a config file matching your answers (or the defaults)
- `docs/` folder with 7 sample Markdown files demonstrating frontmatter features (label, tags, order, icon, badge,
  deprecated, and more)

## Programmatic API

```ts
import { generateManifestsWithDiscovery } from '@fsegurai/manifest-generator';

const results = generateManifestsWithDiscovery('./docs', {
  autoDetect: true,
  docsSubfolder: 'docs',
  outputDir: './docs/1.2.0',
  exclude: ['drafts/**'],
  dryRun: false,
  prevNext: true,
  headingAnchors: true,
  readingTime: true,
  frontmatterAliases: { title: 'label' },
});
```

## `ManifestGenerationOptions`

```ts
interface ManifestGenerationOptions {
  project?: string | null;
  route?: string | null;
  outputDir?: string | null;
  docsSubfolder?: string;
  autoDetect?: boolean;
  recursive?: boolean;
  exclude?: string[];
  projects?: Record<string, ProjectConfig>;
  dryRun?: boolean;
  prevNext?: boolean;
  headingAnchors?: boolean;
  extraFrontmatter?: boolean;
  readingTime?: boolean;
  frontmatterAliases?: Record<string, string>;
}
```

## `DiscoveryOptions`

```ts
interface DiscoveryOptions {
  docsSubfolder?: string; // default: 'docs'
  recursive?: boolean;    // default: false
  exclude?: string[];     // default: []
}
```

## Sorting

Navigation items are sorted by `order` (ascending), then alphabetically by `label`. Set the `order` frontmatter
property to control position:

```md
---
label: First
order: 1
---
```

Files without `order` default to `999` and sort alphabetically at the end.

## Output format

The `cleanItem()` function strips `null`, `false`, and empty-string fields from `manifest.json` entries, producing
minimal output. Fields like `icon`, `badge`, `iconType`, `badgeColor` only appear when non-empty.

## Frontmatter

Full reference in the [Frontmatter guide](frontmatter.md). Key fields:

- `order` — explicit sort weight
- `redirect` / `externalUrl` — route aliases
- `breadcrumbTitle` — on a folder's `README`/`index`, the folder's label in navigation and breadcrumbs; on a leaf, its
  own final breadcrumb segment — see [Frontmatter](frontmatter.md#breadcrumbtitle)
- `layout` — page layout identifier
- `deprecated` + `deprecatedAlternative` — deprecation metadata
- `publishedAt` / `updatedAt` — dates
- `keywords` — extra search terms

## Validate mode

Use `validateDocs()` programmatically to check frontmatter without writing files:

```ts
import { validateDocs } from '@fsegurai/manifest-generator';

const results = validateDocs('./docs');
for (const result of results) {
  if (!result.valid) {
    console.error(result.file, result.errors);
  }
}

// Since 1.2.0: notes written for another tool
validateDocs('./notes', { frontmatterAliases: { title: 'label' }, ignoreKeys: ['mood'] });
```

## Watch mode

Use `watchDocs()` for live regeneration on file changes:

```ts
import { watchDocs, generateManifestsWithDiscovery } from '@fsegurai/manifest-generator';

const watcher = watchDocs('./docs', (changedFile) => {
  console.log('Change detected:', changedFile);
  generateManifestsWithDiscovery('./docs', { autoDetect: true });
});

// Stop watching later:
watcher.close();
```

## Next step

Read [Project Structure](project-structure.md) to see how discovery behaves in practice.
