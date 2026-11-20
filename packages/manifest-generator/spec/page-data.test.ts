import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { runCli } from '../src/cli';
import { validateConsumerKeys } from '../src/config';
import { extractHeadings, extractSections, generateManifestFromFiles } from '../src/core';
import { generateManifest, generateManifestsWithDiscovery, type NavigationItem, type SearchEntry } from '../src/index';

let tempDir = '';

beforeEach(() => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'manifest-generator-page-data-'));
});

afterEach(() => {
  if (tempDir) fs.rmSync(tempDir, { recursive: true, force: true });
});

function writeTree(root: string, files: Record<string, string>) {
  for (const [rel, content] of Object.entries(files)) {
    const full = path.join(root, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content, 'utf8');
  }
}

function flatten(items: NavigationItem[]): NavigationItem[] {
  return items.flatMap((item) => [item, ...flatten(item.children ?? [])]);
}

function files(tree: Record<string, string>) {
  return Object.entries(tree).map(([p, content]) => ({ path: p, content }));
}

function runQuiet(argv: string[]) {
  const originalLog = console.log;
  const originalError = console.error;
  const errors: string[] = [];
  console.log = () => undefined;
  console.error = (...args: unknown[]) => errors.push(args.join(' '));
  let exitCode: number | undefined;
  const exitFn = ((code?: number): never => {
    exitCode ??= code;
    return undefined as never;
  }) as (code?: number) => never;
  try {
    runCli(argv, exitFn);
  } finally {
    console.log = originalLog;
    console.error = originalError;
  }
  return { exitCode, errors };
}

describe('hidden pages', () => {
  const TREE = {
    'a.md': '---\nlabel: A\norder: 1\n---\nx',
    'secret.md': '---\nlabel: Secret\norder: 2\nhidden: true\n---\nSecret page',
    'c.md': '---\nlabel: C\norder: 3\n---\nx',
    'draft.md': '---\nlabel: Draft\ndraft: true\n---\nDraft page',
  };

  test('a hidden page is left out of the navigation but stays in the search index, flagged hidden', () => {
    const { manifest, searchIndex } = generateManifestFromFiles(files(TREE));

    expect(manifest.map((i) => i.label)).toEqual(['A', 'C']);
    const secret = searchIndex.find((e) => e.route === 'secret');
    expect(secret).toEqual({
      label: 'Secret',
      description: '',
      route: 'secret',
      tags: [],
      excerpt: 'Secret page',
      breadcrumb: [{ label: 'Secret', route: 'secret' }],
      hidden: true,
    });
  });

  test('a draft page is still left out of both outputs', () => {
    const { manifest, searchIndex } = generateManifestFromFiles(files(TREE));
    expect(manifest.some((i) => i.label === 'Draft')).toBe(false);
    expect(searchIndex.some((e) => e.route === 'draft')).toBe(false);
  });

  test('draft wins over hidden', () => {
    const { searchIndex } = generateManifestFromFiles(files({ 'x.md': '---\ndraft: true\nhidden: true\n---\nx' }));
    expect(searchIndex).toEqual([]);
  });

  test('prev/next links skip a hidden page', () => {
    const { manifest } = generateManifestFromFiles(files(TREE), { prevNext: true });
    expect(manifest[0].next).toEqual({ label: 'C', route: 'c' });
    expect(manifest[1].prev).toEqual({ label: 'A', route: 'a' });
  });

  test('visible pages have no hidden flag in the search index', () => {
    const { searchIndex } = generateManifestFromFiles(files(TREE));
    expect(searchIndex.find((e) => e.route === 'a')).not.toHaveProperty('hidden');
  });
});

