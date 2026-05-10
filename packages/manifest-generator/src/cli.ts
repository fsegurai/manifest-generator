#!/usr/bin/env node

import { parseArgs } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';
import * as indexModule from './index.js';

function showHelp(): void {
  console.log(`
📄 @fsegurai/manifest-generator CLI

Generate documentation manifests and search indexes for your projects.

Usage: 
  npx @fsegurai/manifest-generator [options] [path]
  manifest-generator [options] [path]

Options:
  -a, --all                    Process all projects in the docs root
  -p, --project <name>          Process a specific project by name
  -r, --route <path>            Process a specific route/path
  -d, --docs-root <path>        Specify the root directory for docs (default: current directory)
  -o, --output <path>           Specify output directory for generated files
  -s, --docs-subfolder <name>   Name of doc subfolder (default: 'docs')
  --discover                    Discover and list projects without processing
  -h, --help                    Show this help message
  -v, --version                 Show version number

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

  # Process with custom docs subfolder name
  npx @fsegurai/manifest-generator --all --docs-subfolder documentation

Production Examples:
  # In your CI/CD pipeline
  npx @fsegurai/manifest-generator --all --docs-root ./projects

  # For a monorepo
  npx @fsegurai/manifest-generator --all --docs-root ./packages

  # For a specific project in production
  npx @fsegurai/manifest-generator --route ./dist/docs --output ./public
`);
}

function showVersion(): void {
  // Read the version from package.json
  try {
    // Prefer a simple, cwd-relative read so tests can mock fs.readFileSync easily
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
    },
    allowPositionals: true,
  });

  // Show version if requested
  if (flags.version) {
    showVersion();
    exitFn(0);
    return;
  }

  // Show help if requested or no arguments provided
  if (flags.help || (Object.keys(flags).length === 0 && positionals.length === 0)) {
    showHelp();
    exitFn(0);
    return;
  }

  console.log('📄 @fsegurai/manifest-generator\n');

  try {
    const rootDir = flags['docs-root'] || positionals[0] || process.cwd();
    const resolvedRoot = path.resolve(rootDir);

    // Check if the docs-root exists
    if (!fs.existsSync(resolvedRoot)) {
      console.error(`❌ Error: Documentation directory not found: ${ resolvedRoot }`);
      console.error(`\nExpected to find markdown files (.md) in: ${ resolvedRoot }`);
      console.error('\nDirectory structure should be one of:');
      console.error('  1. /path/to/docs/README.md (direct markdown files)');
      console.error('  2. /path/to/docs/project-name/docs/README.md (with a \'docs\' subfolder)');
      exitFn(1);
      return;
    }

    // Discovery mode
    if (flags.discover) {
      console.log(`🔍 Discovering projects in: ${ resolvedRoot }`);
      console.log('='.repeat(50));

      const discovered = indexModule.discoverProjects(resolvedRoot, {
        docsSubfolder: flags['docs-subfolder'] || 'docs',
      });

      if (discovered.length === 0) {
        console.log('⚠️  No documentation projects found.');
      } else {
        console.log(`📁 Found ${ discovered.length } project(s):`);
        discovered.forEach(proj => {
          console.log(`  - ${ proj.name } (${ proj.type }): ${ proj.docsPath }`);
        });
      }
      exitFn(0);
      return;
    }

    // Determine processing options
    const options = {
      project: flags.project || null,
      route: flags.route || null,
      outputDir: flags.output || null,
      docsSubfolder: flags['docs-subfolder'] || 'docs',
      autoDetect: flags.all || (!flags.project && !flags.route),
    };

    console.log(`📂 Processing: ${ resolvedRoot }`);
    if (options.project) {
      console.log(`🎯 Target project: ${ options.project }`);
    }
    if (options.route) {
      console.log(`🛤️  Target route: ${ options.route }`);
    }
    if (options.outputDir) {
      console.log(`📁 Output directory: ${ options.outputDir }`);
    }
    console.log('='.repeat(50));

    // Generate manifests
    const results = indexModule.generateManifestsWithDiscovery(resolvedRoot, options);

    // Summary
    const successful = results.filter(r => r.processed).length;
    const failed = results.filter(r => !r.processed).length;

    console.log('\n📊 Summary:');
    console.log(`✅ Successful: ${ successful }`);
    if (failed > 0) {
      console.log(`❌ Failed: ${ failed }`);
      results.filter(r => !r.processed).forEach(r => {
        console.log(`   - ${ r.name }: ${ r.error }`);
      });
    }

    if (successful > 0) {
      console.log('\n🎉 Manifest generation complete!');
      console.log('\nGenerated files:');
      console.log('  - manifest.json (navigation structure)');
      console.log('  - search-index.json (search data)');
    }

    exitFn(failed > 0 ? 1 : 0);

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('❌ Error:', message);
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

// Auto-run unless under a test runner (tests will call runCli or maybeRunCli explicitly)
maybeRunCli();

