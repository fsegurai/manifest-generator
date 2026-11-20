import fs from 'node:fs';
import path from 'node:path';
import {
  ALLOWED_FRONTMATTER_KEYS,
  applyFrontmatterAliases,
  applyPrevNext,
  cleanItem,
  dedupeHeadings,
  diceSimilarity,
  extractHeadings,
  extractSections,
  formatTitle,
  generateManifestFromFiles,
  isExcluded as isExcludedPosix,
  isMarkdownFile,
  makeBreadcrumb,
  makeExcerpt,
  parseFrontmatter,
  slugifyHeading,
  sortItems,
  walkTree,
} from './core.js';
import type {
  BreadcrumbSegment,
  DiscoveredProject,
  DiscoveryOptions,
  DocsReader,
  Frontmatter,
  ManifestGenerationOptions,
  ManifestOptions,
  ManifestResult,
  NavigationItem,
  ProcessingResult,
  ProjectConfig,
  SearchEntry,
  ValidateOptions,
  ValidateResult,
  WalkOptions,
} from './types.js';

export { defineConfig } from './config.js';

function isExcluded(relPath: string, patterns: string[]): boolean {
  return isExcludedPosix(relPath.split(path.sep).join('/'), patterns);
}

/** `DocsReader` over the Node file system. */
const nodeReader: DocsReader = {
  list(dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).map((entry) => ({
      name: entry.name,
      isDirectory: entry.isDirectory(),
      isFile: entry.isFile(),
    }));
  },
  read(file) {
    return fs.readFileSync(file, 'utf8');
  },
  exists(file) {
    return fs.existsSync(file);
  },
  join(...parts) {
    return path.join(...parts);
  },
};

function computeRoutePrefix(outputDir: string, sourceDir: string): string {
  const rel = path.relative(path.resolve(outputDir), path.resolve(sourceDir));
  if (!rel || rel.startsWith('..')) return '';
  return rel.split(path.sep).join('/');
}

function prefixBreadcrumb(
  breadcrumb: BreadcrumbSegment[] | undefined,
  prefix: string,
): BreadcrumbSegment[] | undefined {
  if (!breadcrumb) return breadcrumb;
  return breadcrumb.map((segment) => ({
    ...segment,
    route: segment.route && segment.route !== '#' ? `${prefix}/${segment.route}` : segment.route,
  }));
}