describe('heading anchors (sections)', () => {
  const BODY = [
    '# Guide',
    '',
    '## Getting *started*',
    '',
    '```bash',
    '## not a heading',
    '```',
    '',
    '### Use `npm` & [links](https://x.dev)',
    '',
    '## Getting started',
    '',
    '#### Deep',
    '',
    '## Café — ½ done! ##',
    '',
    '~~~',
    '### fenced with tildes',
    '~~~',
    '## Guide',
  ].join('\n');

  test('extractSections gives GitHub-style ids, unique across all heading levels, for h2 and h3', () => {
    expect(extractSections(BODY)).toEqual([
      { text: 'Getting started', id: 'getting-started', level: 2 },
      { text: 'Use npm & links', id: 'use-npm--links', level: 3 },
      { text: 'Getting started', id: 'getting-started-1', level: 2 },
      { text: 'Café — ½ done!', id: 'café--½-done', level: 2 },
      { text: 'Guide', id: 'guide-1', level: 2 },
    ]);
  });

  test('extractSections keeps backslash-escaped characters and code span content as text', () => {
    expect(extractSections('## MarkdownPlugin\\<O>\n\n## `<T>` and \\*stars\\*')).toEqual([
      { text: 'MarkdownPlugin<O>', id: 'markdownplugino', level: 2 },
      { text: '<T> and *stars*', id: 't-and-stars', level: 2 },
    ]);
  });

  test('extractHeadings ignores lines inside fenced code blocks', () => {
    expect(extractHeadings(BODY)).not.toContain('not a heading');
    expect(extractHeadings(BODY)).not.toContain('fenced with tildes');
  });

  test('headingAnchors writes sections on search entries', () => {
    const { searchIndex } = generateManifestFromFiles(files({ 'page.md': BODY }), { headingAnchors: true });
    expect(searchIndex[0].sections?.map((s) => s.id)).toEqual([
      'getting-started',
      'use-npm--links',
      'getting-started-1',
      'café--½-done',
      'guide-1',
    ]);
  });

  test('without headingAnchors, search entries have no sections', () => {
    const { searchIndex } = generateManifestFromFiles(files({ 'page.md': BODY }));
    expect(searchIndex[0]).not.toHaveProperty('sections');
  });

  test('a page without h2/h3 headings gets no sections', () => {
    const { searchIndex } = generateManifestFromFiles(files({ 'page.md': '# Only\n\nText' }), { headingAnchors: true });
    expect(searchIndex[0]).not.toHaveProperty('sections');
  });
});

describe('extra frontmatter (meta)', () => {
  const PAGE = '---\nlabel: Page\ntitle: Aliased\nowner: docs-team\nreviewers: [a, b]\nstatus: { level: 2 }\n---\nx';

  test('extraFrontmatter copies unknown keys into meta, leaving out known keys and alias sources', () => {
    const { manifest } = generateManifestFromFiles(files({ 'page.md': PAGE }), {
      extraFrontmatter: true,
      frontmatterAliases: { title: 'breadcrumbTitle' },
    });
    expect(manifest[0].meta).toEqual({ owner: 'docs-team', reviewers: ['a', 'b'], status: { level: 2 } });
    expect(manifest[0].breadcrumbTitle).toBe('Aliased');
  });

  test('without extraFrontmatter, items have no meta', () => {
    const { manifest } = generateManifestFromFiles(files({ 'page.md': PAGE }));
    expect(manifest[0]).not.toHaveProperty('meta');
  });

  test('a page with only known keys gets no meta', () => {
    const { manifest } = generateManifestFromFiles(files({ 'page.md': '---\nlabel: P\n---\nx' }), {
      extraFrontmatter: true,
    });
    expect(manifest[0]).not.toHaveProperty('meta');
  });
});

describe('reading time', () => {
  const words = (n: number) => Array.from({ length: n }, (_, i) => `word${i}`).join(' ');

  test('readingTime writes wordCount and minutes at 200 words per minute, rounded up', () => {
    const { manifest } = generateManifestFromFiles(
      files({
        'short.md': `---\nlabel: Short\norder: 1\n---\n${words(10)}`,
        'long.md': `---\nlabel: Long\norder: 2\n---\n${words(401)}\n\n\`\`\`js\n${words(500)}\n\`\`\``,
      }),
      { readingTime: true },
    );
    expect(manifest[0]).toMatchObject({ label: 'Short', wordCount: 10, readingTime: 1 });
    expect(manifest[1]).toMatchObject({ label: 'Long', wordCount: 401, readingTime: 3 });
  });

  test('without readingTime, items have no wordCount or readingTime', () => {
    const { manifest } = generateManifestFromFiles(files({ 'p.md': words(10) }));
    expect(manifest[0]).not.toHaveProperty('wordCount');
    expect(manifest[0]).not.toHaveProperty('readingTime');
  });

  test('title nodes get no reading time', () => {
    const { manifest } = generateManifestFromFiles(files({ 't.md': '---\nisTitle: true\n---\nTitle text' }), {
      readingTime: true,
    });
    expect(manifest[0]).not.toHaveProperty('readingTime');
  });
});

