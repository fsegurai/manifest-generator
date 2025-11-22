# FAQ—Frequently Asked Questions

Common questions and troubleshooting tips for the Manifest Generator.

## General Questions

### What is the Manifest Generator?

The Manifest Generator is a tool that automatically creates navigation structures and search indexes from your Markdown documentation. It scans your documentation files, extracts metadata from frontmatter, and generates JSON files that can be used by documentation sites, static site generators, and search systems.

### Why do I need generated manifests?

Generated manifests provide:
- **Structured Navigation**: Hierarchical navigation that mirrors your folder structure
- **Search Functionality**: Flat indexes perfect for implementing search features
- **Metadata Extraction**: Automatic parsing of frontmatter tags and titles
- **Build Automation**: Integration with CI/CD pipelines and build systems
- **Framework Agnostic**: Works with any frontend framework or static site generator

### What file formats are supported?

Currently, the tool supports:
- ✅ Markdown files (`.md` extension)
- ✅ YAML frontmatter for metadata
- ❌ Other formats (HTML, reStructuredText, etc.) are not supported

## Installation & Setup

### How do I install the Manifest Generator?

You have several options:

```bash
# Use with npx (no installation required)
npx @fsegurai/manifest-generator --help

# Install globally
npm install -g @fsegurai/manifest-generator

# Install as project dependency
npm install --save-dev @fsegurai/manifest-generator
```

### Do I need to install it in every project?

No! You can use `npx` to run it without installation, or install it globally once and use it in any project.

### What Node.js version is required?

The tool requires Node.js 16 or higher. It uses modern ES modules and Node.js built-in features.

## Usage Questions

### How do I process a single documentation folder?

Use the `--route` option to specify a specific path:

```bash
npx @fsegurai/manifest-generator --route ./docs
npx @fsegurai/manifest-generator --route ./my-project/documentation
```

### How do I process multiple projects at once?

Use the `--all` option to process all projects in a directory:

```bash
# Process all projects in current directory
npx @fsegurai/manifest-generator --all

# Process all projects in specific directory
npx @fsegurai/manifest-generator --all --docs-root ./packages
```

### Can I customize the output location?

Yes, use the `--output` option:

```bash
npx @fsegurai/manifest-generator --route ./docs --output ./public/data
```

### How do I use custom documentation folder names?

Use the `--docs-subfolder` option:

```bash
npx @fsegurai/manifest-generator --all --docs-subfolder documentation
npx @fsegurai/manifest-generator --all --docs-subfolder guides
```

## Configuration Questions

### How do I exclude certain files?

Use frontmatter to control file inclusion:

```markdown
---
draft: true    # Exclude from all output
hidden: true   # Also excludes from output
---
```

### Can I customize file titles?

Yes, use the `title` field in frontmatter:

```markdown
---
label: "Custom Page Title"
---

# This heading is ignored, frontmatter title is used
```

### How do I add tags for categorization?

Use the `tags` field in frontmatter:

```markdown
---
tags: [guide, beginner, tutorial]
---
```

### Can I nest documentation folders?

Yes, the tool automatically handles nested folder structures:

```
docs/
├── getting-started.md
├── guides/
│   ├── basic.md
│   └── advanced/
│       └── expert.md
└── api/
    └── reference.md
```

## Integration Questions

### How do I integrate with my build system?

Add manifest generation to your build scripts:

```json
{
  "scripts": {
    "prebuild": "manifest-generator --all",
    "build": "your-build-command"
  }
}
```

### Can I use this with CI/CD?

Yes! Add it to your CI pipeline:

```yaml
# GitHub Actions example
- name: Generate Documentation Manifests
  run: npx @fsegurai/manifest-generator --all --output ./dist
```

### How do I implement search with the generated index?

Use the search index in your application:

```javascript
// Load search index
const searchIndex = await fetch('/search-index.json').then(r => r.json());

// Simple search function
function search(query) {
  return searchIndex.filter(item => 
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
  );
}
```

### Does this work with static site generators?

Yes! It works with:
- ✅ Next.js
- ✅ Gatsby
- ✅ Jekyll
- ✅ Hugo
- ✅ VitePress
- ✅ Docusaurus
- ✅ Astro
- ✅ Any framework that can consume JSON