function applyRoutePrefix(items: NavigationItem[], prefix: string): NavigationItem[] {
  return items.map((item) => {
    if (item.route && item.route !== '#') {
      item.route = `${prefix}/${item.route}`;
    }
    item.breadcrumb = prefixBreadcrumb(item.breadcrumb, prefix);
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
  chain: BreadcrumbSegment[] = [],
  options: WalkOptions = {},
): NavigationItem[] {
  // `path.join` used to normalize `relative` ('guides/', './guides' → 'guides'); keep that for direct callers.
  const normalized = relative ? path.normalize(relative).replace(/[\\/]+$/, '') : '';
  return walkTree(nodeReader, dir, normalized === '.' ? '' : normalized, searchIndex, exclude, chain, options);
}

/** The walker options set in `options`, or `undefined` when none is, so default runs call the walker as before. */
function walkOptionsOf(options: WalkOptions): WalkOptions | undefined {
  const { frontmatterAliases, headingAnchors, extraFrontmatter, readingTime } = options;
  const picked: WalkOptions = {
    ...(frontmatterAliases ? { frontmatterAliases } : {}),
    ...(headingAnchors ? { headingAnchors } : {}),
    ...(extraFrontmatter ? { extraFrontmatter } : {}),
    ...(readingTime ? { readingTime } : {}),
  };
  return Object.keys(picked).length > 0 ? picked : undefined;
}

function resolveDocsPath(projectPath: string, docsSubfolder: string): string {
  const docsPath = path.join(projectPath, docsSubfolder);
  return fs.existsSync(docsPath) && fs.statSync(docsPath).isDirectory() ? docsPath : projectPath;
}

function generateDocsManifests(
  docsRoot: string,
  optionsOrWalker?:
    | (WalkOptions & {
        docsSubfolder?: string;
        recursive?: boolean;
        exclude?: string[];
        projects?: Record<string, ProjectConfig>;
        dryRun?: boolean;
        prevNext?: boolean;
        walkerFn?: (
          projectPath: string,
          relative: string,
          searchIndex: SearchEntry[],
          exclude?: string[],
          chain?: BreadcrumbSegment[],
          options?: WalkOptions,
        ) => NavigationItem[];
      })
    | ((projectPath: string, relative: string, searchIndex: SearchEntry[]) => NavigationItem[]),
): ProcessingResult[] {
  const options = typeof optionsOrWalker === 'function' ? { walkerFn: optionsOrWalker } : optionsOrWalker || {};
  const {
    docsSubfolder = 'docs',
    recursive = false,
    exclude = [],
    projects = {},
    dryRun = false,
    prevNext = false,
    walkerFn,
  } = options;
  const walkOptions = walkOptionsOf(options);
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
      const manifest = walkOptions
        ? walker(docsPath, '', searchIndex, exclude, [], walkOptions)
        : walker(docsPath, '', searchIndex, exclude);
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
          if (entry.route) {
            searchIndex[i] = {
              ...entry,
              route: `${prefix}/${entry.route}`,
              breadcrumb: prefixBreadcrumb(entry.breadcrumb, prefix),
            };
          }
        }
      }

      const cleaned = (prevNext ? applyPrevNext(manifest) : manifest).map(cleanItem);

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

function generateManifest(projectPath: string, exclude: string[] = [], options: ManifestOptions = {}): ManifestResult {
  const { prevNext = false, ...rest } = options;
  const searchIndex: SearchEntry[] = [];
  const manifest = walkDocs(projectPath, '', searchIndex, exclude, [], walkOptionsOf(rest) ?? {});

  return {
    manifest: prevNext ? applyPrevNext(manifest) : manifest,
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
    prevNext = false,
  } = options;
  const walkOptions = walkOptionsOf(options) ?? {};

  if (route) {
    if (!fs.existsSync(route)) {
      throw new Error(`Route not found: ${route}`);
    }

    const result = generateManifest(route, exclude, walkOptions);
    const outputPath = outputDir || route;

    const prefix = outputDir ? computeRoutePrefix(outputDir, route) : '';
    if (prefix) {
      applyRoutePrefix(result.manifest, prefix);
      for (let i = 0; i < result.searchIndex.length; i++) {
        const entry = result.searchIndex[i];
        if (entry.route) {
          result.searchIndex[i] = {
            ...entry,
            route: `${prefix}/${entry.route}`,
            breadcrumb: prefixBreadcrumb(entry.breadcrumb, prefix),
          };
        }
      }
    }

    const cleaned = (prevNext ? applyPrevNext(result.manifest) : result.manifest).map(cleanItem);
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
    const result = generateManifest(targetPath, exclude, walkOptions);
    const outputPath2 = outputDir || projectPath;

    const prefix = outputDir ? computeRoutePrefix(outputPath2, targetPath) : '';
    if (prefix) {
      applyRoutePrefix(result.manifest, prefix);
      for (let i = 0; i < result.searchIndex.length; i++) {
        const entry = result.searchIndex[i];
        if (entry.route) {
          result.searchIndex[i] = {
            ...entry,
            route: `${prefix}/${entry.route}`,
            breadcrumb: prefixBreadcrumb(entry.breadcrumb, prefix),
          };
        }
      }
    }

    const cleaned = (prevNext ? applyPrevNext(result.manifest) : result.manifest).map(cleanItem);
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
    return generateDocsManifests(rootDir, {
      docsSubfolder,
      recursive,
      exclude,
      projects,
      dryRun,
      prevNext,
      ...walkOptions,
    });
  }

  return [];
}

function validateDocs(rootDir: string, options: ValidateOptions = {}): ValidateResult[] {
  const results: ValidateResult[] = [];
  const aliases = options.frontmatterAliases ?? {};
  const ignoredKeys = new Set(options.ignoreKeys ?? []);

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
          const rawFrontmatter = parseFrontmatter<Frontmatter>(content);
          const frontmatter = applyFrontmatterAliases(rawFrontmatter, aliases);

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

          for (const key of Object.keys(rawFrontmatter)) {
            if (!ALLOWED_FRONTMATTER_KEYS.has(key) && !Object.hasOwn(aliases, key) && !ignoredKeys.has(key)) {
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

  const redirectTargets = new Map<string, string[]>();
  for (const result of results) {
    const target = result.frontmatter?.redirect;
    if (!target) continue;
    const files = redirectTargets.get(target) ?? [];
    files.push(result.file);
    redirectTargets.set(target, files);
  }

  for (const result of results) {
    const target = result.frontmatter?.redirect;
    if (!target) continue;
    const collidingFiles = (redirectTargets.get(target) ?? []).filter((file) => file !== result.file);
    if (collidingFiles.length > 0) {
      result.warnings.push(`Redirect target "${target}" is also used by ${collidingFiles.join(', ')}`);
    }
  }

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
  BreadcrumbSegment,
  ConfigFile,
  DiscoveredProject,
  DiscoveryOptions,
  DocsReader,
  Frontmatter,
  FrontmatterAliases,
  InMemoryFile,
  ManifestFromFilesOptions,
  ManifestGenerationOptions,
  ManifestOptions,
  ManifestResult,
  NavigationItem,
  PageLink,
  PageSection,
  ProcessingResult,
  ProjectConfig,
  SearchEntry,
  ValidateOptions,
  ValidateResult,
  WalkOptions,
} from './types.js';
export {
  ALLOWED_FRONTMATTER_KEYS,
  applyFrontmatterAliases,
  applyPrevNext,
  cleanItem,
  dedupeHeadings,
  diceSimilarity,
  discoverProjects,
  extractHeadings,
  extractSections,
  formatTitle,
  generateDocsManifests,
  generateManifest,
  generateManifestFromFiles,
  generateManifestsWithDiscovery,
  makeBreadcrumb,
  makeExcerpt,
  parseFrontmatter,
  slugifyHeading,
  sortItems,
  validateDocs,
  walkDocs,
  watchDocs,
};
