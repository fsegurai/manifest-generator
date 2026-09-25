#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { loadConfig, loadConfigFromFile, mergeConfig } from './config.js';
import * as indexModule from './index.js';
import { promptInitOptions, scaffoldInit } from './init.js';

function isTestEnv(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env.BUN_TEST || env.NODE_ENV === 'test' || env.VITEST);
}

function supportsColor(): boolean {
  return Boolean(process.stdout.isTTY) && !process.env.NO_COLOR;
}

function color(code: string, text: string): string {
  return supportsColor() ? `\x1b[${code}m${text}\x1b[0m` : text;
}

function showHelp(): void {
  console.log(`
@fsegurai/manifest-generator CLI

Generate documentation manifests and search indexes for your projects.

Usage: 
  npx @fsegurai/manifest-generator [options] [path]
  manifest-generator [options] [path]

Options:
  -a, --all                    Process all projects in the docs root
  -p, --project <name>         Process a specific project by name
  -r, --route <path>           Process a specific route/path
  -d, --docs-root <path>       Specify the root directory for docs (default: current directory)
  -o, --output <path>          Specify output directory for generated files
  -s, --docs-subfolder <name>  Name of doc subfolder (default: 'docs')
  --discover                   Discover and list projects without processing
  --recursive                  Recursively discover projects in nested directories
  --init                       Initialize a documentation structure in the current directory
  --validate                   Validate frontmatter in docs without generating files
  --watch                      Watch for file changes and regenerate
  --config <path>              Path to config file (default: auto-detect)
  --json                       Output machine-readable JSON (--discover / --validate)
  --dry-run                    Run generation without writing files to disk
  -q, --quiet                  Suppress banner and progress output (errors still show)
  -h, --help                   Show this help message
  -v, --version                Show version number

Examples:
  # Process all projects in the current directory
  npx @fsegurai/manifest-generator --all

  # Process specific project
  npx @fsegurai/manifest-generator --project my-docs

  # Process specific documentation path
  npx @fsegurai/manifest-generator --route ./my-project/documentation

  # Process all projects in different directory
  npx @fsegurai/manifest-generator --docs-root /path/to/projects --all

  # Discover projects without processing
  npx @fsegurai/manifest-generator --discover

  # Recursive discovery
  npx @fsegurai/manifest-generator --discover --recursive

  # Validate frontmatter
  npx @fsegurai/manifest-generator --validate --docs-root ./docs

  # Initialize a new documentation structure
  npx @fsegurai/manifest-generator --init
  npx @fsegurai/manifest-generator --init ./my-docs-project

  # Watch mode
  npx @fsegurai/manifest-generator --watch --route ./docs --output ./public

  # With config file
  npx @fsegurai/manifest-generator --config ./config/manifest-generator.config.json

  # Dry run (no files written)
  npx @fsegurai/manifest-generator --all --dry-run

  # JSON output
  npx @fsegurai/manifest-generator --discover --json

Exit codes:
  0 = success
  1 = failure
`);
}

