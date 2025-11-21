import fs from 'fs';
import * as cli from '../src/cli.js';
import * as indexModule from '../src/index.js';
import path from 'path';
import { spawnSync } from 'child_process';

jest.mock('fs');

describe('CLI Module', () => {
  let consoleLogSpy;
  let consoleErrorSpy;
  let exitMock;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {
    });
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {
    });
    exitMock = jest.fn();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  test('runCli --help prints help and exits 0', () => {
    cli.runCli(['--help'], exitMock);
    expect(consoleLogSpy).toHaveBeenCalled();
    expect(exitMock).toHaveBeenCalledWith(0);
  });

  test('runCli --version prints version and exits 0 (package.json present)', () => {
    // Mock package.json read
    fs.readFileSync.mockImplementation((file) => {
      if (file.toString().includes('package.json')) return JSON.stringify({ version: '9.9.9' });
      return '';
    });

    cli.runCli(['--version'], exitMock);
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('@fsegurai/manifest-generator v9.9.9'));
    expect(exitMock).toHaveBeenCalledWith(0);
  });

  test('runCli --version handles missing package.json gracefully', () => {
    fs.readFileSync.mockImplementation(() => {
      throw new Error('no file');
    });
    cli.runCli(['--version'], exitMock);
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('version unknown'));
    expect(exitMock).toHaveBeenCalledWith(0);
  });

  test('runCli --discover prints discovered projects and exits 0', () => {
    // Spy on discoverProjects
    const discoverSpy = jest.spyOn(indexModule, 'discoverProjects').mockReturnValue([
      { name: 'p1', type: 'subfolder', docsPath: '/root/p1/docs' },
    ]);

    cli.runCli(['--discover', '--docs-root', '/root'], exitMock);

    expect(discoverSpy).toHaveBeenCalledWith(expect.stringContaining(path.resolve('/root')), expect.any(Object));
    expect(consoleLogSpy).toHaveBeenCalled();
    expect(exitMock).toHaveBeenCalledWith(0);

    discoverSpy.mockRestore();
  });

  test('runCli --discover prints message when no projects found', () => {
    const discoverSpy = jest.spyOn(indexModule, 'discoverProjects').mockReturnValue([]);

    cli.runCli(['--discover', '--docs-root', '/root'], exitMock);

    expect(discoverSpy).toHaveBeenCalledWith(expect.stringContaining(path.resolve('/root')), expect.any(Object));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('No documentation projects found'));
    expect(exitMock).toHaveBeenCalledWith(0);

    discoverSpy.mockRestore();
  });

  test('runCli processes with generateManifestsWithDiscovery and returns exit 0 on success', () => {
    const genSpy = jest.spyOn(indexModule, 'generateManifestsWithDiscovery').mockReturnValue([
      { name: 'p1', processed: true },
    ]);

    cli.runCli(['--all', '--docs-root', '/root'], exitMock);

    expect(genSpy).toHaveBeenCalledWith(expect.stringContaining(path.resolve('/root')), expect.any(Object));
    expect(exitMock).toHaveBeenCalledWith(0);

    genSpy.mockRestore();
  });

  test('runCli logs project, route and output when options provided', () => {
    const genSpy = jest.spyOn(indexModule, 'generateManifestsWithDiscovery').mockReturnValue([
      { name: 'p1', processed: true },
    ]);

    cli.runCli(['--project', 'myproject', '--route', '/some/route', '--output', '/custom', '--docs-root', '/root'], exitMock);

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('🎯 Target project: myproject'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('🛤️'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('📁 Output directory: /custom'));
    expect(exitMock).toHaveBeenCalledWith(0);

    genSpy.mockRestore();
  });

  test('runCli returns non-zero exit when generateManifestsWithDiscovery reports failures', () => {
    const genSpy = jest.spyOn(indexModule, 'generateManifestsWithDiscovery').mockReturnValue([
      { name: 'p1', processed: false, error: 'boom' },
    ]);

    cli.runCli(['--all', '--docs-root', '/root'], exitMock);

    expect(exitMock).toHaveBeenCalledWith(1);

    genSpy.mockRestore();
  });

  test('runCli prints error and exits 1 when generateManifestsWithDiscovery throws', () => {
    const genSpy = jest.spyOn(indexModule, 'generateManifestsWithDiscovery').mockImplementation(() => {
      throw new Error('boom');
    });

    cli.runCli(['--all', '--docs-root', '/root'], exitMock);

    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('❌ Error:'), expect.stringContaining('boom'));
    expect(exitMock).toHaveBeenCalledWith(1);

    genSpy.mockRestore();
  });

  test('runCli with no args shows help (no flags, no positionals)', () => {
    // call with empty argv to simulate no arguments provided
    cli.runCli([], exitMock);
    expect(consoleLogSpy).toHaveBeenCalled();
    expect(exitMock).toHaveBeenCalledWith(0);
  });

  test('runCli with positional docs path processes that path', () => {
    const genSpy = jest.spyOn(indexModule, 'generateManifestsWithDiscovery').mockReturnValue([
      { name: 'posproj', processed: true },
    ]);

    cli.runCli(['./docs'], exitMock);

    expect(genSpy).toHaveBeenCalledWith(expect.stringContaining(path.resolve('./docs')), expect.any(Object));
    expect(exitMock).toHaveBeenCalledWith(0);

    genSpy.mockRestore();
  });

  // Integration tests: run the CLI as a separate Node process to cover the auto-run branch
  test('invoking cli as a separate process --help exits 0 and prints usage', () => {
    const cwd = path.resolve(__dirname, '..');
    const env = { ...process.env };
    delete env.JEST_WORKER_ID; // ensure auto-run branch executes

    const res = spawnSync(process.execPath, ['src/cli.js', '--help'], { cwd, env, encoding: 'utf8' });
    // stdout should contain Usage text
    expect(res.status).toBe(0);
    expect(res.stdout).toEqual(expect.any(String));
    expect(res.stdout).toMatch(/Usage:/);
  });

  test('invoking cli as a separate process --version prints version and exits 0', () => {
    const cwd = path.resolve(__dirname, '..');
    const env = { ...process.env };
    delete env.JEST_WORKER_ID;

    const res = spawnSync(process.execPath, ['src/cli.js', '--version'], { cwd, env, encoding: 'utf8' });
    expect(res.status).toBe(0);
    expect(res.stdout).toMatch(/@fsegurai\/manifest-generator v/);
  });

  test('maybeRunCli returns false when JEST_WORKER_ID present', () => {
    const env = { ...process.env, JEST_WORKER_ID: '1' };
    const called = cli.maybeRunCli(env, ['--help'], exitMock);
    expect(called).toBe(false);
    expect(exitMock).not.toHaveBeenCalled();
  });

  test('maybeRunCli runs when JEST_WORKER_ID absent', () => {
    const env = { ...process.env };
    delete env.JEST_WORKER_ID;
    const called = cli.maybeRunCli(env, ['--help'], exitMock);
    expect(called).toBe(true);
    // runCli should invoke exitFn(0) for --help
    expect(exitMock).toHaveBeenCalledWith(0);
  });

  test('invoking cli as a separate process with --project prints target project', () => {
    const cwd = path.resolve(__dirname, '..');
    const env = { ...process.env };
    delete env.JEST_WORKER_ID;

    const res = spawnSync(process.execPath, ['src/cli.js', '--project', 'intproj', '--docs-root', '.'], {
      cwd,
      env,
      encoding: 'utf8'
    });
    // stdout should include Target project line even if exit status non-zero
    expect(res.stdout).toEqual(expect.any(String));
    expect(res.stdout).toMatch(/Target project: intproj/);
  });

  test('invoking cli as a separate process with --route and --output prints route and output', () => {
    const cwd = path.resolve(__dirname, '..');
    const env = { ...process.env };
    delete env.JEST_WORKER_ID;

    const res = spawnSync(process.execPath, ['src/cli.js', '--route', './some/route', '--output', './out', '--docs-root', '.'], {
      cwd,
      env,
      encoding: 'utf8'
    });
    expect(res.stdout).toEqual(expect.any(String));
    expect(res.stdout).toMatch(/Target route:/);
    expect(res.stdout).toMatch(/Output directory:/);
  });

  test('runCli prints completion messages when there are successful results', () => {
    const genSpy = jest.spyOn(indexModule, 'generateManifestsWithDiscovery').mockReturnValue([
      { name: 'p1', processed: true },
    ]);

    cli.runCli(['--all', '--docs-root', '/root'], exitMock);

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('🎉 Manifest generation complete!'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('manifest.json'));
    expect(exitMock).toHaveBeenCalledWith(0);

    genSpy.mockRestore();
  });

  test('runCli prints failed project details when there are failures', () => {
    const genSpy = jest.spyOn(indexModule, 'generateManifestsWithDiscovery').mockReturnValue([
      { name: 'p1', processed: false, error: 'boom' },
    ]);

    cli.runCli(['--all', '--docs-root', '/root'], exitMock);

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('❌ Failed'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('p1'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('boom'));
    expect(exitMock).toHaveBeenCalledWith(1);

    genSpy.mockRestore();
  });
});
