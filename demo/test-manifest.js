#!/usr/bin/env node

import { discoverProjects, generateManifestsWithDiscovery } from '@fsegurai/manifest-generator';
import { parseArgs } from 'node:util';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command line arguments (matching CLI options)
const { values: flags, positionals } = parseArgs({
  args: process.argv.slice(2),
  options: {
    'all': { type: 'boolean', short: 'a' },
    'project': { type: 'string', short: 'p' },
    'route': { type: 'string', short: 'r' },
    'docs-root': { type: 'string', short: 'd' },
    'output': { type: 'string', short: 'o' },
    'docs-subfolder': { type: 'string', short: 's' },
    'discover': { type: 'boolean' },
    'help': { type: 'boolean', short: 'h' },
  },
  allowPositionals: true,
});

function showHelp() {
  console.log(`
🚀 Manifest Generator Test Tool (Demo)

Usage: node test-manifest.js [options] [path]

Options:
  -a, --all                    Process all projects in the docs root
  -p, --project <name>         Process a specific project by name
  -r, --route <path>           Process a specific route/path
  -d, --docs-root <path>       Specify the root directory for docs (default: current directory)
  -o, --output <path>          Specify output directory for generated files
  -s, --docs-subfolder <name>  Name of docs subfolder (default: 'docs')
  --discover                   Discover and list projects without processing
  -h, --help                   Show this help message

Examples:
  node test-manifest.js --all                          # Process all projects in demo/
  node test-manifest.js --project sample-project-a     # Process specific project
  node test-manifest.js --route ./sample-project-a/docs # Process specific route
  node test-manifest.js --docs-root ../other-docs --all # Process all in different directory
  node test-manifest.js --discover                     # List discovered projects
  node test-manifest.js ./custom/path                   # Process custom path (positional)

Note: This is a demo wrapper around the @fsegurai/manifest-generator library.
`);
}

// Show help if requested or no arguments provided
if (flags.help || (Object.keys(flags).length === 0 && positionals.length === 0)) {
  showHelp();
  process.exit(0);
}

console.log('🚀 Manifest Generator Demo\n');

try {
  const rootDir = flags['docs-root'] || positionals[0] || __dirname;
  const resolvedRoot = path.resolve(rootDir);

  // Discovery mode (using library function)
  if (flags.discover) {
    console.log(`🔍 Discovering projects in: ${ resolvedRoot }`);
    console.log('='.repeat(50));

    const discovered = discoverProjects(resolvedRoot, {
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
    process.exit(0);
  }

  // Process using the library's generateManifestsWithDiscovery function
  console.log(`📂 Processing: ${ resolvedRoot }`);
  if (flags.project) {
    console.log(`🎯 Target project: ${ flags.project }`);
  }
  if (flags.route) {
    console.log(`🛤️  Target route: ${ flags.route }`);
  }
  if (flags.output) {
    console.log(`📁 Output directory: ${ flags.output }`);
  }
  console.log('='.repeat(50));

  // Determine processing options (matching CLI behavior)
  const options = {
    project: flags.project || null,
    route: flags.route || null,
    outputDir: flags.output || null,
    docsSubfolder: flags['docs-subfolder'] || 'docs',
    autoDetect: flags.all || (!flags.project && !flags.route),
  };

  // Use the library's main function
  const results = generateManifestsWithDiscovery(resolvedRoot, options);

  // Summary (matching CLI output)
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

  process.exit(failed > 0 ? 1 : 0);

} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
