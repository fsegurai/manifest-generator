import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  cleanItem,
  dedupeHeadings,
  defineConfig,
  diceSimilarity,
  discoverProjects,
  extractHeadings,
  formatTitle,
  generateDocsManifests,
  generateManifest,
  generateManifestsWithDiscovery,
  makeBreadcrumb,
  makeExcerpt,
  type NavigationItem,
  parseFrontmatter,
  type SearchEntry,
  sortItems,
  validateDocs,
  walkDocs,
  watchDocs,
} from '../src';

let tempDir = '';

function writeFile(filePath: string, content: string) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
}

beforeEach(() => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'manifest-generator-'));
});

afterEach(() => {
  if (tempDir) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

describe('parseFrontmatter', () => {
  test('parses basic values and arrays', () => {
    const content = '---\nlabel: Intro\ndraft: false\ntags: ["docs", "guide"]\n---\n# Title';
    const parsed = parseFrontmatter<{ label: string; draft: boolean; tags: string[] }>(content);

    expect(parsed.label).toBe('Intro');
    expect(parsed.draft).toBe(false);
    expect(parsed.tags).toEqual(['docs', 'guide']);
  });

  test('handles null values', () => {
    const content = '---\nicon: null\nbadge: null\n---\n# Content';
    const parsed = parseFrontmatter<{ icon: null; badge: null }>(content);

    expect(parsed.icon).toBe(null);
    expect(parsed.badge).toBe(null);
  });

  test('handles quoted strings', () => {
    const content = '---\nlabel: "Page Title"\ndescription: \'A short description\'\n---\n# Content';
    const parsed = parseFrontmatter<{ label: string; description: string }>(content);

    expect(parsed.label).toBe('Page Title');
    expect(parsed.description).toBe('A short description');
  });

  test('returns empty object when no frontmatter', () => {
    const content = '# Just a title\n\nSome content';
    const parsed = parseFrontmatter(content);

    expect(parsed).toEqual({});
  });

  test('handles numeric values', () => {
    const content = '---\norder: 1\nversion: 2.5\n---\n# Content';
    const parsed = parseFrontmatter<{ order: number; version: number }>(content);

    expect(parsed.order).toBe(1);
    expect(parsed.version).toBe(2.5);
  });

  test('parses multiline pipe values', () => {
    const content = '---\ndescription: |\n  Line one\n  Line two\nlabel: Done\n---\n# Content';
    const parsed = parseFrontmatter<{ description: string; label: string }>(content);

    expect(parsed.label).toBe('Done');
    expect(parsed.description).toBeTruthy();
  });

  test('parses multiline block scalar with empty separator line', () => {
    const content = '---\ndescription: >\n  Folded\n  text\n\nnext: value\n---\n# Content';
    const parsed = parseFrontmatter(content);

    expect(parsed.next).toBe('value');
    expect(parsed.description).toBeTruthy();
  });

  test('handles key with empty value', () => {
    const content = '---\nlabel:\norder: 1\n---\n# Content';
    const parsed = parseFrontmatter<{ label?: string; order: number }>(content);

    expect(parsed.order).toBe(1);
    expect(parsed.label).toBe('');
  });

  test('returns empty object when YAML is malformed instead of throwing', () => {
    // Tab-indented YAML is invalid and makes js-yaml throw a YAMLException.
    const content = '---\n\tlabel: Broken\n---\n# Content';
    expect(() => parseFrontmatter(content)).not.toThrow();
    expect(parseFrontmatter(content)).toEqual({});
  });
});

describe('formatTitle', () => {
  test('removes .md extension and title-cases', () => {
    expect(formatTitle('hello-world.md')).toBe('Hello World');
  });

  test('removes .mdx extension and title-cases', () => {
    expect(formatTitle('getting-started.mdx')).toBe('Getting Started');
  });

  test('handles single word without extension', () => {
    expect(formatTitle('readme')).toBe('Readme');
  });

  test('handles multiple dashes', () => {
    expect(formatTitle('my-long-doc-name.md')).toBe('My Long Doc Name');
  });
});

describe('walkDocs', () => {
  test('builds navigation and search index', () => {
    const docsRoot = path.join(tempDir, 'docs');

    writeFile(path.join(docsRoot, 'intro.md'), '---\nlabel: Intro\n---\nHello');
    writeFile(path.join(docsRoot, 'title.md'), '---\nisTitle: true\n---\n# Title');
    writeFile(path.join(docsRoot, 'hidden.md'), '---\nhidden: true\n---\nHidden');
    writeFile(path.join(docsRoot, 'section', 'guide.md'), '# Guide');

    const searchIndex: SearchEntry[] = [];
    const manifest = walkDocs(docsRoot, '', searchIndex);

    expect(manifest.length).toBe(3);
    expect(searchIndex.length).toBe(2);

    const titleEntry = manifest.find((item) => item.label === 'Title');
    expect(titleEntry?.route).toBe('#');

    const sectionEntry = manifest.find((item) => item.label === 'Section');
    expect(sectionEntry?.isParent).toBe(true);
    expect(sectionEntry?.children?.length).toBe(1);
  });

  test('supports .mdx files', () => {
    const docsRoot = path.join(tempDir, 'docs');
    writeFile(path.join(docsRoot, 'article.mdx'), '---\nlabel: MDX Article\n---\n# Article');
    writeFile(path.join(docsRoot, 'note.md'), '# Note');

    const searchIndex: SearchEntry[] = [];
    const manifest = walkDocs(docsRoot, '', searchIndex);

    expect(manifest.length).toBe(2);
    expect(manifest.find((i) => i.label === 'MDX Article')).toBeTruthy();
    expect(manifest.find((i) => i.label === 'Note')).toBeTruthy();
  });

  test('respects order property for sorting', () => {
    const docsRoot = path.join(tempDir, 'docs');

    writeFile(path.join(docsRoot, 'zzz.md'), '---\nlabel: ZZZ Last\norder: 3\n---\n# Z');
    writeFile(path.join(docsRoot, 'aaa.md'), '---\nlabel: AAA Mid\norder: 2\n---\n# A');
    writeFile(path.join(docsRoot, 'mmm.md'), '---\nlabel: MMM First\norder: 1\n---\n# M');

    const searchIndex: SearchEntry[] = [];
    const manifest = walkDocs(docsRoot, '', searchIndex);

    expect(manifest.length).toBe(3);
    expect(manifest[0].label).toBe('MMM First');
    expect(manifest[1].label).toBe('AAA Mid');
    expect(manifest[2].label).toBe('ZZZ Last');
  });

  test('falls back to alphabetical sorting when no order set', () => {
    const docsRoot = path.join(tempDir, 'docs');

    writeFile(path.join(docsRoot, 'beta.md'), '# Beta');
    writeFile(path.join(docsRoot, 'alpha.md'), '# Alpha');
    writeFile(path.join(docsRoot, 'charlie.md'), '# Charlie');

    const searchIndex: SearchEntry[] = [];
    const manifest = walkDocs(docsRoot, '', searchIndex);

    expect(manifest[0].label).toBe('Alpha');
    expect(manifest[1].label).toBe('Beta');
    expect(manifest[2].label).toBe('Charlie');
  });

  test('filters out draft and hidden files', () => {
    const docsRoot = path.join(tempDir, 'docs-filter');
    writeFile(path.join(docsRoot, 'visible.md'), '# Visible');
    writeFile(path.join(docsRoot, 'draft.md'), '---\ndraft: true\n---\nDraft');
    writeFile(path.join(docsRoot, 'hidden.md'), '---\nhidden: true\n---\nHidden');

    const items = walkDocs(docsRoot);
    expect(items.length).toBe(1);
    expect(items[0].label).toBe('Visible');
  });

  test('folder inherits props from README.md', () => {
    const docsRoot = path.join(tempDir, 'docs-inherit');
    writeFile(
      path.join(docsRoot, 'section', 'README.md'),
      '---\norder: 1\nicon: folder-icon\nbadge: New\nbadgeColor: green\niconType: filled\n---\nSection',
    );
    writeFile(path.join(docsRoot, 'section', 'page.md'), '# Page');

    const items = walkDocs(docsRoot);
    const section = items.find((i) => i.isParent);
    expect(section).toBeTruthy();
    expect(section?.order).toBe(1);
    expect(section?.icon).toBe('folder-icon');
    expect(section?.badge).toBe('New');
    expect(section?.badgeColor).toBe('green');
    expect(section?.iconType).toBe('filled');
  });

  test('includes headings, excerpt, and breadcrumb in search index', () => {
    const docsRoot = path.join(tempDir, 'docs-search');

    writeFile(
      path.join(docsRoot, 'guides', 'advanced.md'),
      `---
label: Advanced Guide
tags: ["guide"]
---

## Getting Started

Some **bold** text here.

### Configuration

More content with a [link](https://example.com) and \`inline code\`.

### Deployment

Final section with a list:

- item one
- item two
`,
    );

    const searchIndex: SearchEntry[] = [];
    walkDocs(docsRoot, '', searchIndex);

    expect(searchIndex[0].headings).toEqual(['Getting Started', 'Configuration', 'Deployment']);
    expect(searchIndex[0].breadcrumb).toBe('Guides');
    expect(searchIndex[0].excerpt).toBeTruthy();
    expect(searchIndex[0].excerpt?.toLowerCase()).toContain('bold');
    expect(searchIndex[0].tags).toEqual(['guide']);
  });

  test('breadcrumbTitle in a folder README overrides the derived breadcrumb label', () => {
    const docsRoot = path.join(tempDir, 'docs-breadcrumb-override');

    writeFile(path.join(docsRoot, 'section', 'README.md'), '---\nbreadcrumbTitle: Custom Section Name\n---\nSection');
    writeFile(path.join(docsRoot, 'section', 'page.md'), '# Page');

    const searchIndex: SearchEntry[] = [];
    walkDocs(docsRoot, '', searchIndex);

    const entry = searchIndex.find((e) => e.label === 'Page');
    expect(entry?.breadcrumb).toBe('Custom Section Name');
  });

  test('breadcrumb falls back to the derived folder label without breadcrumbTitle override', () => {
    const docsRoot = path.join(tempDir, 'docs-breadcrumb-default');

    writeFile(path.join(docsRoot, 'getting-started', 'page.md'), '# Page');

    const searchIndex: SearchEntry[] = [];
    walkDocs(docsRoot, '', searchIndex);

    expect(searchIndex[0].breadcrumb).toBe('Getting Started');
  });

  test('chains multiple ancestor labels, some overridden and some derived', () => {
    const docsRoot = path.join(tempDir, 'docs-breadcrumb-chain');

    writeFile(
      path.join(docsRoot, 'grandparent', 'README.md'),
      '---\nbreadcrumbTitle: Custom Grandparent\n---\nGrandparent',
    );
    writeFile(path.join(docsRoot, 'grandparent', 'parent', 'page.md'), '# Page');

    const searchIndex: SearchEntry[] = [];
    walkDocs(docsRoot, '', searchIndex);

    expect(searchIndex[0].breadcrumb).toBe('Custom Grandparent > Parent');
  });

  test('omits excerpt for file with only frontmatter', () => {
    const docsRoot = path.join(tempDir, 'docs-empty-body');

    writeFile(path.join(docsRoot, 'page.md'), '---\nlabel: Empty\n---\n   \n\n  ');

    const searchIndex: SearchEntry[] = [];
    walkDocs(docsRoot, '', searchIndex);

    expect(searchIndex[0].excerpt).toBeUndefined();
  });

  test('excludes files matching a glob pattern', () => {
    const docsRoot = path.join(tempDir, 'docs-exclude');
    writeFile(path.join(docsRoot, 'visible.md'), '# Visible');
    writeFile(path.join(docsRoot, 'internal.md'), '# Internal');

    const items = walkDocs(docsRoot, '', [], ['internal.md']);
    expect(items.length).toBe(1);
    expect(items[0].label).toBe('Visible');
  });

  test('excludes an entire directory matching a glob pattern', () => {
    const docsRoot = path.join(tempDir, 'docs-exclude-dir');
    writeFile(path.join(docsRoot, 'keep.md'), '# Keep');
    writeFile(path.join(docsRoot, 'drafts', 'wip.md'), '# WIP');

    const items = walkDocs(docsRoot, '', [], ['drafts/**']);
    expect(items.length).toBe(1);
    expect(items[0].label).toBe('Keep');
  });

  test('reads new frontmatter fields', () => {
    const docsRoot = path.join(tempDir, 'docs');

    writeFile(
      path.join(docsRoot, 'page.md'),
      `---
label: Full Page
description: Desc
tags: ["tag1"]
order: 1
redirect: /old-path
externalUrl: https://example.com
breadcrumbTitle: Bread
layout: custom
deprecated: true
deprecatedAlternative: /new-page
publishedAt: 2024-01-15
updatedAt: 2024-06-01
keywords: ["key1", "key2"]
---`,
    );

    const searchIndex: SearchEntry[] = [];
    const manifest = walkDocs(docsRoot, '', searchIndex);

    expect(manifest.length).toBe(1);
    const item = manifest[0];
    expect(item.label).toBe('Full Page');
    expect(item.order).toBe(1);
    expect(item.redirect).toBe('/old-path');
    expect(item.externalUrl).toBe('https://example.com');
    expect(item.breadcrumbTitle).toBe('Bread');
    expect(item.layout).toBe('custom');
    expect(item.deprecated).toBe(true);
    expect(item.deprecatedAlternative).toBe('/new-page');
    expect(item.publishedAt).toBe('2024-01-15');
    expect(item.updatedAt).toBe('2024-06-01');
    expect(item.keywords).toEqual(['key1', 'key2']);

    expect(searchIndex[0].headings).toBeUndefined();
    expect(searchIndex[0].excerpt).toBeUndefined();
    expect(searchIndex[0].breadcrumb).toBeUndefined();
  });

  test('README takes precedence over index.md when both exist, with a warning', () => {
    const docsRoot = path.join(tempDir, 'docs-readme-index-conflict');
    writeFile(path.join(docsRoot, 'guides', 'README.md'), '---\nlabel: Guides Readme\norder: 1\n---\nBody');
    writeFile(path.join(docsRoot, 'guides', 'index.md'), '---\nlabel: Guides Index\norder: 2\n---\nBody');
    writeFile(path.join(docsRoot, 'guides', 'page.md'), '# Page');

    const warnings: string[] = [];
    const originalWarn = console.warn;
    console.warn = (...args: unknown[]) => warnings.push(args.join(' '));

    let manifest: NavigationItem[];
    try {
      manifest = walkDocs(docsRoot, '', []);
    } finally {
      console.warn = originalWarn;
    }

    const guidesFolder = manifest.find((i) => i.route === 'guides');
    expect(guidesFolder).toBeDefined();
    expect(guidesFolder!.order).toBe(1);
    expect(warnings.some((w) => w.includes('both README and index found in guides'))).toBe(true);
  });

  test('skips files with unsupported extensions', () => {
    const docsRoot = path.join(tempDir, 'docs-unsupported-ext');
    writeFile(path.join(docsRoot, 'README.md'), '# Home');
    writeFile(path.join(docsRoot, 'notes.txt'), 'not markdown');
    writeFile(path.join(docsRoot, 'image.png'), 'binary-ish');

    const manifest = walkDocs(docsRoot, '', []);
    expect(manifest.length).toBe(1);
    expect(manifest[0].label).toBe('README');
  });

  test('falls back to formatTitle when a folder README.md cannot be read (e.g. is a directory)', () => {
    const docsRoot = path.join(tempDir, 'docs-broken-readme');
    // Make "README.md" itself a directory so existsSync() is true but readFileSync() throws EISDIR,
    // exercising resolveFolderBreadcrumbLabel's catch branch indirectly via walkDocs.
    fs.mkdirSync(path.join(docsRoot, 'getting-started', 'README.md'), { recursive: true });
    writeFile(path.join(docsRoot, 'getting-started', 'page.md'), '# Page');

    expect(() => walkDocs(docsRoot, '', [])).not.toThrow();
    const manifest = walkDocs(docsRoot, '', []);
    const folder = manifest.find((i) => i.route === 'getting-started');
    expect(folder).toBeDefined();
    expect(folder!.label).toBe('Getting Started');
  });
});

describe('cleanItem', () => {
  test('removes null, false, empty string fields', () => {
    const item = {
      label: 'Test',
      description: '',
      route: '/test',
      tags: [],
      icon: null,
      iconType: null,
      badge: null,
      badgeColor: null,
      isTitle: false,
      isParent: false,
    };

    const cleaned = cleanItem(item as NavigationItem);

    expect(cleaned.label).toBe('Test');
    expect(cleaned.description).toBeUndefined();
    expect(cleaned.route).toBe('/test');
    expect(cleaned.icon).toBeUndefined();
    expect(cleaned.isTitle).toBeUndefined();
    expect(cleaned.isParent).toBeUndefined();
  });

  test('preserves truthy fields', () => {
    const item = {
      label: 'Test',
      route: '/test',
      order: 1,
      redirect: '/old',
      deprecated: true,
      keywords: ['a'],
    };

    const cleaned = cleanItem(item as NavigationItem);

    expect(cleaned.order).toBe(1);
    expect(cleaned.redirect).toBe('/old');
    expect(cleaned.deprecated).toBe(true);
    expect(cleaned.keywords).toEqual(['a']);
  });

  test('recursively cleans children', () => {
    const item: NavigationItem = {
      label: 'Parent',
      children: [{ label: 'Child', description: '', icon: null }],
    };

    const cleaned = cleanItem(item);
    expect(cleaned.children![0].description).toBeUndefined();
    expect(cleaned.children![0].icon).toBeUndefined();
  });
});

describe('sortItems', () => {
  test('sorts by order then alphabetically', () => {
    const items = [{ label: 'Beta' }, { label: 'Alpha' }, { label: 'Gamma', order: 0 }, { label: 'Delta', order: 1 }];

    const sorted = sortItems(items as NavigationItem[]);

    expect(sorted[0].label).toBe('Gamma');
    expect(sorted[1].label).toBe('Delta');
    expect(sorted[2].label).toBe('Alpha');
    expect(sorted[3].label).toBe('Beta');
  });
});

describe('discoverProjects', () => {
  test('prefers docs subfolder when present', () => {
    const root = path.join(tempDir, 'projects');
    const projectA = path.join(root, 'project-a');
    const projectB = path.join(root, 'project-b');

    writeFile(path.join(projectA, 'docs', 'README.md'), '# A');
    writeFile(path.join(projectB, 'README.md'), '# B');

    const discovered = discoverProjects(root, { docsSubfolder: 'docs' });

    expect(discovered.length).toBe(2);
    const docsProject = discovered.find((item) => item.name === 'project-a');
    const directProject = discovered.find((item) => item.name === 'project-b');

    expect(docsProject?.type).toBe('subfolder');
    expect(directProject?.type).toBe('direct');
  });

  test('excludes matching directories from project discovery', () => {
    const root = path.join(tempDir, 'projects-exclude');
    writeFile(path.join(root, 'project-a', 'docs', 'README.md'), '# A');
    writeFile(path.join(root, 'project-b', 'docs', 'README.md'), '# B');

    const discovered = discoverProjects(root, { docsSubfolder: 'docs', exclude: ['project-b'] });

    expect(discovered.length).toBe(1);
    expect(discovered[0].name).toBe('project-a');
  });

  test('discovers nested projects with recursive option', () => {
    const root = path.join(tempDir, 'projects');
    const groupA = path.join(root, 'group-a');
    const project1 = path.join(groupA, 'project-1');
    const project2 = path.join(groupA, 'project-2');
    const standalone = path.join(root, 'standalone');

    writeFile(path.join(project1, 'docs', 'README.md'), '# P1');
    writeFile(path.join(project2, 'docs', 'README.md'), '# P2');
    writeFile(path.join(standalone, 'README.md'), '# S');

    const nonRecursive = discoverProjects(root, { docsSubfolder: 'docs', recursive: false });
    expect(nonRecursive.length).toBe(1); // only standalone
    expect(nonRecursive[0].name).toBe('standalone');

    const recursive = discoverProjects(root, { docsSubfolder: 'docs', recursive: true });
    expect(recursive.length).toBe(3);
    expect(recursive.find((p) => p.name === 'project-1')?.type).toBe('recursive');
    expect(recursive.find((p) => p.name === 'standalone')?.type).toBe('direct');
  });

  test('skips a candidate directory that cannot be read, without crashing (isProjectRoot catch)', () => {
    const root = path.join(tempDir, 'projects-locked-candidate');
    writeFile(path.join(root, 'project-a', 'docs', 'README.md'), '# A');
    const lockedDir = path.join(root, 'locked-project');
    fs.mkdirSync(lockedDir, { recursive: true });
    fs.chmodSync(lockedDir, 0o000);

    try {
      const discovered = discoverProjects(root, { docsSubfolder: 'docs' });
      expect(discovered.length).toBe(1);
      expect(discovered[0].name).toBe('project-a');
    } finally {
      fs.chmodSync(lockedDir, 0o755);
    }
  });

  test('warns and continues when a root directory cannot be scanned (scan catch)', () => {
    const lockedRoot = path.join(tempDir, 'locked-root');
    fs.mkdirSync(lockedRoot, { recursive: true });
    fs.chmodSync(lockedRoot, 0o000);

    const warnings: string[] = [];
    const originalWarn = console.warn;
    console.warn = (...args: unknown[]) => warnings.push(args.join(' '));

    try {
      const discovered = discoverProjects(lockedRoot);
      expect(discovered).toEqual([]);
      expect(warnings.some((w) => w.includes('Could not scan directory'))).toBe(true);
    } finally {
      console.warn = originalWarn;
      fs.chmodSync(lockedRoot, 0o755);
    }
  });
});

describe('validateDocs', () => {
  test('reports valid files as valid', () => {
    const root = path.join(tempDir, 'docs');
    writeFile(path.join(root, 'valid.md'), '---\nlabel: Valid\n---\nContent');

    const results = validateDocs(root);

    expect(results.length).toBe(1);
    expect(results[0].valid).toBe(true);
    expect(results[0].errors.length).toBe(0);
  });

  test('warns on redundant draft+hidden', () => {
    const root = path.join(tempDir, 'docs');
    writeFile(path.join(root, 'redundant.md'), '---\ndraft: true\nhidden: true\n---\nContent');

    const results = validateDocs(root);

    expect(results.length).toBe(1);
    expect(results[0].valid).toBe(true);
    expect(results[0].warnings.some((w) => w.includes('Both draft and hidden'))).toBe(true);
  });

  test('warns on duplicate redirect targets', () => {
    const root = path.join(tempDir, 'docs');
    writeFile(path.join(root, 'old-one.md'), '---\nredirect: /new-page\n---\nContent');
    writeFile(path.join(root, 'old-two.md'), '---\nredirect: /new-page\n---\nContent');
    writeFile(path.join(root, 'unique.md'), '---\nredirect: /other-page\n---\nContent');

    const results = validateDocs(root);
    const byFile = Object.fromEntries(results.map((r) => [r.file, r]));

    expect(byFile['old-one.md'].warnings.some((w) => w.includes('also used by old-two.md'))).toBe(true);
    expect(byFile['old-two.md'].warnings.some((w) => w.includes('also used by old-one.md'))).toBe(true);
    expect(byFile['unique.md'].warnings.some((w) => w.includes('also used by'))).toBe(false);
  });

  test('warns on deprecated without alternative', () => {
    const root = path.join(tempDir, 'docs');
    writeFile(path.join(root, 'dep.md'), '---\ndeprecated: true\n---\nOld');

    const results = validateDocs(root);

    expect(results.length).toBe(1);
    expect(results[0].warnings.some((w) => w.includes('deprecatedAlternative'))).toBe(true);
  });

  test('reports invalid dates', () => {
    const root = path.join(tempDir, 'docs');
    writeFile(path.join(root, 'dates.md'), '---\npublishedAt: not-a-date\n---\nContent');

    const results = validateDocs(root);

    expect(results.length).toBe(1);
    expect(results[0].valid).toBe(false);
    expect(results[0].errors.some((e) => e.includes('not a valid date'))).toBe(true);
  });

  test('reports isTitle+isParent conflict', () => {
    const root = path.join(tempDir, 'docs');
    writeFile(path.join(root, 'conflict.md'), '---\nisTitle: true\nisParent: true\n---\nBad');

    const results = validateDocs(root);

    expect(results[0].warnings.some((w) => w.includes('Both isTitle and isParent'))).toBe(true);
  });

  test('warns on badge without badgeColor', () => {
    const root = path.join(tempDir, 'docs-badge');
    writeFile(path.join(root, 'badge.md'), '---\nbadge: New\n---\nContent');
    const results = validateDocs(root);
    expect(results[0].warnings.some((w) => w.includes('badgeColor'))).toBe(true);
  });

  test('warns on externalUrl with redirect', () => {
    const root = path.join(tempDir, 'docs-ext');
    writeFile(path.join(root, 'both.md'), '---\nexternalUrl: https://example.com\nredirect: /old\n---\nContent');
    const results = validateDocs(root);
    expect(results[0].warnings.some((w) => w.includes('externalUrl and redirect'))).toBe(true);
  });

  test('warns on redirect with route', () => {
    const root = path.join(tempDir, 'docs-redir');
    writeFile(path.join(root, 'both.md'), '---\nredirect: /new\nroute: /old\n---\nContent');
    const results = validateDocs(root);
    expect(results[0].warnings.some((e) => e.includes('Unknown frontmatter key') && e.includes('route'))).toBe(true);
  });

  test('handles parse errors gracefully', () => {
    const root = path.join(tempDir, 'docs-error');
    writeFile(path.join(root, 'broken.md'), '---\nunclosed frontmatter\nContent');
    const results = validateDocs(root);
    expect(results.length).toBe(1);
    expect(results[0].valid).toBe(true);
  });

  test('validates updatedAt invalid date', () => {
    const root = path.join(tempDir, 'docs-updated');
    writeFile(path.join(root, 'bad.md'), '---\nupdatedAt: not-a-date\n---\nContent');
    const results = validateDocs(root);
    expect(results[0].valid).toBe(false);
    expect(results[0].errors.some((e) => e.includes('not a valid date'))).toBe(true);
  });

  test('warns when no label is set', () => {
    const root = path.join(tempDir, 'docs-nolabel');
    writeFile(path.join(root, 'no-label.md'), '---\ndescription: No label\n---\nContent');
    const results = validateDocs(root);
    expect(results[0].warnings.some((w) => w.includes('No label set'))).toBe(true);
  });

  test('warns when publishedAt is after updatedAt', () => {
    const root = path.join(tempDir, 'docs-reversed');
    writeFile(path.join(root, 'reversed.md'), '---\npublishedAt: 2024-06-01\nupdatedAt: 2024-01-15\n---\nContent');
    const results = validateDocs(root);
    expect(results[0].warnings.some((w) => w.includes('dates may be reversed'))).toBe(true);
  });

  test('warns when publishedAt is in the future', () => {
    const root = path.join(tempDir, 'docs-future');
    writeFile(path.join(root, 'future.md'), '---\npublishedAt: 2099-01-01\n---\nContent');
    const results = validateDocs(root);
    expect(results[0].warnings.some((w) => w.includes('future'))).toBe(true);
  });

  test('warns when order is not an integer', () => {
    const root = path.join(tempDir, 'docs-order-float');
    writeFile(path.join(root, 'float.md'), '---\norder: 1.5\n---\nContent');
    const results = validateDocs(root);
    expect(results[0].warnings.some((w) => w.includes('not an integer'))).toBe(true);
  });

  test('errors when order is negative', () => {
    const root = path.join(tempDir, 'docs-order-neg');
    writeFile(path.join(root, 'neg.md'), '---\norder: -1\n---\nContent');
    const results = validateDocs(root);
    expect(results[0].valid).toBe(false);
    expect(results[0].errors.some((e) => e.includes('negative'))).toBe(true);
  });

  test('warns when tags and keywords overlap', () => {
    const root = path.join(tempDir, 'docs-overlap');
    writeFile(
      path.join(root, 'overlap.md'),
      '---\ntags: ["guide", "api"]\nkeywords: ["api", "reference"]\n---\nContent',
    );
    const results = validateDocs(root);
    expect(results[0].warnings.some((w) => w.includes('tags and keywords overlap'))).toBe(true);
  });

  test('warns when iconType set without icon', () => {
    const root = path.join(tempDir, 'docs-icon');
    writeFile(path.join(root, 'icon.md'), '---\niconType: filled\n---\nContent');
    const results = validateDocs(root);
    expect(results[0].warnings.some((w) => w.includes('iconType set without icon'))).toBe(true);
  });

  test('warns when badgeColor set without badge', () => {
    const root = path.join(tempDir, 'docs-badgecolor');
    writeFile(path.join(root, 'bc.md'), '---\nbadgeColor: red\n---\nContent');
    const results = validateDocs(root);
    expect(results[0].warnings.some((w) => w.includes('badgeColor set without badge'))).toBe(true);
  });

  test('warns on malformed externalUrl', () => {
    const root = path.join(tempDir, 'docs-url');
    writeFile(path.join(root, 'url.md'), '---\nexternalUrl: not-a-url\n---\nContent');
    const results = validateDocs(root);
    expect(results[0].warnings.some((w) => w.includes('expected a URL with scheme'))).toBe(true);
  });

  test('warns on redirect without leading slash', () => {
    const root = path.join(tempDir, 'docs-redir2');
    writeFile(path.join(root, 'redir.md'), '---\nredirect: old-path\n---\nContent');
    const results = validateDocs(root);
    expect(results[0].warnings.some((w) => w.includes('does not start with "/"'))).toBe(true);
  });

  test('warns on unknown frontmatter keys (typos)', () => {
    const root = path.join(tempDir, 'docs-typo');
    writeFile(path.join(root, 'typo.md'), '---\nlable: My Page\ndescripton: A typo\n---\nContent');
    const results = validateDocs(root);
    expect(results[0].warnings.some((w) => w.includes('"lable"'))).toBe(true);
    expect(results[0].warnings.some((w) => w.includes('"descripton"'))).toBe(true);
  });

  test('passes on valid frontmatter with all non-conflicting keys', () => {
    const root = path.join(tempDir, 'docs-all-valid');
    writeFile(
      path.join(root, 'full.md'),
      `---
label: Full Page
description: All keys present
tags: ["a"]
keywords: ["b"]
order: 1
isTitle: false
isParent: false
icon: home
iconType: filled
badge: New
badgeColor: green
breadcrumbTitle: Bread
layout: default
externalUrl: https://example.com
deprecated: false
publishedAt: 2024-01-15
updatedAt: 2024-06-01
draft: false
hidden: false
---
Content`,
    );
    const results = validateDocs(root);
    expect(results[0].valid).toBe(true);
    expect(results[0].warnings.length).toBe(0);
    expect(results[0].errors.length).toBe(0);
  });

  test('recurses into nested subdirectories', () => {
    const root = path.join(tempDir, 'docs-nested-validate');
    writeFile(path.join(root, 'top.md'), '---\nlabel: Top\n---\nContent');
    writeFile(path.join(root, 'guides', 'nested.md'), '---\nlabel: Nested\n---\nContent');

    const results = validateDocs(root);
    const files = results.map((r) => r.file);
    expect(files).toContain(path.join('guides', 'nested.md'));
  });

  test('returns no results (without throwing) when the root directory cannot be read', () => {
    const root = path.join(tempDir, 'docs-locked-validate');
    fs.mkdirSync(root, { recursive: true });
    fs.chmodSync(root, 0o000);

    try {
      expect(() => validateDocs(root)).not.toThrow();
      expect(validateDocs(root)).toEqual([]);
    } finally {
      fs.chmodSync(root, 0o755);
    }
  });

  test('reports a parse error when a markdown file cannot be read', () => {
    const root = path.join(tempDir, 'docs-unreadable-file');
    const filePath = path.join(root, 'locked.md');
    writeFile(filePath, '---\nlabel: Locked\n---\nContent');
    fs.chmodSync(filePath, 0o000);

    try {
      const results = validateDocs(root);
      expect(results.length).toBe(1);
      expect(results[0].valid).toBe(false);
      expect(results[0].errors.some((e) => e.startsWith('Parse error:'))).toBe(true);
    } finally {
      fs.chmodSync(filePath, 0o644);
    }
  });
});

describe('generateManifestsWithDiscovery', () => {
  test('auto-detects and writes outputs to project root', () => {
    const root = path.join(tempDir, 'projects');
    const projectA = path.join(root, 'project-a');

    writeFile(path.join(projectA, 'docs', 'README.md'), '# A');

    const results = generateManifestsWithDiscovery(root, { autoDetect: true, docsSubfolder: 'docs' });

    expect(results.length).toBe(1);
    expect(results[0].processed).toBe(true);

    const manifestPath = path.join(projectA, 'manifest.json');
    const searchIndexPath = path.join(projectA, 'search-index.json');

    expect(fs.existsSync(manifestPath)).toBe(true);
    expect(fs.existsSync(searchIndexPath)).toBe(true);

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const searchIndex = JSON.parse(fs.readFileSync(searchIndexPath, 'utf8'));

    expect(manifest[0].label).toBe('README');
    expect(manifest[0].icon).toBeUndefined();
    expect(searchIndex.length).toBe(1);
  });

  test('writes cleaned items without null/false fields', () => {
    const root = path.join(tempDir, 'projects');
    const projectA = path.join(root, 'project-a');

    writeFile(path.join(projectA, 'docs', 'README.md'), '# A');

    const results = generateManifestsWithDiscovery(root, { autoDetect: true, docsSubfolder: 'docs' });
    expect(results[0].processed).toBe(true);

    const manifest = JSON.parse(fs.readFileSync(path.join(projectA, 'manifest.json'), 'utf8'));
    const item = manifest[0];

    expect(item.icon).toBeUndefined();
    expect(item.badge).toBeUndefined();
    expect(item.isParent).toBeUndefined();
  });

  test('generates manifest for specific route', () => {
    const docsPath = path.join(tempDir, 'mydocs');
    writeFile(path.join(docsPath, 'page.md'), '---\nlabel: My Page\n---\nContent');

    const results = generateManifestsWithDiscovery(tempDir, {
      route: docsPath,
    });

    expect(results.length).toBe(1);
    expect(results[0].processed).toBe(true);
    expect(fs.existsSync(path.join(docsPath, 'manifest.json'))).toBe(true);
  });

  test('generates for specific project by name', () => {
    const root = path.join(tempDir, 'projects-gen');
    const projectA = path.join(root, 'project-a');
    const projectB = path.join(root, 'project-b');
    writeFile(path.join(projectA, 'docs', 'README.md'), '# A');
    writeFile(path.join(projectB, 'docs', 'README.md'), '# B');

    const results = generateManifestsWithDiscovery(root, { project: 'project-a' });
    expect(results.length).toBe(1);
    expect(results[0].processed).toBe(true);
    expect(fs.existsSync(path.join(projectA, 'manifest.json'))).toBe(true);
    expect(fs.existsSync(path.join(projectB, 'manifest.json'))).toBe(false);
  });

  test('project with direct md files (no docs subfolder)', () => {
    const root = path.join(tempDir, 'projects-direct');
    const projectA = path.join(root, 'project-a');
    writeFile(path.join(projectA, 'README.md'), '# A');

    const results = generateManifestsWithDiscovery(root, { project: 'project-a' });
    expect(results[0].processed).toBe(true);
    expect(fs.existsSync(path.join(projectA, 'manifest.json'))).toBe(true);
  });

  test('generates with outputDir for route', () => {
    const docsPath = path.join(tempDir, 'route-out');
    const outDir = path.join(tempDir, 'route-out-gen');
    writeFile(path.join(docsPath, 'page.md'), '---\nlabel: P\n---\nC');

    const results = generateManifestsWithDiscovery(tempDir, {
      route: docsPath,
      outputDir: outDir,
    });

    expect(results[0].processed).toBe(true);
    expect(fs.existsSync(path.join(outDir, 'manifest.json'))).toBe(true);
  });

  test('returns empty array when autoDetect is false and no project/route', () => {
    const results = generateManifestsWithDiscovery(tempDir, { autoDetect: false });
    expect(results).toEqual([]);
  });

  test('throws on non-existent route', () => {
    expect(() => {
      generateManifestsWithDiscovery('/nonexistent-route', { route: '/nonexistent-route' });
    }).toThrow('Route not found');
  });

  test('throws on non-existent project', () => {
    const root = path.join(tempDir, 'no-proj');
    fs.mkdirSync(root, { recursive: true });
    expect(() => {
      generateManifestsWithDiscovery(root, { project: 'nonexistent' });
    }).toThrow('Project not found');
  });

  test('prefixes routes (including nested children) when outputDir is an ancestor of the route', () => {
    const versionRoot = path.join(tempDir, 'route-prefix', 'v1');
    const docsPath = path.join(versionRoot, 'content');
    writeFile(path.join(docsPath, 'page.md'), '---\nlabel: Page\n---\nC');
    writeFile(path.join(docsPath, 'guide', 'nested.md'), '---\nlabel: Nested\n---\nC');

    const results = generateManifestsWithDiscovery(tempDir, {
      route: docsPath,
      outputDir: versionRoot,
    });

    expect(results[0].processed).toBe(true);
    const manifest = JSON.parse(fs.readFileSync(path.join(versionRoot, 'manifest.json'), 'utf8'));
    const searchIndex = JSON.parse(fs.readFileSync(path.join(versionRoot, 'search-index.json'), 'utf8'));

    expect(manifest.find((i: { route?: string }) => i.route === 'content/page')).toBeDefined();
    const guideFolder = manifest.find((i: { route?: string }) => i.route === 'content/guide');
    expect(guideFolder.children[0].route).toBe('content/guide/nested');
    expect(searchIndex.every((e: { route: string }) => e.route.startsWith('content/'))).toBe(true);
  });

  test('does not write files in route mode when dryRun is set', () => {
    const docsPath = path.join(tempDir, 'route-dry-run');
    writeFile(path.join(docsPath, 'page.md'), '---\nlabel: Page\n---\nC');

    const results = generateManifestsWithDiscovery(tempDir, { route: docsPath, dryRun: true });

    expect(results[0].processed).toBe(true);
    expect(fs.existsSync(path.join(docsPath, 'manifest.json'))).toBe(false);
    expect(fs.existsSync(path.join(docsPath, 'search-index.json'))).toBe(false);
  });

  test('prefixes routes when outputDir is an ancestor of the project path', () => {
    const root = path.join(tempDir, 'project-prefix');
    const projectPath = path.join(root, 'proj-a');
    writeFile(path.join(projectPath, 'docs', 'page.md'), '---\nlabel: Page\n---\nC');

    const results = generateManifestsWithDiscovery(root, {
      project: 'proj-a',
      docsSubfolder: 'docs',
      outputDir: root,
    });

    expect(results[0].processed).toBe(true);
    const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
    // Prefix is relative from outputDir (root) to the resolved docs path (proj-a/docs), not the project root.
    expect(manifest.find((i: { route?: string }) => i.route === 'proj-a/docs/page')).toBeDefined();
  });

  test('does not write files in project mode when dryRun is set', () => {
    const root = path.join(tempDir, 'project-dry-run');
    writeFile(path.join(root, 'proj-a', 'docs', 'page.md'), '---\nlabel: Page\n---\nC');

    const results = generateManifestsWithDiscovery(root, { project: 'proj-a', docsSubfolder: 'docs', dryRun: true });

    expect(results[0].processed).toBe(true);
    expect(fs.existsSync(path.join(root, 'proj-a', 'manifest.json'))).toBe(false);
  });
});

describe('generateDocsManifests', () => {
  test('processes all discovered projects', () => {
    const root = path.join(tempDir, 'multi-proj');
    writeFile(path.join(root, 'proj-a', 'docs', 'README.md'), '# A');
    writeFile(path.join(root, 'proj-b', 'docs', 'README.md'), '# B');

    const results = generateDocsManifests(root);
    expect(results.length).toBe(2);
    expect(results.every((r) => r.processed)).toBe(true);
  });

  test('handles invalid manifest from custom walker', () => {
    const root = path.join(tempDir, 'invalid-walk');
    writeFile(path.join(root, 'proj', 'docs', 'README.md'), '# A');

    const results = generateDocsManifests(root, {
      docsSubfolder: 'docs',
      walkerFn: () => null as unknown as NavigationItem[],
    });

    expect(results.length).toBe(1);
    expect(results[0].processed).toBe(false);
    expect(results[0].error).toBe('Invalid manifest generated');
  });

  test('excludes files across all discovered projects', () => {
    const root = path.join(tempDir, 'multi-proj-exclude');
    writeFile(path.join(root, 'proj-a', 'docs', 'README.md'), '# A');
    writeFile(path.join(root, 'proj-a', 'docs', 'secret.md'), '# Secret');

    generateDocsManifests(root, { docsSubfolder: 'docs', exclude: ['secret.md'] });

    const manifest = JSON.parse(fs.readFileSync(path.join(root, 'proj-a', 'manifest.json'), 'utf8'));
    expect(manifest.length).toBe(1);
    expect(manifest[0].label).toBe('README');
  });

  test('applies per-project docsSubfolder override', () => {
    const root = path.join(tempDir, 'projects-override-subfolder');
    writeFile(path.join(root, 'proj-a', 'docs', 'page.md'), '---\nlabel: Default Page\n---\nFrom docs');
    writeFile(path.join(root, 'proj-a', 'guides', 'page.md'), '---\nlabel: Override Page\n---\nFrom guides');

    generateDocsManifests(root, {
      docsSubfolder: 'docs',
      projects: { 'proj-a': { docsSubfolder: 'guides' } },
    });

    const manifest = JSON.parse(fs.readFileSync(path.join(root, 'proj-a', 'manifest.json'), 'utf8'));
    expect(manifest.length).toBe(1);
    expect(manifest[0].label).toBe('Override Page');
  });

  test('applies per-project outputDir override', () => {
    const root = path.join(tempDir, 'projects-override-output');
    writeFile(path.join(root, 'proj-a', 'docs', 'README.md'), '# A');

    generateDocsManifests(root, {
      docsSubfolder: 'docs',
      projects: { 'proj-a': { outputDir: 'custom-out' } },
    });

    const customOutDir = path.join(root, 'proj-a', 'custom-out');
    expect(fs.existsSync(path.join(customOutDir, 'manifest.json'))).toBe(true);
    expect(fs.existsSync(path.join(customOutDir, 'search-index.json'))).toBe(true);
    expect(fs.existsSync(path.join(root, 'proj-a', 'manifest.json'))).toBe(false);
  });

  test('records a failure without aborting other projects when a walker throws', () => {
    const root = path.join(tempDir, 'multi-proj-throw');
    writeFile(path.join(root, 'proj-a', 'docs', 'README.md'), '# A');
    writeFile(path.join(root, 'proj-b', 'docs', 'README.md'), '# B');

    const results = generateDocsManifests(root, {
      docsSubfolder: 'docs',
      walkerFn: (projectPath) => {
        if (projectPath.includes('proj-b')) throw new Error('boom');
        return [];
      },
    });

    expect(results.length).toBe(2);
    const failed = results.find((r) => r.name === 'proj-b');
    const succeeded = results.find((r) => r.name === 'proj-a');
    expect(failed?.processed).toBe(false);
    expect(failed?.error).toBe('boom');
    expect(succeeded?.processed).toBe(true);
  });
});

describe('generateManifest', () => {
  test('returns manifest and search index in memory', () => {
    const docsPath = path.join(tempDir, 'docs');
    writeFile(path.join(docsPath, 'a.md'), '---\nlabel: Page A\n---\nA');
    writeFile(path.join(docsPath, 'b.md'), '---\nlabel: Page B\n---\nB');

    const result = generateManifest(docsPath);

    expect(result.manifest.length).toBe(2);
    expect(result.searchIndex.length).toBe(2);
    expect(result.manifest[0].label).toBe('Page A');
    expect(result.manifest[1].label).toBe('Page B');
  });
});

describe('discoverProjects', () => {
  test('returns empty array for directory with no projects', () => {
    const root = path.join(tempDir, 'empty-projs');
    fs.mkdirSync(path.join(root, 'not-a-project'), { recursive: true });
    const discovered = discoverProjects(root);
    expect(discovered).toEqual([]);
  });

  test('skips dot-prefixed directories', () => {
    const root = path.join(tempDir, 'dot-dirs');
    writeFile(path.join(root, '.hidden', 'docs', 'README.md'), '# hidden');
    writeFile(path.join(root, 'visible', 'docs', 'README.md'), '# visible');

    const discovered = discoverProjects(root, { recursive: true });
    expect(discovered.some((d) => d.name === '.hidden')).toBe(false);
    expect(discovered.some((d) => d.name === 'visible')).toBe(true);
  });
});

describe('watchDocs', () => {
  test('detects file change via mtime polling', async () => {
    const docsRoot = path.join(tempDir, 'watch-test');
    writeFile(path.join(docsRoot, 'page.md'), '# Original');

    const changes: string[] = [];
    const watcher = watchDocs(
      docsRoot,
      (file) => {
        changes.push(file);
      },
      20,
    );

    await Bun.sleep(50);

    writeFile(path.join(docsRoot, 'page.md'), '# Modified');

    await Bun.sleep(60);

    watcher.close();

    expect(changes.length).toBe(1);
    expect(changes[0]).toContain('page.md');
  });

  test('watcher close stops polling', async () => {
    const docsRoot = path.join(tempDir, 'watch-stop');
    writeFile(path.join(docsRoot, 'page.md'), '# Original');

    let callCount = 0;
    const watcher = watchDocs(
      docsRoot,
      () => {
        callCount++;
      },
      10,
    );

    watcher.close();

    writeFile(path.join(docsRoot, 'page.md'), '# Modified');

    await Bun.sleep(50);

    expect(callCount).toBe(0);
  });

  test('does not throw when a watched entry cannot be stat-ed (e.g. a dangling symlink)', async () => {
    const docsRoot = path.join(tempDir, 'watch-dangling-symlink');
    fs.mkdirSync(docsRoot, { recursive: true });
    fs.symlinkSync(path.join(docsRoot, 'does-not-exist.md'), path.join(docsRoot, 'dangling.md'));

    let callCount = 0;
    const watcher = watchDocs(docsRoot, () => callCount++, 20);

    await Bun.sleep(40);
    watcher.close();

    expect(callCount).toBe(0);
  });
});

describe('extractHeadings', () => {
  test('extracts h2 and h3 headings from body text', () => {
    const body = `Some intro text.

## Getting Started

Installation steps.

### Configuration

Details here.

## Deployment

Final section.`;
    expect(extractHeadings(body)).toEqual(['Getting Started', 'Configuration', 'Deployment']);
  });

  test('ignores h1 headings', () => {
    const body = `# Title

## Introduction

### Configuration`;
    expect(extractHeadings(body)).toEqual(['Introduction', 'Configuration']);
  });

  test('returns empty array when no headings', () => {
    expect(extractHeadings('Just plain text without headings.')).toEqual([]);
  });

  test('deduplicates similar headings', () => {
    const body = `## Installation

Content

### Installation Guide

More content

## Quick Start

Content

### Quick Start Guide

More`;
    const result = extractHeadings(body);
    expect(result).toEqual(['Installation', 'Quick Start']);
  });
});

describe('diceSimilarity', () => {
  test('identical strings return 1.0', () => {
    expect(diceSimilarity('Installation', 'Installation')).toBe(1);
  });

  test('similar strings return > 0.7', () => {
    expect(diceSimilarity('Installation', 'Installation Guide')).toBeGreaterThan(0.7);
  });

  test('different strings return < 0.3', () => {
    expect(diceSimilarity('Installation', 'Deployment')).toBeLessThan(0.3);
  });
});

describe('dedupeHeadings', () => {
  test('removes duplicates above threshold', () => {
    const input = ['Installation', 'Installation Guide', 'Quick Start', 'Quick Start Guide'];
    expect(dedupeHeadings(input)).toEqual(['Installation', 'Quick Start']);
  });

  test('preserves distinct headings', () => {
    const input = ['Getting Started', 'Configuration', 'Deployment'];
    expect(dedupeHeadings(input)).toEqual(['Getting Started', 'Configuration', 'Deployment']);
  });
});

describe('makeExcerpt', () => {
  test('strips markdown and truncates to 150 chars', () => {
    const body =
      '## Intro\n\nThis is a **long** document with [a link](https://example.com). ' +
      'It has multiple sentences that should all be captured in the excerpt. ' +
      'And more text to push past the 150 char limit.';
    const excerpt = makeExcerpt(body);
    expect(excerpt).toBeTruthy();
    expect(excerpt!.length).toBeLessThanOrEqual(155);
    expect(excerpt).not.toContain('**');
    expect(excerpt).not.toContain('[');
    expect(excerpt?.toLowerCase()).toContain('link');
  });

  test('returns full text when shorter than max length', () => {
    const body = 'Short text without markdown.';
    expect(makeExcerpt(body)).toBe('Short text without markdown.');
  });

  test('returns empty string for empty body', () => {
    expect(makeExcerpt('')).toBe('');
  });

  test('truncates at the last space when no sentence boundary is found', () => {
    // No punctuation anywhere, but spaces every 5 chars, so lastIndexOf(' ') within the
    // truncated window is well past the 30-char minimum.
    const body = 'word '.repeat(40).trim();
    const excerpt = makeExcerpt(body);
    expect(excerpt.endsWith('...')).toBe(true);
    expect(excerpt).not.toContain('  ');
  });

  test('falls back to a hard cut when no space or sentence boundary is found', () => {
    // A single long run with no spaces or punctuation at all.
    const body = 'a'.repeat(200);
    const excerpt = makeExcerpt(body);
    expect(excerpt).toBe(`${'a'.repeat(150)}...`);
  });
});

describe('makeBreadcrumb', () => {
  test('derives from a single-label chain', () => {
    expect(makeBreadcrumb(['Guides'])).toBe('Guides');
  });

  test('handles deep nesting', () => {
    expect(makeBreadcrumb(['Api', 'V2'])).toBe('Api > V2');
  });

  test('handles multi-word segments', () => {
    expect(makeBreadcrumb(['Getting Started'])).toBe('Getting Started');
  });

  test('returns undefined for an empty chain (root-level files)', () => {
    expect(makeBreadcrumb([])).toBeUndefined();
  });
});

describe('defineConfig', () => {
  test('is exported from package entry', () => {
    const config = defineConfig({ docsSubfolder: 'guides', recursive: true });
    expect(config.docsSubfolder).toBe('guides');
    expect(config.recursive).toBe(true);
  });
});
