import fs from 'node:fs';
import path from 'node:path';
import type {
  DiscoveredProject,
  DiscoveryOptions,
  Frontmatter,
  ManifestGenerationOptions,
  ManifestResult,
  NavigationItem,
  ProcessingResult,
  SearchEntry,
  ValidateResult,
} from './types.js';

function formatTitle(name: string): string {
  return name.replace(/\.(md|mdx)$/, '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function parseFrontmatter<T = Record<string, unknown>>(content: string): T {
  const match = content.match(/^---\s*\n([\s\S]*?)\n\s*---/);
  if (!match) return {} as T;

  const raw = match[1];
  const data: Record<string, unknown> = {};
  const lines = raw.split('\n');
  let currentKey: string | null = null;
  let currentValue: string[] = [];
  let inMultiline = false;

  function commitValue() {
    if (currentKey === null) return;
    const rawValue = currentValue.join('\n').trim();
    if (!rawValue) {
      currentKey = null;
      currentValue = [];
      return;
    }
    data[currentKey] = parseValue(rawValue);
    currentKey = null;
    currentValue = [];
  }

  for (const line of lines) {
    const trimmed = line.trimEnd();

    if (inMultiline) {
      if (trimmed === '' || trimmed.startsWith('---')) {
        inMultiline = false;
        continue;
      }
      const indented = line.startsWith(' ') || line.startsWith('\t');
      const nextKeyMatch = !indented && trimmed.match(/^(\w[\w-]*?):\s/);
      if (nextKeyMatch && currentValue.length > 0) {
        commitValue();
        currentKey = nextKeyMatch[1];
        const rest = trimmed.slice(nextKeyMatch[0].length).trim();
        if (rest) {
          currentValue = [rest];
        }
      } else {
        currentValue.push(line);
      }
      continue;
    }

    const keyMatch = trimmed.match(/^(\w[\w-]*?):\s*(.*)/);
    if (!keyMatch) continue;

    commitValue();

    currentKey = keyMatch[1];
    const rest = keyMatch[2];

    if (rest === '|' || rest === '>') {
      inMultiline = true;
      currentValue = [];
    } else if (rest) {
      currentValue = [rest];
    } else {
      currentValue = [];
    }
  }

  if (currentKey !== null) {
    commitValue();
  }

  return data as T;
}

function parseValue(rawValue: string): unknown {
  const trimmed = rawValue.trim();

  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed;
    }
  }

  if (trimmed === 'true' || trimmed === 'false') {
    return trimmed === 'true';
  }

  if (trimmed === 'null') {
    return null;
  }

  if (!isNaN(Number(trimmed)) && trimmed !== '') {
    return Number(trimmed);
  }

  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith('\'') && trimmed.endsWith('\''))) {
    return trimmed.slice(1, -1);
  }

  return trimmed.replace(/^["']|["']$/g, '');
}

function cleanItem(item: NavigationItem): NavigationItem {
  const cleaned: NavigationItem = { label: item.label };
  const keys = Object.keys(item) as (keyof NavigationItem)[];
  for (const key of keys) {
    const value = item[key];
    if (value !== null && value !== false && value !== '' && value !== undefined) {
      if (key === 'children' && Array.isArray(value)) {
        cleaned.children = value.map(cleanItem);
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

const VALID_MARKDOWN_EXTENSIONS = ['.md', '.mdx'];

function isMarkdownFile(name: string): boolean {
  return VALID_MARKDOWN_EXTENSIONS.some(ext => name.endsWith(ext));
}

function walkDocs(dir: string, relative = '', searchIndex: SearchEntry[] = []): NavigationItem[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  const items = entries
    .filter(entry => !entry.name.startsWith('.') && entry.name !== 'manifest.json')
    .map(entry => {
      const fullPath = path.join(dir, entry.name);
      const relPath = path.join(relative, entry.name);

      if (entry.isDirectory()) {
        const children = walkDocs(fullPath, relPath, searchIndex);
        if (children.length === 0) return null;

        const folderItem: NavigationItem = {
          label: formatTitle(entry.name),
          route: relPath.replace(/\\/g, '/'),
          isParent: true,
        };

        const indexMd = children.find(c => c.route === relPath.replace(/\\/g, '/') + '/README'
          || c.route === relPath.replace(/\\/g, '/') + '/index');
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

        if (item.route !== '#' && item.route !== '' && item.route !== null) {
          searchIndex.push({
            label: item.label,
            description: item.description,
            route: cleanPath,
            tags: item.tags,
            keywords: item.keywords,
            breadcrumbTitle: item.breadcrumbTitle,
          });
        }

        return item;
      }

      return null;
    })
    .filter(Boolean) as NavigationItem[];

  return sortItems(items);
}

function generateDocsManifests(
  docsRoot: string,
  optionsOrWalker?:
    | {
        docsSubfolder?: string;
        recursive?: boolean;
        walkerFn?: (projectPath: string, relative: string, searchIndex: SearchEntry[]) => NavigationItem[];
      }
    | ((projectPath: string, relative: string, searchIndex: SearchEntry[]) => NavigationItem[]),
): ProcessingResult[] {
  const options = typeof optionsOrWalker === 'function' ? { walkerFn: optionsOrWalker } : (optionsOrWalker || {});
  const { docsSubfolder = 'docs', recursive = false, walkerFn } = options;
  const discovered = discoverProjects(docsRoot, { docsSubfolder, recursive });
  const results: ProcessingResult[] = [];

  discovered.forEach(project => {
    const searchIndex: SearchEntry[] = [];
    const walker = walkerFn || walkDocs;

    try {
      const manifest = walker(project.docsPath, '', searchIndex);
      if (!manifest || !Array.isArray(manifest)) {
        results.push({
          name: project.name,
          processed: false,
          error: 'Invalid manifest generated',
        });
        return;
      }

      const cleaned = manifest.map(cleanItem);

      fs.writeFileSync(
        path.join(project.projectPath, 'manifest.json'),
        JSON.stringify(cleaned, null, 2),
        'utf8',
      );

      fs.writeFileSync(
        path.join(project.projectPath, 'search-index.json'),
        JSON.stringify(searchIndex, null, 2),
        'utf8',
      );

      console.log(`Generated manifest and search index for: ${ project.name }`);
      results.push({ name: project.name, processed: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      results.push({ name: project.name, processed: false, error: message });
    }
  });

  return results;
}

function generateManifest(projectPath: string): ManifestResult {
  const searchIndex: SearchEntry[] = [];
  const manifest = walkDocs(projectPath, '', searchIndex);

  return {
    manifest,
    searchIndex,
  };
}

function discoverProjects(rootDir: string, options: DiscoveryOptions = {}): DiscoveredProject[] {
  const { docsSubfolder = 'docs', recursive = false } = options;
  const discovered: DiscoveredProject[] = [];
  const maxDepth = recursive ? Infinity : 1;

  function isProjectRoot(dir: string): boolean {
    try {
      const docsPath = path.join(dir, docsSubfolder);
      if (fs.existsSync(docsPath) && fs.statSync(docsPath).isDirectory()) {
        return true;
      }
      return fs.readdirSync(dir, { withFileTypes: true })
        .some(file => file.isFile() && isMarkdownFile(file.name));
    } catch {
      return false;
    }
  }

  function scan(dir: string, depth: number) {
    if (depth > maxDepth) return;

    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        if (!entry.isDirectory() || entry.name.startsWith('.')) continue;

        const projectPath = path.join(dir, entry.name);

        if (isProjectRoot(projectPath)) {
          const docsPath = path.join(projectPath, docsSubfolder);
          const actualDocsPath = fs.existsSync(docsPath) && fs.statSync(docsPath).isDirectory()
            ? docsPath
            : projectPath;

          discovered.push({
            name: entry.name,
            projectPath,
            docsPath: actualDocsPath,
            type: depth > 1 ? 'recursive' : (actualDocsPath === docsPath ? 'subfolder' : 'direct'),
          });
        } else if (recursive) {
          scan(projectPath, depth + 1);
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`Warning: Could not scan directory ${ dir }: ${ message }`);
    }
  }

  scan(rootDir, 1);
  return discovered;
}

function generateManifestsWithDiscovery(
  rootDir: string,
  options: ManifestGenerationOptions = {},
): ProcessingResult[] {
  const {
    project = null,
    route = null,
    outputDir = null,
    docsSubfolder = 'docs',
    autoDetect = true,
    recursive = false,
  } = options;

  if (route) {
    if (!fs.existsSync(route)) {
      throw new Error(`Route not found: ${ route }`);
    }

    const result = generateManifest(route);
    const outputPath = outputDir || route;

    fs.mkdirSync(outputPath, { recursive: true });

    const cleaned = result.manifest.map(cleanItem);

    fs.writeFileSync(
      path.join(outputPath, 'manifest.json'),
      JSON.stringify(cleaned, null, 2),
      'utf8',
    );

    fs.writeFileSync(
      path.join(outputPath, 'search-index.json'),
      JSON.stringify(result.searchIndex, null, 2),
      'utf8',
    );

    console.log(`Generated manifest for route: ${ route }`);
    return [{ name: path.basename(route), processed: true }];
  }

  if (project) {
    const projectPath = path.join(rootDir, project);
    const docsPath = path.join(projectPath, docsSubfolder);

    if (!fs.existsSync(projectPath)) {
      throw new Error(`Project not found: ${ project }`);
    }

    const targetPath = fs.existsSync(docsPath) ? docsPath : projectPath;
    const result = generateManifest(targetPath);
    const outputPath2 = outputDir || projectPath;

    fs.mkdirSync(outputPath2, { recursive: true });

    const cleaned = result.manifest.map(cleanItem);

    fs.writeFileSync(
      path.join(outputPath2, 'manifest.json'),
      JSON.stringify(cleaned, null, 2),
      'utf8',
    );

    fs.writeFileSync(
      path.join(outputPath2, 'search-index.json'),
      JSON.stringify(result.searchIndex, null, 2),
      'utf8',
    );

    console.log(`Generated manifest for project: ${ project }`);
    return [{ name: project, processed: true }];
  }

  if (autoDetect) {
    return generateDocsManifests(rootDir, { docsSubfolder, recursive });
  }

  return [];
}

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

          if (frontmatter.redirect && frontmatter.route) {
            result.warnings.push('redirect set with route — route will be overridden');
          }

          if (frontmatter.deprecated && !frontmatter.deprecatedAlternative) {
            result.warnings.push('deprecated set without deprecatedAlternative — consider suggesting a migration path');
          }

          if (frontmatter.publishedAt && isNaN(Date.parse(frontmatter.publishedAt))) {
            result.errors.push(`publishedAt "${ frontmatter.publishedAt }" is not a valid date`);
            result.valid = false;
          }

          if (frontmatter.updatedAt && isNaN(Date.parse(frontmatter.updatedAt))) {
            result.errors.push(`updatedAt "${ frontmatter.updatedAt }" is not a valid date`);
            result.valid = false;
          }

        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          result.errors.push(`Parse error: ${ message }`);
          result.valid = false;
        }

        results.push(result);
      }
    }
  }

  validateDirectory(rootDir);
  return results;
}

function watchDocs(
  rootDir: string,
  onChange: (changedFile: string) => void,
  interval = 1000,
): { close: () => void } {
  const watched = new Set<string>();

  function collectFiles(dir: string) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name.startsWith('.') || entry.name === 'manifest.json' || entry.name === 'search-index.json') continue;
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

export {
  formatTitle,
  parseFrontmatter,
  walkDocs,
  cleanItem,
  sortItems,
  generateDocsManifests,
  generateManifest,
  discoverProjects,
  generateManifestsWithDiscovery,
  validateDocs,
  watchDocs,
};

export type {
  NavigationItem,
  SearchEntry,
  ManifestResult,
  DiscoveredProject,
  ProcessingResult,
  DiscoveryOptions,
  ManifestGenerationOptions,
  Frontmatter,
  ValidateResult,
} from './types.js';
