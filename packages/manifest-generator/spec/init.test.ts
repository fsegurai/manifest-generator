import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { scaffoldInit } from '../src/init.js';

let tempDir = '';

beforeEach(() => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'manifest-generator-init-'));
});

afterEach(() => {
  if (tempDir) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

describe('scaffoldInit', () => {
  test('creates a config file and sample docs structure with defaults', () => {
    scaffoldInit(tempDir);

    expect(fs.existsSync(path.join(tempDir, 'manifest-generator.config.ts'))).toBe(true);
    expect(fs.existsSync(path.join(tempDir, 'docs', 'README.md'))).toBe(true);
    expect(fs.existsSync(path.join(tempDir, 'docs', 'api', 'reference.md'))).toBe(true);
    expect(fs.existsSync(path.join(tempDir, 'docs', 'guides', 'README.md'))).toBe(true);

    const configContent = fs.readFileSync(path.join(tempDir, 'manifest-generator.config.ts'), 'utf8');
    expect(configContent).toContain(`docsSubfolder: 'docs'`);
    expect(configContent).toContain('recursive: false');
    expect(configContent).toContain('outputDir: null');
  });

  test('honors custom docsSubfolder, recursive, and outputDir options', () => {
    scaffoldInit(tempDir, { docsSubfolder: 'documentation', recursive: true, outputDir: './dist' });

    expect(fs.existsSync(path.join(tempDir, 'documentation', 'README.md'))).toBe(true);

    const configContent = fs.readFileSync(path.join(tempDir, 'manifest-generator.config.ts'), 'utf8');
    expect(configContent).toContain(`docsSubfolder: 'documentation'`);
    expect(configContent).toContain('recursive: true');
    expect(configContent).toContain(`outputDir: './dist'`);
  });
});

describe('promptInitOptions', () => {
  test('resolves answers from readline prompts into ScaffoldInitOptions', async () => {
    const answers = ['guides', './public/docs', 'y'];
    let questionCount = 0;

    mock.module('node:readline/promises', () => ({
      createInterface: () => ({
        question: async () => answers[questionCount++],
        close: () => {},
      }),
    }));

    const { promptInitOptions } = await import('../src/init.js');
    const options = await promptInitOptions();

    expect(options.docsSubfolder).toBe('guides');
    expect(options.outputDir).toBe('./public/docs');
    expect(options.recursive).toBe(true);
  });

  test('falls back to undefined/false for blank answers', async () => {
    mock.module('node:readline/promises', () => ({
      createInterface: () => ({
        question: async () => '   ',
        close: () => {},
      }),
    }));

    const { promptInitOptions } = await import('../src/init.js');
    const options = await promptInitOptions();

    expect(options.docsSubfolder).toBeUndefined();
    expect(options.outputDir).toBeUndefined();
    expect(options.recursive).toBe(false);
  });

  test('closes the readline interface even if a question rejects', async () => {
    let closed = false;

    mock.module('node:readline/promises', () => ({
      createInterface: () => ({
        question: async () => {
          throw new Error('stdin closed');
        },
        close: () => {
          closed = true;
        },
      }),
    }));

    const { promptInitOptions } = await import('../src/init.js');
    await expect(promptInitOptions()).rejects.toThrow('stdin closed');
    expect(closed).toBe(true);
  });
});
