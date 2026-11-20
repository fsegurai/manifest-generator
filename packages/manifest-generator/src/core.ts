/**
 * Node-free core of @fsegurai/manifest-generator (`@fsegurai/manifest-generator/core`).
 *
 * Holds the pure helpers and the tree walker shared by the Node entry (`walkDocs`, over the file
 * system) and `generateManifestFromFiles` (over in-memory files). Must not import `node:*` modules,
 * so it runs in browsers and other non-Node runtimes.
 */
import * as yaml from 'js-yaml';
import type {
  BreadcrumbSegment,
  DocsReader,
  Frontmatter,
  FrontmatterAliases,
  InMemoryFile,
  ManifestFromFilesOptions,
  ManifestResult,
  NavigationItem,
  PageLink,
  PageSection,
  SearchEntry,
  WalkOptions,
} from './types.js';

export function formatTitle(name: string): string {
  return name
    .replace(/\.(md|mdx)$/, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function parseFrontmatter<T = Record<string, unknown>>(content: string): T {
  const match = content.match(/^---\s*\n([\s\S]*?)\n\s*---/);
  if (!match) return {} as T;

  try {
    const doc = yaml.load(match[1], { schema: yaml.JSON_SCHEMA }) as Record<string, unknown> | null;
    return (doc || {}) as T;
  } catch {
    return {} as T;
  }
}

/**
 * Returns a copy of `frontmatter` where each alias source key (`{ source: target }`) fills its target key
 * when the target is not set. Without aliases, returns `frontmatter` unchanged.
 */
export function applyFrontmatterAliases<T extends object = Frontmatter>(
  frontmatter: T,
  aliases?: FrontmatterAliases,
): T {
  if (!aliases || Object.keys(aliases).length === 0) return frontmatter;
  const source = frontmatter as Record<string, unknown>;
  const result: Record<string, unknown> = { ...source };
  for (const [from, to] of Object.entries(aliases)) {
    if (source[from] !== undefined && result[to] === undefined) {
      result[to] = source[from];
    }
  }
  return result as T;
}

export function cleanItem(item: NavigationItem): NavigationItem {
  const cleaned: NavigationItem = { label: item.label };
  const keys = Object.keys(item) as (keyof NavigationItem)[];
  for (const key of keys) {
    const value = item[key];
    if (value !== null && value !== false && value !== '' && value !== undefined) {
      if (key === 'children' && Array.isArray(value)) {
        cleaned.children = (value as NavigationItem[]).map(cleanItem);
      } else if (key !== 'children') {
        cleaned[key] = value as never;
      }
    }
  }
  return cleaned;
}

export function sortItems(items: NavigationItem[]): NavigationItem[] {
  const sorted = [...items].sort((a, b) => {
    const orderA = a.order ?? 999;
    const orderB = b.order ?? 999;
    if (orderA !== orderB) return orderA - orderB;
    return a.label.localeCompare(b.label);
  });
  for (const item of sorted) {
    if (item.children) {
      item.children = sortItems(item.children);
    }
  }
  return sorted;
}

export function getBody(content: string): string {
  const match = content.match(/^---\s*\n[\s\S]*?\n\s*---\n*/);
  return match ? content.slice(match[0].length) : content;
}

export function diceSimilarity(a: string, b: string): number {
  const bigramsA = new Set<string>();
  const bigramsB = new Set<string>();
  for (let i = 0; i < a.length - 1; i++) {
    bigramsA.add(a.slice(i, i + 2).toLowerCase());
  }
  for (let i = 0; i < b.length - 1; i++) {
    bigramsB.add(b.slice(i, i + 2).toLowerCase());
  }
  let intersection = 0;
  for (const bg of bigramsA) {
    if (bigramsB.has(bg)) intersection++;
  }
  return (2 * intersection) / (bigramsA.size + bigramsB.size);
}

export function dedupeHeadings(headings: string[], threshold = 0.7): string[] {
  const result: string[] = [];
  for (const h of headings) {
    if (!result.some((existing) => diceSimilarity(existing, h) > threshold)) result.push(h);
  }
  return result;
}

/** An opening or closing code fence: up to 3 spaces, then 3+ backticks or tildes. */
const CODE_FENCE = /^ {0,3}(`{3,}|~{3,})(.*)$/;

/**
 * Returns the lines of `body` outside fenced code blocks (```` ``` ```` / `~~~`), so a `## comment` inside a code
 * sample is not read as a heading. An unclosed fence runs to the end of the body, as in CommonMark.
 */
function linesOutsideCode(body: string): string[] {
  const lines: string[] = [];
  let fence: string | null = null;
  for (const line of body.split(/\r?\n/)) {
    const match = CODE_FENCE.exec(line);
    if (fence === null) {
      // ? A backtick fence cannot have backticks in its info string
      if (match && !(match[1][0] === '`' && match[2].includes('`'))) fence = match[1];
      else lines.push(line);
    } else if (match && match[1][0] === fence[0] && match[1].length >= fence.length && !match[2].trim()) {
      fence = null;
    }
  }
  return lines;
}

export function extractHeadings(body: string): string[] {
  const headings: string[] = [];
  for (const line of linesOutsideCode(body)) {
    const match = /^#{2,3}\s+(.+)$/.exec(line);
    if (match) headings.push(match[1].trim());
  }
  return dedupeHeadings(headings);
}

/** An ATX heading: its `#` run and its content, without the optional closing `#` sequence. */
const ATX_HEADING = /^ {0,3}(#{1,6})(?:[ \t]+(.*?))?(?:[ \t]+#+)?[ \t]*$/;
/** What a GitHub-style slug drops: anything but letters, marks, numbers, connector punctuation, spaces and `-`. */
const SLUG_REMOVED = /[^\p{L}\p{M}\p{N}\p{Pc} -]/gu;
const NAMED_ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

function decodeEntities(text: string): string {
  return text.replace(/&(#\d{1,7}|#[xX][0-9a-fA-F]{1,6}|[a-zA-Z]+);/g, (entity, name: string) => {
    if (name[0] !== '#') return NAMED_ENTITIES[name] ?? entity;
    const code =
      name[1] === 'x' || name[1] === 'X' ? Number.parseInt(name.slice(2), 16) : Number.parseInt(name.slice(1), 10);
    return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : entity;
  });
}

/** The plain text of a heading's Markdown content, as the `textContent` of its rendered HTML. */
function headingText(raw: string): string {
  // ? Code spans and backslash escapes keep their characters as written: set them aside before reading the markup
  const literals: string[] = [];
  const protectedText = raw.replace(/(`+)(.+?)\1|\\([!-/:-@[-`{-~])/g, (_, __, code?: string, escaped?: string) => {
    literals.push(code !== undefined ? code.trim() : (escaped as string));
    return `\uE000${literals.length - 1}\uE000`;
  });
  const text = protectedText
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]*>/g, '')
    .replace(/(\*\*|__)(.+?)\1/g, '$2')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/(^|[^\p{L}\p{N}])_(.+?)_(?![\p{L}\p{N}])/gu, '$1$2')
    .replace(/~~(.+?)~~/g, '$1');
  return decodeEntities(text)
    .replace(/\uE000(\d+)\uE000/g, (_, index: string) => literals[Number(index)])
    .replace(/\s+/g, ' ')
    .trim();
}

