import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  ALLOWED_FRONTMATTER_KEYS as CORE_ALLOWED_KEYS,
  formatTitle as coreFormatTitle,
  parseFrontmatter as coreParseFrontmatter,
  generateManifestFromFiles,
} from '../src/core';
import { ALLOWED_FRONTMATTER_KEYS, cleanItem, formatTitle, generateManifest, parseFrontmatter } from '../src/index';

const packageRoot = path.resolve(import.meta.dir, '..');
const repoRoot = path.resolve(packageRoot, '../..');

let tempDir = '';

beforeEach(() => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'manifest-generator-core-'));
});

afterEach(() => {
  if (tempDir) fs.rmSync(tempDir, { recursive: true, force: true });
});

const FIXTURE: Record<string, string> = {
  'README.md': '---\nlabel: Home\norder: 0\n---\n# Home\n\n## Welcome\n\nWelcome to the docs.',
  'getting-started.md': '---\nlabel: Getting Started\norder: 1\ntags: [intro]\n---\n## Install\n\nRun it.',
  'guides/README.md': '---\nlabel: Guides Home\nbreadcrumbTitle: Guides\norder: 2\nicon: book\n---\nGuides intro.',
  'guides/theming.md': '---\nlabel: Theming\norder: 1\n---\n## Colors\n\nPick colors.',
  'guides/advanced/deep.mdx': '---\nlabel: Deep\n---\nDeep content.',
  'guides/draft.md': '---\nlabel: Draft\ndraft: true\n---\nHidden.',
  'section.md': '---\nlabel: Section\nisTitle: true\norder: 3\n---\n',
  'external.md': '---\nlabel: External\nexternalUrl: https://example.com\norder: 4\n---\n',
  'zeta.md': 'No frontmatter here.',
  'internal/secret.md': '---\nlabel: Secret\n---\nSecret.',
  'notes.txt': 'not markdown',
};

function writeFixture(root: string, files: Record<string, string>) {
  for (const [rel, content] of Object.entries(files)) {
    const full = path.join(root, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content, 'utf8');
  }
}

function toFiles(files: Record<string, string>) {
  return Object.entries(files).map(([p, content]) => ({ path: p, content }));
}

