import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  discoverProjects,
  generateManifestsWithDiscovery,
  parseFrontmatter,
  walkDocs,
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
  });
});

