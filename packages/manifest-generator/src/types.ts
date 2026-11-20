export interface BreadcrumbSegment {
  label: string;
  route: string;
}

export interface NavigationItem {
  label: string;
  route?: string;
  tags?: string[];
  isTitle?: boolean;
  isParent?: boolean;
  description?: string;
  icon?: string | null;
  iconType?: string | null;
  badge?: string | null;
  badgeColor?: string | null;
  order?: number;
  redirect?: string;
  externalUrl?: string;
  breadcrumbTitle?: string;
  breadcrumb?: BreadcrumbSegment[];
  layout?: string;
  deprecated?: boolean;
  deprecatedAlternative?: string;
  publishedAt?: string;
  updatedAt?: string;
  keywords?: string[];
  /** Previous page in reading order (only with the `prevNext` option). */
  prev?: PageLink;
  /** Next page in reading order (only with the `prevNext` option). */
  next?: PageLink;
  /** Frontmatter keys the generator does not know, as written (only with the `extraFrontmatter` option). */
  meta?: Record<string, unknown>;
  /** Words of the page body, code blocks excluded (only with the `readingTime` option). */
  wordCount?: number;
  /** Reading time in minutes at 200 words per minute, rounded up (only with the `readingTime` option). */
  readingTime?: number;
  children?: NavigationItem[];
}

/** Link to an adjacent page, written on page items by the `prevNext` option. */
export interface PageLink {
  label: string;
  route: string;
}

/**
 * Frontmatter key aliases: `{ sourceKey: targetKey }`, e.g. `{ title: 'label', created: 'publishedAt' }`.
 * An alias is used only when the target key is not set.
 */
export type FrontmatterAliases = Record<string, string>;

/** Options shared by the tree walker (`walkDocs`, `generateManifest`, `generateManifestFromFiles`). */
export interface WalkOptions {
  frontmatterAliases?: FrontmatterAliases;
  /** Write `sections` (h2/h3 text, GitHub-style `id`, level) on search entries. Default `false`. */
  headingAnchors?: boolean;
  /** Copy frontmatter keys the generator does not know into `meta` on page items. Default `false`. */
  extraFrontmatter?: boolean;
  /** Write `wordCount` and `readingTime` (minutes) on page items. Default `false`. */
  readingTime?: boolean;
}

/** One h2/h3 heading of a page, with the `id` a GitHub-style slugger gives it (written by `headingAnchors`). */
export interface PageSection {
  /** Plain text of the heading, without Markdown markup. */
  text: string;
  /** GitHub-style slug, unique in the page (`intro`, `intro-1`…), counting headings of every level. */
  id: string;
  level: 2 | 3;
}

/** Options of `generateManifest` and `generateManifestFromFiles`. */
export interface ManifestOptions extends WalkOptions {
  /** Write `prev` / `next` links on page items, following the manifest reading order. Default `false`. */
  prevNext?: boolean;
}

/** Options of `generateManifestFromFiles`. */
export interface ManifestFromFilesOptions extends ManifestOptions {
  /** Glob patterns (relative to the root) to skip, as in the config `exclude`. */
  exclude?: string[];
}

/** One in-memory documentation file for `generateManifestFromFiles`. */
export interface InMemoryFile {
  /** Path relative to the docs root, using `/` separators (e.g. `guides/theming.md`). */
  path: string;
  content: string;
}

/** Minimal directory reader the shared walker runs over (file system or in-memory). */
export interface DocsReader {
  list(dir: string): { name: string; isDirectory: boolean; isFile: boolean }[];
  read(file: string): string;
  exists(file: string): boolean;
  join(...parts: string[]): string;
}

/** Options of `validateDocs`. */
export interface ValidateOptions {
  frontmatterAliases?: FrontmatterAliases;
  /** Frontmatter keys that never produce the "Unknown frontmatter key" warning. */
  ignoreKeys?: string[];
}

export interface SearchEntry {
  label: string;
  description?: string;
  route: string;
  tags?: string[];
  headings?: string[];
  excerpt?: string;
  breadcrumb?: BreadcrumbSegment[];
  /** Linkable headings of the page (only with the `headingAnchors` option). */
  sections?: PageSection[];
  /** `true` for a page with `hidden: true`: searchable and routable, but left out of the navigation. */
  hidden?: boolean;
}

export interface ManifestResult {
  manifest: NavigationItem[];
  searchIndex: SearchEntry[];
}

export interface DiscoveredProject {
  name: string;
  projectPath: string;
  docsPath: string;
  type: 'subfolder' | 'direct' | 'recursive';
}

export interface ProcessingResult {
  name: string;
  processed: boolean;
  error?: string;
}

export interface DiscoveryOptions {
  docsSubfolder?: string;
  recursive?: boolean;
  exclude?: string[];
}

export interface ManifestGenerationOptions {
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
  frontmatterAliases?: FrontmatterAliases;
  headingAnchors?: boolean;
  extraFrontmatter?: boolean;
  readingTime?: boolean;
}

export interface Frontmatter {
  label?: string;
  description?: string;
  tags?: string[];
  isTitle?: boolean;
  isParent?: boolean;
  icon?: string | null;
  iconType?: string | null;
  badge?: string | null;
  badgeColor?: string | null;
  draft?: boolean;
  hidden?: boolean;
  order?: number;
  redirect?: string;
  externalUrl?: string;
  breadcrumbTitle?: string;
  layout?: string;
  deprecated?: boolean;
  deprecatedAlternative?: string;
  publishedAt?: string;
  updatedAt?: string;
  keywords?: string[];
}

export interface ProjectConfig {
  docsSubfolder?: string;
  outputDir?: string;
}

export interface ConfigFile {
  docsRoot?: string;
  docsSubfolder?: string;
  outputDir?: string;
  recursive?: boolean;
  exclude?: string[];
  projects?: Record<string, ProjectConfig>;
  /** Write `prev` / `next` links on page items. Default `false`. */
  prevNext?: boolean;
  /** Frontmatter key aliases for generation and validation, e.g. `{ title: 'label' }`. No default aliases. */
  frontmatterAliases?: FrontmatterAliases;
  /** Frontmatter keys that `--validate` must not report as unknown. */
  ignoreKeys?: string[];
  /** Write `sections` (h2/h3 anchors) on search entries. Default `false`. */
  headingAnchors?: boolean;
  /** Copy unknown frontmatter keys into `meta` on page items. Default `false`. */
  extraFrontmatter?: boolean;
  /** Write `wordCount` and `readingTime` on page items. Default `false`. */
  readingTime?: boolean;
}

export interface ValidateResult {
  file: string;
  valid: boolean;
  warnings: string[];
  errors: string[];
  frontmatter?: Frontmatter;
}
