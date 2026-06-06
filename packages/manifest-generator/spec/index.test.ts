import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  cleanItem,
  discoverProjects,
  formatTitle,
  generateDocsManifests,
  generateManifest,
  generateManifestsWithDiscovery,
  parseFrontmatter,
  sortItems,
  validateDocs,
  walkDocs,
  watchDocs,
} from '../src/index.js';

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
    const content = "---\nlabel: \"Page Title\"\ndescription: 'A short description'\n---\n# Content";
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
    expect(parsed.label).toBeUndefined();
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

    const searchIndex: { label: string; route: string }[] = [];
    const manifest = walkDocs(docsRoot, '', searchIndex);

    expect(manifest.length).toBe(3);
    expect(searchIndex.length).toBe(2);

    const titleEntry = manifest.find(item => item.label === 'Title');
    expect(titleEntry?.route).toBe('#');

    const sectionEntry = manifest.find(item => item.label === 'Section');
    expect(sectionEntry?.isParent).toBe(true);
    expect(sectionEntry?.children?.length).toBe(1);
  });

  test('supports .mdx files', () => {
    const docsRoot = path.join(tempDir, 'docs');
    writeFile(path.join(docsRoot, 'article.mdx'), '---\nlabel: MDX Article\n---\n# Article');
    writeFile(path.join(docsRoot, 'note.md'), '# Note');

    const searchIndex: { label: string; route: string }[] = [];
    const manifest = walkDocs(docsRoot, '', searchIndex);

    expect(manifest.length).toBe(2);
    expect(manifest.find(i => i.label === 'MDX Article')).toBeTruthy();
    expect(manifest.find(i => i.label === 'Note')).toBeTruthy();
  });

  test('respects order property for sorting', () => {
    const docsRoot = path.join(tempDir, 'docs');

    writeFile(path.join(docsRoot, 'zzz.md'), '---\nlabel: ZZZ Last\norder: 3\n---\n# Z');
    writeFile(path.join(docsRoot, 'aaa.md'), '---\nlabel: AAA Mid\norder: 2\n---\n# A');
    writeFile(path.join(docsRoot, 'mmm.md'), '---\nlabel: MMM First\norder: 1\n---\n# M');

    const searchIndex: { label: string; route: string }[] = [];
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

    const searchIndex: { label: string; route: string }[] = [];
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
    writeFile(path.join(docsRoot, 'section', 'README.md'), '---\norder: 1\nicon: folder-icon\nbadge: New\nbadgeColor: green\niconType: filled\n---\nSection');
    writeFile(path.join(docsRoot, 'section', 'page.md'), '# Page');

    const items = walkDocs(docsRoot);
    const section = items.find(i => i.isParent);
    expect(section).toBeTruthy();
    expect(section?.order).toBe(1);
    expect(section?.icon).toBe('folder-icon');
    expect(section?.badge).toBe('New');
    expect(section?.badgeColor).toBe('green');
    expect(section?.iconType).toBe('filled');
  });

  test('reads new frontmatter fields', () => {
    const docsRoot = path.join(tempDir, 'docs');

    writeFile(path.join(docsRoot, 'page.md'), `---
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
---`);

    const searchIndex: { label: string; route: string }[] = [];
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

    expect(searchIndex[0].keywords).toEqual(['key1', 'key2']);
    expect(searchIndex[0].breadcrumbTitle).toBe('Bread');
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

    const cleaned = cleanItem(item as any);

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

    const cleaned = cleanItem(item as any);

    expect(cleaned.order).toBe(1);
    expect(cleaned.redirect).toBe('/old');
    expect(cleaned.deprecated).toBe(true);
    expect(cleaned.keywords).toEqual(['a']);
  });

  test('recursively cleans children', () => {
    const item: any = {
      label: 'Parent',
      children: [
        { label: 'Child', description: '', icon: null },
      ],
    };

    const cleaned = cleanItem(item);
    expect(cleaned.children![0].description).toBeUndefined();
    expect(cleaned.children![0].icon).toBeUndefined();
  });
});