/** GitHub-style slug of a heading text (as `github-slugger`, and ngx-markdown's `headingIds`). */
export function slugifyHeading(text: string): string {
  return text.toLowerCase().replace(SLUG_REMOVED, '').replace(/ /g, '-');
}

/**
 * Returns the h2/h3 ATX headings of `body` (outside fenced code) with the ids a GitHub-style slugger gives them:
 * lower-cased slugs made unique in the page (`intro`, `intro-1`…), counting the headings of every level in document
 * order, as `github-slugger`, `marked-gfm-heading-id` and ngx-markdown's `headingIds` do. Setext headings are not read.
 */
export function extractSections(body: string): PageSection[] {
  const sections: PageSection[] = [];
  const used = new Map<string, number>();
  for (const line of linesOutsideCode(body)) {
    const match = ATX_HEADING.exec(line);
    if (!match) continue;
    const text = headingText(match[2] ?? '');
    const base = slugifyHeading(text) || 'heading';
    let id = base;
    while (used.has(id)) {
      const count = (used.get(base) as number) + 1;
      used.set(base, count);
      id = `${base}-${count}`;
    }
    used.set(id, 0);
    const level = match[1].length;
    if ((level === 2 || level === 3) && text) sections.push({ text, id, level });
  }
  return sections;
}

