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

  test('runs CLI when not in test env', () => {
    const logs: string[] = [];
    const originalLog = console.log;
    console.log = (...args: unknown[]) => logs.push(args.join(' '));

    let exitCode: number | undefined;
    const exitFn = ((code?: number): never => {
      exitCode = code;
      return undefined as never;
    }) as (code?: number) => never;

    try {
      const result = maybeRunCli({}, ['--help'], exitFn);
      expect(result).toBe(true);
      expect(exitCode).toBe(0);
    } finally {
      console.log = originalLog;
    }
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

  test('--validate reports valid docs', () => {
    const docsRoot = path.join(tempDir, 'docs');
    writeFile(path.join(docsRoot, 'good.md'), '---\nlabel: Good\n---\nContent');

    const logs: string[] = [];
    const originalLog = console.log;
    console.log = (...args: unknown[]) => logs.push(args.join(' '));

    let exitCode: number | undefined;
    const exitFn = ((code?: number): never => {
      exitCode = code;
      return undefined as never;
    }) as (code?: number) => never;

    try {
      runCli(['--validate', '--docs-root', docsRoot], exitFn);
    } finally {
      console.log = originalLog;
    }

    expect(exitCode).toBe(0);
    expect(logs.join('\n')).toContain('valid');
  });

  test('--validate exits 1 on invalid frontmatter', () => {
    const docsRoot = path.join(tempDir, 'docs');
    writeFile(path.join(docsRoot, 'bad.md'), '---\npublishedAt: not-a-date\n---\nContent');

    const logs: string[] = [];
    const originalLog = console.log;
    console.log = (...args: unknown[]) => logs.push(args.join(' '));

    let exitCode: number | undefined;
    const exitFn = ((code?: number): never => {
      exitCode = code;
      return undefined as never;
    }) as (code?: number) => never;

    try {
      runCli(['--validate', '--docs-root', docsRoot], exitFn);
    } finally {
      console.log = originalLog;
    }

    expect(exitCode).toBe(1);
  });

  test('--recursive discover finds nested projects', () => {
    const root = path.join(tempDir, 'root');
    const nested = path.join(root, 'group', 'project');
    writeFile(path.join(nested, 'docs', 'README.md'), '# Nested');

    const logs: string[] = [];
    const originalLog = console.log;
    console.log = (...args: unknown[]) => logs.push(args.join(' '));

    let exitCode: number | undefined;
    const exitFn = ((code?: number): never => {
      exitCode = code;
      return undefined as never;
    }) as (code?: number) => never;

    try {
      runCli(['--discover', '--recursive', '--docs-root', root], exitFn);
    } finally {
      console.log = originalLog;
    }

    expect(exitCode).toBe(0);
    expect(logs.join('\n')).toContain('project');
  });

  test('--all generates for all projects', () => {
    const root = path.join(tempDir, 'projects');
    const projectA = path.join(root, 'project-a');
    writeFile(path.join(projectA, 'docs', 'README.md'), '# A');
    const projectB = path.join(root, 'project-b');
    writeFile(path.join(projectB, 'README.md'), '# B');

    const logs: string[] = [];
    const originalLog = console.log;
    console.log = (...args: unknown[]) => logs.push(args.join(' '));

    let exitCode: number | undefined;
    const exitFn = ((code?: number): never => {
      exitCode = code;
      return undefined as never;
    }) as (code?: number) => never;

    try {
      runCli(['--all', '--docs-root', root], exitFn);
    } finally {
      console.log = originalLog;
    }

    expect(exitCode).toBe(0);
    expect(fs.existsSync(path.join(projectA, 'manifest.json'))).toBe(true);
    expect(fs.existsSync(path.join(projectB, 'manifest.json'))).toBe(true);
  });

  test('--help prints help and exits 0', () => {
    const logs: string[] = [];
    const originalLog = console.log;
    console.log = (...args: unknown[]) => logs.push(args.join(' '));

    let exitCode: number | undefined;
    const exitFn = ((code?: number): never => {
      exitCode = code;
      return undefined as never;
    }) as (code?: number) => never;

    try {
      runCli(['--help'], exitFn);
    } finally {
      console.log = originalLog;
    }

    expect(exitCode).toBe(0);
    expect(logs.join('\n')).toContain('@fsegurai/manifest-generator CLI');
  });

  test('--version prints version and exits 0', () => {
    const logs: string[] = [];
    const originalLog = console.log;
    console.log = (...args: unknown[]) => logs.push(args.join(' '));

    let exitCode: number | undefined;
    const exitFn = ((code?: number): never => {
      exitCode = code;
      return undefined as never;
    }) as (code?: number) => never;

    try {
      runCli(['--version'], exitFn);
    } finally {
      console.log = originalLog;
    }

    expect(exitCode).toBe(0);
    expect(logs.join('\n')).toContain('@fsegurai/manifest-generator v');
  });

  test('--version shows unknown when package.json is missing', () => {
    const logs: string[] = [];
    const originalLog = console.log;
    console.log = (...args: unknown[]) => logs.push(args.join(' '));

    let exitCode: number | undefined;
    const exitFn = ((code?: number): never => {
      exitCode = code;
      return undefined as never;
    }) as (code?: number) => never;

    const originalCwd = process.cwd();
    process.chdir(tempDir);
    try {
      runCli(['--version'], exitFn);
    } finally {
      process.chdir(originalCwd);
      console.log = originalLog;
    }

    expect(exitCode).toBe(0);
    expect(logs.join('\n')).toContain('version unknown');
  });

  test('--discover shows no projects in empty directory', () => {
    const empty = path.join(tempDir, 'empty');
    fs.mkdirSync(empty, { recursive: true });

    const logs: string[] = [];
    const originalLog = console.log;
    console.log = (...args: unknown[]) => logs.push(args.join(' '));

    let exitCode: number | undefined;
    const exitFn = ((code?: number): never => {
      exitCode = code;
      return undefined as never;
    }) as (code?: number) => never;

    try {
      runCli(['--discover', '--docs-root', empty], exitFn);
    } finally {
      console.log = originalLog;
    }

    expect(exitCode).toBe(0);
    expect(logs.join('\n')).toContain('No documentation projects found');
  });

  test('--validate reports no markdown files in empty directory', () => {
    const empty = path.join(tempDir, 'empty-validate');
    fs.mkdirSync(empty, { recursive: true });

    const logs: string[] = [];
    const originalLog = console.log;
    console.log = (...args: unknown[]) => logs.push(args.join(' '));

    let exitCode: number | undefined;
    const exitFn = ((code?: number): never => {
      exitCode = code;
      return undefined as never;
    }) as (code?: number) => never;

    try {
      runCli(['--validate', '--docs-root', empty], exitFn);
    } finally {
      console.log = originalLog;
    }

    expect(exitCode).toBe(0);
    expect(logs.join('\n')).toContain('No markdown files found to validate');
  });

  test('--project generates for specific project', () => {
    const root = path.join(tempDir, 'project-flag');
    const projectA = path.join(root, 'project-a');
    const projectB = path.join(root, 'project-b');
    writeFile(path.join(projectA, 'docs', 'README.md'), '# A');
    writeFile(path.join(projectB, 'docs', 'README.md'), '# B');

    const logs: string[] = [];
    const originalLog = console.log;
    console.log = (...args: unknown[]) => logs.push(args.join(' '));

    let exitCode: number | undefined;
    const exitFn = ((code?: number): never => {
      exitCode = code;
      return undefined as never;
    }) as (code?: number) => never;

    try {
      runCli(['--project', 'project-a', '--docs-root', root], exitFn);
    } finally {
      console.log = originalLog;
    }

    expect(exitCode).toBe(0);
    expect(fs.existsSync(path.join(projectA, 'manifest.json'))).toBe(true);
    expect(fs.existsSync(path.join(projectB, 'manifest.json'))).toBe(false);
  });

  test('--project nonexistent exits 1 with error', () => {
    const errors: string[] = [];
    const originalError = console.error;
    const originalLog = console.log;
    console.error = (...args: unknown[]) => errors.push(args.join(' '));
    console.log = () => {};

    let exitCode: number | undefined;
    const exitFn = ((code?: number): never => {
      exitCode = code;
      return undefined as never;
    }) as (code?: number) => never;

    try {
      runCli(['--project', 'nonexistent', '--docs-root', tempDir], exitFn);
    } finally {
      console.error = originalError;
      console.log = originalLog;
    }

    expect(exitCode).toBe(1);
    expect(errors.join('\n')).toContain('Error:');
  });

  test('--route generates for specific path', () => {
    const docsPath = path.join(tempDir, 'route-test');
    writeFile(path.join(docsPath, 'page.md'), '---\nlabel: My Page\n---\nContent');

    const logs: string[] = [];
    const originalLog = console.log;
    console.log = (...args: unknown[]) => logs.push(args.join(' '));

    let exitCode: number | undefined;
    const exitFn = ((code?: number): never => {
      exitCode = code;
      return undefined as never;
    }) as (code?: number) => never;

    try {
      runCli(['--route', docsPath], exitFn);
    } finally {
      console.log = originalLog;
    }

    expect(exitCode).toBe(0);
    expect(fs.existsSync(path.join(docsPath, 'manifest.json'))).toBe(true);
  });

  test('--docs-subfolder with --all uses custom subfolder name', () => {
    const root = path.join(tempDir, 'subfolder-test');
    const projectA = path.join(root, 'project-a');
    writeFile(path.join(projectA, 'documents', 'README.md'), '# A');

    const logs: string[] = [];
    const originalLog = console.log;
    console.log = (...args: unknown[]) => logs.push(args.join(' '));

    let exitCode: number | undefined;
    const exitFn = ((code?: number): never => {
      exitCode = code;
      return undefined as never;
    }) as (code?: number) => never;

    try {
      runCli(['--all', '--docs-root', root, '--docs-subfolder', 'documents'], exitFn);
    } finally {
      console.log = originalLog;
    }

    expect(exitCode).toBe(0);
    expect(fs.existsSync(path.join(projectA, 'manifest.json'))).toBe(true);
  });

  test('positional arg is used as docs root with auto-detect', () => {
    const root = path.join(tempDir, 'positional');
    const projectA = path.join(root, 'project-a');
    writeFile(path.join(projectA, 'docs', 'README.md'), '# A');

    const logs: string[] = [];
    const originalLog = console.log;
    console.log = (...args: unknown[]) => logs.push(args.join(' '));

    let exitCode: number | undefined;
    const exitFn = ((code?: number): never => {
      exitCode = code;
      return undefined as never;
    }) as (code?: number) => never;

    try {
      runCli([root], exitFn);
    } finally {
      console.log = originalLog;
    }

    expect(exitCode).toBe(0);
    expect(fs.existsSync(path.join(projectA, 'manifest.json'))).toBe(true);
  });

  test('no args or flags shows help and exits 0', () => {
    const logs: string[] = [];
    const originalLog = console.log;
    console.log = (...args: unknown[]) => logs.push(args.join(' '));

    let exitCode: number | undefined;
    const exitFn = ((code?: number): never => {
      exitCode = code;
      return undefined as never;
    }) as (code?: number) => never;

    try {
      runCli([], exitFn);
    } finally {
      console.log = originalLog;
    }

    expect(exitCode).toBe(0);
    expect(logs.join('\n')).toContain('@fsegurai/manifest-generator CLI');
  });

  test('--watch triggers initial generation and starts watcher', () => {
    const root = path.join(tempDir, 'watch-cli');
    writeFile(path.join(root, 'proj', 'docs', 'README.md'), '# Project');

    const logs: string[] = [];
    const originalLog = console.log;
    console.log = (...args: unknown[]) => logs.push(args.join(' '));

    const exitFn = ((_code?: number): never => {
      return undefined as never;
    }) as (code?: number) => never;

    try {
      runCli(['--watch', '--docs-root', root], exitFn);
      const output = logs.join('\n');
      expect(output).toContain('Watching for file changes');
      expect(output).toContain('Watching for changes in:');
      expect(output).toContain('Generated manifest and search index');
    } finally {
      console.log = originalLog;
    }
  });

  test('--watch stops on SIGINT', () => {
    const root = path.join(tempDir, 'watch-sigint');
    writeFile(path.join(root, 'proj', 'docs', 'README.md'), '# Project');

    const logs: string[] = [];
    const originalLog = console.log;
    console.log = (...args: unknown[]) => logs.push(args.join(' '));

    let exitCode: number | undefined;
    const exitFn = ((code?: number): never => {
      exitCode = code;
      return undefined as never;
    }) as (code?: number) => never;

    try {
      runCli(['--watch', '--docs-root', root], exitFn);
      process.emit('SIGINT');
      expect(logs.join('\n')).toContain('Stopping watch...');
      expect(exitCode).toBe(0);
    } finally {
      console.log = originalLog;
      process.removeAllListeners('SIGINT');
      process.removeAllListeners('SIGTERM');
    }
  });

  test('--watch stops on SIGTERM', () => {
    const root = path.join(tempDir, 'watch-sigterm');
    writeFile(path.join(root, 'proj', 'docs', 'README.md'), '# Project');

    const logs: string[] = [];
    const originalLog = console.log;
    console.log = (...args: unknown[]) => logs.push(args.join(' '));

    let exitCode: number | undefined;
    const exitFn = ((code?: number): never => {
      exitCode = code;
      return undefined as never;
    }) as (code?: number) => never;

    try {
      runCli(['--watch', '--docs-root', root], exitFn);
      process.emit('SIGTERM');
      expect(exitCode).toBe(0);
    } finally {
      console.log = originalLog;
      process.removeAllListeners('SIGINT');
      process.removeAllListeners('SIGTERM');
    }
  });

  test('--all --output logs output directory', () => {
    const root = path.join(tempDir, 'all-output');
    writeFile(path.join(root, 'proj', 'docs', 'README.md'), '# A');

    const logs: string[] = [];
    const originalLog = console.log;
    console.log = (...args: unknown[]) => logs.push(args.join(' '));

    let exitCode: number | undefined;
    const exitFn = ((code?: number): never => {
      exitCode = code;
      return undefined as never;
    }) as (code?: number) => never;

    try {
      runCli(['--all', '--docs-root', root, '--output', tempDir], exitFn);
      expect(exitCode).toBe(0);
      expect(logs.join('\n')).toContain('Output directory:');
    } finally {
      console.log = originalLog;
    }
  });

  test('--init scaffolds docs structure in current dir', () => {
    const logs: string[] = [];
    const originalLog = console.log;
    console.log = (...args: unknown[]) => logs.push(args.join(' '));

    let exitCode: number | undefined;
    const exitFn = ((code?: number): never => {
      exitCode = code;
      return undefined as never;
    }) as (code?: number) => never;

    try {
      runCli(['--init', tempDir], exitFn);
      expect(exitCode).toBe(0);

      expect(fs.existsSync(path.join(tempDir, 'manifest-generator.config.ts'))).toBe(true);
      expect(fs.existsSync(path.join(tempDir, 'docs', 'README.md'))).toBe(true);
      expect(fs.existsSync(path.join(tempDir, 'docs', 'getting-started.md'))).toBe(true);
      expect(fs.existsSync(path.join(tempDir, 'docs', 'api', 'reference.md'))).toBe(true);
      expect(fs.existsSync(path.join(tempDir, 'docs', 'guides', 'README.md'))).toBe(true);
      expect(fs.existsSync(path.join(tempDir, 'docs', 'guides', 'setup.md'))).toBe(true);
      expect(fs.existsSync(path.join(tempDir, 'docs', 'guides', 'advanced.md'))).toBe(true);

      expect(logs.join('\n')).toContain('Initialized documentation structure');
    } finally {
      console.log = originalLog;
    }
  });

  test('--config loads JSON config and applies defaults', () => {
    const root = path.join(tempDir, 'config-test');
    const projectA = path.join(root, 'project-a');
    writeFile(path.join(projectA, 'documents', 'README.md'), '# A');

    const logs: string[] = [];
    const originalLog = console.log;
    console.log = (...args: unknown[]) => logs.push(args.join(' '));

    let exitCode: number | undefined;
    const exitFn = ((code?: number): never => {
      exitCode = code;
      return undefined as never;
    }) as (code?: number) => never;

    const configPath = path.join(tempDir, 'manifest-generator.config.json');
    fs.writeFileSync(configPath, JSON.stringify({
      docsSubfolder: 'documents',
    }), 'utf8');

    try {
      runCli(['--all', '--docs-root', root, '--config', configPath], exitFn);
      expect(exitCode).toBe(0);
      expect(fs.existsSync(path.join(projectA, 'manifest.json'))).toBe(true);
    } finally {
      console.log = originalLog;
    }
  });

  test('--config loads config and CLI flags override it', () => {
    const root = path.join(tempDir, 'config-override');
    const projectA = path.join(root, 'custom-docs');
    writeFile(path.join(projectA, 'custom-docs', 'README.md'), '# A');
    writeFile(path.join(root, 'other-project', 'custom-docs', 'README.md'), '# B');

    const logs: string[] = [];
    const originalLog = console.log;
    console.log = (...args: unknown[]) => logs.push(args.join(' '));

    let exitCode: number | undefined;
    const exitFn = ((code?: number): never => {
      exitCode = code;
      return undefined as never;
    }) as (code?: number) => never;

    const configPath = path.join(tempDir, 'manifest-generator.config.json');
    fs.writeFileSync(configPath, JSON.stringify({
      docsSubfolder: 'wrong-folder',
    }), 'utf8');

    try {
      runCli(['--all', '--docs-root', root, '--config', configPath, '--docs-subfolder', 'custom-docs'], exitFn);
      expect(exitCode).toBe(0);
      expect(fs.existsSync(path.join(projectA, 'manifest.json'))).toBe(true);
    } finally {
      console.log = originalLog;
    }
  });

  test('--all --recursive logs recursive discovery', () => {
    const root = path.join(tempDir, 'all-recursive');
    writeFile(path.join(root, 'group', 'proj', 'docs', 'README.md'), '# A');

    const logs: string[] = [];
    const originalLog = console.log;
    console.log = (...args: unknown[]) => logs.push(args.join(' '));

    let exitCode: number | undefined;
    const exitFn = ((code?: number): never => {
      exitCode = code;
      return undefined as never;
    }) as (code?: number) => never;

    try {
      runCli(['--all', '--recursive', '--docs-root', root], exitFn);
      expect(exitCode).toBe(0);
      expect(logs.join('\n')).toContain('Recursive discovery: enabled');
    } finally {
      console.log = originalLog;
    }
  });
});
