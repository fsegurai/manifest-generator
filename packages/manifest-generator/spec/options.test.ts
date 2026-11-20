import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { generateManifestFromFiles } from '../src/core';
import {
  generateDocsManifests,
  generateManifest,
  generateManifestsWithDiscovery,
  type NavigationItem,
  validateDocs,
  walkDocs,
} from '../src/index';

let tempDir = '';

beforeEach(() => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'manifest-generator-options-'));
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

const TREE: Record<string, string> = {
  'README.md': '---\nlabel: Home\norder: 0\n---\nx',
  'intro.md': '---\nlabel: Intro\norder: 1\n---\nx',
  'guides/README.md': '---\nlabel: Guides Home\nbreadcrumbTitle: Guides\norder: 2\n---\nx',
  'guides/theming.md': '---\nlabel: Theming\norder: 1\n---\nx',
  'guides/zz.md': '---\nlabel: Last Guide\norder: 5\n---\nx',
  'section.md': '---\nlabel: Section\nisTitle: true\norder: 3\n---\n',
  'external.md': '---\nlabel: External\nexternalUrl: https://example.com\norder: 4\n---\n',
  'outro.md': '---\nlabel: Outro\norder: 6\n---\nx',
};

describe('prevNext option (S2)', () => {
  test('writes prev/next on page items following manifest reading order', () => {
    const { manifest } = generateManifestFromFiles(
      Object.entries(TREE).map(([p, content]) => ({ path: p, content })),
      { prevNext: true },
    );
    const byRoute = Object.fromEntries(flatten(manifest).map((item) => [item.route, item]));

    expect(byRoute.README.prev).toBeUndefined();
    expect(byRoute.README.next).toEqual({ label: 'Intro', route: 'intro' });
    expect(byRoute.intro.prev).toEqual({ label: 'Home', route: 'README' });
    expect(byRoute.intro.next).toEqual({ label: 'Guides', route: 'guides' });
    // A folder and its README are the same page (README maps to its folder, like Arkodex).
    expect(byRoute.guides.prev).toEqual({ label: 'Intro', route: 'intro' });
    expect(byRoute.guides.next).toEqual({ label: 'Theming', route: 'guides/theming' });
    expect(byRoute['guides/README'].prev).toEqual(byRoute.guides.prev);
    expect(byRoute['guides/README'].next).toEqual(byRoute.guides.next);
    expect(byRoute['guides/theming'].prev).toEqual({ label: 'Guides', route: 'guides' });
    expect(byRoute['guides/theming'].next).toEqual({ label: 'Last Guide', route: 'guides/zz' });
    // Title nodes ('#') and external links are not pages and are skipped.
    expect(byRoute['#'].prev).toBeUndefined();
    expect(byRoute['#'].next).toBeUndefined();
    expect(byRoute.external.prev).toBeUndefined();
    expect(byRoute['guides/zz'].next).toEqual({ label: 'Outro', route: 'outro' });
    expect(byRoute.outro.prev).toEqual({ label: 'Last Guide', route: 'guides/zz' });
    expect(byRoute.outro.next).toBeUndefined();
  });

  test('is off by default: no prev/next keys anywhere', () => {
    writeTree(tempDir, TREE);
    const { manifest } = generateManifest(tempDir);
    expect(JSON.stringify(manifest)).not.toContain('"prev"');
    expect(JSON.stringify(manifest)).not.toContain('"next"');
  });

  test('generateManifestsWithDiscovery --route honours prevNext with the output route prefix', () => {
    const content = path.join(tempDir, 'site', 'content');
    const out = path.join(tempDir, 'site');
    writeTree(content, { 'a.md': '---\nlabel: A\norder: 1\n---\nx', 'b.md': '---\nlabel: B\norder: 2\n---\nx' });

    generateManifestsWithDiscovery(tempDir, { route: content, outputDir: out, prevNext: true });
    const manifest = JSON.parse(fs.readFileSync(path.join(out, 'manifest.json'), 'utf8')) as NavigationItem[];
    const a = manifest.find((i) => i.label === 'A');
    const b = manifest.find((i) => i.label === 'B');

    expect(a?.next).toEqual({ label: 'B', route: 'content/b' });
    expect(b?.prev).toEqual({ label: 'A', route: 'content/a' });
    expect(Object.keys(b ?? {}).at(-1)).toBe('prev');
  });

  test('generateDocsManifests (auto-detect) honours prevNext', () => {
    writeTree(path.join(tempDir, 'proj', 'docs'), {
      'a.md': '---\nlabel: A\norder: 1\n---\nx',
      'b.md': '---\nlabel: B\norder: 2\n---\nx',
    });
    generateDocsManifests(tempDir, { prevNext: true });
    const manifest = JSON.parse(fs.readFileSync(path.join(tempDir, 'proj', 'manifest.json'), 'utf8'));
    expect(manifest[0].next).toEqual({ label: 'B', route: 'docs/b' });
  });
});

