import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { defineConfig, loadConfig, mergeConfig } from '../src/config.js';

let tempDir = '';

beforeEach(() => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'manifest-config-'));
});

afterEach(() => {
  if (tempDir) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

describe('defineConfig', () => {
  test('returns the config object as-is', () => {
    const config = defineConfig({ docsSubfolder: 'docs', recursive: true });
    expect(config.docsSubfolder).toBe('docs');
    expect(config.recursive).toBe(true);
  });
});

describe('loadConfig', () => {
  test('returns empty object when no config file exists', () => {
    const config = loadConfig(tempDir);
    expect(config).toEqual({});
  });

  test('loads JSON config', () => {
    const configPath = path.join(tempDir, 'manifest-generator.config.json');
    fs.writeFileSync(configPath, JSON.stringify({
      docsSubfolder: 'documents',
      recursive: true,
    }), 'utf8');

    const config = loadConfig(tempDir);
    expect(config.docsSubfolder).toBe('documents');
    expect(config.recursive).toBe(true);
  });

  test('loads JSON config with optional fields', () => {
    const configPath = path.join(tempDir, 'manifest-generator.config.json');
    fs.writeFileSync(configPath, JSON.stringify({
      docsRoot: './my-docs',
      outputDir: './dist',
      exclude: ['node_modules'],
    }), 'utf8');

    const config = loadConfig(tempDir);
    expect(config.docsRoot).toBe('./my-docs');
    expect(config.outputDir).toBe('./dist');
    expect(config.exclude).toEqual(['node_modules']);
  });

  test('loads JS config with default export', () => {
    const configPath = path.join(tempDir, 'manifest-generator.config.js');
    fs.writeFileSync(configPath, `export default { docsSubfolder: 'guides', recursive: true };`, 'utf8');

    const config = loadConfig(tempDir);
    expect(config.docsSubfolder).toBe('guides');
    expect(config.recursive).toBe(true);
  });

  test('loads JS config with direct export', () => {
    const configPath = path.join(tempDir, 'manifest-generator.config.js');
    fs.writeFileSync(configPath, `({ docsSubfolder: 'ref' });`, 'utf8');

    const config = loadConfig(tempDir);
    expect(config.docsSubfolder).toBe('ref');
  });

  test('returns empty object on invalid JS config', () => {
    const configPath = path.join(tempDir, 'manifest-generator.config.js');
    fs.writeFileSync(configPath, 'not valid javascript {{{', 'utf8');

    const config = loadConfig(tempDir);
    expect(config).toEqual({});
  });

  test('prefers .ts over .js over .json', () => {
    const jsonPath = path.join(tempDir, 'manifest-generator.config.json');
    fs.writeFileSync(jsonPath, JSON.stringify({ docsSubfolder: 'json-folder' }), 'utf8');

    const jsPath = path.join(tempDir, 'manifest-generator.config.js');
    fs.writeFileSync(jsPath, `export default { docsSubfolder: 'js-folder' };`, 'utf8');

    const config = loadConfig(tempDir);
    expect(config.docsSubfolder).toBe('js-folder');
  });

  test('prefers .ts over .js', () => {
    const jsPath = path.join(tempDir, 'manifest-generator.config.js');
    fs.writeFileSync(jsPath, `export default { docsSubfolder: 'js-folder' };`, 'utf8');

    const tsPath = path.join(tempDir, 'manifest-generator.config.ts');
    fs.writeFileSync(tsPath, `export default { docsSubfolder: 'ts-folder' };`, 'utf8');

    const config = loadConfig(tempDir);
    expect(config.docsSubfolder).toBe('ts-folder');
  });
});

describe('mergeConfig', () => {
  test('defaults win when both CLI and config are undefined', () => {
    const result = mergeConfig({}, {}, { docsSubfolder: 'docs', recursive: false, output: null as string | null });
    expect(result.docsSubfolder).toBe('docs');
    expect(result.recursive).toBe(false);
    expect(result.output).toBeNull();
  });

  test('config file overrides defaults', () => {
    const result = mergeConfig({}, { docsSubfolder: 'guides' }, { docsSubfolder: 'docs', recursive: false, output: null as string | null });
    expect(result.docsSubfolder).toBe('guides');
    expect(result.recursive).toBe(false);
  });

  test('CLI flags override config file', () => {
    const result = mergeConfig(
      { docsSubfolder: 'cli-value' },
      { docsSubfolder: 'config-value' },
      { docsSubfolder: 'docs', recursive: false, output: null as string | null },
    );
    expect(result.docsSubfolder).toBe('cli-value');
  });

  test('CLI undefined values do not override config', () => {
    const result = mergeConfig(
      { docsSubfolder: undefined, recursive: undefined } as any,
      { docsSubfolder: 'config-sub', recursive: true },
      { docsSubfolder: 'docs', recursive: false, output: null as string | null },
    );
    expect(result.docsSubfolder).toBe('config-sub');
    expect(result.recursive).toBe(true);
  });
});