function findOwnPackageJson(): string | null {
  let dir = path.dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < 5; i++) {
    const candidate = path.join(dir, 'package.json');
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

function showVersion(): void {
  try {
    const packageJsonPath = findOwnPackageJson();
    if (!packageJsonPath) throw new Error('package.json not found');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    console.log(`@fsegurai/manifest-generator v${packageJson.version}`);
  } catch {
    console.log('@fsegurai/manifest-generator (version unknown)');
  }
}

export function runCli(argv: string[] = process.argv.slice(2), exitFn: (code?: number) => never = process.exit) {
  const { values: flags, positionals } = parseArgs({
    args: argv,
    options: {
      all: { type: 'boolean', short: 'a' },
      project: { type: 'string', short: 'p' },
      route: { type: 'string', short: 'r' },
      'docs-root': { type: 'string', short: 'd' },
      output: { type: 'string', short: 'o' },
      'docs-subfolder': { type: 'string', short: 's' },
      help: { type: 'boolean', short: 'h' },
      version: { type: 'boolean', short: 'v' },
      init: { type: 'boolean' },
      discover: { type: 'boolean' },
      recursive: { type: 'boolean' },
      validate: { type: 'boolean' },
      watch: { type: 'boolean' },
      config: { type: 'string' },
      json: { type: 'boolean' },
      'dry-run': { type: 'boolean' },
      quiet: { type: 'boolean', short: 'q' },
    },
    allowPositionals: true,
  });

  if (flags.version) {
    showVersion();
    exitFn(0);
    return;
  }

  if (flags.help || (Object.keys(flags).length === 0 && positionals.length === 0)) {
    showHelp();
    exitFn(0);
    return;
  }

  const modeFlags: Array<[string, boolean | undefined]> = [
    ['--validate', flags.validate],
    ['--discover', flags.discover],
    ['--watch', flags.watch],
    ['--init', flags.init],
  ];
  const activeModes = modeFlags.filter(([, enabled]) => enabled === true).map(([name]) => name);

  if (activeModes.length > 1) {
    console.error(
      `Error: the flags ${activeModes.join(', ')} are mutually exclusive. Pass only one of --validate, --discover, --watch, --init at a time.`,
    );
    exitFn(1);
    return;
  }

  if (flags.init) {
    const initDir = positionals[0] ? path.resolve(positionals[0]) : process.cwd();
    const interactive = Boolean(process.stdin.isTTY) && !isTestEnv();

    if (interactive) {
      promptInitOptions()
        .then((options) => {
          scaffoldInit(initDir, options);
          exitFn(0);
        })
        .catch((error) => {
          const message = error instanceof Error ? error.message : String(error);
          console.error('Error during interactive init:', message);
          exitFn(1);
        });
      return;
    }

    scaffoldInit(initDir);
    exitFn(0);
    return;
  }

  const quiet = Boolean(flags.quiet) || Boolean(flags.json);

  if (!quiet) {
    console.log('@fsegurai/manifest-generator\n');
  }

  const configFile = flags.config ? loadConfigFromFile(flags.config) : loadConfig(process.cwd());

  const rootDir = flags['docs-root'] || configFile.docsRoot || positionals[0] || process.cwd();
  const resolvedRoot = path.resolve(rootDir);

  const cfg = mergeConfig(
    {
      docsSubfolder: flags['docs-subfolder'],
      recursive: flags.recursive,
      output: flags.output,
    },
    {
      docsSubfolder: configFile.docsSubfolder,
      recursive: configFile.recursive,
      output: configFile.outputDir,
    },
    {
      docsSubfolder: 'docs',
      recursive: false,
      output: null as string | null,
    },
  );

  if (!fs.existsSync(resolvedRoot)) {
    console.error(`Error: Documentation directory not found: ${resolvedRoot}`);
    console.error('\nExpected to find markdown files (.md / .mdx) in:', resolvedRoot);
    console.error('\nDirectory structure should be one of:');
    console.error('  1. /path/to/docs/README.md (direct markdown files)');
    console.error('  2. /path/to/docs/project-name/docs/README.md (with a docs subfolder)');
    exitFn(1);
    return;
  }

  // Validate mode
  if (flags.validate) {
    const results = indexModule.validateDocs(resolvedRoot);

    if (flags.json) {
      console.log(JSON.stringify(results, null, 2));
      const invalidJsonCount = results.filter((r) => !r.valid).length;
      exitFn(invalidJsonCount > 0 ? 1 : 0);
      return;
    }

    if (!quiet) {
      console.log(`Validating frontmatter in: ${resolvedRoot}`);
      console.log('='.repeat(50));
    }

    if (results.length === 0) {
      console.log('No markdown files found to validate.');
      exitFn(0);
      return;
    }

    let validCount = 0;
    let invalidCount = 0;
    let warningCount = 0;

    for (const result of results) {
      const status = result.valid ? 'OK' : 'FAIL';
      const statusLabel = result.valid ? color('32', `[${status}]`) : color('31', `[${status}]`);
      console.log(`  ${statusLabel} ${result.file}`);

      for (const warning of result.warnings) {
        console.log(`         ${color('33', 'warning:')} ${warning}`);
        warningCount++;
      }

      for (const error of result.errors) {
        console.log(`         ${color('31', 'error:')} ${error}`);
      }

      if (result.valid) validCount++;
      else invalidCount++;
    }

    if (!quiet) {
      console.log('='.repeat(50));
    }
    console.log(`Summary: ${validCount} valid, ${invalidCount} invalid, ${warningCount} warnings`);

    exitFn(invalidCount > 0 ? 1 : 0);
    return;
  }

  // Discover mode
  if (flags.discover) {
    const discovered = indexModule.discoverProjects(resolvedRoot, {
      docsSubfolder: cfg.docsSubfolder,
      recursive: cfg.recursive,
    });

    if (flags.json) {
      console.log(JSON.stringify(discovered, null, 2));
      exitFn(0);
      return;
    }

    if (!quiet) {
      console.log(`Discovering projects in: ${resolvedRoot}${cfg.recursive ? ' (recursive)' : ''}`);
      console.log('='.repeat(50));
    }

    if (discovered.length === 0) {
      console.log('No documentation projects found.');
    } else {
      console.log(`Found ${discovered.length} project(s):`);
      discovered.forEach((proj) => {
        console.log(`  - ${proj.name} (${proj.type}): ${proj.docsPath}`);
      });
    }
    exitFn(0);
    return;
  }

  // Watch mode
  if (flags.watch && !flags['dry-run']) {
    if (!quiet) {
      console.log(`Watching for changes in: ${resolvedRoot}`);
      console.log('='.repeat(50));
    }

    const options = {
      project: flags.project || null,
      route: flags.route || null,
      outputDir: cfg.output,
      docsSubfolder: cfg.docsSubfolder,
      autoDetect: flags.all || (!flags.project && !flags.route),
      exclude: configFile.exclude || [],
      projects: configFile.projects || {},
    };

    const runOnce = () => {
      try {
        indexModule.generateManifestsWithDiscovery(resolvedRoot, options);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('Error during generation:', message);
      }
    };

    runOnce();

    const watcher = indexModule.watchDocs(resolvedRoot, (changedFile) => {
      console.log(`Change detected: ${changedFile}`);
      runOnce();
    });

    console.log('Watching for file changes... (Ctrl+C to stop)');

    process.on('SIGINT', () => {
      console.log('\nStopping watch...');
      watcher.close();
      exitFn(0);
    });

    process.on('SIGTERM', () => {
      watcher.close();
      exitFn(0);
    });

    return;
  }

  if (flags.watch && flags['dry-run']) {
    console.error(
      'Warning: --dry-run only applies to a single generation pass and is incompatible with --watch (file writes are the point of watch mode). Ignoring --watch and running a single dry-run pass instead.',
    );
  }

  // Normal generation mode
  try {
    const dryRun = Boolean(flags['dry-run']);
    const options = {
      project: flags.project || null,
      route: flags.route || null,
      outputDir: cfg.output,
      docsSubfolder: cfg.docsSubfolder,
      autoDetect: flags.all || (!flags.project && !flags.route),
      recursive: cfg.recursive,
      exclude: configFile.exclude || [],
      projects: configFile.projects || {},
      dryRun,
    };

    if (!quiet) {
      console.log(`Processing: ${resolvedRoot}`);
      if (options.project) {
        console.log(`Target project: ${options.project}`);
      }
      if (options.route) {
        console.log(`Target route: ${options.route}`);
      }
      if (options.outputDir) {
        console.log(`Output directory: ${options.outputDir}`);
      }
      if (options.recursive) {
        console.log('Recursive discovery: enabled');
      }
      if (dryRun) {
        console.log('Dry run: enabled (no files will be written)');
      }
      console.log('='.repeat(50));
    }

    const results = indexModule.generateManifestsWithDiscovery(resolvedRoot, options);

    const successful = results.filter((r) => r.processed).length;
    const failed = results.filter((r) => !r.processed).length;

    if (quiet) {
      console.log(`Summary: ${successful} successful, ${failed} failed`);
    } else {
      console.log('\nSummary:');
      console.log(`Successful: ${successful}`);
      if (failed > 0) {
        console.log(`Failed: ${failed}`);
        results
          .filter((r) => !r.processed)
          .forEach((r) => {
            console.log(`   - ${r.name}: ${r.error}`);
          });
      }

      if (successful > 0) {
        console.log('\nManifest generation complete!');
        console.log('\nGenerated files:');
        console.log('  - manifest.json (navigation structure)');
        console.log('  - search-index.json (search data)');
      }
    }

    exitFn(failed > 0 ? 1 : 0);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error:', message);
    exitFn(1);
  }
}

export function maybeRunCli(
  env: NodeJS.ProcessEnv = process.env,
  argv: string[] = process.argv.slice(2),
  exitFn: (code?: number) => never = process.exit,
) {
  if (!isTestEnv(env)) {
    runCli(argv, exitFn);
    return true;
  }
  return false;
}

function isMainModule(): boolean {
  try {
    const invokedPath = process.argv[1];
    if (!invokedPath) return false;
    return import.meta.url === pathToFileURL(invokedPath).href;
  } catch {
    return false;
  }
}

if (isMainModule()) {
  maybeRunCli();
}
