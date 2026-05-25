#!/usr/bin/env node

import { parseArgs } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';
import * as indexModule from './index.js';

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
  --validate                   Validate frontmatter in docs without generating files
  --watch                      Watch for file changes and regenerate
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

  # Watch mode
  npx @fsegurai/manifest-generator --watch --route ./docs --output ./public
`);
}

function showVersion(): void {
  try {
    const packageJson = JSON.parse(
      fs.readFileSync('package.json', 'utf8'),
    );
    console.log(`@fsegurai/manifest-generator v${ packageJson.version }`);
  } catch {
    console.log('@fsegurai/manifest-generator (version unknown)');
  }
}

export function runCli(argv: string[] = process.argv.slice(2), exitFn: (code?: number) => never = process.exit) {
  const { values: flags, positionals } = parseArgs({
    args: argv,
    options: {
      'all': { type: 'boolean', short: 'a' },
      'project': { type: 'string', short: 'p' },
      'route': { type: 'string', short: 'r' },
      'docs-root': { type: 'string', short: 'd' },
      'output': { type: 'string', short: 'o' },
      'docs-subfolder': { type: 'string', short: 's' },
      'help': { type: 'boolean', short: 'h' },
      'version': { type: 'boolean', short: 'v' },
      'discover': { type: 'boolean' },
      'recursive': { type: 'boolean' },
      'validate': { type: 'boolean' },
      'watch': { type: 'boolean' },
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

  console.log('@fsegurai/manifest-generator\n');

  const rootDir = flags['docs-root'] || positionals[0] || process.cwd();
  const resolvedRoot = path.resolve(rootDir);

  if (!fs.existsSync(resolvedRoot)) {
    console.error(`Error: Documentation directory not found: ${ resolvedRoot }`);
    console.error('\nExpected to find markdown files (.md / .mdx) in:', resolvedRoot);
    console.error('\nDirectory structure should be one of:');
    console.error('  1. /path/to/docs/README.md (direct markdown files)');
    console.error('  2. /path/to/docs/project-name/docs/README.md (with a docs subfolder)');
    exitFn(1);
    return;
  }

  // Validate mode
  if (flags.validate) {
    console.log(`Validating frontmatter in: ${ resolvedRoot }`);
    console.log('='.repeat(50));

    const results = indexModule.validateDocs(resolvedRoot);

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
      console.log(`  [${ status }] ${ result.file }`);

      for (const warning of result.warnings) {
        console.log(`         warning: ${ warning }`);
        warningCount++;
      }

      for (const error of result.errors) {
        console.log(`         error: ${ error }`);
      }

      if (result.valid) validCount++;
      else invalidCount++;
    }

    console.log('='.repeat(50));
    console.log(`Summary: ${ validCount } valid, ${ invalidCount } invalid, ${ warningCount } warnings`);

    exitFn(invalidCount > 0 ? 1 : 0);
    return;
  }

  // Discover mode
  if (flags.discover) {
    const recursive = flags.recursive || false;
    console.log(`Discovering projects in: ${ resolvedRoot }${ recursive ? ' (recursive)' : '' }`);
    console.log('='.repeat(50));

    const discovered = indexModule.discoverProjects(resolvedRoot, {
      docsSubfolder: flags['docs-subfolder'] || 'docs',
      recursive,
    });

    if (discovered.length === 0) {
      console.log('No documentation projects found.');
    } else {
      console.log(`Found ${ discovered.length } project(s):`);
      discovered.forEach(proj => {
        console.log(`  - ${ proj.name } (${ proj.type }): ${ proj.docsPath }`);
      });
    }
    exitFn(0);
    return;
  }

  // Watch mode
  if (flags.watch) {
    console.log(`Watching for changes in: ${ resolvedRoot }`);
    console.log('='.repeat(50));

    const options = {
      project: flags.project || null,
      route: flags.route || null,
      outputDir: flags.output || null,
      docsSubfolder: flags['docs-subfolder'] || 'docs',
      autoDetect: flags.all || (!flags.project && !flags.route),
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
      console.log(`Change detected: ${ changedFile }`);
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

  // Normal generation mode
  try {
    const options = {
      project: flags.project || null,
      route: flags.route || null,
      outputDir: flags.output || null,
      docsSubfolder: flags['docs-subfolder'] || 'docs',
      autoDetect: flags.all || (!flags.project && !flags.route),
      recursive: flags.recursive || false,
    };

    console.log(`Processing: ${ resolvedRoot }`);
    if (options.project) {
      console.log(`Target project: ${ options.project }`);
    }
    if (options.route) {
      console.log(`Target route: ${ options.route }`);
    }
    if (options.outputDir) {
      console.log(`Output directory: ${ options.outputDir }`);
    }
    if (options.recursive) {
      console.log('Recursive discovery: enabled');
    }
    console.log('='.repeat(50));

    const results = indexModule.generateManifestsWithDiscovery(resolvedRoot, options);

    const successful = results.filter(r => r.processed).length;
    const failed = results.filter(r => !r.processed).length;

    console.log('\nSummary:');
    console.log(`Successful: ${ successful }`);
    if (failed > 0) {
      console.log(`Failed: ${ failed }`);
      results.filter(r => !r.processed).forEach(r => {
        console.log(`   - ${ r.name }: ${ r.error }`);
      });
    }

    if (successful > 0) {
      console.log('\nManifest generation complete!');
      console.log('\nGenerated files:');
      console.log('  - manifest.json (navigation structure)');
      console.log('  - search-index.json (search data)');
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
  const isTestEnv = Boolean(env.BUN_TEST || env.NODE_ENV === 'test' || env.VITEST);
  if (!isTestEnv) {
    runCli(argv, exitFn);
    return true;
  }
  return false;
}

maybeRunCli();