describe('sortItems', () => {
  test('sorts by order then alphabetically', () => {
    const items = [
      { label: 'Beta' },
      { label: 'Alpha' },
      { label: 'Gamma', order: 0 },
      { label: 'Delta', order: 1 },
    ];

    const sorted = sortItems(items as any);

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
    const docsProject = discovered.find(item => item.name === 'project-a');
    const directProject = discovered.find(item => item.name === 'project-b');

    expect(docsProject?.type).toBe('subfolder');
    expect(directProject?.type).toBe('direct');
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
    expect(recursive.find(p => p.name === 'project-1')?.type).toBe('recursive');
    expect(recursive.find(p => p.name === 'standalone')?.type).toBe('direct');
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
    expect(results[0].warnings.some(w => w.includes('Both draft and hidden'))).toBe(true);
  });

  test('warns on deprecated without alternative', () => {
    const root = path.join(tempDir, 'docs');
    writeFile(path.join(root, 'dep.md'), '---\ndeprecated: true\n---\nOld');

    const results = validateDocs(root);

    expect(results.length).toBe(1);
    expect(results[0].warnings.some(w => w.includes('deprecatedAlternative'))).toBe(true);
  });

  test('reports invalid dates', () => {
    const root = path.join(tempDir, 'docs');
    writeFile(path.join(root, 'dates.md'), '---\npublishedAt: not-a-date\n---\nContent');

    const results = validateDocs(root);

    expect(results.length).toBe(1);
    expect(results[0].valid).toBe(false);
    expect(results[0].errors.some(e => e.includes('not a valid date'))).toBe(true);
  });

  test('reports isTitle+isParent conflict', () => {
    const root = path.join(tempDir, 'docs');
    writeFile(path.join(root, 'conflict.md'), '---\nisTitle: true\nisParent: true\n---\nBad');

    const results = validateDocs(root);

    expect(results[0].warnings.some(w => w.includes('Both isTitle and isParent'))).toBe(true);
  });

  test('warns on badge without badgeColor', () => {
    const root = path.join(tempDir, 'docs-badge');
    writeFile(path.join(root, 'badge.md'), '---\nbadge: New\n---\nContent');
    const results = validateDocs(root);
    expect(results[0].warnings.some(w => w.includes('badgeColor'))).toBe(true);
  });

  test('warns on externalUrl with redirect', () => {
    const root = path.join(tempDir, 'docs-ext');
    writeFile(path.join(root, 'both.md'), '---\nexternalUrl: https://example.com\nredirect: /old\n---\nContent');
    const results = validateDocs(root);
    expect(results[0].warnings.some(w => w.includes('externalUrl and redirect'))).toBe(true);
  });

  test('warns on redirect with route', () => {
    const root = path.join(tempDir, 'docs-redir');
    writeFile(path.join(root, 'both.md'), '---\nredirect: /new\nroute: /old\n---\nContent');
    const results = validateDocs(root);
    expect(results[0].warnings.some(w => w.includes('redirect set with route'))).toBe(true);
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
    expect(results[0].errors.some(e => e.includes('not a valid date'))).toBe(true);
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
});

describe('generateDocsManifests', () => {
  test('processes all discovered projects', () => {
    const root = path.join(tempDir, 'multi-proj');
    writeFile(path.join(root, 'proj-a', 'docs', 'README.md'), '# A');
    writeFile(path.join(root, 'proj-b', 'docs', 'README.md'), '# B');

    const results = generateDocsManifests(root);
    expect(results.length).toBe(2);
    expect(results.every(r => r.processed)).toBe(true);
  });

  test('handles invalid manifest from custom walker', () => {
    const root = path.join(tempDir, 'invalid-walk');
    writeFile(path.join(root, 'proj', 'docs', 'README.md'), '# A');

    const results = generateDocsManifests(root, {
      docsSubfolder: 'docs',
      walkerFn: () => null as any,
    });

    expect(results.length).toBe(1);
    expect(results[0].processed).toBe(false);
    expect(results[0].error).toBe('Invalid manifest generated');
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
    expect(discovered.some(d => d.name === '.hidden')).toBe(false);
    expect(discovered.some(d => d.name === 'visible')).toBe(true);
  });
});

describe('watchDocs', () => {
  test('detects file change via mtime polling', async () => {
    const docsRoot = path.join(tempDir, 'watch-test');
    writeFile(path.join(docsRoot, 'page.md'), '# Original');

    const changes: string[] = [];
    const watcher = watchDocs(docsRoot, (file) => {
      changes.push(file);
    }, 20);

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
    const watcher = watchDocs(docsRoot, () => {
      callCount++;
    }, 10);

    watcher.close();

    writeFile(path.join(docsRoot, 'page.md'), '# Modified');

    await Bun.sleep(50);

    expect(callCount).toBe(0);
  });
});
