import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { maybeRunCli, runCli } from '../src/cli.js';

let tempDir = '';

function writeFile(filePath: string, content: string) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
}

beforeEach(() => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'manifest-generator-cli-'));
});

afterEach(() => {
  if (tempDir) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

describe('maybeRunCli', () => {
  test('does not auto-run under test env', () => {
    const ran = maybeRunCli({ BUN_TEST: '1' }, [], (() => {
      throw new Error('should not exit');
    }) as never);

    expect(ran).toBe(false);
  });
});

describe('runCli', () => {
  test('discover lists projects and exits 0', () => {
    const projectsRoot = path.join(tempDir, 'projects');
    const projectA = path.join(projectsRoot, 'project-a');
    writeFile(path.join(projectA, 'docs', 'README.md'), '# A');

    const logs: string[] = [];
    const originalLog = console.log;
    console.log = (...args: unknown[]) => {
      logs.push(args.join(' '));
    };

    let exitCode: number | undefined;
    const exitFn = ((code?: number): never => {
      exitCode = code;
      return undefined as never;
    }) as (code?: number) => never;

    try {
      runCli(['--discover', '--docs-root', projectsRoot, '--docs-subfolder', 'docs'], exitFn);
    } finally {
      console.log = originalLog;
    }

    expect(exitCode).toBe(0);
    expect(logs.join('\n')).toContain('Found 1 project');
  });

  test('exits 1 with helpful error when docs-root does not exist', () => {
    const nonexistentRoot = path.join(tempDir, 'nonexistent');

    const logs: string[] = [];
    const errors: string[] = [];
    const originalLog = console.log;
    const originalError = console.error;

    console.log = (...args: unknown[]) => logs.push(args.join(' '));
    console.error = (...args: unknown[]) => errors.push(args.join(' '));

    let exitCode: number | undefined;
    const exitFn = ((code?: number): never => {
      exitCode = code;
      return undefined as never;
    }) as (code?: number) => never;

    try {
      runCli(['--docs-root', nonexistentRoot], exitFn);
    } finally {
      console.log = originalLog;
      console.error = originalError;
    }

    expect(exitCode).toBe(1);
    expect(errors.join('\n')).toContain('Documentation directory not found');
    expect(errors.join('\n')).toContain('Directory structure should be one of');
  });
});