function stripMarkdown(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]*>/g, ' ')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/~~([^~]+)~~/g, '$1')
    .replace(/^>\s+/gm, '')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/^[-*_]{3,}\s*$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

export function makeExcerpt(body: string, maxLength = 150): string {
  const text = stripMarkdown(body);
  if (!text || text.length <= maxLength) return text;

  const truncated = text.slice(0, maxLength);
  const lastSentence = truncated.match(/.*[.!?]/);
  if (lastSentence && lastSentence[0].length > 30) {
    return lastSentence[0];
  }

  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > 30) {
    return `${truncated.slice(0, lastSpace)}...`;
  }

  return `${truncated}...`;
}

export function makeBreadcrumb(chain: BreadcrumbSegment[], self: BreadcrumbSegment): BreadcrumbSegment[] {
  return [...chain, self];
}

export const ALLOWED_FRONTMATTER_KEYS: ReadonlySet<string> = new Set([
  'label',
  'description',
  'tags',
  'keywords',
  'order',
  'isTitle',
  'isParent',
  'icon',
  'iconType',
  'badge',
  'badgeColor',
  'breadcrumbTitle',
  'layout',
  'redirect',
  'externalUrl',
  'deprecated',
  'deprecatedAlternative',
  'publishedAt',
  'updatedAt',
  'draft',
  'hidden',
]);

const VALID_MARKDOWN_EXTENSIONS = ['.md', '.mdx'];

export function isMarkdownFile(name: string): boolean {
  return VALID_MARKDOWN_EXTENSIONS.some((ext) => name.endsWith(ext));
}

function globToRegExp(pattern: string): RegExp {
  const placeholder = '\u0000';
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, placeholder)
    .replace(/\*/g, '[^/]*')
    .split(placeholder)
    .join('.*');
  return new RegExp(`^${escaped}$`);
}

/** Whether a `/`-separated relative path matches any of the exclude globs. */
export function isExcluded(relPath: string, patterns: string[]): boolean {
  if (!patterns || patterns.length === 0) return false;
  return patterns.some((pattern) => globToRegExp(pattern).test(relPath));
}

const FOLDER_LABEL_SOURCES = ['README.md', 'README.mdx', 'index.md', 'index.mdx'];

function resolveFolderLabel(reader: DocsReader, dirFullPath: string, folderName: string, options: WalkOptions): string {
  const targetPath = FOLDER_LABEL_SOURCES.map((name) => reader.join(dirFullPath, name)).find((candidate) =>
    reader.exists(candidate),
  );

  if (!targetPath) return formatTitle(folderName);

  try {
    const content = reader.read(targetPath);
    const meta = applyFrontmatterAliases(parseFrontmatter<Frontmatter>(content), options.frontmatterAliases);
    return meta.breadcrumbTitle || meta.label || formatTitle(folderName);
  } catch {
    return formatTitle(folderName);
  }
}

/** Reading speed used by the `readingTime` option. */
const WORDS_PER_MINUTE = 200;

/** Words of a page body as read: Markdown markup and code blocks excluded. */
function countWords(body: string): number {
  const text = stripMarkdown(body);
  return text ? text.split(/\s+/).length : 0;
}

/** The frontmatter keys the generator does not know (nor reads through an alias), or `undefined` when there are none. */
function extraFrontmatter(meta: Frontmatter, aliases?: FrontmatterAliases): Record<string, unknown> | undefined {
  const extra: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(meta)) {
    if (!ALLOWED_FRONTMATTER_KEYS.has(key) && !(aliases && Object.hasOwn(aliases, key))) extra[key] = value;
  }
  return Object.keys(extra).length > 0 ? extra : undefined;
}

function joinRelative(relative: string, name: string): string {
  return relative ? `${relative}/${name}` : name;
}

/**
 * Walks a documentation tree through `reader` and returns the sorted navigation items, pushing one
 * search entry per routable page into `searchIndex`. `relative` is the `/`-separated path of `dir`
 * from the docs root. Shared by `walkDocs` (file system) and `generateManifestFromFiles` (in memory).
 */