/** Collects every relative import of a source file, recursively, and returns all import specifiers seen. */
function collectImports(file: string, seen = new Set<string>()): string[] {
  if (seen.has(file)) return [];
  seen.add(file);
  const source = fs.readFileSync(file, 'utf8');
  const specifiers = [...source.matchAll(/(?:import|export)[^'"]*?from\s+['"]([^'"]+)['"]/g)].map((m) => m[1]);
  const all = [...specifiers];
  for (const spec of specifiers) {
    if (!spec.startsWith('.')) continue;
    const resolved = path.resolve(path.dirname(file), spec.replace(/\.js$/, '.ts'));
    if (fs.existsSync(resolved)) all.push(...collectImports(resolved, seen));
  }
  return all;
}

describe('core entry (S4)', () => {
  test('generateManifestFromFiles matches generateManifest for the same tree on disk', () => {
    writeFixture(tempDir, FIXTURE);
    const fromDisk = generateManifest(tempDir, ['internal/**']);
    const fromMemory = generateManifestFromFiles(toFiles(FIXTURE), { exclude: ['internal/**'] });

    expect(fromMemory.manifest).toEqual(fromDisk.manifest);
    expect(JSON.stringify(fromMemory.manifest.map(cleanItem))).toBe(JSON.stringify(fromDisk.manifest.map(cleanItem)));
    // Search entries follow directory listing order: Node's readdir is sorted by name, Bun's is not, while the
    // in-memory reader always lists by name (Node's order). Compare entries independently of that order.
    const byRoute = (a: { route: string }, b: { route: string }) => (a.route < b.route ? -1 : 1);
    expect([...fromMemory.searchIndex].sort(byRoute)).toEqual([...fromDisk.searchIndex].sort(byRoute));
    expect(fromMemory.searchIndex.map((e) => e.route)).toEqual([
      'README',
      'external',
      'getting-started',
      'guides/README',
      'guides/advanced/deep',
      'guides/theming',
      'zeta',
    ]);
  });

  test('generateManifestFromFiles accepts leading "./" or "/" and folder labels from README', () => {
    const result = generateManifestFromFiles([
      { path: './guides/README.md', content: '---\nbreadcrumbTitle: Guides\n---\nx' },
      { path: '/guides/a.md', content: '---\nlabel: A\n---\nx' },
    ]);
    const folder = result.manifest.find((item) => item.route === 'guides');
    expect(folder?.label).toBe('Guides');
    expect(folder?.children?.map((c) => c.route)).toEqual(['guides/a', 'guides/README']);
    expect(result.searchIndex.find((e) => e.route === 'guides/a')?.breadcrumb).toEqual([
      { label: 'Guides', route: 'guides' },
      { label: 'A', route: 'guides/a' },
    ]);
  });

  test('generateManifestFromFiles returns empty output for no files', () => {
    expect(generateManifestFromFiles([])).toEqual({ manifest: [], searchIndex: [] });
  });

  test('core module and its imports have no node: builtins', () => {
    const imports = collectImports(path.join(packageRoot, 'src/core.ts'));
    expect(imports.length).toBeGreaterThan(0);
    expect(imports.filter((spec) => spec.startsWith('node:') || ['fs', 'path'].includes(spec))).toEqual([]);
  });

  test('root entry re-exports the same pure helpers as core', () => {
    expect(formatTitle).toBe(coreFormatTitle);
    expect(parseFrontmatter).toBe(coreParseFrontmatter);
    expect(ALLOWED_FRONTMATTER_KEYS).toBe(CORE_ALLOWED_KEYS);
  });

  test('package.json exposes the core and schema subpaths', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8'));
    expect(pkg.exports['./core']).toEqual({
      types: './dist/types/core.d.ts',
      import: './dist/core.esm.js',
      require: './dist/core.cjs',
    });
    expect(pkg.exports['./schema']).toEqual({
      types: './dist/types/schema.d.ts',
      import: './dist/schema.esm.js',
      require: './dist/schema.cjs',
    });
    expect(pkg.exports['./schema/manifest.schema.json']).toBe('./schema/manifest.schema.json');
    expect(pkg.exports['./schema/search-index.schema.json']).toBe('./schema/search-index.schema.json');
    expect(pkg.files).toContain('schema/');
  });
});

// ---------------------------------------------------------------------------
// Minimal JSON Schema (draft-07 subset) validator: type, required, properties,
// additionalProperties: false, items, local $ref.
// ---------------------------------------------------------------------------
type Schema = {
  type?: string | string[];
  required?: string[];
  properties?: Record<string, Schema>;
  additionalProperties?: boolean;
  items?: Schema;
  $ref?: string;
  definitions?: Record<string, Schema>;
  enum?: unknown[];
  minimum?: number;
};

function typeOf(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

function validate(value: unknown, schema: Schema, root: Schema, at = '$'): string[] {
  if (schema.$ref) {
    const name = schema.$ref.replace('#/definitions/', '');
    const target = root.definitions?.[name];
    if (!target) return [`${at}: unresolved ${schema.$ref}`];
    return validate(value, target, root, at);
  }
  const errors: string[] = [];
  if (schema.type) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    const actual = Number.isInteger(value) && types.includes('integer') ? 'integer' : typeOf(value);
    if (!types.includes(actual)) return [`${at}: expected ${types.join('|')}, got ${typeOf(value)}`];
  }
  if (schema.enum && !schema.enum.includes(value)) return [`${at}: ${JSON.stringify(value)} is not one of the enum`];
  if (schema.minimum !== undefined && typeof value === 'number' && value < schema.minimum) {
    return [`${at}: below minimum ${schema.minimum}`];
  }
  if (Array.isArray(value) && schema.items) {
    value.forEach((v, i) => {
      errors.push(...validate(v, schema.items as Schema, root, `${at}[${i}]`));
    });
  }
  if (typeOf(value) === 'object') {
    const obj = value as Record<string, unknown>;
    for (const key of schema.required ?? []) if (!(key in obj)) errors.push(`${at}: missing ${key}`);
    for (const [key, v] of Object.entries(obj)) {
      const prop = schema.properties?.[key];
      if (prop) errors.push(...validate(v, prop, root, `${at}.${key}`));
      else if (schema.additionalProperties === false) errors.push(`${at}: unexpected property ${key}`);
    }
  }
  return errors;
}

function loadSchema(name: string): Schema {
  return JSON.parse(fs.readFileSync(path.join(packageRoot, 'schema', name), 'utf8'));
}

describe('JSON Schemas (S1)', () => {
  const manifestSchema = loadSchema('manifest.schema.json');
  const searchSchema = loadSchema('search-index.schema.json');

  test('validator rejects an invalid manifest (sanity check)', () => {
    expect(validate([{ label: 1 }], manifestSchema, manifestSchema).length).toBeGreaterThan(0);
    expect(validate([{ label: 'a', unknown: true }], manifestSchema, manifestSchema)).toEqual([
      '$[0]: unexpected property unknown',
    ]);
    expect(validate([{ route: 'a' }], searchSchema, searchSchema)).toEqual(['$[0]: missing label']);
  });

  test('generated output with every frontmatter field and prevNext validates', () => {
    const everything = [
      'label: All',
      'description: Every field',
      'tags: [a]',
      'keywords: [k]',
      'order: 1',
      'isParent: true',
      'icon: star',
      'iconType: material',
      'badge: New',
      'badgeColor: green',
      'breadcrumbTitle: All Fields',
      'layout: wide',
      'redirect: /elsewhere',
      'externalUrl: https://example.com',
      'deprecated: true',
      'deprecatedAlternative: other',
      'publishedAt: "2024-01-01"',
      'updatedAt: "2024-02-01"',
    ].join('\n');
    const result = generateManifestFromFiles(
      [
        ...toFiles(FIXTURE),
        { path: 'all/README.md', content: `---\n${everything}\n---\n## Heading\n\nBody text.` },
        { path: 'all/next.md', content: '---\nlabel: Next\n---\nx' },
      ],
      { prevNext: true },
    );
    const manifest = JSON.parse(JSON.stringify(result.manifest.map(cleanItem)));
    const searchIndex = JSON.parse(JSON.stringify(result.searchIndex));

    expect(validate(manifest, manifestSchema, manifestSchema)).toEqual([]);
    expect(validate(searchIndex, searchSchema, searchSchema)).toEqual([]);
    expect(JSON.stringify(manifest)).toContain('"prev"');
  });

  test('generated output with headingAnchors, extraFrontmatter, readingTime and a hidden page validates', () => {
    const result = generateManifestFromFiles(
      [
        ...toFiles(FIXTURE),
        { path: 'extra.md', content: '---\nlabel: Extra\nowner: me\n---\n## One\n\n### Two\n\nSome words.' },
        { path: 'secret.md', content: '---\nlabel: Secret\nhidden: true\n---\n## Hidden section' },
      ],
      { headingAnchors: true, extraFrontmatter: true, readingTime: true },
    );
    const manifest = JSON.parse(JSON.stringify(result.manifest.map(cleanItem)));
    const searchIndex = JSON.parse(JSON.stringify(result.searchIndex));

    expect(validate(manifest, manifestSchema, manifestSchema)).toEqual([]);
    expect(validate(searchIndex, searchSchema, searchSchema)).toEqual([]);
    const raw = JSON.stringify(manifest) + JSON.stringify(searchIndex);
    for (const key of ['"meta"', '"wordCount"', '"readingTime"', '"sections"', '"hidden"']) expect(raw).toContain(key);
    expect(
      validate([{ label: 'a', route: 'a', sections: [{ text: 'x', id: 'x', level: 4 }] }], searchSchema, searchSchema),
    ).toEqual(['$[0].sections[0].level: 4 is not one of the enum']);
  });

  test("this repository's published 1.1.0 output validates", () => {
    const manifest = JSON.parse(fs.readFileSync(path.join(repoRoot, 'docs/1.1.0/manifest.json'), 'utf8'));
    const searchIndex = JSON.parse(fs.readFileSync(path.join(repoRoot, 'docs/1.1.0/search-index.json'), 'utf8'));

    expect(validate(manifest, manifestSchema, manifestSchema)).toEqual([]);
    expect(validate(searchIndex, searchSchema, searchSchema)).toEqual([]);
  });
});
