import fs from 'node:fs';
import path from 'node:path';
import * as yaml from 'js-yaml';
import type {
  DiscoveredProject,
  DiscoveryOptions,
  Frontmatter,
  ManifestGenerationOptions,
  ManifestResult,
  NavigationItem,
  ProcessingResult,
  ProjectConfig,
  SearchEntry,
  ValidateResult,
} from './types.js';

export { defineConfig } from './config.js';

function formatTitle(name: string): string {
  return name
    .replace(/\.(md|mdx)$/, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function parseFrontmatter<T = Record<string, unknown>>(content: string): T {
  const match = content.match(/^---\s*\n([\s\S]*?)\n\s*---/);
  if (!match) return {} as T;

  try {
    const doc = yaml.load(match[1], { schema: yaml.JSON_SCHEMA }) as Record<string, unknown> | null;
    return (doc || {}) as T;
  } catch {
    return {} as T;
  }
}

function cleanItem(item: NavigationItem): NavigationItem {
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

function sortItems(items: NavigationItem[]): NavigationItem[] {
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

function getBody(content: string): string {
  const match = content.match(/^---\s*\n[\s\S]*?\n\s*---\n*/);
  return match ? content.slice(match[0].length) : content;
}

function diceSimilarity(a: string, b: string): number {
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

function dedupeHeadings(headings: string[], threshold = 0.7): string[] {
  const result: string[] = [];
  for (const h of headings) {
    if (!result.some((existing) => diceSimilarity(existing, h) > threshold)) result.push(h);
  }
  return result;
}

function extractHeadings(body: string): string[] {
  const headings: string[] = [];
  const regex = /^#{2,3}\s+(.+)$/gm;
  let match: RegExpExecArray | null = regex.exec(body);
  while (match !== null) {
    headings.push(match[1].trim());
    match = regex.exec(body);
  }
  return dedupeHeadings(headings);
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

function makeExcerpt(body: string, maxLength = 150): string {
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

function makeBreadcrumb(route: string): string | undefined {
  const segments = route.split('/');
  if (segments.length <= 1) return undefined;
  segments.pop();
  return segments.map((s) => s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())).join(' > ');
}

const VALID_MARKDOWN_EXTENSIONS = ['.md', '.mdx'];

function isMarkdownFile(name: string): boolean {
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

function isExcluded(relPath: string, patterns: string[]): boolean {
  if (!patterns || patterns.length === 0) return false;
  const normalized = relPath.split(path.sep).join('/');
  return patterns.some((pattern) => globToRegExp(pattern).test(normalized));
}

function computeRoutePrefix(outputDir: string, sourceDir: string): string {
  const rel = path.relative(path.resolve(outputDir), path.resolve(sourceDir));
  if (!rel || rel.startsWith('..')) return '';
  return rel.split(path.sep).join('/');
}

function applyRoutePrefix(items: NavigationItem[], prefix: string): NavigationItem[] {
  return items.map((item) => {
    if (item.route && item.route !== '#') {
      item.route = `${prefix}/${item.route}`;
    }
    if (item.children) {
      item.children = applyRoutePrefix(item.children, prefix);
    }
    return item;
  });
}

function walkDocs(
  dir: string,
  relative = '',
  searchIndex: SearchEntry[] = [],
  exclude: string[] = [],
): NavigationItem[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  const items = entries
    .filter((entry) => !entry.name.startsWith('.') && entry.name !== 'manifest.json')
    .filter((entry) => !isExcluded(path.join(relative, entry.name), exclude))
    .map((entry) => {
      const fullPath = path.join(dir, entry.name);
      const relPath = path.join(relative, entry.name);

      if (entry.isDirectory()) {
        const children = walkDocs(fullPath, relPath, searchIndex, exclude);
        if (children.length === 0) return null;

        const folderItem: NavigationItem = {
          label: formatTitle(entry.name),
          route: relPath.replace(/\\/g, '/'),
          isParent: true,
        };

        const normalizedRelPath = relPath.replace(/\\/g, '/');
        const readmeMd = children.find((c) => c.route === `${normalizedRelPath}/README`);
        const indexOnlyMd = children.find((c) => c.route === `${normalizedRelPath}/index`);
        if (readmeMd && indexOnlyMd) {
          console.warn(`Warning: both README and index found in ${normalizedRelPath} — README takes precedence`);
        }
        const indexMd = readmeMd || indexOnlyMd;
        if (indexMd) {
          folderItem.order = (indexMd as NavigationItem & { order?: number }).order;
          folderItem.icon = (indexMd as NavigationItem & { icon?: string | null }).icon ?? null;
          folderItem.iconType = (indexMd as NavigationItem & { iconType?: string | null }).iconType ?? null;
          folderItem.badge = (indexMd as NavigationItem & { badge?: string | null }).badge ?? null;
          folderItem.badgeColor = (indexMd as NavigationItem & { badgeColor?: string | null }).badgeColor ?? null;
        }

        folderItem.children = children;
        return folderItem;
      }

      if (entry.isFile() && isMarkdownFile(entry.name)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const meta = parseFrontmatter<Frontmatter>(content);

        if (meta.draft || meta.hidden) return null;

        const cleanPath = relPath.replace(/\.(md|mdx)$/, '').replace(/\\/g, '/');
        const body = getBody(content);
        const headings = extractHeadings(body);
        const excerpt = makeExcerpt(body);
        const breadcrumb = makeBreadcrumb(cleanPath);

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

        if (item.route !== '#' && item.route !== '') {
          searchIndex.push({
            label: item.label,
            description: item.description,
            route: cleanPath,
            tags: item.tags,
            headings: headings.length > 0 ? headings : undefined,
            excerpt: excerpt || undefined,
            breadcrumb: breadcrumb || undefined,
          });
        }

        return item;
      }

      return null;
    })
    .filter(Boolean) as NavigationItem[];

  return sortItems(items);
}

function resolveDocsPath(projectPath: string, docsSubfolder: string): string {
  const docsPath = path.join(projectPath, docsSubfolder);
  return fs.existsSync(docsPath) && fs.statSync(docsPath).isDirectory() ? docsPath : projectPath;
}

function generateDocsManifests(
  docsRoot: string,
  optionsOrWalker?:
    | {
        docsSubfolder?: string;
        recursive?: boolean;
        exclude?: string[];
        projects?: Record<string, ProjectConfig>;
        dryRun?: boolean;
        walkerFn?: (
          projectPath: string,
          relative: string,
          searchIndex: SearchEntry[],
          exclude?: string[],
        ) => NavigationItem[];
      }
    | ((projectPath: string, relative: string, searchIndex: SearchEntry[]) => NavigationItem[]),
): ProcessingResult[] {
  const options = typeof optionsOrWalker === 'function' ? { walkerFn: optionsOrWalker } : optionsOrWalker || {};
  const { docsSubfolder = 'docs', recursive = false, exclude = [], projects = {}, dryRun = false, walkerFn } = options;
  const discovered = discoverProjects(docsRoot, { docsSubfolder, recursive, exclude });
  const results: ProcessingResult[] = [];

  discovered.forEach((project) => {
    const searchIndex: SearchEntry[] = [];
    const walker = walkerFn || walkDocs;

    const override = projects[project.name];
    const docsPath = override?.docsSubfolder
      ? resolveDocsPath(project.projectPath, override.docsSubfolder)
      : project.docsPath;
    const writeDir = override?.outputDir
      ? path.isAbsolute(override.outputDir)
        ? override.outputDir
        : path.join(project.projectPath, override.outputDir)
      : project.projectPath;

    try {
      const manifest = walker(docsPath, '', searchIndex, exclude);
      if (!manifest || !Array.isArray(manifest)) {
        results.push({
          name: project.name,
          processed: false,
          error: 'Invalid manifest generated',
        });
        return;
      }

      const prefix = computeRoutePrefix(writeDir, docsPath);
      if (prefix) {
        applyRoutePrefix(manifest, prefix);
        for (let i = 0; i < searchIndex.length; i++) {
          const entry = searchIndex[i];
          if (entry.route) searchIndex[i] = { ...entry, route: `${prefix}/${entry.route}` };
        }
      }

      const cleaned = manifest.map(cleanItem);

      const manifestPath = path.join(writeDir, 'manifest.json');
      const searchIndexPath = path.join(writeDir, 'search-index.json');

      if (!dryRun) {
        fs.mkdirSync(writeDir, { recursive: true });
        fs.writeFileSync(manifestPath, JSON.stringify(cleaned, null, 2), 'utf8');
        fs.writeFileSync(searchIndexPath, JSON.stringify(searchIndex, null, 2), 'utf8');
        console.log(`Generated manifest and search index for: ${project.name}`);
      } else {
        console.log(
          `[dry-run] Would write: ${manifestPath} (${cleaned.length} items), ${searchIndexPath} (${searchIndex.length} entries)`,
        );
      }

      results.push({ name: project.name, processed: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      results.push({ name: project.name, processed: false, error: message });
    }
  });

  return results;
}

function generateManifest(projectPath: string, exclude: string[] = []): ManifestResult {
  const searchIndex: SearchEntry[] = [];
  const manifest = walkDocs(projectPath, '', searchIndex, exclude);

  return {
    manifest,
    searchIndex,
  };
}

function discoverProjects(rootDir: string, options: DiscoveryOptions = {}): DiscoveredProject[] {
  const { docsSubfolder = 'docs', recursive = false, exclude = [] } = options;
  const discovered: DiscoveredProject[] = [];
  const maxDepth = recursive ? Infinity : 1;

  function isProjectRoot(dir: string): boolean {
    try {
      const docsPath = path.join(dir, docsSubfolder);
      if (fs.existsSync(docsPath) && fs.statSync(docsPath).isDirectory()) {
        return true;
      }
      return fs.readdirSync(dir, { withFileTypes: true }).some((file) => file.isFile() && isMarkdownFile(file.name));
    } catch {
      return false;
    }
  }

  function scan(dir: string, depth: number, relative = '') {
    if (depth > maxDepth) return;

    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        if (!entry.isDirectory() || entry.name.startsWith('.')) continue;

        const relPath = path.join(relative, entry.name);
        if (isExcluded(relPath, exclude)) continue;

        const projectPath = path.join(dir, entry.name);

        if (isProjectRoot(projectPath)) {
          const actualDocsPath = resolveDocsPath(projectPath, docsSubfolder);
          const docsPath = path.join(projectPath, docsSubfolder);

          discovered.push({
            name: entry.name,
            projectPath,
            docsPath: actualDocsPath,
            type: depth > 1 ? 'recursive' : actualDocsPath === docsPath ? 'subfolder' : 'direct',
          });
        } else if (recursive) {
          scan(projectPath, depth + 1, relPath);
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`Warning: Could not scan directory ${dir}: ${message}`);
    }
  }

  scan(rootDir, 1);
  return discovered;
}

function generateManifestsWithDiscovery(rootDir: string, options: ManifestGenerationOptions = {}): ProcessingResult[] {
  const {
    project = null,
    route = null,
    outputDir = null,
    docsSubfolder = 'docs',
    autoDetect = true,
    recursive = false,
    exclude = [],
    projects = {},
    dryRun = false,
  } = options;

  if (route) {
    if (!fs.existsSync(route)) {
      throw new Error(`Route not found: ${route}`);
    }

    const result = generateManifest(route, exclude);
    const outputPath = outputDir || route;

    const prefix = outputDir ? computeRoutePrefix(outputDir, route) : '';
    if (prefix) {
      applyRoutePrefix(result.manifest, prefix);
      for (let i = 0; i < result.searchIndex.length; i++) {
        const entry = result.searchIndex[i];
        if (entry.route) result.searchIndex[i] = { ...entry, route: `${prefix}/${entry.route}` };
      }
    }

    const cleaned = result.manifest.map(cleanItem);
    const manifestPath = path.join(outputPath, 'manifest.json');
    const searchIndexPath = path.join(outputPath, 'search-index.json');

    if (!dryRun) {
      fs.mkdirSync(outputPath, { recursive: true });
      fs.writeFileSync(manifestPath, JSON.stringify(cleaned, null, 2), 'utf8');
      fs.writeFileSync(searchIndexPath, JSON.stringify(result.searchIndex, null, 2), 'utf8');
      console.log(`Generated manifest for route: ${route}`);
    } else {
      console.log(
        `[dry-run] Would write: ${manifestPath} (${cleaned.length} items), ${searchIndexPath} (${result.searchIndex.length} entries)`,
      );
    }

    return [{ name: path.basename(route), processed: true }];
  }

  if (project) {
    const projectPath = path.join(rootDir, project);
    const docsPath = path.join(projectPath, docsSubfolder);

    if (!fs.existsSync(projectPath)) {
      throw new Error(`Project not found: ${project}`);
    }

    const targetPath = fs.existsSync(docsPath) ? docsPath : projectPath;
    const result = generateManifest(targetPath, exclude);
    const outputPath2 = outputDir || projectPath;

    const prefix = outputDir ? computeRoutePrefix(outputPath2, targetPath) : '';
    if (prefix) {
      applyRoutePrefix(result.manifest, prefix);
      for (let i = 0; i < result.searchIndex.length; i++) {
        const entry = result.searchIndex[i];
        if (entry.route) result.searchIndex[i] = { ...entry, route: `${prefix}/${entry.route}` };
      }
    }

    const cleaned = result.manifest.map(cleanItem);
    const manifestPath2 = path.join(outputPath2, 'manifest.json');
    const searchIndexPath2 = path.join(outputPath2, 'search-index.json');

    if (!dryRun) {
      fs.mkdirSync(outputPath2, { recursive: true });
      fs.writeFileSync(manifestPath2, JSON.stringify(cleaned, null, 2), 'utf8');
      fs.writeFileSync(searchIndexPath2, JSON.stringify(result.searchIndex, null, 2), 'utf8');
      console.log(`Generated manifest for project: ${project}`);
    } else {
      console.log(
        `[dry-run] Would write: ${manifestPath2} (${cleaned.length} items), ${searchIndexPath2} (${result.searchIndex.length} entries)`,
      );
    }

    return [{ name: project, processed: true }];
  }

  if (autoDetect) {
    return generateDocsManifests(rootDir, { docsSubfolder, recursive, exclude, projects, dryRun });
  }

  return [];
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

function validateDocs(rootDir: string): ValidateResult[] {
  const results: ValidateResult[] = [];

  function validateDirectory(dir: string, relative = '') {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name === 'manifest.json') continue;

      const fullPath = path.join(dir, entry.name);
      const relPath = path.join(relative, entry.name);

      if (entry.isDirectory()) {
        validateDirectory(fullPath, relPath);
        continue;
      }

      if (entry.isFile() && isMarkdownFile(entry.name)) {
        const result: ValidateResult = {
          file: relPath,
          valid: true,
          warnings: [],
          errors: [],
        };

        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          const frontmatter = parseFrontmatter<Frontmatter>(content);

          result.frontmatter = frontmatter;

          if (frontmatter.draft && frontmatter.hidden) {
            result.warnings.push('Both draft and hidden are set — redundant');
          }

          if (frontmatter.isTitle && frontmatter.isParent) {
            result.warnings.push('Both isTitle and isParent are set — title nodes cannot be parents');
          }

          if (frontmatter.badge && !frontmatter.badgeColor) {
            result.warnings.push('badge set without badgeColor');
          }

          if (frontmatter.externalUrl && frontmatter.redirect) {
            result.warnings.push('Both externalUrl and redirect set — redirect takes precedence');
          }

          if (frontmatter.deprecated && !frontmatter.deprecatedAlternative) {
            result.warnings.push('deprecated set without deprecatedAlternative — consider suggesting a migration path');
          }

          if (frontmatter.publishedAt && Number.isNaN(Date.parse(frontmatter.publishedAt))) {
            result.errors.push(`publishedAt "${frontmatter.publishedAt}" is not a valid date`);
            result.valid = false;
          }

          if (frontmatter.updatedAt && Number.isNaN(Date.parse(frontmatter.updatedAt))) {
            result.errors.push(`updatedAt "${frontmatter.updatedAt}" is not a valid date`);
            result.valid = false;
          }

          if (!frontmatter.label) {
            result.warnings.push('No label set — title will be derived from filename');
          }

          if (frontmatter.publishedAt && frontmatter.updatedAt) {
            const published = Date.parse(frontmatter.publishedAt);
            const updated = Date.parse(frontmatter.updatedAt);
            if (!Number.isNaN(published) && !Number.isNaN(updated) && published > updated) {
              result.warnings.push(
                `publishedAt (${frontmatter.publishedAt}) is after updatedAt (${frontmatter.updatedAt}) — dates may be reversed`,
              );
            }
          }

          if (frontmatter.publishedAt) {
            const published = Date.parse(frontmatter.publishedAt);
            if (!Number.isNaN(published) && published > Date.now()) {
              result.warnings.push(
                `publishedAt (${frontmatter.publishedAt}) is in the future — document will not appear as published`,
              );
            }
          }

          if (frontmatter.order !== undefined && !Number.isInteger(frontmatter.order)) {
            result.warnings.push(`order "${frontmatter.order}" is not an integer — sort order may be unexpected`);
          }

          if (frontmatter.order !== undefined && frontmatter.order < 0) {
            result.errors.push(`order "${frontmatter.order}" is negative — must be >= 0`);
            result.valid = false;
          }

          if (frontmatter.tags && frontmatter.keywords) {
            const overlap = frontmatter.tags.filter((t) => frontmatter.keywords?.includes(t));
            if (overlap.length > 0) {
              result.warnings.push(`tags and keywords overlap: [${overlap.join(', ')}] — redundant data`);
            }
          }

          if (frontmatter.iconType && !frontmatter.icon) {
            result.warnings.push('iconType set without icon — has no effect');
          }

          if (frontmatter.badgeColor && !frontmatter.badge) {
            result.warnings.push('badgeColor set without badge — has no effect');
          }

          if (frontmatter.externalUrl && !frontmatter.externalUrl.includes('://')) {
            result.warnings.push(
              `externalUrl "${frontmatter.externalUrl}" may be invalid — expected a URL with scheme`,
            );
          }

          if (
            frontmatter.redirect &&
            !frontmatter.redirect.startsWith('/') &&
            !frontmatter.redirect.startsWith('http')
          ) {
            result.warnings.push(
              `redirect "${frontmatter.redirect}" does not start with "/" — may resolve to unexpected path`,
            );
          }

          for (const key of Object.keys(frontmatter)) {
            if (!ALLOWED_FRONTMATTER_KEYS.has(key)) {
              result.warnings.push(`Unknown frontmatter key "${key}" — possible typo`);
            }
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          result.errors.push(`Parse error: ${message}`);
          result.valid = false;
        }

        results.push(result);
      }
    }
  }

  validateDirectory(rootDir);
  return results;
}

function watchDocs(rootDir: string, onChange: (changedFile: string) => void, interval = 1000): { close: () => void } {
  const watched = new Set<string>();

  function collectFiles(dir: string) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name.startsWith('.') || entry.name === 'manifest.json' || entry.name === 'search-index.json')
          continue;
        const fullPath = path.join(dir, entry.name);
        watched.add(fullPath);
        if (entry.isDirectory()) {
          collectFiles(fullPath);
        }
      }
    } catch {
      // skip unreadable directories
    }
  }

  collectFiles(rootDir);

  const mtimes = new Map<string, number>();

  for (const file of watched) {
    try {
      const stat = fs.statSync(file);
      mtimes.set(file, stat.mtimeMs);
    } catch {
      mtimes.set(file, 0);
    }
  }

  const timer = setInterval(() => {
    for (const file of watched) {
      try {
        const stat = fs.statSync(file);
        const prev = mtimes.get(file);
        const current = stat.mtimeMs;
        if (prev !== undefined && current !== prev) {
          mtimes.set(file, current);
          onChange(file);
        }
      } catch {
        // file may have been deleted
      }
    }
  }, interval);

  return {
    close: () => clearInterval(timer),
  };
}

export type {
  ConfigFile,
  DiscoveredProject,
  DiscoveryOptions,
  Frontmatter,
  ManifestGenerationOptions,
  ManifestResult,
  NavigationItem,
  ProcessingResult,
  ProjectConfig,
  SearchEntry,
  ValidateResult,
} from './types.js';
export {
  cleanItem,
  dedupeHeadings,
  diceSimilarity,
  discoverProjects,
  extractHeadings,
  formatTitle,
  generateDocsManifests,
  generateManifest,
  generateManifestsWithDiscovery,
  makeBreadcrumb,
  makeExcerpt,
  parseFrontmatter,
  sortItems,
  validateDocs,
  walkDocs,
  watchDocs,
};