export function walkTree(
  reader: DocsReader,
  dir: string,
  relative = '',
  searchIndex: SearchEntry[] = [],
  exclude: string[] = [],
  chain: BreadcrumbSegment[] = [],
  options: WalkOptions = {},
): NavigationItem[] {
  const entries = reader.list(dir);

  const items = entries
    .filter((entry) => !entry.name.startsWith('.') && entry.name !== 'manifest.json')
    .filter((entry) => !isExcluded(joinRelative(relative, entry.name), exclude))
    .map((entry) => {
      const fullPath = reader.join(dir, entry.name);
      const relPath = joinRelative(relative, entry.name);
      const routePath = relPath.replace(/\\/g, '/');

      if (entry.isDirectory) {
        const folderLabel = resolveFolderLabel(reader, fullPath, entry.name, options);
        const folderRoute = routePath;
        const children = walkTree(
          reader,
          fullPath,
          relPath,
          searchIndex,
          exclude,
          [...chain, { label: folderLabel, route: folderRoute }],
          options,
        );
        if (children.length === 0) return null;

        const folderItem: NavigationItem = {
          label: folderLabel,
          route: folderRoute,
          isParent: true,
        };
        folderItem.breadcrumb = makeBreadcrumb(chain, {
          label: folderLabel,
          route: folderItem.route ?? '',
        });

        const readmeMd = children.find((c) => c.route === `${routePath}/README`);
        const indexOnlyMd = children.find((c) => c.route === `${routePath}/index`);
        if (readmeMd && indexOnlyMd) {
          console.warn(`Warning: both README and index found in ${routePath} — README takes precedence`);
        }
        const indexMd = readmeMd || indexOnlyMd;
        if (indexMd) {
          folderItem.order = indexMd.order;
          folderItem.icon = indexMd.icon ?? null;
          folderItem.iconType = indexMd.iconType ?? null;
          folderItem.badge = indexMd.badge ?? null;
          folderItem.badgeColor = indexMd.badgeColor ?? null;
        }

        folderItem.children = children;
        return folderItem;
      }

      if (entry.isFile && isMarkdownFile(entry.name)) {
        const content = reader.read(fullPath);
        const meta = applyFrontmatterAliases(parseFrontmatter<Frontmatter>(content), options.frontmatterAliases);

        if (meta.draft) return null;

        const cleanPath = routePath.replace(/\.(md|mdx)$/, '');
        const body = getBody(content);
        const headings = extractHeadings(body);
        const excerpt = makeExcerpt(body);
        const sections = options.headingAnchors ? extractSections(body) : [];

        const item: NavigationItem = {
          label: meta.label || formatTitle(entry.name),
          description: meta.description || '',
          route: cleanPath,
          tags: meta.tags || [],
          isTitle: meta.isTitle || false,
          isParent: meta.isParent || false,
          order: meta.order,
          redirect: meta.redirect,
          externalUrl: meta.externalUrl,
          breadcrumbTitle: meta.breadcrumbTitle,
          layout: meta.layout,
          deprecated: meta.deprecated,
          deprecatedAlternative: meta.deprecatedAlternative,
          publishedAt: meta.publishedAt,
          updatedAt: meta.updatedAt,
          keywords: meta.keywords,
          icon: meta.icon || null,
          iconType: meta.iconType || null,
          badge: meta.badge || null,
          badgeColor: meta.badgeColor || null,
        };

        if (meta.isTitle === true) {
          item.route = '#';
        }

        if (options.extraFrontmatter) {
          const extra = extraFrontmatter(meta, options.frontmatterAliases);
          if (extra) item.meta = extra;
        }

        if (options.readingTime && item.route !== '#') {
          item.wordCount = countWords(body);
          item.readingTime = Math.ceil(item.wordCount / WORDS_PER_MINUTE);
        }

        item.breadcrumb = makeBreadcrumb(chain, {
          label: item.breadcrumbTitle || item.label,
          route: item.route ?? '',
        });

        if (item.route !== '#' && item.route !== '') {
          searchIndex.push({
            label: item.label,
            description: item.description,
            route: cleanPath,
            tags: item.tags,
            headings: headings.length > 0 ? headings : undefined,
            excerpt: excerpt || undefined,
            breadcrumb: item.breadcrumb,
            ...(sections.length > 0 ? { sections } : {}),
            ...(meta.hidden ? { hidden: true } : {}),
          });
        }

        // ? A hidden page stays routable and searchable, but is left out of the navigation
        return meta.hidden ? null : item;
      }

      return null;
    })
    .filter(Boolean) as NavigationItem[];

  return sortItems(items);
}

const isAbsoluteUrl = (route: string) => /^[a-z][a-z\d+.-]*:|^\/\//i.test(route);