## Advanced Questions

### Can I customize the generated JSON structure?

The current version generates a fixed structure, but you can post-process the JSON:

```javascript
const { generateManifest } = require('@fsegurai/manifest-generator');

const result = generateManifest('./docs');
// Customize the result object before saving
const customManifest = result.manifest.map(item => ({
  ...item,
  customField: 'custom value'
}));
```

### How do I handle multiple languages?

Process each language separately:

```bash
npx @fsegurai/manifest-generator --route ./docs/en --output ./public/data/en
npx @fsegurai/manifest-generator --route ./docs/es --output ./public/data/es
```

### Can I version my documentation?

Yes, process each version separately:

```bash
npx @fsegurai/manifest-generator --route ./docs/v1.0 --output ./public/data/v1.0
npx @fsegurai/manifest-generator --route ./docs/v2.0 --output ./public/data/v2.0
```

### How do I handle large documentation sets?

For large documentation:
1. **Use specific routes** instead of `--all`
2. **Process incrementally** in CI/CD
3. **Consider splitting** into multiple projects
4. **Implement caching** in your application

## Performance Questions

### How fast is the manifest generation?

Performance depends on:
- **Number of files**: More files take longer
- **File size**: Larger files take more time to parse
- **Frontmatter complexity**: Simple frontmatter is faster

Typical performance:
- Small project (10–50 files): < 1 second
- Medium project (100–500 files): 1–5 seconds  
- Large project (1000+ files): 5–30 seconds

### Can I improve generation speed?

Yes:
1. **Process specific projects** instead of using `--all`
2. **Use faster storage** (SSD vs HDD)
3. **Minimize frontmatter complexity**
4. **Remove draft/hidden files** if not needed

### Does it watch for file changes?

The tool doesn't include a built-in watch mode, but you can use file watchers:

```bash
# Install chokidar-cli
npm install -g chokidar-cli

# Watch for changes
chokidar 'docs/**/*.md' -c 'manifest-generator --route ./docs'
```

## API Questions

### Can I use this programmatically?

Yes! Import the functions directly:

```javascript
import { generateManifest, discoverProjects } from '@fsegurai/manifest-generator';

// Generate for specific path
const result = generateManifest('./docs');

// Discover projects
const projects = discoverProjects('./workspace');
```

### Is TypeScript supported?

Yes, the package includes full TypeScript definitions:

```typescript
import { NavigationItem, SearchEntry, ManifestResult } from '@fsegurai/manifest-generator';

const result: ManifestResult = generateManifest('./docs');
```

### Can I extend the functionality?

You can wrap the core functions with additional logic:

```javascript
import { generateManifest } from '@fsegurai/manifest-generator';

function customManifestGenerator(docsPath, options = {}) {
  const result = generateManifest(docsPath);
  
  // Add custom processing
  if (options.addTimestamp) {
    result.generatedAt = new Date().toISOString();
  }
  
  return result;
}
```

## Migration Questions

### How do I migrate from manual navigation?

1. **Generate manifests** for your existing docs
2. **Update your application** to consume the JSON files
3. **Remove manual navigation** code
4. **Add to build process** for automatic updates

### Can I migrate from other documentation tools?

Yes, if they use Markdown with frontmatter:
- **GitBook**: Usually works directly
- **Notion exports**: May need frontmatter adjustment
- **Wiki systems**: Convert to Markdown first
- **Confluence**: Export to Markdown, then process

## Getting Help

### Where can I report bugs?

Report issues on the GitHub repository with:
- Your command and options are used
- Directory structure
- Expected vs. actual output
- Error messages (if any)

### How do I request features?

Open a feature request on GitHub with:
- Description of the desired functionality
- Use case explanation
- Examples of expected behavior

### Where can I get support?

- 📖 Read this documentation
- 🐛 Check existing GitHub issues
- 💬 Open a new GitHub issue
- 📧 Contact the maintainer through GitHub

### Can I contribute?

Yes! Contributions are welcome:
- 🐛 Bug fixes
- ✨ New features
- 📖 Documentation improvements
- 🧪 Tests and examples

See the [CONTRIBUTING.md](../../../../CONTRIBUTING.md) file for guidelines.