describe('Node entry and CLI', () => {
  const TREE = {
    'page.md': '---\nlabel: Page\nowner: me\n---\n## Intro\n\nSome words here',
  };

  test('generateManifest passes the new options to the walker', () => {
    writeTree(tempDir, TREE);
    const { manifest, searchIndex } = generateManifest(tempDir, [], {
      headingAnchors: true,
      extraFrontmatter: true,
      readingTime: true,
    });
    expect(manifest[0]).toMatchObject({ meta: { owner: 'me' }, wordCount: 4, readingTime: 1 });
    expect((searchIndex[0] as SearchEntry).sections).toEqual([{ text: 'Intro', id: 'intro', level: 2 }]);
  });

  test('generateManifestsWithDiscovery writes the new fields for a route', () => {
    const docs = path.join(tempDir, 'docs');
    writeTree(docs, TREE);
    generateManifestsWithDiscovery(tempDir, {
      route: docs,
      headingAnchors: true,
      extraFrontmatter: true,
      readingTime: true,
    });
    const manifest = JSON.parse(fs.readFileSync(path.join(docs, 'manifest.json'), 'utf8'));
    const index = JSON.parse(fs.readFileSync(path.join(docs, 'search-index.json'), 'utf8'));
    expect(flatten(manifest)[0]).toMatchObject({ meta: { owner: 'me' }, readingTime: 1 });
    expect(index[0].sections[0].id).toBe('intro');
  });

  test('--heading-anchors, --extra-frontmatter and --reading-time apply to generation', () => {
    const docs = path.join(tempDir, 'docs');
    writeTree(docs, TREE);
    const { exitCode } = runQuiet([
      '--route',
      docs,
      '--heading-anchors',
      '--extra-frontmatter',
      '--reading-time',
      '-q',
    ]);
    expect(exitCode).toBe(0);
    const manifest = JSON.parse(fs.readFileSync(path.join(docs, 'manifest.json'), 'utf8'));
    const index = JSON.parse(fs.readFileSync(path.join(docs, 'search-index.json'), 'utf8'));
    expect(manifest[0]).toMatchObject({ meta: { owner: 'me' }, wordCount: 4, readingTime: 1 });
    expect(index[0].sections).toEqual([{ text: 'Intro', id: 'intro', level: 2 }]);
  });

  test('config headingAnchors, extraFrontmatter and readingTime apply to generation', () => {
    const docs = path.join(tempDir, 'docs');
    writeTree(docs, TREE);
    const configPath = path.join(tempDir, 'mg.config.json');
    fs.writeFileSync(
      configPath,
      JSON.stringify({ headingAnchors: true, extraFrontmatter: true, readingTime: true }),
      'utf8',
    );
    runQuiet(['--route', docs, '--config', configPath, '-q']);
    const manifest = JSON.parse(fs.readFileSync(path.join(docs, 'manifest.json'), 'utf8'));
    const index = JSON.parse(fs.readFileSync(path.join(docs, 'search-index.json'), 'utf8'));
    expect(manifest[0]).toMatchObject({ meta: { owner: 'me' }, readingTime: 1 });
    expect(index[0].sections[0].id).toBe('intro');
  });

  test('without the flags the output has none of the new fields', () => {
    const docs = path.join(tempDir, 'docs');
    writeTree(docs, TREE);
    runQuiet(['--route', docs, '-q']);
    const raw =
      fs.readFileSync(path.join(docs, 'manifest.json'), 'utf8') +
      fs.readFileSync(path.join(docs, 'search-index.json'), 'utf8');
    for (const key of ['"meta"', '"wordCount"', '"readingTime"', '"sections"']) {
      expect(raw).not.toContain(key);
    }
  });

  test('an invalid config value for a new key is reported and exits 1', () => {
    const configPath = path.join(tempDir, 'bad.config.json');
    fs.writeFileSync(configPath, JSON.stringify({ readingTime: 'yes' }), 'utf8');
    const { exitCode, errors } = runQuiet(['--config', configPath, '--docs-root', tempDir]);
    expect(exitCode).toBe(1);
    expect(errors).toEqual(['Error: Invalid config: "readingTime" must be a boolean']);
  });

  test('validateConsumerKeys checks the type of each new boolean key', () => {
    for (const key of ['headingAnchors', 'extraFrontmatter', 'readingTime']) {
      expect(() => validateConsumerKeys({ [key]: 1 })).toThrow(`Invalid config: "${key}" must be a boolean`);
      expect(() => validateConsumerKeys({ [key]: true })).not.toThrow();
    }
  });
});

describe('root entry', () => {
  test('re-exports extractSections and slugifyHeading', async () => {
    const root = await import('../src/index');
    expect(root.extractSections('## A b')).toEqual([{ text: 'A b', id: 'a-b', level: 2 }]);
    expect(root.slugifyHeading('Hello, World!')).toBe('hello-world');
  });
});