describe('frontmatterAliases / ignoreKeys (S3)', () => {
  const ARKENDA = '---\ntitle: Note Title\ncreated: "2024-01-01"\nupdated: "2024-02-01"\nmood: calm\n---\nBody';
  const aliases = { title: 'label', created: 'publishedAt', updated: 'updatedAt' };

  test('generation maps aliased keys when the target key is not set', () => {
    const { manifest } = generateManifestFromFiles([{ path: 'note.md', content: ARKENDA }], {
      frontmatterAliases: aliases,
    });
    expect(manifest[0].label).toBe('Note Title');
    expect(manifest[0].publishedAt).toBe('2024-01-01');
    expect(manifest[0].updatedAt).toBe('2024-02-01');
  });

  test('generation keeps the target key when both are set', () => {
    const { manifest } = generateManifestFromFiles(
      [{ path: 'note.md', content: '---\nlabel: Real\ntitle: Alias\n---\nx' }],
      { frontmatterAliases: aliases },
    );
    expect(manifest[0].label).toBe('Real');
  });

  test('aliases apply to folder labels and to disk generation (walkDocs / generateManifest)', () => {
    writeTree(tempDir, { 'notes/README.md': '---\ntitle: Notes\n---\nx', 'notes/a.md': ARKENDA });
    const { manifest } = generateManifest(tempDir, [], { frontmatterAliases: aliases });
    expect(manifest[0].label).toBe('Notes');
    expect(manifest[0].children?.find((c) => c.route === 'notes/a')?.label).toBe('Note Title');
    expect(walkDocs(tempDir, '', [], [], [], { frontmatterAliases: aliases })[0].label).toBe('Notes');
  });

  test('without aliases, generation is unchanged (title is ignored)', () => {
    const { manifest } = generateManifestFromFiles([{ path: 'note.md', content: ARKENDA }]);
    expect(manifest[0].label).toBe('Note');
    expect(manifest[0].publishedAt).toBeUndefined();
  });

  test('validation: aliased keys are known and satisfy the target checks', () => {
    writeTree(tempDir, { 'note.md': ARKENDA });
    const [result] = validateDocs(tempDir, { frontmatterAliases: aliases });
    expect(result.warnings).toEqual(['Unknown frontmatter key "mood" — possible typo']);
  });

  test('validation: aliased dates are checked as their target key', () => {
    writeTree(tempDir, { 'note.md': '---\ntitle: T\ncreated: nope\n---\nx' });
    const [result] = validateDocs(tempDir, { frontmatterAliases: aliases });
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(['publishedAt "nope" is not a valid date']);
  });

  test('validation: ignoreKeys suppresses the unknown key warning only for those keys', () => {
    writeTree(tempDir, { 'note.md': ARKENDA });
    const [result] = validateDocs(tempDir, { ignoreKeys: ['mood', 'created'] });
    expect(result.warnings).toEqual([
      'No label set — title will be derived from filename',
      'Unknown frontmatter key "title" — possible typo',
      'Unknown frontmatter key "updated" — possible typo',
    ]);
  });

  test('validation without options keeps the previous warnings', () => {
    writeTree(tempDir, { 'note.md': ARKENDA });
    const [result] = validateDocs(tempDir);
    expect(result.warnings).toEqual([
      'No label set — title will be derived from filename',
      'Unknown frontmatter key "title" — possible typo',
      'Unknown frontmatter key "created" — possible typo',
      'Unknown frontmatter key "updated" — possible typo',
      'Unknown frontmatter key "mood" — possible typo',
    ]);
    expect(result.frontmatter).toEqual({
      title: 'Note Title',
      created: '2024-01-01',
      updated: '2024-02-01',
      mood: 'calm',
    });
  });
});

describe('walkDocs relative argument', () => {
  test('normalizes a trailing slash and a leading "./" like path.join did', () => {
    fs.mkdirSync(path.join(tempDir, 'sub'));
    fs.writeFileSync(path.join(tempDir, 'sub', 'index.md'), '---\nlabel: Sub\n---\n', 'utf8');
    const routes = (relative: string) =>
      walkDocs(tempDir, relative, [], [], [])
        .flatMap((item) => [item.route, ...(item.children ?? []).map((child) => child.route)])
        .join(',');
    const expected = routes('guides');
    expect(expected).toBe('guides/sub,guides/sub/index');
    expect(routes('guides/')).toBe(expected);
    expect(routes('./guides')).toBe(expected);
    expect(routes('.')).toBe(routes(''));
  });
});