/** Page identity: a `README` is the same page as its folder (`guides/README` → `guides`). */
function pageKey(route: string): string {
  return route.replace(/^\/+|\/+$/g, '').replace(/(^|\/)README$/, '');
}

function isPage(item: NavigationItem): item is NavigationItem & { route: string } {
  return Boolean(item.route) && item.route !== '#' && !item.externalUrl && !isAbsoluteUrl(item.route as string);
}

/**
 * Returns a copy of `items` where every page item carries `prev` / `next` links to the adjacent pages in
 * reading order (depth-first, manifest order). Pages are items with an internal route (not `#`, not an
 * external URL); a folder and its `README` count as one page, linked through the first one met.
 */
export function applyPrevNext(items: NavigationItem[]): NavigationItem[] {
  const pages: PageLink[] = [];
  const indexByKey = new Map<string, number>();

  const collect = (level: NavigationItem[]) => {
    for (const item of level) {
      if (isPage(item)) {
        const key = pageKey(item.route);
        if (!indexByKey.has(key)) {
          indexByKey.set(key, pages.length);
          pages.push({ label: item.label, route: item.route });
        }
      }
      if (item.children) collect(item.children);
    }
  };
  collect(items);

  const link = (level: NavigationItem[]): NavigationItem[] =>
    level.map((item) => {
      const { children, ...rest } = item;
      const result: NavigationItem = { ...rest };
      if (isPage(item)) {
        const index = indexByKey.get(pageKey(item.route)) as number;
        if (index > 0) result.prev = { ...pages[index - 1] };
        if (index < pages.length - 1) result.next = { ...pages[index + 1] };
      }
      if (children) result.children = link(children);
      return result;
    });

  return link(items);
}

function normalizeFilePath(filePath: string): string {
  return filePath
    .replace(/\\/g, '/')
    .replace(/^(\.\/|\/)+/, '')
    .replace(/\/{2,}/g, '/');
}

/** A `DocsReader` over in-memory files; the root directory is `''`. */
export function createMemoryReader(files: InMemoryFile[]): DocsReader {
  const contents = new Map<string, string>();
  const directories = new Map<string, Map<string, boolean>>([['', new Map()]]);

  for (const file of files) {
    const normalized = normalizeFilePath(file.path);
    if (!normalized) continue;
    contents.set(normalized, file.content);
    const parts = normalized.split('/');
    let dir = '';
    parts.forEach((part, index) => {
      const isDir = index < parts.length - 1;
      const children = directories.get(dir) ?? new Map<string, boolean>();
      directories.set(dir, children);
      if (isDir) children.set(part, true);
      else if (!children.has(part)) children.set(part, false);
      dir = joinRelative(dir, part);
      if (isDir && !directories.has(dir)) directories.set(dir, new Map());
    });
  }

  return {
    list(dir) {
      const children = directories.get(dir);
      if (!children) throw new Error(`Directory not found: ${dir}`);
      return [...children.entries()]
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        .map(([name, isDirectory]) => ({ name, isDirectory, isFile: !isDirectory }));
    },
    read(file) {
      const content = contents.get(file);
      if (content === undefined) throw new Error(`File not found: ${file}`);
      return content;
    },
    exists(file) {
      return contents.has(file) || directories.has(file);
    },
    join(...parts) {
      return parts.filter(Boolean).join('/');
    },
  };
}

/**
 * Generates the manifest and search index from in-memory files (`{ path, content }`, paths relative to
 * the docs root). Produces the same output as `generateManifest(dir)` for the same tree on disk.
 */
export function generateManifestFromFiles(
  files: InMemoryFile[],
  options: ManifestFromFilesOptions = {},
): ManifestResult {
  const { exclude = [], prevNext = false, ...walkOptions } = options;
  const searchIndex: SearchEntry[] = [];
  const manifest = walkTree(createMemoryReader(files), '', '', searchIndex, exclude, [], walkOptions);

  return {
    manifest: prevNext ? applyPrevNext(manifest) : manifest,
    searchIndex,
  };
}

export type {
  BreadcrumbSegment,
  DocsReader,
  Frontmatter,
  FrontmatterAliases,
  InMemoryFile,
  ManifestFromFilesOptions,
  ManifestOptions,
  ManifestResult,
  NavigationItem,
  PageLink,
  PageSection,
  SearchEntry,
  WalkOptions,
} from './types.js';
